import express from 'express';
import { authMiddleware, restrictTo } from '../middleware/auth.js';
import Video from '../models/Video.js';
import User from '../models/User.js';
import { sendVideoRejectedEmail } from '../services/emailService.js';

const router = express.Router();

// Tất cả route admin đều yêu cầu đăng nhập + role admin
router.use(authMiddleware, restrictTo('admin'));

// --- VIDEO MANAGEMENT ---

// GET /api/admin/videos - Lấy toàn bộ videos + populate thông tin người tạo
router.get('/videos', async (req, res) => {
  try {
    const { search = '', jlpt = '', status = '' } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    
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

    const skip = (page - 1) * limit;
    const total = await Video.countDocuments(filter);

    const videos = await Video.find(filter)
      .select('-vocab_list -script.vocabulary -script.text') 
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'fullName email')
      .lean();

    // 🚀 BỌC GIÁP PHÒNG THỦ CHỐNG CRASH VÒNG LẶP .MAP()
    const mappedVideos = videos.map(v => {
      let creatorInfo = { id: null, fullName: 'Đã xóa hoặc Lỗi', email: '' };
      
      if (v.creator && typeof v.creator === 'object') {
        creatorInfo = {
          id: v.creator._id || v.creator.id || null,
          fullName: v.creator.fullName || 'Không có tên',
          email: v.creator.email || ''
        };
      } else if (v.creator) {
        creatorInfo = { id: String(v.creator), fullName: 'Lỗi Populate ID', email: '' };
      }

      return {
        id: v._id,
        title: v.title || 'Video không tiêu đề',
        youtube_url: v.youtube_url || '',
        thumbnail_url: v.thumbnail_url || '',
        jlpt_level: v.jlpt_level || 'Unknown',
        status: v.status || 'pending',
        views_count: v.views_count || 0,
        likes_count: v.likes_count || 0,
        created_date: v.created_date,
        script_length: Array.isArray(v.script) ? v.script.length : 0, 
        creator: creatorInfo
      };
    });

    res.json({
      videos: mappedVideos,
      total,
      page,
      totalPages: Math.ceil(total / limit)
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
    const { status, reason } = req.body;
    
    // Kiểm tra class status có hợp lệ không
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    // Vẫn áp dụng .select để khi update xong không bị dính cục data nặng
    const existingVideo = await Video.findById(req.params.id)
      .select('-vocab_list')
      .populate('creator', 'fullName email');
      
    if (!existingVideo) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    const video = await Video.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    )
    .select('-vocab_list')
    .populate('creator', 'fullName email');

    if (!video) {
      return res.status(404).json({ error: 'Video không tồn tại' });
    }

    if (status === 'rejected' && existingVideo.status !== 'rejected' && video.creator?.email) {
      void sendVideoRejectedEmail({
        to: video.creator.email,
        fullName: video.creator.fullName,
        title: video.title,
        reason,
        videoId: String(video._id),
      }).catch((emailError) => {
        console.error('[Admin] Error sending rejection email:', emailError);
      });
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

    const users = await User.find(filter).sort({ createdAt: -1 }).lean();
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
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).lean();
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