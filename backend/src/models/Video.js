import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  youtube_url: {
    type: String,
    required: true
  },
  thumbnail_url: {
    type: String,
    default: ''
  },
  jlpt_level: {
    type: String,
    default: 'Unknown'
  },
  script: {
    type: Array, // Mảng các câu hội thoại { timestamp, japanese, vietnamese, vocabulary }
    required: true
  },
  
  // THÊM MỚI: KHO CHỨA TỪ VỰNG KÈM KANJI ĐÃ XỬ LÝ
  vocab_list: [{
    word: String,
    reading: String,
    meaning: String,
    pos: String,
    kanji_info: { type: Array, default: [] } // Chứa full object thông tin Kanji
  }],

  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Gắn ID người tạo để dễ truy vấn sở hữu
  },
  views_count: {
    type: Number,
    default: 0
  },
  likes_count: {
    type: Number,
    default: 0
  },
  status:{
    type: String,
    enum: ['approved', 'rejected', 'pending'],
    default: 'pending'
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  created_date: {
    type: Date,
    default: Date.now
  },
  // Thời lượng video (Lưu bằng tổng số giây - ví dụ: 750 giây)
  duration: {
    type: Number,
    default: 0
  },
  // Chủ đề của video (Ví dụ: Anime, Podcast, Tin tức, Kinh doanh...)
  video_theme: {
    type: String,
    default: 'Khác',
    trim: true
  },
});

VideoSchema.index({ status: 1, visibility: 1, created_date: -1 });
VideoSchema.index({ status: 1, visibility: 1, jlpt_level: 1, created_date: -1 });
VideoSchema.index({ status: 1, created_date: -1 });
VideoSchema.index({ creator: 1, created_date: -1 });
VideoSchema.index({ created_date: -1 });
VideoSchema.index({ jlpt_level: 1, created_date: -1 });

export default mongoose.model('Video', VideoSchema);
