import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { Agent } from 'undici';
import KuroshiroModule from "kuroshiro";
import KuromojiAnalyzerModule from "kuroshiro-analyzer-kuromoji";
import Vocabulary from '../models/Vocabulary.js';
import Video from '../models/Video.js';
import VideoLike from '../models/VideoLike.js';
import VideoWatched from '../models/VideoWatched.js';
import VideoComment from '../models/VideoComment.js';
import Kanji from '../models/Kanji.js';
import Quiz from '../models/Quiz.js';
import { indexVideoScript } from './ragChatService.js';
import { generateQuizFromScript } from './quizAIService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_SERVICE = process.env.AI_SERVICE; 

function resolvePythonCommand() {
  if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH;
  const projectRoot = path.resolve(__dirname, '../../..');
  const venvCandidates = [
    path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),
    path.join(projectRoot, '.venv', 'bin', 'python')
  ];
  for (const candidate of venvCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'python';
}
const PYTHON_CMD = resolvePythonCommand();

const AI_FETCH_TIMEOUT_MS = 1000 * 60 * 30; // 30 phút
const aiFetchDispatcher = new Agent({
  headersTimeout: AI_FETCH_TIMEOUT_MS,
  bodyTimeout: AI_FETCH_TIMEOUT_MS,
  connect: { timeout: 1000 * 30 },
});

async function readResponseSafely(response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text }; }
}

function normalizeUtf8Value(value) {
  if (typeof value === 'string') return value.normalize('NFC');
  if (Array.isArray(value)) return value.map(normalizeUtf8Value);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeUtf8Value(entry)])
    );
  }
  return value;
}

function parseYouTubeDuration(durationStr) {
  const match = durationStr.match(/PT(d+H)?(d+M)?(d+S)?/);
  if (!match) return 0;
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

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

const Kuroshiro = KuroshiroModule.default || KuroshiroModule;
const KuromojiAnalyzer = KuromojiAnalyzerModule.default || KuromojiAnalyzerModule;
const kuroshiro = new Kuroshiro();
let isKuroshiroInit = false;
let kuroshiroInitPromise = null;

async function initKuroshiro() {
  if (isKuroshiroInit) return;
  if (!kuroshiroInitPromise) kuroshiroInitPromise = kuroshiro.init(new KuromojiAnalyzer());
  await kuroshiroInitPromise;
  isKuroshiroInit = true;
}

import Video from '../models/Video.js';
import VideoLike from '../models/VideoLike.js';
import VideoWatched from '../models/VideoWatched.js';
import VideoComment from '../models/VideoComment.js';
import Kanji from '../models/Kanji.js';

const createError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const findVideoOrThrow = async (videoId, fields) => {
  const query = Video.findById(videoId);
  if (fields) query.select(fields);
  const video = await query;
  if (!video) {
    throw createError('Video không tồn tại', 404);
  }
  return video;
};

const validateCommentContent = (content) => {
  const normalizedContent = String(content || '').trim();

  if (!normalizedContent) {
    throw createError('Nội dung bình luận không được để trống', 400);
  }

  if (normalizedContent.length > 1000) {
    throw createError('Bình luận tối đa 1000 ký tự', 400);
  }

  return normalizedContent;
};

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
    likedByMe: currentUserId
      ? likes.some(id => String(id) === String(currentUserId))
      : false,
    author: comment.author ? {
      id: comment.author._id,
      fullName: comment.author.fullName,
      profilePicture: comment.author.profilePicture || null,
      role: comment.author.role || 'user',
    } : null,
  };
};

export const countVideoViewService = async (videoId) => {
    const video = await findVideoOrThrow(videoId, 'views_count status');
    console.log("đã tăng view");
    if (video.status !== 'approved') {
        return {
            message: 'View skipped for unapproved video',
            views_count: video.views_count,
        };
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views_count: 1 } },
        { new: true }
    ).select('views_count');

    return {
        message: 'View counted successfully',
        views_count: updatedVideo?.views_count ?? video.views_count,
    };
};

export const countVideoLikeService = async (videoId, currentUserId) => {
  const video = await findVideoOrThrow(videoId, 'likes_count status');

  if (video.status !== 'approved') {
    return {
      message: 'Like skipped for unapproved video',
      likes_count: video.likes_count,
    };
  }

  let likeResult;
  try {
    likeResult = await VideoLike.updateOne(
      { video: videoId, user: currentUserId },
      { $setOnInsert: { video: videoId, user: currentUserId } },
      { upsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return {
      message: 'Video đã được thích trước đó',
      alreadyLiked: true,
      likes_count: video.likes_count,
    };
  }

  if (!likeResult.upsertedCount) {
    return {
      message: 'Video đã được thích trước đó',
      alreadyLiked: true,
      likes_count: video.likes_count,
    };
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { likes_count: 1 } },
    { new: true }
  ).select('likes_count');

  return {
    message: 'Like counted successfully',
    alreadyLiked: false,
    likes_count: updatedVideo?.likes_count ?? video.likes_count,
  };
};

export const removeVideoLikeService = async (videoId, currentUserId) => {
  const video = await findVideoOrThrow(videoId, 'likes_count status');

  if (video.status !== 'approved') {
    return {
      message: 'Like skipped for unapproved video',
      likes_count: video.likes_count,
    };
  }

  const unlikeResult = await VideoLike.deleteOne({ video: videoId, user: currentUserId });

  if (!unlikeResult.deletedCount) {
    return {
      message: 'Video chưa được thích trước đó',
      alreadyUnliked: true,
      likes_count: video.likes_count,
    };
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { likes_count: -1 } },
    { new: true }
  ).select('likes_count');

  return {
    message: 'Unlike counted successfully',
    alreadyUnliked: false,
    likes_count: Math.max(0, updatedVideo?.likes_count ?? video.likes_count),
  };
};

export const getWatchHistoryService = async (currentUserId, requestedLimit = 30) => {
  const limit = Math.min(Math.max(Number.parseInt(requestedLimit) || 30, 1), 100);
  const watchedVideos = await VideoWatched.find({ user: currentUserId })
    .sort({ watched_at: -1 })
    .limit(limit)
    .populate({
      path: 'video',
      select: '_id title thumbnail_url jlpt_level views_count likes_count created_date duration video_theme status',
    })
    .lean();

  return watchedVideos
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
};

export const markVideoWatchedService = async (videoId, currentUserId, progressSeconds = 0) => {
  const video = await findVideoOrThrow(videoId, '_id status');
  if (video.status !== 'approved') {
    throw createError('Video chưa được duyệt', 403);
  }

  const watched = await VideoWatched.create({
    video: videoId,
    user: currentUserId,
    watched_at: new Date(),
    progress_seconds: Math.max(0, Number(progressSeconds) || 0),
  });

  const oldWatchedIds = await VideoWatched.find({ user: currentUserId })
    .sort({ watched_at: -1 })
    .skip(30)
    .select('_id')
    .lean();

  if (oldWatchedIds.length > 0) {
    await VideoWatched.deleteMany({
      _id: { $in: oldWatchedIds.map(item => item._id) },
    });
  }

  return watched;
};

export const getVideoCommentsService = async (videoId, currentUserId) => {
  await findVideoOrThrow(videoId, '_id');

  const [comments, replies] = await Promise.all([
    VideoComment.find({ video: videoId, parentComment: null })
      .populate('author', 'fullName profilePicture role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    VideoComment.find({ video: videoId, parentComment: { $ne: null } })
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

  return comments.map(comment => ({
    ...formatComment(comment, currentUserId),
    replies: repliesByParent[String(comment._id)] || [],
  }));
};

export const createVideoCommentService = async ({
  videoId,
  currentUserId,
  content,
  parentComment = null,
}) => {
  const normalizedContent = validateCommentContent(content);
  await findVideoOrThrow(videoId, '_id');

  if (parentComment) {
    const parent = await VideoComment.findOne({
      _id: parentComment,
      video: videoId,
      parentComment: null,
    }).select('_id').lean();

    if (!parent) {
      throw createError('Bình luận gốc không tồn tại', 404);
    }
  }

  const comment = await VideoComment.create({
    video: videoId,
    author: currentUserId,
    parentComment,
    content: normalizedContent,
  });

  const populated = await VideoComment.findById(comment._id)
    .populate('author', 'fullName profilePicture role')
    .lean();

  return {
    ...formatComment(populated, currentUserId),
    replies: [],
  };
};

export const toggleVideoCommentLikeService = async (commentId, currentUserId) => {
  const comment = await VideoComment.findById(commentId);
  if (!comment) {
    throw createError('Bình luận không tồn tại', 404);
  }

  const liked = comment.likes.some(id => String(id) === String(currentUserId));
  if (liked) {
    comment.likes = comment.likes.filter(id => String(id) !== String(currentUserId));
  } else {
    comment.likes.push(currentUserId);
  }

  await comment.save();
  return {
    likedByMe: !liked,
    likesCount: comment.likes.length,
  };
};

export const updateVideoCommentService = async (commentId, currentUserId, content) => {
  const normalizedContent = validateCommentContent(content);
  const comment = await VideoComment.findById(commentId);

  if (!comment) {
    throw createError('Bình luận không tồn tại', 404);
  }

  if (String(comment.author) !== String(currentUserId)) {
    throw createError('Bạn không có quyền chỉnh sửa bình luận này', 403);
  }

  comment.content = normalizedContent;
  await comment.save();

  const populated = await VideoComment.findById(comment._id)
    .populate('author', 'fullName profilePicture role')
    .lean();

  return {
    ...formatComment(populated, currentUserId),
    replies: [],
  };
};

export const deleteVideoCommentService = async (commentId, currentUserId) => {
  const comment = await VideoComment.findById(commentId);

  if (!comment) {
    throw createError('Bình luận không tồn tại', 404);
  }

  if (String(comment.author) !== String(currentUserId)) {
    throw createError('Bạn không có quyền xóa bình luận này', 403);
  }

  await VideoComment.deleteMany({
    $or: [
      { _id: comment._id },
      { parentComment: comment._id },
    ],
  });

  return { message: 'Đã xóa bình luận' };
};

export const getVideoDetailService = async (videoId, currentUser) => {
  const video = await findVideoOrThrow(videoId);
  const currentUserId = currentUser?.id || currentUser?.userId;
  const isAdmin = currentUser?.role === 'admin';
  const isCreator = currentUserId && String(video.creator) === String(currentUserId);
  const likedByMe = currentUserId
    ? await VideoLike.exists({ video: video._id, user: currentUserId })
    : false;

  if (video.status !== 'approved' && !isAdmin && !isCreator) {
    throw createError('Video chưa được duyệt nên bạn không có quyền xem', 403);
  }

  return {
    id: video._id,
    title: video.title,
    youtube_url: video.youtube_url,
    script: video.script,
    vocab_list: video.vocab_list,
    jlpt_level: video.jlpt_level,
    status: video.status,
    views_count: video.views_count,
    likes_count: video.likes_count,
    likedByMe: Boolean(likedByMe),
  };
};

export const getUserVideosService = async (currentUserId, requestedPage = 1, requestedLimit = 5) => {
  const page = Math.max(Number.parseInt(requestedPage) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(requestedLimit) || 5, 1), 100);
  const skip = (page - 1) * limit;
  const total = await Video.countDocuments({ creator: currentUserId });
  const videos = await Video.find({ creator: currentUserId })
    .select('_id title thumbnail_url jlpt_level views_count status visibility created_date duration video_theme')
    .sort({ created_date: -1 })
    .skip(skip)
    .limit(limit);
  const totalPages = Math.ceil(total / limit);

  return {
    videos,
    pagination: {
      currentPage: page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const updateVideoService = async (videoId, currentUserId, data) => {
  const video = await findVideoOrThrow(videoId);

  if (String(video.creator) !== String(currentUserId)) {
    throw createError('Bạn không có quyền chỉnh sửa video này', 403);
  }

  if (data.title) video.title = data.title;
  if (data.visibility && ['public', 'private'].includes(data.visibility)) {
    video.visibility = data.visibility;
  }
  if (data.jlpt_level) video.jlpt_level = String(data.jlpt_level);

  await video.save();

  return {
    message: 'Video đã được cập nhật',
    video: {
      _id: video._id,
      title: video.title,
      youtube_url: video.youtube_url,
      jlpt_level: video.jlpt_level,
      status: video.status,
      visibility: video.visibility,
    },
  };
};

export const deleteVideoService = async (videoId, currentUserId) => {
  const video = await findVideoOrThrow(videoId);

  if (String(video.creator) !== String(currentUserId)) {
    throw createError('Bạn không có quyền xóa video này', 403);
  }

  await Video.findByIdAndDelete(videoId);
  return { message: 'Video đã được xóa' };
};

export const getVideoVocabularyService = async (videoId) => {
  const video = await Video.findById(videoId).select('script').lean();
  if (!video?.script?.length) return [];

  const vocabMap = new Map();
  const allKanjiSet = new Set();

  video.script.forEach(segment => {
    if (!Array.isArray(segment.vocabulary)) return;
    segment.vocabulary.forEach(vocab => {
      if (vocabMap.has(vocab.word)) return;
      vocabMap.set(vocab.word, vocab);
      vocab.word.split('').forEach(char => {
        if (char.match(/[\u4e00-\u9faf]/)) allKanjiSet.add(char);
      });
    });
  });

  const kanjiData = await Kanji.find({ kanji: { $in: Array.from(allKanjiSet) } })
    .select('kanji mean kun on level stroke_count detail img')
    .lean();
  const kanjiMap = Object.fromEntries(kanjiData.map(kanji => [kanji.kanji, kanji]));

  return Array.from(vocabMap.values()).map(vocab => ({
    word: vocab.word,
    reading: vocab.reading,
    meaning: vocab.meaning,
    pos: vocab.pos,
    kanji_info: vocab.word
      .split('')
      .filter(char => char.match(/[\u4e00-\u9faf]/))
      .map(char => kanjiMap[char])
      .filter(Boolean),
  }));
};

export const getPublicVideosService = async ({ level, search, page = 1, limit = 4 }) => {
  const pageNum = Math.max(Number.parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number.parseInt(limit) || 4, 1), 100);
  const skip = (pageNum - 1) * limitNum;
  const query = { status: 'approved', visibility: 'public' };

  if (level === 'Mixed') {
    query.jlpt_level = { $nin: ['N1', 'N2', 'N3', 'N4', 'N5'] };
  } else if (level) {
    query.jlpt_level = level;
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { video_theme: { $regex: search, $options: 'i' } }
    ];
  }

  const [videos, total] = await Promise.all([
    Video.find(query)
      .select('_id title thumbnail_url jlpt_level views_count likes_count created_date duration video_theme')
      .sort({ created_date: -1 })
      .allowDiskUse(true)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Video.countDocuments(query),
  ]);

  return {
    success: true,
    data: videos.map(video => ({
      id: video._id,
      title: video.title,
      thumbnail_url: video.thumbnail_url,
      jlpt_level: video.jlpt_level,
      views_count: video.views_count,
      likes_count: video.likes_count,
      created_date: video.created_date,
      duration: video.duration || 0,
      video_theme: video.video_theme || '',
    })),
    hasMore: total > skip + videos.length,
    total,
  };
};


export const analyzeVideoScriptService = async (url) => {
  const response = await fetch(`${AI_SERVICE}/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.AI_KEY || '',
    },
    body: JSON.stringify({ media_path: url, use_gpu: true }),
    dispatcher: aiFetchDispatcher,
  });

  const responseData = await readResponseSafely(response);

  if (!response.ok) {
    throw new Error(responseData.detail || responseData.error || responseData.raw || `Script Service error: ${response.status}`);
  }

  const script = Array.isArray(responseData.segments)
    ? normalizeUtf8Value(responseData.segments)
    : Array.isArray(responseData.script)
      ? normalizeUtf8Value(responseData.script)
      : [];

  return {
    title: typeof responseData.title === 'string' ? responseData.title.normalize('NFC') : 'Youtube Video (Auto-Transcription)',
    jlpt_level: typeof responseData.jlpt_level === 'string' ? responseData.jlpt_level.normalize('NFC') : responseData.jlpt_level || 'Unknown',
    script,
  };
};

export const translateWordService = async (word) => {
  return new Promise((resolve, reject) => {
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

    pythonProcess.stdout.on('data', (data) => { outData += data.toString(); });
    pythonProcess.on('close', (code) => {
      try { resolve(JSON.parse(outData)); } 
      catch (e) { reject(new Error('Failed')); }
    });
  });
};

export const saveWordService = async (userId, data) => {
  const { word, reading, meaning_vi, meaning_en, part_of_speech, jlpt_level, example_sentence, example_meaning, ease_factor, review_interval, review_count } = data;

  const existing = await Vocabulary.findOne({ user: userId, word });
  if (existing) {
    const err = new Error('Từ này đã có trong sổ tay'); err.status = 400; throw err;
  }

  const newVocab = new Vocabulary({
    user: userId, word, reading, meaning_vi, meaning_en, part_of_speech, jlpt_level, example_sentence, example_meaning, ease_factor, review_interval, review_count,
  });

  await newVocab.save();
  return newVocab;
};

export const saveVideoWithQuizService = async (userId, youtube_url, script) => {
  const ytMatch = youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  const ytId = ytMatch ? ytMatch[1] : null;
  const thumbnail_url = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

  let autoTitle = 'Youtube auto transcription';
  let realDurationSeconds = 0;
  if (ytId) {
     const ytDetails = await fetchYouTubeVideoDetails(ytId);
     autoTitle = ytDetails.title;             
     realDurationSeconds = ytDetails.duration; 
  }

  const vocabMap = new Map();
  const allKanjiSet = new Set();

  if (script && Array.isArray(script)) {
    script.forEach(segment => {
      if (segment.vocabulary && Array.isArray(segment.vocabulary)) {
        segment.vocabulary.forEach(v => {
          if (!vocabMap.has(v.word)) {
            vocabMap.set(v.word, v);
            const chars = v.word.split('');
            chars.forEach(char => {
              if (char.match(/[一-龯]/)) allKanjiSet.add(char);
            });
          }
        });
      }
    });
  }

  const uniqueKanjis = Array.from(allKanjiSet);
  const kanjiData = await Kanji.find({ kanji: { $in: uniqueKanjis } }).select('kanji mean kun on level stroke_count detail img').lean();
  const kanjiMap = {};
  kanjiData.forEach(k => kanjiMap[k.kanji] = k);

  const enrichedVocabList = Array.from(vocabMap.values()).map(vocab => {
    const kanjiDetails = vocab.word.split('')
      .filter(char => char.match(/[一-龯]/))
      .map(char => kanjiMap[char])
      .filter(Boolean);

    return {
      word: vocab.word, reading: vocab.reading, meaning: vocab.meaning, pos: vocab.pos, kanji_info: kanjiDetails 
    };
  });

  const newVideo = new Video({
    title: autoTitle, youtube_url, thumbnail_url, script, vocab_list: enrichedVocabList, creator: userId, jlpt_level: 'Unknown', duration: realDurationSeconds || 0, video_theme: 'Anime'          
  });

  let aiResult = null;
  try {
    aiResult = await generateQuizFromScript(script); 
  } catch (aiError) {
    console.warn("⚠️ [Auto-AI] Gemini API đang quá tải hoặc lỗi. Bỏ qua tạo Quiz:", aiError.message);
  }

  newVideo.jlpt_level = aiResult?.jlptLevel || 'Unknown';
  await newVideo.save(); 

  let newQuiz = null;
  if (aiResult && aiResult.questions) {
    newQuiz = new Quiz({ videoId: newVideo._id, questions: aiResult.questions });
    await newQuiz.save();
  }

  indexVideoScript(newVideo._id, script).catch(console.error);

  return { newVideo, newQuiz, aiResult };
};

export const convertFuriganaService = async (text) => {
  if (!text || !String(text).trim()) return "";
  await initKuroshiro();
  return await kuroshiro.convert(String(text), { mode: "furigana", to: "hiragana" });
};
