import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware, restrictTo } from '../middleware/auth.js'
import Vocabulary from '../models/Vocabulary.js';
import Video from '../models/Video.js';
import VideoLike from '../models/VideoLike.js';
import VideoComment from '../models/VideoComment.js';
import { indexVideoScript } from '../services/ragChatService.js';
import Quiz from '../models/Quiz.js';
import Kanji from '../models/Kanji.js';
import { generateQuizFromScript } from '../services/quizAIService.js';
import axios from 'axios';
import { Agent } from 'undici';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import KuroshiroModule from "kuroshiro";
import KuromojiAnalyzerModule from "kuroshiro-analyzer-kuromoji";
import VideoWatched from '../models/VideoWatched.js';

const Kuroshiro = KuroshiroModule.default || KuroshiroModule;
const KuromojiAnalyzer =
  KuromojiAnalyzerModule.default || KuromojiAnalyzerModule;

const kuroshiro = new Kuroshiro();

let isKuroshiroInit = false;

const formatComment = (comment, currentUserId) => {
  const likes = comment.likes || [];
  return {
    id: comment._id,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    isEdited: comment.updatedAt && comment.createdAt
      ? new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000
      : false,
    likesCount: likes.length,
    likedByMe: currentUserId ? likes.some(id => String(id) === String(currentUserId)) : false,
    author: comment.author ? {
      id: comment.author._id,
      fullName: comment.author.fullName,
      profilePicture: comment.author.profilePicture || null,
      role: comment.author.role || 'user',
    } : null,
  };
};
let kuroshiroInitPromise = null;

async function initKuroshiro() {
  if (isKuroshiroInit) return;

  if (!kuroshiroInitPromise) {
    kuroshiroInitPromise = kuroshiro.init(new KuromojiAnalyzer());
  }

  await kuroshiroInitPromise;
  isKuroshiroInit = true;
}
const scriptPath = path.join(__dirname, '../scripts/transcribe.py');
const AI_SERVICE = process.env.AI_SERVICE; 

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

// Hàm dịch thời gian YouTube (PT12M30S) sang giây (750)
function parseYouTubeDuration(durationStr) {
  const match = durationStr.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Hàm lấy trọn gói thông tin Video từ YouTube API v3
async function fetchYouTubeVideoDetails(videoId) {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY; 
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${API_KEY}`;
    
    const response = await axios.get(url);
    const items = response.data.items;
    
    if (items && items.length > 0) {
      const videoData = items[0];
      const title = videoData.snippet.title; 
      const isoDuration = videoData.contentDetails.duration; 
      const durationSeconds = parseYouTubeDuration(isoDuration); 
      
      return { title, duration: durationSeconds };
    }
    
    return { title: 'Video tự động bóc băng', duration: 0 };
  } catch (error) {
    console.error("Lỗi lấy thông tin từ YouTube API:", error.message);
    return { title: 'Video tự động bóc băng', duration: 0 };
  }
}

function normalizeUtf8Value(value) {
  if (typeof value === 'string') {
    return value.normalize('NFC');
  }

  if (Array.isArray(value)) {
    return value.map(normalizeUtf8Value);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeUtf8Value(entry)])
    );
  }

  return value;
}


const AI_FETCH_TIMEOUT_MS = 1000 * 60 * 30; // 30 phút

const aiFetchDispatcher = new Agent({
  headersTimeout: AI_FETCH_TIMEOUT_MS,
  bodyTimeout: AI_FETCH_TIMEOUT_MS,
  connect: {
    timeout: 1000 * 30,
  },
});

async function readResponseSafely(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

// Router dịch script
// Chỉ có user đã đăng nhập mới được tạo script
router.post('/analyze', authMiddleware, async (req, res) => {
  const { url } = req.body;
  const endpoint = 'transcribe';

  console.log('[analyze Log]: đã gọi analyze');

  if (req.user?.role === 'admin') {
    return res.status(403).json({
      error: 'Admin khong duoc dang video',
    });
  }

  if (!url) {
    return res.status(400).json({
      error: 'URL is required',
    });
  }

  try {
    console.log(`[analyze Log]: gọi AI service ${AI_SERVICE}/${endpoint}`);

    const response = await fetch(`${AI_SERVICE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.AI_KEY || '',
      },
      body: JSON.stringify({
        media_path: url,
        use_gpu: true,
      }),

      // Quan trọng: fix UND_ERR_HEADERS_TIMEOUT
      dispatcher: aiFetchDispatcher,
    });

    const responseData = await readResponseSafely(response);

    if (!response.ok) {
      console.error('[SCRIPT_API_ERROR_RESPONSE]', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });

      throw new Error(
        responseData.detail ||
          responseData.error ||
          responseData.raw ||
          `Script Service error: ${response.status}`
      );
    }

    const script = Array.isArray(responseData.segments)
      ? normalizeUtf8Value(responseData.segments)
      : Array.isArray(responseData.script)
        ? normalizeUtf8Value(responseData.script)
        : [];

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.json({
      title:
        typeof responseData.title === 'string'
          ? responseData.title.normalize('NFC')
          : 'Youtube Video (Auto-Transcription)',

      jlpt_level:
        typeof responseData.jlpt_level === 'string'
          ? responseData.jlpt_level.normalize('NFC')
          : responseData.jlpt_level || 'Unknown',

      script,
    });
  } catch (error) {
    console.error(`[SCRIPT_API_ERROR] ${endpoint}:`, {
      name: error?.name,
      message: error?.message,
      cause: error?.cause,
      stack: error?.stack,
    });

    return res.status(500).json({
      error: 'Failed to analyze video',
      details: error?.message || 'Unknown error',
      cause: error?.cause?.code || null,
    });
  }
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
    const userId = req.user?.id || req.user?.userId;
    if(!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { word, reading, meaning_vi, meaning_en, part_of_speech, jlpt_level, example_sentence, example_meaning } = req.body;

    // Check if word already exists for this user
    const existing = await Vocabulary.findOne({ user: req.user.id || req.user.userId, word });
    if (existing) {
      return res.status(400).json({ message: 'Từ này đã có trong sổ tay' });
    }

    const newVocab = new Vocabulary({
      user: userId,
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
    if (req.user?.role === 'admin') {
      return res.status(403).json({ error: 'Admin khong duoc dang video' });
    }

    const { youtube_url, script } = req.body;
    const userId = req.user.id || req.user.userId;

    // 1. Xử lý ID YouTube và Thumbnail
    const ytMatch = youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    const ytId = ytMatch ? ytMatch[1] : null;
    const thumbnail_url = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

    // Khởi tạo biến lưu thông tin tự động
    let autoTitle = 'Youtube auto transcription';
    let realDurationSeconds = 0;
    if (ytId) {
       const ytDetails = await fetchYouTubeVideoDetails(ytId);
       autoTitle = ytDetails.title;             // Tiêu đề thật từ YouTube
       realDurationSeconds = ytDetails.duration; // Thời lượng thật từ YouTube
    }

    // ==============================================================
    // 2. GOM TỪ VỰNG & TRA KANJI NGAY TẠI THỜI ĐIỂM TẠO VIDEO
    // ==============================================================
    const vocabMap = new Map();
    const allKanjiSet = new Set();

    if (script && Array.isArray(script)) {
      script.forEach(segment => {
        if (segment.vocabulary && Array.isArray(segment.vocabulary)) {
          segment.vocabulary.forEach(v => {
            if (!vocabMap.has(v.word)) {
              vocabMap.set(v.word, v);
              // Lọc tách từng chữ Kanji ra
              const chars = v.word.split('');
              chars.forEach(char => {
                if (char.match(/[\u4e00-\u9faf]/)) {
                  allKanjiSet.add(char);
                }
              });
            }
          });
        }
      });
    }

    const uniqueKanjis = Array.from(allKanjiSet);

    // Chọc Database Kanji ĐÚNG 1 LẦN để lấy thông tin
    const kanjiData = await Kanji.find({ kanji: { $in: uniqueKanjis } })
      .select('kanji mean kun on level stroke_count detail img').lean();

    const kanjiMap = {};
    kanjiData.forEach(k => kanjiMap[k.kanji] = k);

    // Đóng gói mảng Từ vựng đã ngậm sẵn Kanji
    const enrichedVocabList = Array.from(vocabMap.values()).map(vocab => {
      const kanjiDetails = vocab.word.split('')
        .filter(char => char.match(/[\u4e00-\u9faf]/))
        .map(char => kanjiMap[char])
        .filter(Boolean);

      return {
        word: vocab.word,
        reading: vocab.reading,
        meaning: vocab.meaning,
        pos: vocab.pos,
        kanji_info: kanjiDetails // Lưu chết cục này vào DB luôn
      };
    });
    // ==============================================================

    // 3. Lưu Video với tất cả dữ liệu
    const newVideo = new Video({
      title: autoTitle, // 🎯 Đã tự động điền tiêu đề xịn, không lo bị trống!
      youtube_url,
      thumbnail_url,
      script,
      vocab_list: enrichedVocabList,
      creator: userId,
      jlpt_level: 'Unknown',
      duration: realDurationSeconds || 0, // Lưu thời lượng thật
      video_theme: 'Anime'          // Có thể mặc định hoặc cho user chọn sau
    });

    // 4. TỰ ĐỘNG GỌI AI ĐỂ TẠO QUIZ
    let aiResult = null;
    try {
      console.log("[Auto-AI]: Đang phân tích trình độ và tạo câu hỏi...");
      aiResult = await generateQuizFromScript(script); 
    } catch (aiError) {
      console.warn("⚠️ [Auto-AI] Gemini API đang quá tải hoặc lỗi. Bỏ qua tạo Quiz:", aiError.message);
    }

    newVideo.jlpt_level = aiResult?.jlptLevel || 'Unknown';
    await newVideo.save(); // Lệnh Save hoàn thiện 100% data

    // Lưu Quiz
    let newQuiz = null;
    if (aiResult && aiResult.questions) {
      newQuiz = new Quiz({
        videoId: newVideo._id,
        questions: aiResult.questions
      });
      await newQuiz.save();
    }

    // 5. TRẢ VỀ FRONTEND
    res.status(201).json({
      message: aiResult ? 'Hoàn tất bóc băng và tạo bài tập!' : 'Đã bóc băng xong! (AI đang bận nên chưa tạo Quiz được)',
      videoId: newVideo._id,
      jlptLevel: newVideo.jlpt_level,
      script: newVideo.script,
      vocab_list: newVideo.vocab_list, // Trả luôn cho FrontEnd nếu cần
      quiz: newQuiz
    });

    // Index RAG chạy ngầm
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
    // ... code kiểm tra quyền xem video ở trên giữ nguyên ...
    // Trả về thẳng cho frontend
    res.json({
      id: video._id,
      title: video.title,
      youtube_url: video.youtube_url,
      script: video.script,
      vocab_list: video.vocab_list, // THÊM DÒNG NÀY (Data đã có sẵn Kanji)
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

router.get('/watched', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?.userId;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 30, 1), 100);

    const watchedVideos = await VideoWatched.find({ user: currentUserId })
      .sort({ watched_at: -1 })
      .limit(limit)
      .populate({
        path: 'video',
        select: '_id title thumbnail_url jlpt_level views_count likes_count created_date duration video_theme status',
      })
      .lean();

    const data = watchedVideos
      .filter(item => item.video)
      .map(item => ({
        history_id: item._id,
        id: item.video._id,
        title: item.video.title,
        thumbnail_url: item.video.thumbnail_url,
        jlpt_level: item.video.jlpt_level,
        views_count: item.video.views_count,
        likes_count: item.video.likes_count,
        created_date: item.video.created_date,
        duration: item.video.duration || 0,
        video_theme: item.video.video_theme || '',
        status: item.video.status,
        watched_at: item.watched_at,
        progress_seconds: item.progress_seconds || 0,
      }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử xem video:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy lịch sử xem video' });
  }
});

router.post('/watched/:id', authMiddleware, async (req, res) => {
  try {
    const videoId = req.params.id;
    const currentUserId = req.user?.id || req.user?.userId;
    const progressSeconds = Math.max(0, Number(req.body?.progress_seconds || 0));

    const video = await Video.findById(videoId).select('_id status');
    if (!video) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    if (video.status !== 'approved') {
      return res.status(403).json({ error: 'Video chưa được duyệt' });
    }

    const watched = await VideoWatched.create({
      video: videoId,
      user: currentUserId,
      watched_at: new Date(),
      progress_seconds: progressSeconds,
    });

    const oldWatchedIds = await VideoWatched.find({ user: currentUserId })
      .sort({ watched_at: -1 })
      .skip(30)
      .select('_id')
      .lean();

    if (oldWatchedIds.length > 0) {
      await VideoWatched.deleteMany({ _id: { $in: oldWatchedIds.map(item => item._id) } });
    }

    return res.json({
      success: true,
      watched,
    });
  } catch (error) {
    console.error('Lỗi khi lưu lịch sử xem video:', error);
    return res.status(500).json({ error: 'Lỗi khi lưu lịch sử xem video' });
  }
});


router.get('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?.userId;
    const video = await Video.findById(req.params.id).select('_id').lean();
    if (!video) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    const [comments, replies] = await Promise.all([
      VideoComment.find({ video: req.params.id, parentComment: null })
        .populate('author', 'fullName profilePicture role')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      VideoComment.find({ video: req.params.id, parentComment: { $ne: null } })
        .populate('author', 'fullName profilePicture role')
        .sort({ createdAt: 1 })
        .limit(200)
        .lean(),
    ]);

    const repliesByParent = replies.reduce((acc, reply) => {
      const key = String(reply.parentComment);
      if (!acc[key]) acc[key] = [];
      acc[key].push(formatComment(reply, currentUserId));
      return acc;
    }, {});

    res.json({
      comments: comments.map(comment => ({
        ...formatComment(comment, currentUserId),
        replies: repliesByParent[String(comment._id)] || [],
      })),
    });
  } catch (error) {
    console.error('Lỗi khi lấy bình luận:', error);
    res.status(500).json({ error: 'Lỗi khi lấy bình luận' });
  }
});

router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?.userId;
    const content = String(req.body?.content || '').trim();
    const parentComment = req.body?.parentComment || null;

    if (!content) {
      return res.status(400).json({ error: 'Nội dung bình luận không được để trống' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Bình luận tối đa 1000 ký tự' });
    }

    const video = await Video.findById(req.params.id).select('_id').lean();
    if (!video) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    if (parentComment) {
      const parent = await VideoComment.findOne({
        _id: parentComment,
        video: req.params.id,
        parentComment: null,
      }).select('_id').lean();

      if (!parent) {
        return res.status(404).json({ error: 'Bình luận gốc không tồn tại' });
      }
    }

    const comment = await VideoComment.create({
      video: req.params.id,
      author: currentUserId,
      parentComment,
      content,
    });

    const populated = await VideoComment.findById(comment._id)
      .populate('author', 'fullName profilePicture role')
      .lean();

    res.status(201).json({
      comment: {
        ...formatComment(populated, currentUserId),
        replies: [],
      },
    });
  } catch (error) {
    console.error('Lỗi khi tạo bình luận:', error);
    res.status(500).json({ error: 'Lỗi khi tạo bình luận' });
  }
});

router.post('/comments/:commentId/like', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?.userId;
    const comment = await VideoComment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Bình luận không tồn tại' });
    }

    const liked = comment.likes.some(id => String(id) === String(currentUserId));
    if (liked) {
      comment.likes = comment.likes.filter(id => String(id) !== String(currentUserId));
    } else {
      comment.likes.push(currentUserId);
    }

    await comment.save();

    res.json({
      likedByMe: !liked,
      likesCount: comment.likes.length,
    });
  } catch (error) {
    console.error('Lỗi khi thích bình luận:', error);
    res.status(500).json({ error: 'Lỗi khi thích bình luận' });
  }
});

router.patch('/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?.userId;
    const content = String(req.body?.content || '').trim();

    if (!content) {
      return res.status(400).json({ error: 'Nội dung bình luận không được để trống' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Bình luận tối đa 1000 ký tự' });
    }

    const comment = await VideoComment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Bình luận không tồn tại' });
    }

    if (String(comment.author) !== String(currentUserId)) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa bình luận này' });
    }

    comment.content = content;
    await comment.save();

    const populated = await VideoComment.findById(comment._id)
      .populate('author', 'fullName profilePicture role')
      .lean();

    res.json({
      comment: {
        ...formatComment(populated, currentUserId),
        replies: [],
      },
    });
  } catch (error) {
    console.error('Lỗi khi chỉnh sửa bình luận:', error);
    res.status(500).json({ error: 'Lỗi khi chỉnh sửa bình luận' });
  }
});

router.delete('/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?.userId;
    const comment = await VideoComment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Bình luận không tồn tại' });
    }

    if (String(comment.author) !== String(currentUserId)) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bình luận này' });
    }

    await VideoComment.deleteMany({
      $or: [
        { _id: comment._id },
        { parentComment: comment._id },
      ],
    });

    res.json({ message: 'Đã xóa bình luận' });
  } catch (error) {
    console.error('Lỗi khi xóa bình luận:', error);
    res.status(500).json({ error: 'Lỗi khi xóa bình luận' });
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
      .select('_id title thumbnail_url jlpt_level views_count status visibility created_date duration video_theme')
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

// ==========================================
// API: LẤY DANH SÁCH TỪ VỰNG & KANJI CỦA VIDEO
// ==========================================
router.get('/vocabulary/:id', async (req, res) => {
  try {
    // 1. Lấy script của video
    const video = await Video.findById(req.params.id).select('script').lean();
    if (!video || !video.script || video.script.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2. Gom tất cả từ vựng từ các câu thoại (script) & Lọc trùng lặp
    const vocabMap = new Map();
    const allKanjiSet = new Set();

    video.script.forEach(segment => {
      if (segment.vocabulary && Array.isArray(segment.vocabulary)) {
        segment.vocabulary.forEach(v => {
          if (!vocabMap.has(v.word)) {
            vocabMap.set(v.word, v);
            
            // Lọc tách từng chữ Kanji ra để chuẩn bị tra cứu
            const chars = v.word.split('');
            chars.forEach(char => {
              if (char.match(/[\u4e00-\u9faf]/)) { // Regex bắt chuẩn chữ Kanji
                allKanjiSet.add(char);
              }
            });
          }
        });
      }
    });

    const uniqueKanjis = Array.from(allKanjiSet);

    // 3. Truy vấn bảng Kanji (Gọi 1 lần duy nhất cho toàn bộ video)
    const kanjiData = await Kanji.find({ kanji: { $in: uniqueKanjis } })
      .select('kanji mean kun on level stroke_count detail img').lean();

    // Biến thành Dictionary để tra cứu tốc độ cao O(1)
    const kanjiMap = {};
    kanjiData.forEach(k => kanjiMap[k.kanji] = k);

    // 4. Nhồi thông tin Kanji vào từng từ vựng
    const enrichedVocabList = Array.from(vocabMap.values()).map(vocab => {
      const kanjiDetails = vocab.word.split('')
        .filter(char => char.match(/[\u4e00-\u9faf]/))
        .map(char => kanjiMap[char])
        .filter(Boolean); // Bỏ qua nếu DB thiếu chữ đó

      return {
        word: vocab.word,
        reading: vocab.reading,
        meaning: vocab.meaning,
        pos: vocab.pos,
        kanji_info: kanjiDetails // ✨ Đây là "cục vàng" dành cho Frontend
      };
    });

    res.json({ success: true, data: enrichedVocabList });
  } catch (error) {
    console.error('Lỗi khi lấy từ vựng và Kanji của video:', error);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

// ==========================================
// API: LẤY DANH SÁCH VIDEO CHO TRANG CHỦ (CÓ PHÂN TRANG TỪNG LEVEL)
// Endpoint: GET /api/videos/public-videos?level=N5&page=1&limit=4
// ==========================================
router.get('/public-videos', async (req, res) => {
  try {
    const { level, page = 1, limit = 4 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 1. Khởi tạo điều kiện query cơ bản: Chỉ video Công khai & Đã duyệt
    const query = {
      status: 'approved',
      visibility: 'public' // Giả sử model của bạn có trường này, nếu không thì bỏ qua
    };

    // 2. Xử lý bộ lọc JLPT Level
    if (level === 'Mixed') {
      // Nhóm "Mixed" là những video không nằm trong phổ N1-N5 hoặc chưa phân loại
      query.jlpt_level = { $nin: ['N1', 'N2', 'N3', 'N4', 'N5'] };
    } else if (level) {
      query.jlpt_level = level;
    }

    // 3. Chạy song song 2 lệnh: Lấy data và Đếm tổng số
    const [videos, totalCount] = await Promise.all([
      Video.find(query)
        // Chỉ select những trường cần thiết cho Card ở trang Home để tiết kiệm băng thông
        .select('_id title thumbnail_url jlpt_level views_count likes_count created_date duration video_theme')
        .sort({ created_date: -1 }) // Mới nhất xếp trước
        .allowDiskUse(true)
        .skip(skip)
        .limit(limitNum)
        .lean(), // Trả về plain JS object cho nhẹ
      Video.countDocuments(query)
    ]);

    // 4. Map lại _id thành id cho khớp với interface VideoItem của React
    const formattedVideos = videos.map(v => ({
      id: v._id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      jlpt_level: v.jlpt_level,
      views_count: v.views_count,
      likes_count: v.likes_count,
      created_date: v.created_date,
      duration: v.duration || 0,
      video_theme: v.video_theme || ''
    }));

    // 5. Trả về kết quả
    res.status(200).json({
      success: true,
      data: formattedVideos,
      hasMore: totalCount > (skip + videos.length),
      total: totalCount
    });

  } catch (error) {
    console.error('Lỗi khi lấy danh sách video trang chủ:', error);
    res.status(500).json({ success: false, error: 'Lỗi server khi tải danh sách video' });
  }
});


// API xử lý Furigana On-the-fly cho duy nhất 1 câu
router.post("/furigana-line", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.json({ html: "" });
    }

    await initKuroshiro();

    const htmlResult = await kuroshiro.convert(String(text), {
      mode: "furigana",
      to: "hiragana",
    });

    return res.json({
      html: htmlResult,
    });
  } catch (error) {
    console.error("Lỗi convert Furigana:", error);

    return res.status(500).json({
      html: "",
      error: "Không thể xử lý Furigana",
    });
  }
});


export default router;
