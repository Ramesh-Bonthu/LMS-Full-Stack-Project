# Backend Setup & Configuration Guide

## 📋 Quick Overview

The Study Shine Joy LMS Backend is a Node.js/Express REST API server providing complete backend services for the Learning Management System. It uses SQLite for data persistence and JWT for authentication.

## 🚀 Quick Start (30 seconds)

```bash
cd lms-backend
npm install
npm start
```

Backend runs on: **http://localhost:8082**

## 🛠️ Prerequisites

- **Node.js**: v14.0.0 or higher ([Download](https://nodejs.org))
- **npm**: v6.0.0 or higher
- **Git**: For version control

Verify installation:
```bash
node --version
npm --version
```

## 📦 Installation Steps

### 1. Navigate to Backend Directory
```bash
cd lms-backend
```

### 2. Install Dependencies
```bash
npm install
```

This installs all required packages:
- `express` - Web framework
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - Cross-origin requests
- `sequelize` - Database ORM
- `sqlite3` - Database driver

### 3. Environment Setup

Create `.env` file in backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=8082

# Database
DATABASE_PATH=./data/lms.db

# JWT Security
JWT_SECRET=study_shine_joy_secret_key_min_32_chars
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

**Important**: Change `JWT_SECRET` to a strong random string for production.

### 4. Verify Setup

```bash
npm list
npm start
```

Expected output:
```
Initializing database...
✓ Database initialized successfully
Server running on http://localhost:8082
Database: SQLite
Environment: development
```

Health check endpoint:
```bash
curl http://localhost:8082/api/health
```

## ▶️ Running the Server

### Start Server
```bash
npm start
```

### Stop Server
```bash
Press Ctrl + C
```

### Server Running on
```
http://localhost:8082
```

## 📡 Available API Endpoints

### Health Check
```bash
GET /api/health
```

### Authentication
```bash
POST /api/auth/register  - Register new user
POST /api/auth/login     - Login user
```

### Core API Areas
```
/api/courses      - Course management
/api/assignments  - Assignments
/api/submissions  - Student submissions
/api/quizzes      - Quiz management
/api/attendance   - Attendance tracking
/api/announcements - Announcements
/api/performance  - Performance tracking
/api/admin        - Admin operations (Admin only)
```

## 👥 Demo Credentials

```
Admin:
Email: admin@example.com
Password: password123

Faculty:
Email: faculty@example.com
Password: password123

Student:
Email: student@example.com
Password: password123
```

## 💾 Database

### Location
```
lms-backend/data/lms.db
```

### Reset Database
```bash
# Delete database file to reset
rm data/lms.db
npm start
```

### Database Schema

**Users**: id, name, email, password, role, active, createdAt, updatedAt
**Courses**: id, name, description, instructorId, createdAt, updatedAt
**Assignments**: id, courseId, title, description, dueDate, maxScore
**Submissions**: id, assignmentId, studentId, submissionText, score, feedback
**Quizzes**: id, courseId, title, totalQuestions, timeLimit, passingScore
**Attendance**: id, courseId, studentId, date, status

## 🔐 Authentication

### JWT Token Flow

1. **Register/Login** → Receive JWT token
2. **Include Token** in Authorization header:
   ```
   Authorization: Bearer <token>
   ```
3. **Token Expires** after configured expiration time
4. **Re-login** to get new token

### Example Request with Token

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
     http://localhost:8082/api/courses
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | development | Environment mode |
| PORT | 8082 | Server port |
| JWT_SECRET | - | JWT signing key |
| JWT_EXPIRATION | 7d | Token expiration |
| DATABASE_PATH | ./data/lms.db | SQLite path |
| CORS_ORIGIN | http://localhost:5173 | Allowed origins |

### Port Configuration

Change port by editing `.env`:
```env
PORT=3000
```

Or start with port argument:
```bash
PORT=3000 npm start
```

## 🧪 Testing Endpoints

### Test with curl

```bash
# Health check
curl http://localhost:8082/api/health

# Login
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'

# Get courses (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8082/api/courses
```

### Test with Postman

1. Import API collection
2. Set base URL: `http://localhost:8082/api`
3. Add token to Authorization header
4. Test endpoints

## 🚀 Deployment

### Production Setup

1. **Use PostgreSQL/MySQL** instead of SQLite
2. **Set Strong JWT_SECRET**
3. **Update CORS_ORIGIN** to production domain
4. **Enable HTTPS**
5. **Set NODE_ENV=production**
6. **Use process manager** (PM2, systemd)

### Deploy to Heroku

```bash
heroku create your-app-name
git push heroku main
heroku config:set JWT_SECRET=your_secret
```

### Deploy to Railway

```bash
railway init
railway link
railway up
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :8082
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8082
kill -9 <PID>
```

### Database Issues

```bash
# Reset database
rm data/lms.db
npm start

# Check SQLite
sqlite3 data/lms.db ".tables"
```

### JWT Errors

- **Token expired**: Re-login
- **Invalid token**: Check JWT_SECRET matches
- **Missing token**: Add Authorization header

### CORS Issues

Verify `.env` includes frontend URL:
```env
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

### Module Not Found

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📋 Checklist

- [ ] Node.js v14+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created
- [ ] Server starts (`npm start`)
- [ ] Health check responds
- [ ] Frontend can connect
- [ ] Demo user can login
- [ ] Database persists data

## 📚 Resources

- [Express.js Docs](https://expressjs.com)
- [JWT.io](https://jwt.io)
- [Sequelize Docs](https://sequelize.org)
- [SQLite Docs](https://www.sqlite.org)

## 🆘 Need Help?

Check the logs in console for error messages. Common issues:
- Port in use: Change PORT in .env
- Connection refused: Ensure server is running
- CORS error: Update CORS_ORIGIN in .env
- JWT error: Verify Authorization header format

---

**Backend Version**: 1.0.0  
**Last Updated**: April 2026  
**Status**: Production Ready ✅
