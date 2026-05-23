import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET chưa được cấu hình!');

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    ///Vì job ở server chạy theo chu kỳ (mỗi 5 phút), nên sẽ có khoảng trễ.
  // Nếu user vừa hết hạn ban nhưng job chưa kịp chạy thì:

    // User vẫn bị chặn 403 sai thời điểm
    // Phải đợi đến lần quét tiếp theo mới được mở
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const user = await User.findById(userId)
      .select('isBanned bannedAt unbannedAt banReason');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.isBanned) {
      const now = new Date();
      if (user.unbannedAt && user.unbannedAt <= now) {
        await User.findByIdAndUpdate(userId, {
          $set: {
            isBanned: false,
            bannedAt: null,
            unbannedAt: null,
            banReason: ''
          }
        });
      } else {
        return res.status(403).json({
          error: 'User is banned',
          bannedAt: user.bannedAt,
          unbannedAt: user.unbannedAt,
          banReason: user.banReason
        });
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};


export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user đã được gán từ middleware phía trên
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này!' });
    }
    next();
  };
};

export default authMiddleware;