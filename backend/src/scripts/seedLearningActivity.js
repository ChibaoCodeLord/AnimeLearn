import mongoose from 'mongoose';
import User from '../models/User.js';
import LearningActivity from '../models/LearningActivity.js';
import dotenv from 'dotenv';

dotenv.config();

const seedLearningActivity = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Get first user or use hardcoded ID
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No user found. Please create a user first.');
      await mongoose.connection.close();
      return;
    }

    console.log(`📊 Creating learning activity for user: ${user.fullName}`);

    // Delete existing activities for this user
    await LearningActivity.deleteMany({ userId: user._id });

    // Create learning activities for last 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activities = [];
    const hours = [2, 3, 1, 4, 2, 0, 1]; // MON to SUN

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      if (hours[6 - i] > 0) { // Only create activity if hours > 0
        activities.push({
          userId: user._id,
          date: date,
          hoursSpent: hours[6 - i],
          videosWatched: Math.floor(hours[6 - i] * 1.5),
          quizzesTaken: Math.floor(hours[6 - i]),
          vocabularyLearned: Math.floor(hours[6 - i] * 10),
          xpEarned: hours[6 - i] * 25
        });
      }
    }

    const result = await LearningActivity.insertMany(activities);
    console.log(`✓ Created ${result.length} learning activity records`);

    // Update user stats based on activities
    const totalHours = hours.reduce((a, b) => a + b, 0);
    const totalXP = hours.reduce((acc, h) => acc + (h * 25), 0);
    
    // Calculate day streak (consecutive days from today going backwards)
    let dayStreak = 0;
    for (let i = 0; i < hours.length; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const activity = await LearningActivity.findOne({ userId: user._id, date });
      if (activity && activity.hoursSpent > 0) {
        dayStreak++;
      } else {
        break;
      }
    }

    user.totalLearningHours = totalHours;
    user.xpPoints = totalXP;
    user.dayStreak = dayStreak;
    user.lastActiveDate = new Date();
    await user.save();

    console.log(`📈 Updated user stats:`);
    console.log(`   - Day Streak: ${dayStreak} days`);
    console.log(`   - Total Hours: ${totalHours} hours`);
    console.log(`   - XP Points: ${totalXP}`);

    await mongoose.connection.close();
    console.log('✓ Database seeding completed');
  } catch (error) {
    console.error('❌ Error seeding learning activity:', error);
    process.exit(1);
  }
};

seedLearningActivity();
