import mongoose from 'mongoose';

const learningActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    hoursSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    videosWatched: {
      type: Number,
      default: 0
    },
    quizzesTaken: {
      type: Number,
      default: 0
    },
    vocabularyLearned: {
      type: Number,
      default: 0
    },
    xpEarned: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Index for efficient queries
learningActivitySchema.index({ userId: 1, date: -1 });

export default mongoose.model('LearningActivity', learningActivitySchema);
