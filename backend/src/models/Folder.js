import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  color: {
    type: String,
    default: 'emerald'
  }
}, { timestamps: true });

FolderSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.model('Folder', FolderSchema);
