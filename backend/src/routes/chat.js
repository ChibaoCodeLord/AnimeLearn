import express from 'express';
import Video from '../models/Video.js';
import { authMiddleware, restrictTo } from '../middleware/auth.js'
import { askVideoQuestion, indexVideoScript } from '../services/ragChatService.js';

const router = express.Router();
// TODO: hiện tại rag chưa có auth tương lai có thể cần ratelimit
router.post('/video/:videoId/index',authMiddleware , async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    const result = await indexVideoScript(video._id, video.script || []);
    return res.json({
      message: 'Đã index script video vào vector DB',
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Index video script thất bại',
      details: error.message,
    });
  }
});

router.post('/video/:videoId/ask',authMiddleware , async (req, res) => {
  try {
    const { videoId } = req.params;
    const { question, history } = req.body;

    if (!question || !String(question).trim()) {
      return res.status(400).json({ error: 'question là bắt buộc' });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    const ragResult = await askVideoQuestion(video._id, String(question).trim(), history || []);

    return res.json({
      video_id: String(video._id),
      question: String(question).trim(),
      answer: ragResult.answer || 'Không có câu trả lời',
      sources: ragResult.sources || [],
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Chat RAG thất bại',
      details: error.message,
    });
  }
});

export default router;
