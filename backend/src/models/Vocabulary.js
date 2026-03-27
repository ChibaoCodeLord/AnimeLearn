import mongoose from 'mongoose';

const vocabularySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    word: { type: String, required: true },
    meaning: { type: String, required: true },
    label_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Label' },
    // Liên kết bối cảnh (Context linking)
    video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    script_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Script' }
}, { timestamps: true });

export default mongoose.model('Vocabulary', vocabularySchema);