import express from 'express';
import { authMiddleware, restrictTo } from '../middleware/auth.js';
import Video from '../models/Video.js';
import User from '../models/User.js';

const router = express.Router();

// Tất cả route admin đều yêu cầu đăng nhập + role admin
router.use(authMiddleware, restrictTo('admin'));

// --- VIDEO MANAGEMENT ---

// GET /api/admin/videos - Lấy toàn bộ videos + populate thông tin người tạo
router.get('/videos', async (req, res) => {
  try {
    const { search = '', jlpt = '', status = '', page = 1, limit = 20 } = req.query;
    if(page <= 0) {
      throw new Error("Lỗi tham số page");
    }

    if(limit <= 0) {
      throw new Error("Lỗi tham số limit");
    }
    
    const filter = {};
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (jlpt && jlpt !== 'all') {
      filter.jlpt_level = jlpt;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Video.countDocuments(filter);

    const videos = await Video.find(filter)
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('creator', 'fullName email');

    const mappedVideos = videos.map(v => ({
      id: v._id,
      title: v.title,
      youtube_url: v.youtube_url,
      thumbnail_url: v.thumbnail_url,
      jlpt_level: v.jlpt_level,
      status: v.status || 'pending',
      views_count: v.views_count,
      likes_count: v.likes_count,
      created_date: v.created_date,
      script_length: v.script?.length || 0,
      creator: v.creator
        ? { id: v.creator._id, fullName: v.creator.fullName, email: v.creator.email }
        : { id: null, fullName: 'Đã xóa', email: '' }
    }));

    res.json({
      videos: mappedVideos,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('[Admin] Error fetching videos:', error);
    res.status(500).json({ error: "Lỗi lấy dữ liệu từ cở sở dữ liệu" });
  }
});

// DELETE /api/admin/videos/:id - Xóa video
router.delete('/videos/:id', async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video không tồn tại' });
    res.json({ message: 'Đã xóa video thành công', id: req.params.id });
  } catch (error) {
    console.error('[Admin] Error deleting video:', error);
    res.status(500).json({ error: 'Lỗi xóa video' });
  }
});

// PATCH /api/admin/videos/:id/status - Cập nhật trạng thái video 
// approved, rejected, pending (Duyệt/Từ chối/Chờ)
router.patch('/videos/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Kiểm tra class status có hợp lệ không
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const video = await Video.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );

    if (!video) {
        return res.status(404).json({ error: 'Video không tồn tại' });
    }

    res.status(200).json({ 
      message: `Đã cập nhật trạng thái thành: ${status}`, 
      video: { id: video._id, status: video.status } 
    });
  } catch (error) {
    console.error('[Admin] Error updating video status:', error);
    res.status(500).json({ error: "Lỗi xét duyệt" });
  }
});


// --- USER MANAGEMENT ---

// GET /api/admin/users - Lấy toàn bộ users
router.get('/users', async (req, res) => {
  try {
    const { search = '' } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    const mappedUsers = users.map(u => ({
      id: u._id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      jlptLevel: u.jlptLevel,
      createdAt: u.createdAt,
      isVerified: u.isVerified
    }));

    res.json(mappedUsers);
  } catch (error) {
    console.error('[Admin] Error fetching users:', error);
    res.status(500).json({ error: 'Lỗi lấy thông tin người dùng' });
  }
});

// PATCH /api/admin/users/:id/role - Đổi role user
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role không hợp lệ' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'User không tồn tại' });
    res.json({ message: 'Cập nhật quyền thành công', user: { id: user._id, role: user.role } });
  } catch (error) {
    console.error('[Admin] Error updating user role:', error);
    res.status(500).json({ error: 'Lỗi cập nhật quyền' });
  }
});

// --- STATS ---

// GET /api/admin/stats - Thống kê tổng quan
router.get('/stats', async (req, res) => {
  try {
    const [totalVideos, totalUsers, totalAdmins] = await Promise.all([
      Video.countDocuments(),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' })
    ]);

    res.json({ totalVideos, totalUsers, totalAdmins });
  } catch (error) {
    console.error('[Admin] Error fetching stats:', error);
    res.status(500).json({ error: 'Lỗi thống kê' });
  }
});

export default router;
