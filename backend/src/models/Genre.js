import mongoose from 'mongoose';

const genreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String, required: true, unique: true } // Ví dụ: 'anime-hanh-dong'
});

export default mongoose.model('Genre', genreSchema);