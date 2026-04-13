import mongoose from 'mongoose';

const VocabularySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  word: {
    type: String,
    required: true
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
  saved_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Vocabulary', VocabularySchema);
