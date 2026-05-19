import mongoose from 'mongoose';

const dictionarySchema = new mongoose.Schema({
    word: { type: String, required: true, index: true },
    reading: { type: String, index: true },
    pos: { type: String },
    
    // Lưu ý: Meanings của bạn đang là dạng Mảng (Array of Strings)
    // Cấu trúc này rất chuẩn xác và khớp hoàn toàn với bản vá lỗi Controller vừa nãy!
    meanings: [{ type: String }], 

    // ---> BỔ SUNG TRƯỜNG ĐIỂM SỐ <---
    popularity_score: {
        type: Number,
        default: 999999, // Điểm mặc định cực cao để đẩy các từ vô danh xuống cuối
        index: true
    }
});

// Tối ưu hóa Index: Hỗ trợ tìm kiếm kết hợp Sort cực nhanh
dictionarySchema.index({ word: 1, popularity_score: 1 });
dictionarySchema.index({ reading: 1, popularity_score: 1 });

const Dictionary = mongoose.model('Dictionary', dictionarySchema);

export default Dictionary;