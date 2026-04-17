#!/usr/bin/env node
/**
 * Script to test Day Streak and Learning Progress
 * Run: node backend/src/scripts/testLearningFeatures.js
 * 
 * Note: Requires Node 18+ with built-in fetch API
 */

const API_URL = 'http://localhost:5000/api';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testLearningFeatures = async () => {
  try {
    log('\n🚀 Starting Learning Features Test...\n', 'cyan');

    // Step 1: Get profile stats before
    log('📊 [1/4] Fetching current profile stats...', 'blue');
    const statsResponse = await fetch(`${API_URL}/auth/profile-stats`, {
      credentials: 'include'
    });
    
    if (!statsResponse.ok) {
      throw new Error('Failed to fetch profile stats. Make sure you are logged in (JWT cookie)');
    }

    const statsBefore = await statsResponse.json();
    log(`   ✓ Day Streak: ${statsBefore.dayStreak}`, 'green');
    log(`   ✓ Total Hours: ${statsBefore.totalLearningHours}`, 'green');
    log(`   ✓ XP Points: ${statsBefore.xpPoints}`, 'green');

    // Step 2: Get learning progress
    log('\n📈 [2/4] Fetching learning progress (weekly chart)...', 'blue');
    const progressResponse = await fetch(`${API_URL}/auth/learning-progress`, {
      credentials: 'include'
    });

    if (!progressResponse.ok) {
      throw new Error('Failed to fetch learning progress');
    }

    const progress = await progressResponse.json();
    log('   Weekly Hours:', 'green');
    progress.weeklyData.forEach(day => {
      const barLength = Math.round(day.hours * 5);
      const bar = '█'.repeat(barLength);
      log(`   ${day.day}: ${bar} ${day.hours}h`, 'cyan');
    });

    // Step 3: Simulate activity
    log('\n⏱️  [3/4] Simulating learning activity (watching video)...', 'blue');
    const activityResponse = await fetch(`${API_URL}/auth/test-watch-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!activityResponse.ok) {
      throw new Error('Failed to update learning activity');
    }

    const activity = await activityResponse.json();
    log('   ✓ Activity recorded:', 'green');
    log(`     - Hours: ${activity.userStats.totalLearningHours}`, 'cyan');
    log(`     - Day Streak: ${activity.userStats.dayStreak}`, 'cyan');
    log(`     - XP Points: ${activity.userStats.xpPoints}`, 'cyan');

    // Step 4: Get updated progress
    log('\n📊 [4/4] Fetching updated learning progress...', 'blue');
    await sleep(500); // Small delay

    const progressResponse2 = await fetch(`${API_URL}/auth/learning-progress`, {
      credentials: 'include'
    });

    const progress2 = await progressResponse2.json();
    log('   Updated Weekly Hours:', 'green');
    progress2.weeklyData.forEach(day => {
      const barLength = Math.round(day.hours * 5);
      const bar = '█'.repeat(barLength);
      log(`   ${day.day}: ${bar} ${day.hours}h`, 'cyan');
    });

    log('\n✅ Test completed successfully!\n', 'green');
    log('📝 Summary:', 'yellow');
    log(`   Day Streak: ${statsBefore.dayStreak} → (Should increment or reset to 1)`, 'cyan');
    log(`   Charts should now show data for this week`, 'cyan');
    log(`   Test endpoints available:`, 'yellow');
    log(`   - POST /api/auth/test-watch-video`, 'cyan');
    log(`   - POST /api/auth/test-complete-quiz\n`, 'cyan');

  } catch (error) {
    log(`\n❌ Error: ${error.message}\n`, 'red');
    log('Make sure:', 'yellow');
    log('1. Backend server is running (port 5000)', 'cyan');
    log('2. You are logged in (check cookie)', 'cyan');
    log('3. MongoDB is connected\n', 'cyan');
    process.exit(1);
  }
};

testLearningFeatures();
