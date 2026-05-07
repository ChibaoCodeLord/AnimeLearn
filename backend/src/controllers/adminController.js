import { banUser as banUserService, unbanUser as unbanUserService } from '../services/adminService.js'

export const banUser = async(req, res) => {
    try {
        const userId = req.params.id;
        const { banReason, unbannedAt } = req.body;

        // Validate required fields
        if (!banReason || !banReason.trim()) {
            return res.status(400).json({ error: 'banReason là bắt buộc' });
        }

        // Call service to ban user
        const updated = await banUserService(
            userId,
            banReason.trim(),
            new Date(),
            unbannedAt ? new Date(unbannedAt) : null
        );

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
        console.error('[Admin Controller] ban user error:', error);
        return res.status(500).json({ error: error.message || 'Lỗi ban user' });
    }
};

export const unbanUser = async(req, res) => {
    try {
        const userId = req.params.id;
        const user = await unbanUserService(userId);

        if (!user) {
            return res.status(404).json({ error: 'User không tồn tại' });
        }

        return res.json({ 
            message: 'Đã gỡ ban user thành công', 
            user: { 
                id: user._id, 
                fullName: user.fullName,
                email: user.email,
                isBanned: user.isBanned
            } 
        });
    } catch (error) {
        console.error('[Admin Controller] unban user error:', error);
        return res.status(500).json({ error: error.message || 'Lỗi gỡ ban user' });
    }
};