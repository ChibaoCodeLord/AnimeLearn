import mongoose from 'mongoose';

// Định nghĩa cấu trúc chuẩn của 1 câu hỏi để AI không trả về dữ liệu rác
const questionSchema = new mongoose.Schema({
    timestamp: { type: String, required: true }, // Mốc thời gian (VD: "00:30")
    type: { 
        type: String, 
        required: true,
        enum: ['fill_in_blank', 'vocabulary', 'translation', 'grammar_particle', 'kanji_reading'],
    },
    questionText: { type: String, required: true }, // Khớp với frontend: questionText
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
    correctAnswerIndex: { // Khớp với frontend: correctAnswerIndex thay vì correct_index
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
    // Đổi tên thành videoId để khớp chuẩn JSON trả về cho React
    videoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Video', 
        required: true,
        unique: true // CỰC KỲ QUAN TRỌNG: Đảm bảo 1 video chỉ có đúng 1 Quiz duy nhất
    },
    // Đã xóa user_id vì quiz này tạo ra là dùng chung cho toàn bộ user xem video
    // Đã xóa slot_index vì bài test gộp chung thành 1 mảng questions
    questions: [questionSchema] 
}, { 
    timestamps: true,
    toJSON: { virtuals: true, transform: (doc, ret) => { delete ret._id; delete ret.__v; } }, // Tự động map _id thành id cho React dễ xài
    toObject: { virtuals: true }
});

export default mongoose.model('Quiz', quizSchema);