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
    type: Array, // Mảng các câu hội thoại { timestamp, japanese, vietnamese, english, vocabulary }
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Gắn ID người tạo để dễ truy vấn sở hữu,
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
  created_date: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Video', VideoSchema);
