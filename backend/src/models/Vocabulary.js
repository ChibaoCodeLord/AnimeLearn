import mongoose from 'mongoose';

const VocabularySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
    index: true
  },
  item_type: {
    type: String,
    enum: ['vocab', 'kanji'],
    default: 'vocab',
    index: true
  },
  word: {
    type: String,
    required: true,
    trim: true,
    index: true
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
  popularity_score: {
    type: Number,
    default: 999999,
    index: true
  },
  on: {
    type: String
  },
  kun: {
    type: String
  },
  mean: {
    type: String
  },
  stroke_count: {
    type: Number
  },
  freq: {
    type: Number,
    index: true
  },
  detail: {
    type: String
  },
  img: {
    type: String
  },
  example_sentence: {
    type: String
  },
  example_meaning: {
    type: String
  },
  next_review_date: {
    type: Date,
    default: Date.now,
    index: true
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
  review_date: {
    type: Date,
    default: Date.now
  },
  saved_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

VocabularySchema.index({ word: 1, popularity_score: 1 });
VocabularySchema.index({ user: 1, folderId: 1, item_type: 1, saved_at: -1 });
VocabularySchema.index({ user: 1, item_type: 1, next_review_date: 1 });

export default mongoose.model('Vocabulary', VocabularySchema);
