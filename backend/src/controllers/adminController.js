import {banUser as banUserService} from '../services/adminService.js'

export const banUser = async(req, res) => {
    try {
        const {userId, banReason, bannedAt, unbannedAt} = req.body;

        // Validate required fields
        if (!userId || !banReason) {
            return res.status(400).json({ error: 'userId và banReason là bắt buộc' });
        }

        // Call service to ban user
        const updated = await banUserService(userId, banReason, bannedAt || null, unbannedAt || null);

        if (!updated) {
            return res.status(404).json({ error: 'User không tồn tại' });
        }

        return res.json({ 
            message: 'Đã ban user thành công', 
            user: { 
                id: updated._id, 
                fullName: updated.fullName,
                email: updated.email,
                isBanned: updated.isBanned,
                bannedAt: updated.bannedAt,
                unbannedAt: updated.unbannedAt,
                banReason: updated.banReason
            } 
        });
    } catch (error) {
        console.error('ban user error:', error);
        return res.status(500).json({ error: error.message || 'Lỗi ban user' });
    }
}