import mongoose from 'mongoose';

const KanjiSchema = new mongoose.Schema({
    kanji: { type: String, required: true, unique: true }, // VD: "違"
    mean: { type: String }, // Nghĩa Hán Việt: "VI"
    kun: { type: String },  // Âm Kun
    on: { type: String },   // Âm On
    level: { type: Number }, // JLPT Level (1, 2, 3, 4, 5)
    stroke_count: { type: Number }, // Số nét
    detail: { type: String }, // Giải nghĩa chi tiết
    compDetail: { type: Array, default: [] }, // Cấu tạo bộ thủ
    examples: { type: Array, default: [] },   // Mảng từ vựng ví dụ
    img: { type: String }, // Mã SVG vẽ nét chữ
    freq: { type: Number } // Tần suất sử dụng (có thể dùng để xếp hạng phổ biến)
});

export default mongoose.model('Kanji', KanjiSchema);