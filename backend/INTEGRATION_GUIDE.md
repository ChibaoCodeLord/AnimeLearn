# AnimeLearn Backend API Integration Guide

## 🚀 Backend Structure Created

```
backend/
├── models/
│   └── User.js              # MongoDB User schema with validation
├── routes/
│   └── auth.js              # Authentication endpoints (signup, login, profile)
├── middleware/
│   └── auth.js              # JWT verification middleware
├── server.js                # Main Express server
├── .env                     # Environment configuration
├── package.json             # Dependencies
└── SETUP.md                 # Detailed setup instructions
```

## 📦 What's Been Added

### 1. **User Model** (`models/User.js`)
- Full user schema with validation
- Password hashing using bcryptjs
- Methods for password comparison
- JLPT level tracking
- Profile information fields

### 2. **Authentication Routes** (`routes/auth.js`)
Four main endpoints:
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login existing user
- `GET /api/auth/profile` - Get current user (protected)
- `POST /api/auth/logout` - Logout (optional)

### 3. **Auth Middleware** (`middleware/auth.js`)
- Verifies JWT tokens from Authorization header
- Attaches user info to request
- Protects private routes

### 4. **Dependencies Added** to package.json
- `bcryptjs` - Password hashing & comparison
- `jsonwebtoken` - JWT token generation & verification

## ✅ How Frontend Already Works With This

Your frontend Login & Signup pages are **already configured** to use this backend:

### Login Flow:
```
1. User enters email & password in Login.tsx
2. POST request to http://localhost:5000/api/auth/login
3. Backend validates credentials & returns JWT token
4. Frontend stores token in localStorage
5. User redirected to /home (authenticated dashboard)
```

### Signup Flow:
```
1. User enters fullName, email, password in Signup.tsx
2. POST request to http://localhost:5000/api/auth/signup
3. Backend creates user in MongoDB & returns JWT token
4. Frontend stores token in localStorage
5. User redirected to /home (authenticated dashboard)
```

### Protected Routes Flow:
```
1. User accesses /home or other protected routes
2. App.tsx checks for token in localStorage
3. If no token → redirect to /login
4. If token exists → fetch user profile & display authenticated pages
```

## 🔐 Token Usage

The frontend uses tokens like this:
```javascript
// Stored in localStorage
localStorage.getItem('token')

// Used in headers for protected API calls (example)
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 📝 Testing the Endpoints

### Test Signup:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Test Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Test Protected Route:
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🛠️ Server Status

✅ **Server is running on port 5000**

### Available Endpoints:
- `GET /api/health` - Health check (no auth needed)
- `POST /api/auth/signup` - Register (no auth needed)
- `POST /api/auth/login` - Login (no auth needed)
- `GET /api/auth/profile` - Get profile (auth required)
- `POST /api/auth/logout` - Logout (auth required)

## 🔑 Environment Variables

```
PORT=5000                           # Server port
MONGO_URI=mongodb://127.0.0.1:27017/animelearn  # MongoDB connection
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production  # Signing key
```

⚠️ **Important:** Change JWT_SECRET to a strong random string in production!

## 🗄️ MongoDB Connection

**Database:** `animelearn`

**Collections:**
- `users` - User accounts (auto-created on first insert)

### User Document Example:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$...(hashed)...",
  "jlptLevel": "Beginner",
  "profilePicture": null,
  "bio": "",
  "isVerified": false,
  "createdAt": "2024-03-25T16:20:00.000Z",
  "updatedAt": "2024-03-25T16:20:00.000Z",
  "__v": 0
}
```

## 🚀 Starting the Backend

**Development (with auto-reload):**
```bash
cd backend
npm run dev
```

**Production:**
```bash
cd backend
npm start
```

**Output should show:**
```
✅ Connected to MongoDB successfully
🚀 Server is running on http://localhost:5000
```

## ⚙️ Frontend Configuration Already Done

Your App.tsx has been configured to:
1. ✅ Check for `localStorage.getItem('token')`
2. ✅ Use ProtectedRoute component for authenticated pages
3. ✅ Redirect unauthenticated users to `/login`
4. ✅ Make requests to `http://localhost:5000/api/auth/...`

## 🔄 Complete User Journey

### Unauthenticated User:
```
Landing Page (Home_guest)
    ↓
Click "Sign Up" or "Login"
    ↓
Signup/Login Form
    ↓
Submit form → Backend validates & creates token
    ↓
Token stored in localStorage
    ↓
Redirect to /home
    ↓
ProtectedRoute checks token → Allows access ✅
    ↓
Dashboard displayed with user data
```

### Logout:
```
User clicks logout
    ↓
localStorage.removeItem('token')
    ↓
Redirect to /login or /
    ↓
ProtectedRoute checks for token
    ↓
No token found → Redirect to /login ✅
```

## 🐛 Troubleshooting

### Issue: "Server not responding" on frontend
**Solution:** Make sure backend is running: `npm start` in backend folder

### Issue: "Cannot POST /api/auth/signup"
**Solution:** 
- Verify server is running
- Check that request URL matches: `http://localhost:5000`
- Check backend CORS is enabled (it is by default)

### Issue: "Invalid or expired token"
**Solution:**
- Token expires after 7 days
- User needs to login again
- Check that Authorization header format is: `Bearer <token>`

### Issue: "Email already registered"
**Solution:**
- User already has account
- Direct them to login page
- They can signup with different email

## 📚 Next Steps

1. ✅ Backend is set up and running
2. ✅ Frontend is configured to use it
3. **You can now:**
   - Test signup at http://localhost:3000/signup
   - Test login at http://localhost:3000/login
   - User data persists in MongoDB
   - Protected pages work with authentication

## 💡 Security Notes

- ✅ Passwords are hashed with bcryptjs (10 salt rounds)
- ✅ JWT tokens expire after 7 days
- ✅ Passwords never sent back in responses
- ✅ CORS enabled for localhost:3000 (frontend)
- ✅ Protected routes require valid token

## 📞 Support

If backend isn't connecting:
1. Check MongoDB is running
2. Check `.env` has correct MONGO_URI
3. Check PORT 5000 is not in use
4. Check frontend URL matches backend URL in requests
