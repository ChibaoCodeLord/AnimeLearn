import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered. Please login instead.' });
    }

    // Create new user
    const newUser = new User({
      fullName,
      email,
      password
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        jlptLevel: newUser.jlptLevel
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user and select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        jlptLevel: user.jlptLevel
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile (protected route)
 * @access  Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User profile retrieved successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        jlptLevel: user.jlptLevel,
        bio: user.bio,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (optional - mainly handled on frontend)
 * @access  Private
 */
router.post('/logout', authenticateToken, (req, res) => {
  // Token is removed from frontend localStorage
  res.status(200).json({ message: 'Logout successful' });
});

/**
 * @route   POST /api/auth/reset-db
 * @desc    Reset database - DELETE ALL USERS (Development only)
 * @access  Public (⚠️ Remove in production!)
 */
router.post('/reset-db', async (req, res) => {
  try {
    const result = await User.deleteMany({});
    
    res.status(200).json({
      message: 'Database reset successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Reset DB error:', error);
    res.status(500).json({ message: 'Error resetting database', error: error.message });
  }
});

export default router;
