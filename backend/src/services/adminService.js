import Video from '../models/Video.js';
import User from '../models/User.js';
import {sendUserBannedEmail} from '../services/emailService.js';

export const banUser = async(userId, banReason, bannedAt, unbannedAt) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        await sendUserBannedEmail({
            to: user.email,
            fullName: user.fullName,
            banReason: banReason,
            bannedAt: bannedAt || new Date(),
            unbannedAt: unbannedAt || null
        });

        return User.findByIdAndUpdate(
            userId,
            { 
                $set: { 
                    isBanned: true, 
                    bannedAt: bannedAt || new Date(), 
                    unbannedAt: unbannedAt || null,
                    banReason: banReason 
                } 
            },
            { new: true }
        );
    } catch (error) {
        console.error('Error banning user:', error);
        throw error;
    }
}

export const unbanUser = async(userId) => {
    try {
        return User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    isBanned: false,
                    bannedAt: null,
                    unbannedAt: null,
                    banReason: ''
                }
            },
            { new: true }
        );
    } catch (error) {
        console.error('Error unbanning user:', error);
        throw error;
    }
}