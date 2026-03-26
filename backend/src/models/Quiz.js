const mongoose = require('mongoose');

// Định nghĩa cấu trúc chuẩn của 1 câu hỏi để AI không trả về dữ liệu rác
const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }], // Mảng 4 đáp án
    correct_index: { type: Number, required: true }, // Vị trí đáp án đúng (0-3)
    explanation: { type: String } // Giải thích ngữ pháp/từ vựng
}, { _id: false }); // Không cần tự sinh ID cho từng câu hỏi lẻ

const quizSchema = new mongoose.Schema({
    video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slot_index: { type: Number, min: 1, max: 6, required: true }, // Vị trí 1-6
    questions: [questionSchema] // Áp dụng cấu trúc câu hỏi ở trên
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);