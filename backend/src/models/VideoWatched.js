import mongoose from 'mongoose';

const VideoWatchedSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    watched_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    progress_seconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

VideoWatchedSchema.index({ user: 1, watched_at: -1 });
VideoWatchedSchema.index({ user: 1, video: 1 });

export default mongoose.model('VideoWatched', VideoWatchedSchema);