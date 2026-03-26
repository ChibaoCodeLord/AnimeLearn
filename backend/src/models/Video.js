const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    uploader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    source_url: { type: String, required: true },
    source_type: { type: String, enum: ['youtube', 'local_upload'], required: true },
    genre_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }], // Một video có nhiều thể loại
    thumbnail: { type: String },
    is_public: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);