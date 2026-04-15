import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

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

export default router;
