import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware, restrictTo } from '../middleware/auth.js'
import Vocabulary from '../models/Vocabulary.js';
import Video from '../models/Video.js';
import VideoLike from '../models/VideoLike.js';
import { indexVideoScript } from '../services/ragChatService.js';
import Quiz from '../models/Quiz.js';
import { generateQuizFromScript } from '../services/quizAIService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePythonCommand() {
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH;
  }

  const projectRoot = path.resolve(__dirname, '../../..');
  const venvCandidates = [
    path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),
    path.join(projectRoot, '.venv', 'bin', 'python')
  ];

  for (const candidate of venvCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return 'python';
}

const PYTHON_CMD = resolvePythonCommand();
console.log(`[Video Route] Using Python interpreter: ${PYTHON_CMD}`);

const router = express.Router();

function parsePythonJsonOutput(rawOutput) {
  const text = (rawOutput || '').trim();

  if (!text) {
    throw new Error('Python không xuất ra dữ liệu JSON');
  }

  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    try {
      return JSON.parse(line);
    } catch (e) {
      // tiếp tục thử các dòng trước đó
    }
  }

  const objectMatch = text.match(/\{[\s\S]*\}\s*$/);
  if (objectMatch) {
    return JSON.parse(objectMatch[0]);
  }

  const arrayMatch = text.match(/\[[\s\S]*\]\s*$/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]);
  }

  throw new Error('Không tìm thấy JSON hợp lệ trong output của Python');
}

//Router dịch script
//chỉ có user đã đăng nhập mới được tạo script
router.post('/analyze', authMiddleware, (req, res) => {
  const { url } = req.body;
  console.log(`[analyze Log]: đã gọi analyze}`);

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Define Path to python script
  const scriptPath = path.join(__dirname, '../scripts/transcribe.py');

  // Start python process
  const pythonProcess = spawn(PYTHON_CMD, [scriptPath, url]);

  const stdoutChunks = [];
  let errorString = '';
  let isHandled = false;


  pythonProcess.stdout.on('data', (data) => {
    stdoutChunks.push(data);
  });

  pythonProcess.stderr.on('data', (data) => {
    errorString += data.toString();
    console.error(`[Python Log]: ${data.toString().trim()}`);
  });

  pythonProcess.on('error', (err) => {
    if (isHandled) return;
    isHandled = true;
    console.error(`Failed to start Python process: ${err.message}`);
    return res.status(500).json({ error: 'Failed to start transcription process', details: err.message });
  });

  pythonProcess.on('close', (code, signal) => {
    if (isHandled) return;
    isHandled = true;
    const dataString = Buffer.concat(stdoutChunks).toString('utf8');

    try {
      const parsed = parsePythonJsonOutput(dataString);
      const result = Array.isArray(parsed) ? { title: 'Youtube Video (Auto-Transcription)', script: parsed } : parsed;

      if (code !== 0 || signal) {
        console.warn(`[analyze] Python exited with code=${code}, signal=${signal ?? 'none'} but returned valid JSON output.`);
      }

      return res.json({
        title: result.title || 'Youtube Video (Auto-Transcription)',
        jlpt_level: "Unknown",
        script: result.script || result
      });
    } catch (parseError) {
      console.error(`Process exited with code=${code}, signal=${signal ?? 'none'}. stderr: ${errorString}`);
      console.error('Failed to parse Python output:', dataString);

      const baseError = code !== 0 || signal ? 'Failed to transcribe video' : 'Invalid output format from transcription script';
      return res.status(500).json({
        error: baseError,
        details: errorString,
        exitCode: code,
        signal: signal ?? null
      });
    }
  });
});

router.post('/translate-word', (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: 'Word is required' });

  // Một script python mini nhúng trực tiếp để tra từ nhanh
  const pythonScript = `
import sys, json
sys.stdout.reconfigure(encoding='utf-8')
try:
    import fugashi
    try:
      import unidic_lite
    except Exception:
      unidic_lite = None
    from deep_translator import GoogleTranslator

    def build_tagger():
      if unidic_lite is not None:
        try:
          import os
          dicdir = unidic_lite.DICDIR
          mecabrc = os.path.join(dicdir, "mecabrc")
          return fugashi.Tagger(f'-d "{dicdir}" -r "{mecabrc}"')
        except Exception:
          pass
      try:
        return fugashi.Tagger()
      except Exception:
        return None

    word = sys.argv[1]
    tagger = build_tagger()
    translator = GoogleTranslator(source='ja', target='vi')
    
    meaning = translator.translate(word)
    reading = ""
    pos = "Chưa rõ"
    
    if tagger is not None:
      for node in tagger(word):
        pos = node.feature.pos1 if hasattr(node.feature, 'pos1') else ""
        reading = node.feature.kana if hasattr(node.feature, 'kana') else ""
        break # lấy node đầu tiên
        
    print(json.dumps({
        "word": word,
        "reading": reading,
        "meaning_vi": meaning,
        "part_of_speech": pos
    }, ensure_ascii=False))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

  const pythonProcess = spawn(PYTHON_CMD, ['-c', pythonScript, word]);
  let outData = '';

  pythonProcess.stdout.on('data', (data) => {
    outData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    try {
      res.json(JSON.parse(outData));
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });
});

router.post('/save-word', authMiddleware, async (req, res) => {
  try {
    const { word, reading, meaning_vi, meaning_en, part_of_speech, jlpt_level, example_sentence, example_meaning } = req.body;

    // Check if word already exists for this user
    const existing = await Vocabulary.findOne({ user: req.user.id || req.user.userId, word });
    if (existing) {
      return res.status(400).json({ message: 'Từ này đã có trong sổ tay' });
    }

    const newVocab = new Vocabulary({
      user: req.user.userId,
      word,
      reading,
      meaning_vi,
      meaning_en,
      part_of_speech,
      jlpt_level,
      example_sentence,
      example_meaning
    });

    await newVocab.save();
    res.status(201).json({ message: 'Lưu từ vựng thành công!', vocab: newVocab });
  } catch (error) {
    console.error('Error saving vocabulary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { title, youtube_url, script } = req.body;
    const userId = req.user.id || req.user.userId;

    // 1. Lưu Video như cũ
    const ytMatch = youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    const ytId = ytMatch ? ytMatch[1] : null;
    const thumbnail_url = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

    const newVideo = new Video({
      title,
      youtube_url,
      thumbnail_url,
      script,
      creator: userId,
      jlpt_level: 'Unknown' // Mặc định
    });

    // 2. TỰ ĐỘNG GỌI AI TẠO QUIZ & LEVEL NGAY TẠI ĐÂY
    console.log("[Auto-AI]: Đang phân tích trình độ và tạo câu hỏi...");
    const aiResult = await generateQuizFromScript(script); 

    // Cập nhật level vào đối tượng video trước khi save
    newVideo.jlpt_level = aiResult.jlptLevel || '5';
    await newVideo.save();

    // Lưu Quiz vào collection riêng
    const newQuiz = new Quiz({
      videoId: newVideo._id,
      questions: aiResult.questions
    });
    await newQuiz.save();

    // 3. TRẢ VỀ TOÀN BỘ DATA CHO FRONTEND
    res.status(201).json({
      message: 'Hệ thống đã hoàn tất bóc băng và phân tích bài học!',
      videoId: newVideo._id,
      jlptLevel: newVideo.jlpt_level, // Level mới N1-N5
      script: newVideo.script,
      quiz: newQuiz
    });

    // Index RAG chạy ngầm (asynchronous) như cũ
    indexVideoScript(newVideo._id, script).catch(console.error);

  } catch (error) {
    console.error('Lỗi quy trình tự động:', error);
    res.status(500).json({ error: 'Lỗi khi xử lý dữ liệu video và AI' });
  }
});

router.get('/detail/:id', authMiddleware, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video không tồn tại' });

    const currentUserId = req.user?.id || req.user?.userId;
    const isAdmin = req.user?.role === 'admin';
    const isCreator = currentUserId && String(video.creator) === String(currentUserId);
    const likedByMe = currentUserId
      ? await VideoLike.exists({ video: video._id, user: currentUserId })
      : false;

    if (video.status !== 'approved' && !isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Video chưa được duyệt nên bạn không có quyền xem' });
    }


    

    // Tạo data tương thích với frontend load từ local storage
    res.json({
      id: video._id,
      title: video.title,
      youtube_url: video.youtube_url,
      script: video.script,
      jlpt_level: video.jlpt_level,
      status: video.status,
      views_count: video.views_count,
      likes_count: video.likes_count,
      likedByMe: Boolean(likedByMe)
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin video:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin video' });
  }
});

router.post('/view/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findById(videoId).select('views_count status');

    if (!video) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    if (video.status !== 'approved') {
      return res.json({
        message: 'View skipped for unapproved video',
        views_count: video.views_count,
      });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { views_count: 1 } },
      { new: true }
    ).select('views_count');

    return res.json({
      message: 'View counted successfully',
      views_count: updatedVideo?.views_count ?? video.views_count,
    });
  } catch (error) {
    console.error('Lỗi khi tăng lượt xem video:', error);
    res.status(500).json({ error: 'Lỗi khi tăng lượt xem video' });
  }
});

router.post('/like/:id', authMiddleware, async (req, res) => {
  try {
    const videoId = req.params.id;
    const currentUserId = req.user?.id || req.user?.userId;
    const video = await Video.findById(videoId).select('likes_count status');

    if (!video) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    if (video.status !== 'approved') {
      return res.json({
        message: 'Like skipped for unapproved video',
        likes_count: video.likes_count,
      });
    }

    const likeResult = await VideoLike.updateOne(
      { video: videoId, user: currentUserId },
      { $setOnInsert: { video: videoId, user: currentUserId } },
      { upsert: true }
    );

    if (!likeResult.upsertedCount) {
      return res.json({
        message: 'Video đã được thích trước đó',
        alreadyLiked: true,
        likes_count: video.likes_count,
      });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { likes_count: 1 } },
      { new: true }
    ).select('likes_count');

    return res.json({
      message: 'Like counted successfully',
      alreadyLiked: false,
      likes_count: updatedVideo?.likes_count ?? video.likes_count,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const video = await Video.findById(req.params.id).select('likes_count');
      return res.json({
        message: 'Video đã được thích trước đó',
        alreadyLiked: true,
        likes_count: video?.likes_count ?? 0,
      });
    }

    console.error('Lỗi khi tăng lượt thích video:', error);
    res.status(500).json({ error: 'Lỗi khi tăng lượt thích video' });
  }
});

router.post('/unlike/:id', authMiddleware, async (req, res) => {
  try {
    const videoId = req.params.id;
    const currentUserId = req.user?.id || req.user?.userId;
    const video = await Video.findById(videoId).select('likes_count status');

    if (!video) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    if (video.status !== 'approved') {
      return res.json({
        message: 'Like skipped for unapproved video',
        likes_count: video.likes_count,
      });
    }

    const unlikeResult = await VideoLike.deleteOne({ video: videoId, user: currentUserId });

    if (!unlikeResult.deletedCount) {
      return res.json({
        message: 'Video chưa được thích trước đó',
        alreadyUnliked: true,
        likes_count: video.likes_count,
      });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { likes_count: -1 } },
      { new: true }
    ).select('likes_count');

    return res.json({
      message: 'Unlike counted successfully',
      alreadyUnliked: false,
      likes_count: updatedVideo?.likes_count ?? video.likes_count,
    });
  } catch (error) {
    console.error('Lỗi khi bỏ thích video:', error);
    res.status(500).json({ error: 'Lỗi khi bỏ thích video' });
  }
});


// Fetch user's created videos with pagination
router.get('/user/my-videos', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    const total = await Video.countDocuments({ creator: currentUserId });
    
    const videos = await Video.find({ creator: currentUserId })
      .select('_id title thumbnail_url jlpt_level views_count status visibility created_date')
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      videos,
      pagination: {
        currentPage: page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách video của user:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách video' });
  }
});

// Update video
router.put('/update/:id', authMiddleware, async (req, res) => {
  try {
    // 1. Thêm jlpt_level vào destructuring
    const { title, visibility, jlpt_level } = req.body; 
    const currentUserId = req.user?.id || req.user?.userId;

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    // Check if user is the creator
    if (String(video.creator) !== String(currentUserId)) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa video này' });
    }

    if (title) {
      video.title = title;
    }

    if (visibility && ['public', 'private'].includes(visibility)) {
      video.visibility = visibility;
    }

    // 2. Thêm logic cập nhật JLPT Level
    if (jlpt_level) {
      video.jlpt_level = String(jlpt_level); // Đảm bảo luôn lưu dưới dạng String ("5", "4", "3"...)
    }

    await video.save();

    res.json({
      message: 'Video đã được cập nhật',
      video: {
        _id: video._id,
        title: video.title,
        youtube_url: video.youtube_url,
        jlpt_level: video.jlpt_level, // Trả về level mới
        status: video.status,
        visibility: video.visibility
      }
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật video:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật video' });
  }
});

// Delete video
router.delete('/delete/:id', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?.userId;

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    // Check if user is the creator
    if (String(video.creator) !== String(currentUserId)) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa video này' });
    }

    await Video.findByIdAndDelete(req.params.id);

    res.json({ message: 'Video đã được xóa' });
  } catch (error) {
    console.error('Lỗi khi xóa video:', error);
    res.status(500).json({ error: 'Lỗi khi xóa video' });
  }
});

export default router;
