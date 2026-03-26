const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Nhớ hash bằng bcrypt trước khi lưu
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    target_level: { type: String, enum: ['N1', 'N2', 'N3', 'N4', 'N5'] }, // Mục tiêu JLPT
    status: { type: String, enum: ['active', 'banned'], default: 'active' },
    ban_reason: { type: String, default: null },
    banned_until: { type: Date, default: null }
}, { 
    timestamps: true // Tự động tạo created_at và updated_at
});

module.exports = mongoose.model('User', userSchema);