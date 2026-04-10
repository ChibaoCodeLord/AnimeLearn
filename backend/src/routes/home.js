import express from 'express';
import User from '../models/User.js';
import Video from '../models/Video.js';
const router = express.Router();

// Get user profile
router.get('/user-profile', async (req, res) => {
  try {
    // Get user from session or JWT token
    const userId = req.user?.id; // Assuming auth middleware sets req.user

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Lỗi lấy thông tin người dùng' });
  }
});

// Get community videos
router.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ created_date: -1 }).limit(20);
    // Lược bỏ thuộc tính script (data rất nặng) khi trả về List màn hình chính
    const mappedVideos = videos.map(v => ({
      id: v._id,
      title: v.title,
      youtube_url: v.youtube_url,
      thumbnail_url: v.thumbnail_url,
      jlpt_level: v.jlpt_level,
      views_count: v.views_count,
      likes_count: v.likes_count,
      created_date: v.created_date
    }));
    res.json(mappedVideos);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error:  'Lỗi lấy thông tin videos'});
  }
});

export default router; 