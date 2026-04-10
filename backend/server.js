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


// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow Vite & CRA default ports
  credentials: true
}));
app.use(cookieParser()); // Add this to parse cookies
app.use(express.json()); // Allows us to parse JSON data in the request body

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');

    // Start the server only after connecting to the database
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error connecting to MongoDB:', error.message);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Basic test route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'AnimeLearn API is running smoothly!' });
});

// 404 error handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});