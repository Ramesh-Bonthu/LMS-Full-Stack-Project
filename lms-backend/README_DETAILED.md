# LMS Backend - Comprehensive Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Authentication](#authentication)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Study Shine Joy LMS Backend is an Express.js REST API server that powers the frontend application. It provides comprehensive endpoints for course management, assignments, quizzes, student tracking, and administrative functions.

### Key Features

- ✅ JWT-based authentication
- ✅ Role-based access control (Admin, Faculty, Student)
- ✅ Course and enrollment management
- ✅ Assignment and quiz handling
- ✅ Student performance tracking
- ✅ Attendance management
- ✅ Announcement system
- ✅ CORS-enabled for frontend communication

## 🚀 Quick Start

```bash
# Navigate to backend directory
cd lms-backend

# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:8082
```

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js | JavaScript runtime |
| Framework | Express.js | Web framework |
| Database | SQLite (Node) | Data persistence |
| ORM | Sequelize | Database abstraction |
| Authentication | JWT | Token-based auth |
| Security | bcryptjs | Password hashing |
| CORS | cors middleware | Cross-origin requests |

## 📁 Project Structure

```
lms-backend/
├── server.js              # Main entry point
├── db.js                  # Database initialization
├── package.json           # Dependencies
├── pom.xml               # Maven config (Spring reference)
├── BACKEND_SETUP.md      # Setup guide
├── data/
│   └── db.json           # Sample data
└── src/
    └── main/java/        # Spring Boot source (reference)
```

## 📦 Installation & Setup

### Prerequisites

- Node.js v14.0.0 or higher
- npm v6.0.0 or higher
- SQLite3 (usually comes with Node)

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd lms-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```
   
   This installs:
   - `express` - Web framework
   - `jsonwebtoken` - JWT handling
   - `bcryptjs` - Password hashing
   - `cors` - Cross-origin support
   - `sequelize` - ORM
   - `sqlite3` - Database driver

3. **Verify Installation**
   ```bash
   npm list
   npm -v
   node -v
   ```

4. **Environment Configuration**
   
   Create `.env` file in backend root:
   ```env
   NODE_ENV=development
   PORT=8082
   JWT_SECRET=your_secret_key_here_min_32_chars
   JWT_EXPIRATION=7d
   DATABASE_PATH=./data/lms.db
   CORS_ORIGIN=http://localhost:5173
   ```

## ▶️ Running the Server

### Development Mode

```bash
npm start
```

Output:
```
Initializing database...
✓ Database initialized successfully
Server running on http://localhost:8082
Database: SQLite
Environment: development
```

### Health Check

Verify server is running:

```bash
curl http://localhost:8082/api/health

# Response:
{
  "status": "OK",
  "timestamp": "2026-04-28T10:00:00Z",
  "version": "1.0.0"
}
```

## 📡 API Documentation

### Base URL

```
http://localhost:8082/api
```

### Authentication Header

All protected endpoints require:

```
Authorization: Bearer <jwt_token>
```

### Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

### Core Endpoints

#### 1. Authentication Routes (`/api/auth`)

##### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "STUDENT"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STUDENT"
  }
}
```

##### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "john@example.com",
      "role": "STUDENT",
      "name": "John Doe"
    }
  }
}
```

#### 2. Course Routes (`/api/courses`)

##### Get All Courses
```http
GET /api/courses
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Web Development",
      "description": "Learn web dev",
      "instructorId": 2,
      "enrolled": 25
    }
  ]
}
```

##### Create Course (Faculty/Admin)
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Advanced React",
  "description": "Master React framework",
  "instructorId": 2
}

Response (201):
{
  "success": true,
  "data": { "id": 2, "name": "Advanced React", ... }
}
```

##### Get Course Details
```http
GET /api/courses/:courseId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Web Development",
    "description": "Learn web dev",
    "instructor": { "id": 2, "name": "Jane Smith" },
    "students": [ { "id": 3, "name": "John Doe" } ],
    "createdAt": "2026-04-01T10:00:00Z"
  }
}
```

#### 3. Assignment Routes (`/api/assignments`)

##### Create Assignment (Faculty/Admin)
```http
POST /api/assignments
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1,
  "title": "Assignment 1",
  "description": "Build a portfolio website",
  "dueDate": "2026-05-15T23:59:59Z",
  "maxScore": 100
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Assignment 1",
    "courseId": 1,
    "dueDate": "2026-05-15T23:59:59Z",
    "maxScore": 100
  }
}
```

##### Get Assignments for Course
```http
GET /api/courses/:courseId/assignments
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Assignment 1",
      "description": "Build a portfolio website",
      "dueDate": "2026-05-15T23:59:59Z",
      "submitted": 15,
      "total": 25
    }
  ]
}
```

#### 4. Submission Routes (`/api/submissions`)

##### Submit Assignment
```http
POST /api/submissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "assignmentId": 1,
  "studentId": 3,
  "submissionText": "Portfolio completed",
  "fileUrl": "https://example.com/portfolio.zip"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "assignmentId": 1,
    "studentId": 3,
    "submittedAt": "2026-04-28T10:00:00Z",
    "status": "SUBMITTED"
  }
}
```

##### Grade Submission (Faculty/Admin)
```http
PUT /api/submissions/:submissionId/grade
Authorization: Bearer <token>
Content-Type: application/json

{
  "score": 85,
  "feedback": "Great work! Well structured code."
}

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "score": 85,
    "feedback": "Great work!",
    "gradedAt": "2026-04-28T11:00:00Z"
  }
}
```

#### 5. Quiz Routes (`/api/quizzes`)

##### Create Quiz (Faculty/Admin)
```http
POST /api/quizzes
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1,
  "title": "Midterm Quiz",
  "description": "Test your knowledge",
  "totalQuestions": 10,
  "timeLimit": 30,
  "passingScore": 60
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Midterm Quiz",
    "courseId": 1,
    "totalQuestions": 10
  }
}
```

#### 6. Attendance Routes (`/api/attendance`)

##### Mark Attendance
```http
POST /api/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1,
  "studentId": 3,
  "date": "2026-04-28",
  "status": "PRESENT"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "courseId": 1,
    "studentId": 3,
    "date": "2026-04-28",
    "status": "PRESENT"
  }
}
```

#### 7. Announcement Routes (`/api/announcements`)

##### Create Announcement (Faculty/Admin)
```http
POST /api/announcements
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1,
  "title": "Important Notice",
  "content": "Class will be held online tomorrow",
  "priority": "HIGH"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "courseId": 1,
    "title": "Important Notice",
    "createdAt": "2026-04-28T10:00:00Z"
  }
}
```

#### 8. Performance Routes (`/api/performance`)

##### Get Student Performance
```http
GET /api/performance/students/:studentId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "studentId": 3,
    "overallGpa": 3.8,
    "coursesEnrolled": 5,
    "averageScore": 88.5,
    "coursePerformance": [
      {
        "courseId": 1,
        "courseName": "Web Development",
        "averageScore": 92,
        "grade": "A"
      }
    ]
  }
}
```

#### 9. Admin Routes (`/api/admin`)

##### Get All Users (Admin)
```http
GET /api/admin/users
Authorization: Bearer <admin_token>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN",
      "active": true
    }
  ]
}
```

## 💾 Database

### Schema Overview

**Users Table**
- id (Primary Key)
- name
- email (Unique)
- password (hashed)
- role (ENUM: ADMIN, FACULTY, STUDENT)
- active (Boolean)
- createdAt
- updatedAt

**Courses Table**
- id (Primary Key)
- name
- description
- instructorId (Foreign Key)
- createdAt
- updatedAt

**Enrollments Table**
- id (Primary Key)
- courseId (Foreign Key)
- studentId (Foreign Key)
- enrollmentDate

**Assignments Table**
- id (Primary Key)
- courseId (Foreign Key)
- title
- description
- dueDate
- maxScore
- createdAt

**Submissions Table**
- id (Primary Key)
- assignmentId (Foreign Key)
- studentId (Foreign Key)
- submissionText
- fileUrl
- score
- feedback
- submittedAt
- gradedAt

### Database Initialization

Database is automatically initialized on first run:

```javascript
// db.js
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_PATH || './data/lms.db'
});
```

### Data Persistence

- **Development**: SQLite file-based storage
- **Production**: Consider PostgreSQL or MySQL
- **Backup**: Regular database backups recommended

## 🔐 Authentication

### JWT Implementation

1. **Token Generation**
   ```javascript
   const token = jwt.sign(
     { userId, email, role },
     process.env.JWT_SECRET,
     { expiresIn: process.env.JWT_EXPIRATION }
   );
   ```

2. **Token Validation**
   ```javascript
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   ```

3. **Password Security**
   ```javascript
   // Hashing
   const hashedPassword = await bcrypt.hash(password, 10);
   
   // Verification
   const isValid = await bcrypt.compare(password, hashedPassword);
   ```

### Role-Based Access Control

```
Admin:
- ✅ Manage all users
- ✅ Manage all courses
- ✅ View system analytics
- ✅ Configuration access

Faculty:
- ✅ Create/edit courses
- ✅ Post assignments & quizzes
- ✅ Grade submissions
- ✅ Track student progress
- ✅ Post announcements

Student:
- ✅ View enrolled courses
- ✅ Submit assignments
- ✅ Take quizzes
- ✅ View grades
- ✅ Check attendance
```

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```env
# Server
NODE_ENV=development
PORT=8082

# Database
DATABASE_PATH=./data/lms.db

# JWT
JWT_SECRET=your_very_secret_key_minimum_32_characters_long
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=debug

# File Upload (if implemented)
MAX_UPLOAD_SIZE=10mb
UPLOAD_PATH=./uploads
```

### Demo Credentials

Pre-configured accounts:

```
Admin:
- Email: admin@example.com
- Password: password123
- Role: ADMIN

Faculty:
- Email: faculty@example.com
- Password: password123
- Role: FACULTY

Student:
- Email: student@example.com
- Password: password123
- Role: STUDENT
```

## 👨‍💻 Development

### Key Files

**server.js** - Main server file
```javascript
const express = require('express');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
// ... more routes

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**db.js** - Database configuration
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/lms.db'
});

module.exports = sequelize;
```

### Making API Requests

Using fetch:
```javascript
const response = await fetch('http://localhost:8082/api/courses', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

Using curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8082/api/courses
```

## 🚀 Deployment

### Preparing for Production

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   DATABASE_PATH=/var/lib/lms/database.db
   JWT_SECRET=<very_secure_random_secret>
   ```

2. **Database Migration**
   - Migrate from SQLite to PostgreSQL
   - Set up automated backups
   - Configure connection pooling

3. **Security Hardening**
   - Use environment variables for secrets
   - Enable HTTPS
   - Configure rate limiting
   - Add request validation
   - Set up logging & monitoring

4. **Performance Optimization**
   - Enable caching
   - Add database indexing
   - Use CDN for static files
   - Implement load balancing

### Hosting Options

- **Heroku**: `git push heroku main`
- **AWS**: EC2 + RDS
- **DigitalOcean**: Droplet + Managed Database
- **Railway**: Connected to GitHub
- **Render**: Easy deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8082
CMD ["npm", "start"]
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

### Database Errors

```bash
# Reset database
rm data/lms.db
npm start

# Check database connectivity
sqlite3 data/lms.db ".tables"
```

### JWT Token Issues

- **Token expired**: Re-login to get new token
- **Invalid signature**: Verify JWT_SECRET matches
- **Missing token**: Include Authorization header

### CORS Errors

Ensure `CORS_ORIGIN` includes frontend URL:

```env
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

### API Connection Issues

1. Verify backend is running
2. Check firewall settings
3. Verify API URL in frontend
4. Check network connectivity

## 📚 Additional Resources

- [Express.js Guide](https://expressjs.com)
- [Sequelize Documentation](https://sequelize.org)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## ✅ Pre-deployment Checklist

- [ ] All errors fixed
- [ ] Environment variables set
- [ ] Database initialized
- [ ] All endpoints tested
- [ ] Authentication working
- [ ] CORS configured
- [ ] Error handling implemented
- [ ] Logging enabled
- [ ] Security headers added
- [ ] Performance optimized

---

**Last Updated**: April 2026  
**Backend Version**: 1.0.0  
**Status**: Production Ready ✅
