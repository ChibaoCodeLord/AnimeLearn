import LearningActivity from '../models/LearningActivity.js';
import User from '../models/User.js';

/**
 * Update learning activity for a user
 * Automatically increment today's activity and update day streak
 */
export const updateUserActivity = async (
  userId,
  activityData = {}
) => {
  try {
    const {
      hoursSpent = 0.5,
      videosWatched = 1,
      quizzesTaken = 0,
      vocabularyLearned = 5,
      xpEarned = 25
    } = activityData;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's activity
    let activity = await LearningActivity.findOne({
      userId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (activity) {
      // Add to existing activity
      activity.hoursSpent += hoursSpent;
      activity.videosWatched += videosWatched;
      activity.quizzesTaken += quizzesTaken;
      activity.vocabularyLearned += vocabularyLearned;
      activity.xpEarned += xpEarned;
    } else {
      // Create new activity for today
      activity = new LearningActivity({
        userId,
        date: today,
        hoursSpent,
        videosWatched,
        quizzesTaken,
        vocabularyLearned,
        xpEarned
      });
    }

    await activity.save();

    // Update user stats
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Check day streak logic (Duolingo style)
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (user.lastActiveDate) {
      const lastActive = new Date(user.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      const timeDiff = todayDate.getTime() - lastActive.getTime();
      const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Active yesterday, increment streak
        user.dayStreak = (user.dayStreak || 0) + 1;
      } else if (daysDiff > 1) {
        // Missed yesterday or more, reset streak
        user.dayStreak = 1;
      }
      // If daysDiff === 0, they were already active today, do not change streak.
    } else {
      // First time active
      user.dayStreak = 1;
    }

    // Update totals
    user.lastActiveDate = new Date();
    user.totalLearningHours = (user.totalLearningHours || 0) + hoursSpent;
    user.xpPoints = (user.xpPoints || 0) + xpEarned;

    await user.save();

    return {
      success: true,
      activity,
      userStats: {
        totalLearningHours: user.totalLearningHours,
        dayStreak: user.dayStreak,
        xpPoints: user.xpPoints,
        lastActiveDate: user.lastActiveDate
      }
    };
  } catch (error) {
    console.error('Error updating user activity:', error);
    throw error;
  }
};

/**
 * Calculate day streak by checking consecutive days from today backwards
 */
export const calculateDayStreak = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    // Check backwards from today
    while (true) {
      const activity = await LearningActivity.findOne({
        userId,
        date: {
          $gte: currentDate,
          $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (activity && activity.hoursSpent > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating day streak:', error);
    return 0;
  }
};

/**
 * Get weekly learning stats
 */
export const getWeeklyStats = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activities = await LearningActivity.find({
      userId,
      date: { $gte: sevenDaysAgo, $lte: today }
    }).sort({ date: 1 });

    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const weeklyData = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);

      const activity = activities.find(
        a => new Date(a.date).toDateString() === date.toDateString()
      );

      weeklyData.push({
        day: daysOfWeek[(date.getDay() + 6) % 7],
        hours: activity?.hoursSpent || 0,
        date: date.toISOString().split('T')[0]
      });
    }

    return weeklyData;
  } catch (error) {
    console.error('Error getting weekly stats:', error);
    return [];
  }
};
