import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import UserAchievement from '../models/UserAchievement.js';
import Achievement from '../models/Achievement.js';
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

    const period = req.query.period || 'week'; // week, month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate, dataPoints, daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    if (period === 'week') {
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      dataPoints = 7;
    } else if (period === 'month') {
      // Last 12 months
      startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      dataPoints = 12;
    }

    const activities = await LearningActivity.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: today }
    }).sort({ date: 1 });

    if (period === 'week') {
      const weeklyData = [];

      for (let i = 0; i < dataPoints; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (dataPoints - 1 - i));
        date.setHours(0, 0, 0, 0);

        const activity = activities.find(
          a => new Date(a.date).toDateString() === date.toDateString()
        );

        const dayLabel = daysOfWeek[(date.getDay() + 6) % 7];

        weeklyData.push({
          day: dayLabel.toString(),
          hours: activity?.hoursSpent || 0,
          date: date.toISOString().split('T')[0]
        });
      }

      res.json({ weeklyData });
    } else if (period === 'month') {
      // Build monthly data for last 12 months
      const monthlyData = [];
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const monthActivities = activities.filter(a => {
          const activityDate = new Date(a.date);
          return activityDate >= monthStart && activityDate <= monthEnd;
        });

        const totalHours = monthActivities.reduce((sum, a) => sum + (a.hoursSpent || 0), 0);

        monthlyData.push({
          month: monthNames[monthDate.getMonth()],
          hours: Math.round(totalHours * 10) / 10
        });
      }

      res.json({ monthlyData });
    }
  } catch (error) {
    console.error('Error fetching learning progress:', error);
    res.status(500).json({ error: 'Lỗi lấy tiến độ học tập' });
  }
});

// Get user's courses with progress
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

    // Update last active date to now
    await User.findByIdAndUpdate(req.user.id, { lastActiveDate: new Date() });

    // Get user's rank based on XP points
    const totalUsers = await User.countDocuments();
    const usersAhead = await User.countDocuments({ xpPoints: { $gt: user.xpPoints } });
    const userRank = usersAhead + 1; // 1-based ranking
    const percentile = Math.round(((totalUsers - usersAhead) / totalUsers) * 100);

    // Get today's learning activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayActivity = await LearningActivity.findOne({
      userId: req.user.id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    // Calculate total learning hours this week
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekActivities = await LearningActivity.find({
      userId: req.user.id,
      date: { $gte: sevenDaysAgo, $lte: today }
    });
    const weekHours = weekActivities.reduce((sum, a) => sum + (a.hoursSpent || 0), 0);

    res.json({
      totalLearningHours: user.totalLearningHours || 0,
      dayStreak: user.dayStreak || 0,
      xpPoints: user.xpPoints || 0,
      userRank: userRank,
      ranking: `Top ${percentile}%`,
      todayHours: todayActivity?.hoursSpent || 0,
      weekHours: Math.round(weekHours * 10) / 10
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

// Track user session time (called via sendBeacon)
router.post('/track-session', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { durationSeconds, page } = req.body;

    if (!durationSeconds || durationSeconds < 0) {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    // Convert seconds to hours
    const durationHours = durationSeconds / 3600;

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find or create today's activity
    let activity = await LearningActivity.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (activity) {
      // Update existing activity
      activity.hoursSpent += durationHours;
    } else {
      // Create new activity
      activity = await LearningActivity.create({
        userId: req.user.id,
        date: today,
        hoursSpent: durationHours,
        videosWatched: 0,
        quizzesTaken: 0,
        vocabularyLearned: 0,
        xpEarned: 0
      });
    }

    await activity.save();

    // Get the user to check if they need a streak update
    const currentUser = await User.findById(req.user.id);
    const now = new Date();
    let streakUpdate = {};

    if (currentUser.lastActiveDate) {
      const lastActive = new Date(currentUser.lastActiveDate);
      const timeDiff = now.getTime() - lastActive.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      // If more than 24 hours have passed since last activity, reset streak
      if (daysDiff > 1) {
        streakUpdate = { dayStreak: 1 };
      } else {
        // Same day or within 24 hours, increment streak
        streakUpdate = { $inc: { dayStreak: 1 } };
      }
    } else {
      // First time, start streak at 1
      streakUpdate = { dayStreak: 1 };
    }

    // Update user's totalLearningHours, lastActiveDate, and streak
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { totalLearningHours: durationHours },
        lastActiveDate: now,
        ...streakUpdate
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Session tracked successfully',
      durationHours,
      totalLearningHours: user.totalLearningHours,
      page
    });
  } catch (error) {
    console.error('Error tracking session:', error);
    res.status(500).json({ error: 'Failed to track session' });
  }
});

export default router;
