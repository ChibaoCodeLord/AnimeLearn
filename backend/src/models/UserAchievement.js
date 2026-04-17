import mongoose from 'mongoose';

const userAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Unique index to prevent duplicate achievements for same user
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export default mongoose.model('UserAchievement', userAchievementSchema);
