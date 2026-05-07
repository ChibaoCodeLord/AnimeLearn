import express from 'express';
import { getQuizByVideoId, generateQuizForVideo } from '../controllers/quizController.js';
import { authMiddleware } from '../middleware/auth.js'; // Nhớ check auth để tránh spam API
import Quiz from '../models/Quiz.js';
import Video from '../models/Video.js'; // Để cập nhật JLPT level vào Video sau khi AI trả về
import { generateQuizFromScript } from '../services/quizAIService.js';

const router = express.Router();

// GET /api/quiz/:videoId - Lấy quiz đã tồn tại
router.get('/:videoId', authMiddleware, getQuizByVideoId);

router.post('/:videoId/generate', authMiddleware, async (req, res) => {
    try {
        const { videoId } = req.params;
        const { script } = req.body;

        // 1. Gọi AI xử lý 1 chạm
        const aiResult = await generateQuizFromScript(script);

        // 2. Lưu bộ câu hỏi vào Database Quiz
        const newQuiz = new Quiz({
            videoId: videoId,
            questions: aiResult.questions
        });
        await newQuiz.save();

        // 3. CẬP NHẬT JLPT LEVEL VÀO VIDEO (Lưu ý mấu chốt ở đây)
        if (aiResult.jlptLevel) {
            await Video.findByIdAndUpdate(videoId, { 
                jlpt_level: aiResult.jlptLevel 
            });
        }

        res.json({ message: 'Tạo Quiz thành công', quiz: newQuiz, jlptLevel: aiResult.jlptLevel });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi AI tạo quiz' });
    }
});

export default router;