import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import UserAchievement from '../models/UserAchievement.js';
import Achievement from '../models/Achievement.js';
import UserCourse from '../models/UserCourse.js';
import LearningActivity from '../models/LearningActivity.js';
import { updateUserActivity } from '../services/learningActivityService.js';

const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng bởi tài khoản khác' });
    }

    // Create new user (password will be hashed by pre-save hook in User model)
    const user = await User.create({
      fullName,
      email,
      password
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      token: token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Use matchPassword method (from User.js)
    const isValid = await user.matchPassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role},
      process.env.JWT_SECRET, // bắt buộc phải có env
      { expiresIn: '7d' }
    );

    console.log(token.JWT_SECRET);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    //đã lưu vào cookie không cần gửi thêm token
    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi đăng nhập' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      jlptLevel: user.jlptLevel,
      profilePicture: user.profilePicture,
      bio: user.bio,
      phone: user.phone,
      location: user.location,
      role: user.role || 'user',
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Lỗi lấy thông tin cá nhân' });
  }
});

// Update user profile
router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { fullName, jlptLevel, bio, profilePicture, phone, location } = req.body;

    // Validate input
    if (fullName && fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Tên phải có ít nhất 2 ký tự' });
    }

    // Validate phone format (optional)
    if (phone && phone.trim().length > 0) {
      const phoneRegex = /^[0-9+\-\s()]{10,}$/;
      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        fullName: fullName || undefined,
        jlptLevel: jlptLevel || undefined,
        bio: bio !== undefined ? bio : undefined,
        profilePicture: profilePicture || undefined,
        phone: phone || undefined,
        location: location || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      jlptLevel: user.jlptLevel,
      profilePicture: user.profilePicture,
      bio: user.bio,
      phone: user.phone,
      location: user.location,
      role: user.role || 'user',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Lỗi cập nhật profile' });
  }
});

// Logout route
router.post('/logout', authMiddleware, (req, res) => {
  try {
    // Clear cookie
    // Set cookie to empty value and expire it immediately to ensure removal
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    // Also call clearCookie for good measure
    res.clearCookie('token', { path: '/' });

    res.json({ success: true, message: 'Đã đăng xuất thành công' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Lỗi đăng xuất' });
  }
});

// Get learning progress (weekly activity)
router.get('/learning-progress', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get last 7 days of learning activity
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activities = await LearningActivity.find({
      userId: req.user.id,
      date: { $gte: sevenDaysAgo, $lte: today }
    }).sort({ date: 1 });

    // Map to days of week
    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const weeklyData = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);

      const activity = activities.find(
        a => new Date(a.date).toDateString() === date.toDateString()
      );

      weeklyData.push({
        day: daysOfWeek[(date.getDay() + 6) % 7],
        hours: activity?.hoursSpent || 0,
        date: date.toISOString().split('T')[0]
      });
    }

    res.json({ weeklyData });
  } catch (error) {
    console.error('Error fetching learning progress:', error);
    res.status(500).json({ error: 'Lỗi lấy tiến độ học tập' });
  }
});

// Get user's courses with progress
router.get('/courses', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const courses = await UserCourse.find({ userId: req.user.id }).sort({ startedAt: -1 });

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Lỗi lấy danh sách khoá học' });
  }
});

// Get user's achievements
router.get('/achievements', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user's achievements
    const userAchievements = await UserAchievement.find({
      userId: req.user.id
    }).populate('achievementId');

    // Get all achievements for reference
    const allAchievements = await Achievement.find();

    // Create achievement list with locked/unlocked status
    const achievementsData = allAchievements.map(achievement => {
      const unlocked = userAchievements.some(
        ua => ua.achievementId._id.toString() === achievement._id.toString()
      );

      return {
        id: achievement._id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        unlocked
      };
    });

    res.json(achievementsData);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Lỗi lấy danh sách huy hiệu' });
  }
});

// Get profile statistics
router.get('/profile-stats', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's rank based on XP points (top 5%)
    const totalUsers = await User.countDocuments();
    const userRank = await User.countDocuments({ xpPoints: { $gt: user.xpPoints } });
    const percentile = Math.round(((totalUsers - userRank) / totalUsers) * 100);

    // Get today's learning activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayActivity = await LearningActivity.findOne({
      userId: req.user.id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalLearningHours: user.totalLearningHours || 0,
      dayStreak: user.dayStreak || 0,
      xpPoints: user.xpPoints || 0,
      ranking: `Top ${percentile}%`,
      todayHours: todayActivity?.hoursSpent || 0
    });
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    res.status(500).json({ error: 'Lỗi lấy thống kê profile' });
  }
});

// Add/Update learning activity for today
router.post('/update-learning-activity', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await updateUserActivity(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating learning activity:', error);
    res.status(500).json({ error: 'Lỗi cập nhật hoạt động học tập' });
  }
});

// Add course for user
router.post('/add-course', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { courseId, title, unit, color = '#A5F3C7' } = req.body;

    if (!courseId || !title || !unit) {
      return res.status(400).json({ error: 'Thiếu thông tin khoá học' });
    }

    const userCourse = new UserCourse({
      userId: req.user.id,
      courseId,
      title,
      unit,
      color,
      progress: 0
    });

    await userCourse.save();

    res.json({ success: true, userCourse });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Khoá học đã tồn tại cho người dùng này' });
    }
    console.error('Error adding course:', error);
    res.status(500).json({ error: 'Lỗi thêm khoá học' });
  }
});

// Update course progress
router.put('/update-course/:courseId', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { progress } = req.body;
    const { courseId } = req.params;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Tiến độ phải từ 0 đến 100' });
    }

    const userCourse = await UserCourse.findOneAndUpdate(
      { userId: req.user.id, courseId },
      {
        progress,
        completedAt: progress === 100 ? new Date() : null
      },
      { new: true }
    );

    if (!userCourse) {
      return res.status(404).json({ error: 'Không tìm thấy khoá học' });
    }

    res.json({ success: true, userCourse });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Lỗi cập nhật khoá học' });
  }
});

// Unlock achievement for user
router.post('/unlock-achievement', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { achievementId } = req.body;

    if (!achievementId) {
      return res.status(400).json({ error: 'Thiếu ID huy hiệu' });
    }

    try {
      const userAchievement = new UserAchievement({
        userId: req.user.id,
        achievementId,
        unlockedAt: new Date()
      });

      await userAchievement.save();

      res.json({ success: true, userAchievement });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Huy hiệu đã được mở khoá' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    res.status(500).json({ error: 'Lỗi mở khoá huy hiệu' });
  }
});

// TEST ENDPOINT: Simulate watching a video
router.post('/test-watch-video', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await updateUserActivity(req.user.id, {
      hoursSpent: 0.5,
      videosWatched: 1,
      quizzesTaken: 0,
      vocabularyLearned: 5,
      xpEarned: 25
    });

    res.json({
      ...result,
      message: '✓ Simulated watching a video for 30 minutes'
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// TEST ENDPOINT: Simulate completing a quiz
router.post('/test-complete-quiz', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await updateUserActivity(req.user.id, {
      hoursSpent: 0.25,
      videosWatched: 0,
      quizzesTaken: 1,
      vocabularyLearned: 0,
      xpEarned: 50
    });

    res.json({
      ...result,
      message: '✓ Simulated completing a quiz'
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
