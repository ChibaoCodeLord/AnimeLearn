import express from 'express';
import User from '../models/User.js';

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
    res.status(500).json({ error: error.message });
  }
});

// Get community videos
router.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find().limit(20);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;