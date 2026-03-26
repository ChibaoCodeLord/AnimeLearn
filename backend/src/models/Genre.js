const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String, required: true, unique: true } // Ví dụ: 'anime-hanh-dong'
});

module.exports = mongoose.model('Genre', genreSchema);