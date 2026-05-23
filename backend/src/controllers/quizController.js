import Quiz from '../models/Quiz.js'; // Nhớ đường dẫn đến file Model lúc nãy
import { generateQuizFromScript } from '../services/quizAiService.js';

// Lấy Quiz theo Video ID
export const getQuizByVideoId = async (req, res) => {
    try {
        const { videoId } = req.params;
        
        const quiz = await Quiz.findOne({ videoId });
        if (!quiz) {
            return res.status(404).json({ message: "Chưa có quiz cho video này" });
        }

        res.status(200).json(quiz);
    } catch (error) {
        console.error("Lỗi khi lấy quiz:", error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy dữ liệu bài tập" });
    }
};

// Gọi AI tạo Quiz và lưu vào Database
export const generateQuizForVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        const { script } = req.body;

        if (!script || !Array.isArray(script) || script.length === 0) {
            return res.status(400).json({ error: "Kịch bản (script) không hợp lệ hoặc trống." });
        }

        // 1. Kiểm tra xem Video này đã có Quiz chưa
        const existingQuiz = await Quiz.findOne({ videoId });
        if (existingQuiz) {
            return res.status(400).json({ error: "Video này đã có bài tập rồi, không thể tạo thêm!" });
        }

        // 2. Gọi AI sinh câu hỏi
        const generatedQuestions = await generateQuizFromScript(script);

        if (!generatedQuestions || generatedQuestions.length === 0) {
            return res.status(500).json({ error: "AI không thể tạo được câu hỏi nào từ kịch bản này." });
        }

        // 3. Lưu vào Database
        const newQuiz = new Quiz({
            videoId,
            questions: generatedQuestions
        });

        await newQuiz.save();

        res.status(201).json(newQuiz);
    } catch (error) {
        console.error("Lỗi tạo Quiz:", error);
        res.status(500).json({ error: "Lỗi hệ thống khi tạo bài tập bằng AI. Vui lòng thử lại sau." });
    }
};