import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    required: true
  },
  unlockCondition: {
    type: String, // 'earlyBirdLearner', 'weeklyChampion', 'vocabularyVirtuoso', 'jlptN2Finisher'
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Achievement', achievementSchema);
