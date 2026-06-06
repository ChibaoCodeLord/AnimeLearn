import mongoose from 'mongoose';

const VocabularySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  word: {
    type: String,
    required: true,
    index: true // Tối ưu hóa khi tìm kiếm theo từ khóa
  },
  reading: {
    type: String
  },
  meaning_vi: {
    type: String
  },
  meaning_en: {
    type: String
  },
  part_of_speech: {
    type: String
  },
  jlpt_level: {
    type: String,
    default: 'Unknown'
  },
  
  // ---> TRƯỜNG LƯU TRỮ THỨ HẠNG PHỔ BIẾN <---
  popularity_score: {
    type: Number,
    default: 999999, // Số càng nhỏ càng phổ biến. Default lớn để đẩy các từ hiếm xuống đáy.
    index: true 
  },

  example_sentence: {
    type: String
  },
  example_meaning: {
    type: String
  },
  review_date: {
    type: Date,
    default: Date.now
  },
  next_review_date: {
    type: Date,
    default: Date.now
  },
  review_interval: {
    type: Number,
    default: 1
  },
  ease_factor: {
    type: Number,
    default: 2.5
  },
  review_count: {
    type: Number,
    default: 0
  },
  saved_at: {
    type: Date,
    default: Date.now
  }
});

// Tạo Compound Index để tối ưu triệt để câu lệnh VỪA SEARCH word VỪA SORT popularity
VocabularySchema.index({ word: 1, popularity_score: 1 });

export default mongoose.model('Vocabulary', VocabularySchema);