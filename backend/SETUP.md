# AnimeLearn Backend Setup Guide

## Prerequisites
- Node.js (v14+)
- MongoDB (local or cloud)

## Installation

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Make sure `.env` file contains:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/animelearn
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 3. Start MongoDB (if local)
```bash
# On Windows
mongod

# On Mac/Linux
brew services start mongodb-community
# or
mongod
```

### 4. Start Backend Server

**Development (with hot reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication Routes

#### 1. **Signup**
- **Route:** `POST /api/auth/signup`
- **Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```
- **Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "jlptLevel": "Beginner"
  }
}
```

#### 2. **Login**
- **Route:** `POST /api/auth/login`
- **Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "jlptLevel": "Beginner"
  }
}
```

#### 3. **Get Profile** (Protected Route)
- **Route:** `GET /api/auth/profile`
- **Headers:**
```
Authorization: Bearer jwt_token_here
```
- **Response:**
```json
{
  "message": "User profile retrieved successfully",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "jlptLevel": "Beginner",
    "bio": "Learning Japanese",
    "profilePicture": null,
    "createdAt": "2024-03-25T..."
  }
}
```

#### 4. **Logout** (Protected Route)
- **Route:** `POST /api/auth/logout`
- **Headers:**
```
Authorization: Bearer jwt_token_here
```
- **Response:**
```json
{
  "message": "Logout successful"
}
```

#### 5. **Health Check**
- **Route:** `GET /api/health`
- **Response:**
```json
{
  "message": "AnimeLearn API is running smoothly!"
}
```

## Frontend Integration

The frontend already uses these endpoints:
- `POST http://localhost:5000/api/auth/signup` - for signup
- `POST http://localhost:5000/api/auth/login` - for login
- Token is stored in `localStorage` as `'token'`

## Database Schema

### User Model
```
{
  fullName: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  jlptLevel: String (N5, N4, N3, N2, N1, Beginner),
  profilePicture: String,
  bio: String,
  isVerified: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ JWT token authentication (7-day expiration)
- ✅ Password validation (min 6 characters)
- ✅ Email validation
- ✅ Unique email constraint
- ✅ Protected routes with middleware
- ✅ CORS enabled for frontend communication

## Troubleshooting

### MongoDB Connection Error
```
❌ Error connecting to MongoDB: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB service is running

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change PORT in .env or kill the process using port 5000

### JWT Token Errors
```
403 Invalid or expired token
```
**Solution:** 
- Token may have expired (7 days)
- Check that token is sent correctly in Authorization header as `Bearer token_value`

## Notes
- Tokens expire after 7 days
- Passwords are never returned in responses
- All timestamps use ISO 8601 format
- CORS is enabled for all routes
