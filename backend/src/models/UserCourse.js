import mongoose from 'mongoose';

const userCourseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video', // Linking to Video model as courses
      required: true
    },
    title: {
      type: String,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    color: {
      type: String,
      default: '#A5F3C7'
    },
    completedAt: {
      type: Date,
      default: null
    },
    startedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for quick lookup
userCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model('UserCourse', userCourseSchema);
