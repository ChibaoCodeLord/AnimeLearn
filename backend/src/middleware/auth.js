import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
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