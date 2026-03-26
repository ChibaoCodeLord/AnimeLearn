const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    uploader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    source_url: { type: String, required: true }, // Lưu link video từ Cloudinary trả về
    cloudinary_public_id: { type: String }, // Khóa định danh trên Cloudinary để phục vụ việc xóa/sửa
    source_type: { type: String, enum: ['youtube', 'cloudinary'], required: true }, 
    genre_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
    thumbnail: { type: String }, // Cũng có thể lưu link ảnh Cloudinary ở đây
    is_public: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);