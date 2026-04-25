import mongoose from 'mongoose';


//Phần này để lưu người dùng nào đã thích video nào
// vì nếu không thì sẽ xảy ra hiện tượng chồng like (like video nhiều lần)
const VideoLikeSchema = new mongoose.Schema(
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
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

VideoLikeSchema.index({ video: 1, user: 1 }, { unique: true });

export default mongoose.model('VideoLike', VideoLikeSchema);