import mongoose from 'mongoose';

// Định nghĩa cấu trúc chuẩn của 1 câu hỏi để AI không trả về dữ liệu rác
const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: {
        type: [{ type: String, required: true }],
        required: true,
        validate: {
            validator: function (v) {
                // Kiểm tra phải là mảng và có đúng 4 phần tử
                return Array.isArray(v) && v.length === 4;
            },
            message: 'Mỗi câu hỏi phải có chính xác 4 đáp án!'
        }
    },
    correct_index: {
        type: Number,
        required: true,
        min: 0,
        max: 3, // Vì mảng có 4 phần tử nên index chỉ được từ 0-3
        validate: {
            validator: Number.isInteger,
            message: 'Chỉ số đáp án đúng phải là số nguyên!'
        }
    },
    explanation: { type: String } // Giải thích ngữ pháp/từ vựng
}, { _id: false }); // Không cần tự sinh ID cho từng câu hỏi lẻ

const quizSchema = new mongoose.Schema({
    video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slot_index: { type: Number, min: 1, max: 6, required: true }, // Vị trí 1-6
    questions: [questionSchema] // Áp dụng cấu trúc câu hỏi ở trên
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);