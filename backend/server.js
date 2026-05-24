import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from './src/routes/auth.js';
import homeRoutes from './src/routes/home.js';
import videoRoutes from './src/routes/video.js';
import chatRoutes from './src/routes/chat.js';
import adminRoutes from './src/routes/admin.js';
import dictionaryRoutes from './src/routes/dictionary.js'
import quizRoutes from './src/routes/quiz.js';
import vocabularyRouters from './src/routes/vocabulary.js';
import kanjiRouters from './src/routes/kanji.js';
import User from './src/models/User.js';

import Video from './src/models/Video.js';


// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config();

Video.syncIndexes()
  .then(() => console.log('✅ Đã tạo Index thành công, từ nay khỏi lo tràn RAM!'))
  .catch(err => console.log('Lỗi tạo Index:', err));

const app = express();
const PORT = process.env.PORT || 5000;
const BAN_SWEEP_INTERVAL_MS = 5 * 60 * 1000; // cứ cách 5p kiểm tra để tự động gở ban

const sweepExpiredBans = async () => {
  try {
    const now = new Date();
    const result = await User.updateMany(
      { isBanned: true, unbannedAt: { $ne: null, $lte: now } },
      { $set: { isBanned: false, bannedAt: null, unbannedAt: null, banReason: '' } }
    );

    if (result?.modifiedCount) {
      console.log(`[BanSweep] Unbanned ${result.modifiedCount} user(s)`);
    }
  } catch (error) {
    console.error('[BanSweep] Error unbanning users:', error.message || error);
  }
};

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow Vite & CRA default ports
  credentials: true
}));
app.use(cookieParser()); // Add this to parse cookies

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');

    void sweepExpiredBans();

    setInterval(() => {
      void sweepExpiredBans();
    }, BAN_SWEEP_INTERVAL_MS);

    // Start the server only after connecting to the database
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });

    // Cho phép các request nặng như /api/video/analyze chạy lâu hơn
    server.requestTimeout = 1000 * 60 * 35; // 35 phút
    server.headersTimeout = 1000 * 60 * 36; // phải lớn hơn requestTimeout
    server.timeout = 1000 * 60 * 35;
    server.keepAliveTimeout = 1000 * 60 * 5;
  })
  .catch((error) => {
    console.error('❌ Error connecting to MongoDB:', error.message);
  });

mongoose.connection.once('open', async () => {
  try {
    // Đi cửa sau: Can thiệp thẳng vào collection 'videos' để tạo Index mà không cần Import Model
    await mongoose.connection.db.collection('videos').createIndex({ created_date: -1 });
    console.log('✅ ĐÃ TẠO INDEX XẾP HẠNG THÀNH CÔNG! Vĩnh biệt lỗi 32MB RAM!');
  } catch (err) {
    console.error('❌ Lỗi khi tạo Index:', err);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dictionary', dictionaryRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/vocabulary', vocabularyRouters);
app.use('/api/kanji', kanjiRouters);

// Basic test route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'AnimeLearn API is running smoothly!' });
});

// 404 error handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});