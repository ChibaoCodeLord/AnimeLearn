import express from 'express';
import { getQuizByVideoId, generateQuizForVideo } from '../controllers/quizController.js';
import { authMiddleware } from '../middleware/auth.js'; // Nhớ check auth để tránh spam API

const router = express.Router();

// GET /api/quiz/:videoId - Lấy quiz đã tồn tại
router.get('/:videoId', authMiddleware, getQuizByVideoId);

// POST /api/quiz/:videoId/generate - Yêu cầu AI tạo quiz mới
router.post('/:videoId/generate', authMiddleware, generateQuizForVideo);

export default router;