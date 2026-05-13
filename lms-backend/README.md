# Lumen LMS Backend

This is the Node.js/Express backend for the Lumen LMS platform. It provides a secure API for managing users, courses, assignments, and notifications.

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Authentication**: JWT (JSON Web Tokens) & Bcryptjs
- **Mailing**: Nodemailer (Email OTP)
- **File Handling**: Multer

## 📡 API Functionalities

### Authentication
- `POST /api/auth/register`: Signup with Email OTP generation.
- `POST /api/auth/verify-otp`: Account verification.
- `POST /api/auth/login`: Secure login with JWT.

### Course Management
- `GET /api/courses`: Fetch available/enrolled courses.
- `POST /api/courses`: Faculty creates a course (starts as PENDING).
- `POST /api/courses/:id/approve`: Admin approves a course.
- `POST /api/courses/:id/content`: Add units, videos, or PDFs.

### Assignments & Submissions
- `POST /api/assignments`: Create course assignments.
- `POST /api/assignments/:id/submit`: Student uploads PDF submission.
- `PUT /api/assignments/submissions/:id/grade`: Faculty grades and provides feedback.

### Notification System
- **Automated Alerts**: Triggers on course status changes, new assignments, and grading.
- **Unread Tracking**: `GET /api/notifications/unread-count` for dynamic UI icons.

## 📧 Email OTP Flow

1. User registers -> Backend generates 6-digit code.
2. `nodemailer` sends email via configured SMTP (Gmail App Password).
3. User enters code -> `isVerified` set to `true`.

## ⚙️ Configuration

Ensure your [`.env`](file:///c:/study-shine-joy-main/lms-backend/.env) file is configured:
```env
PORT=8082
DB_NAME=lms_db
JWT_SECRET=your_secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---
Lumen LMS Backend · Built for reliability.
