# Profile Backend API Documentation

## Overview
This document describes the backend API endpoints for the User Profile feature in AnimeLearn.

## Models

### 1. User (Updated)
Extended with learning statistics fields:
- `totalLearningHours`: Number - Total hours spent learning
- `dayStreak`: Number - Consecutive days of learning activity
- `xpPoints`: Number - Accumulated experience points for ranking
- `lastActiveDate`: Date - Last date user was active

### 2. Achievement
Stores available achievements/badges in the system:
- `name`: String - Achievement name
- `description`: String - Description of achievement
- `icon`: String - Icon identifier (sun, bookOpen, trophy, award, zap, flame)
- `unlockCondition`: String - Condition to unlock

### 3. UserAchievement
Tracks which achievements user has unlocked:
- `userId`: ObjectId - Reference to User
- `achievementId`: ObjectId - Reference to Achievement
- `unlockedAt`: Date - When achievement was unlocked

### 4. UserCourse
Tracks user's course progress:
- `userId`: ObjectId - Reference to User
- `courseId`: ObjectId - Reference to Video/Course
- `title`: String - Course title
- `unit`: String - Unit information
- `progress`: Number (0-100) - Course completion percentage
- `color`: String - Course display color
- `startedAt`: Date - When user started the course
- `completedAt`: Date - When user completed the course

### 5. LearningActivity
Daily learning activity tracking:
- `userId`: ObjectId - Reference to User
- `date`: Date - Activity date
- `hoursSpent`: Number - Hours spent learning that day
- `videosWatched`: Number - Number of videos watched
- `quizzesTaken`: Number - Number of quizzes taken
- `vocabularyLearned`: Number - Vocabulary words learned
- `xpEarned`: Number - XP earned that day

## API Endpoints

### Profile Management
#### GET `/api/auth/me`
Get current user profile
- **Auth**: Required (JWT)
- **Response**:
```json
{
  "id": "user_id",
  "email": "user@email.com",
  "fullName": "User Name",
  "jlptLevel": "N3",
  "profilePicture": "base64_or_url",
  "bio": "User bio",
  "phone": "+1234567890",
  "location": "Tokyo, JP",
  "role": "user"
}
```

#### PUT `/api/auth/update-profile`
Update user profile information
- **Auth**: Required (JWT)
- **Body**:
```json
{
  "fullName": "New Name",
  "jlptLevel": "N2",
  "bio": "New bio",
  "profilePicture": "base64_image",
  "phone": "+1234567890",
  "location": "Osaka, JP"
}
```
- **Response**: Updated user object

### Learning Progress

#### GET `/api/auth/learning-progress`
Get weekly learning activity
- **Auth**: Required (JWT)
- **Response**:
```json
{
  "weeklyData": [
    { "day": "MON", "hours": 2, "date": "2026-04-07" },
    { "day": "TUE", "hours": 3, "date": "2026-04-08" },
    ...
  ]
}
```

#### POST `/api/auth/update-learning-activity`
Add/update today's learning activity
- **Auth**: Required (JWT)
- **Body**:
```json
{
  "hoursSpent": 2,
  "videosWatched": 3,
  "quizzesTaken": 2,
  "vocabularyLearned": 15,
  "xpEarned": 50
}
```
- **Response**:
```json
{
  "success": true,
  "activity": { ...activity_data },
  "userStats": {
    "totalLearningHours": 128,
    "dayStreak": 24,
    "xpPoints": 2450
  }
}
```

### Courses

#### GET `/api/auth/courses`
Get user's courses with progress
- **Auth**: Required (JWT)
- **Response**:
```json
[
  {
    "_id": "course_id",
    "title": "Kanji Mastery: N3 Essentials",
    "unit": "Unit 4: Environment & Nature",
    "progress": 87,
    "color": "#6B5B4D",
    "startedAt": "2026-04-01",
    "completedAt": null
  },
  ...
]
```

#### POST `/api/auth/add-course`
Add a new course for user
- **Auth**: Required (JWT)
- **Body**:
```json
{
  "courseId": "video_id",
  "title": "Course Title",
  "unit": "Unit Info",
  "color": "#6B5B4D"
}
```
- **Response**: Created course object

#### PUT `/api/auth/update-course/:courseId`
Update course progress
- **Auth**: Required (JWT)
- **Params**: courseId
- **Body**:
```json
{
  "progress": 87
}
```
- **Response**: Updated course object

### Achievements

#### GET `/api/auth/achievements`
Get user's achievements
- **Auth**: Required (JWT)
- **Response**:
```json
[
  {
    "id": "achievement_id",
    "name": "Early Bird Learner",
    "description": "Learn before 8:00 AM for 5 consecutive days",
    "icon": "sun",
    "unlocked": true
  },
  {
    "id": "achievement_id_2",
    "name": "JLPT N2 Finisher",
    "description": "Complete JLPT N2 certification",
    "icon": "lock",
    "unlocked": false
  },
  ...
]
```

#### POST `/api/auth/unlock-achievement`
Unlock an achievement for user
- **Auth**: Required (JWT)
- **Body**:
```json
{
  "achievementId": "achievement_id"
}
```
- **Response**: Created UserAchievement object

### Profile Statistics

#### GET `/api/auth/profile-stats`
Get overall profile statistics
- **Auth**: Required (JWT)
- **Response**:
```json
{
  "totalLearningHours": 128,
  "dayStreak": 24,
  "xpPoints": 2450,
  "ranking": "Top 5%",
  "todayHours": 2
}
```

## Initialization

### Seed Achievements
To create default achievements in the database:

```bash
cd backend
node src/scripts/seedAchievements.js
```

This will create the following achievements:
- Early Bird Learner
- Vocab Virtuoso
- Weekly Champion
- JLPT N2 Finisher
- Quiz Master
- 30-Day Streak

## Usage Examples

### 1. Get user profile and statistics
```javascript
const userProfile = await fetch('http://localhost:5000/api/auth/me', {
  credentials: 'include'
}).then(r => r.json());

const stats = await fetch('http://localhost:5000/api/auth/profile-stats', {
  credentials: 'include'
}).then(r => r.json());
```

### 2. Update learning activity
```javascript
await fetch('http://localhost:5000/api/auth/update-learning-activity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    hoursSpent: 2,
    videosWatched: 3,
    xpEarned: 50
  })
});
```

### 3. Get achievements and unlock one
```javascript
const achievements = await fetch('http://localhost:5000/api/auth/achievements', {
  credentials: 'include'
}).then(r => r.json());

// Unlock achievement
await fetch('http://localhost:5000/api/auth/unlock-achievement', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    achievementId: achievements[0].id
  })
});
```

## Database Setup

Make sure MongoDB is running and environment variables are configured:

```env
MONGO_URI=mongodb://localhost:27017/animelearn
JWT_SECRET=your_jwt_secret_key
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Server Error

Error responses include message:
```json
{
  "error": "Error description"
}
```
