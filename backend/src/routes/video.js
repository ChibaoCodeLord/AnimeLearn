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
import Kanji from '../models/Kanji.js';
import { generateQuizFromScript } from '../services/quizAIService.js';
import axios from 'axios';
import { Agent } from 'undici';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import KuroshiroModule from "kuroshiro";
import KuromojiAnalyzerModule from "kuroshiro-analyzer-kuromoji";
import {
  countVideoLikeController,
  countVideoViewController,
  createVideoCommentController,
  deleteVideoController,
  deleteVideoCommentController,
  getPublicVideosController,
  getUserVideosController,
  getVideoCommentsController,
  getVideoDetailController,
  getVideoVocabularyController,
  getWatchHistoryController,
  markVideoWatchedController,
  removeVideoLikeController,
  toggleVideoCommentLikeController,
  updateVideoCommentController,
  updateVideoController,
} from '../controllers/videoController.js';

const Kuroshiro = KuroshiroModule.default || KuroshiroModule;
const KuromojiAnalyzer =
  KuromojiAnalyzerModule.default || KuromojiAnalyzerModule;

const kuroshiro = new Kuroshiro();

let isKuroshiroInit = false;

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

router.get('/detail/:id', authMiddleware, getVideoDetailController);
router.post('/view/:id', countVideoViewController);
router.post('/like/:id',authMiddleware, countVideoLikeController);
router.post('/unlike/:id', authMiddleware, removeVideoLikeController);
router.get('/watched', authMiddleware, getWatchHistoryController);
router.post('/watched/:id', authMiddleware, markVideoWatchedController);
router.get('/:id/comments', authMiddleware, getVideoCommentsController);
router.post('/:id/comments', authMiddleware, createVideoCommentController);
router.post('/comments/:commentId/like', authMiddleware, toggleVideoCommentLikeController);
router.patch('/comments/:commentId', authMiddleware, updateVideoCommentController);
router.delete('/comments/:commentId', authMiddleware, deleteVideoCommentController);

router.get('/user/my-videos', authMiddleware, getUserVideosController);
router.put('/update/:id', authMiddleware, updateVideoController);
router.delete('/delete/:id', authMiddleware, deleteVideoController);
router.get('/vocabulary/:id', getVideoVocabularyController);
router.get('/public-videos', getPublicVideosController);
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
