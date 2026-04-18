import mongoose from 'mongoose';
import Achievement from '../models/Achievement.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAchievements = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing achievements
    await Achievement.deleteMany({});

    const achievements = [
      {
        name: 'Early Bird Learner',
        description: 'Learn before 8:00 AM for 5 consecutive days',
        icon: 'sun',
        unlockCondition: 'earlyBirdLearner'
      },
      {
        name: 'Vocab Virtuoso',
        description: 'Learn 100 new vocabulary words',
        icon: 'bookOpen',
        unlockCondition: 'vocabularyVirtuoso'
      },
      {
        name: 'Weekly Champion',
        description: 'Study 10 hours in a single week',
        icon: 'trophy',
        unlockCondition: 'weeklyChampion'
      },
      {
        name: 'JLPT N2 Finisher',
        description: 'Complete JLPT N2 certification',
        icon: 'award',
        unlockCondition: 'jlptN2Finisher'
      },
      {
        name: 'Quiz Master',
        description: 'Score 100% on 10 quizzes',
        icon: 'zap',
        unlockCondition: 'quizMaster'
      },
      {
        name: '30-Day Streak',
        description: 'Maintain a 30-day learning streak',
        icon: 'flame',
        unlockCondition: 'thirtyDayStreak'
      }
    ];

    const result = await Achievement.insertMany(achievements);
    console.log(`✓ Created ${result.length} achievements`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding achievements:', error);
    process.exit(1);
  }
};

seedAchievements();
