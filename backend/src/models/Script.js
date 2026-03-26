const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema({
    video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    line_jp: { type: String, required: true },
    line_vn: { type: String, required: true },
    // Cấu trúc Furigana dạng Array để Frontend dễ dàng bôi đen và render thẻ <ruby>
    line_furigana: [{
        text: { type: String, required: true }, // Ví dụ: "学生" hoặc "は"
        furigana: { type: String, default: null } // Ví dụ: "がくせい" hoặc null
    }],
    start_time: { type: Number, required: true }, // Kiểu Float lưu theo giây (VD: 12.5)
    end_time: { type: Number, required: true }
});

// Đánh chỉ mục (Index) kép để tăng tốc độ tìm kiếm phụ đề theo video và thời gian
scriptSchema.index({ video_id: 1, start_time: 1 });

module.exports = mongoose.model('Script', scriptSchema);