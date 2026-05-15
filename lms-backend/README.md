# Study Shine Joy - Backend API

This is the core engine of the LMS, providing secure, scalable API endpoints and AI integrations.

## 🔐 Authentication & Security
*   **JWT Authentication**: All sensitive routes are protected by JSON Web Tokens.
*   **Role-Based Access (RBAC)**: Specific endpoints restricted to ADMIN, FACULTY, or STUDENT roles.
*   **OTP Verification**: Email-based One-Time Password verification for new user signups.

## 📡 Core API Modules

### `/api/auth`
*   `POST /register`: User registration with email verification trigger.
*   `POST /verify-otp`: Secure OTP verification.
*   `POST /login`: Secure authentication and token generation.

### `/api/mock-interviews` (AI Powered)
*   `POST /start`: Initiates AI session (supports multipart/form-data for resumes).
*   `POST /chat`: Real-time conversational endpoint with history tracking.
*   `POST /:id/end`: Triggers AI feedback generation and scoring.

### `/api/quizzes`
*   `POST /generate`: AI-powered MCQ generation (requires topic and count).
*   `POST /submit`: Score calculation and attempt recording.

### `/api/courses` & `/api/assignments`
*   Full CRUD operations for course content and assignment submissions.
*   Handles PDF uploads and static resource management.

## 🗄️ Database Schema (PostgreSQL)
*   `Users`: Authentication and profile data.
*   `Courses`: Metadata and enrollment tracking.
*   `MockInterviews`: Transcript and feedback storage.
*   `Quizzes`: AI-generated and manual assessments.
*   `Attendance`: Student engagement tracking.

## ⚙️ Environment Variables (.env)
Required keys:
*   `PORT`: Server port (default 8082).
*   `DB_NAME`, `DB_USER`, `DB_PASSWORD`: PostgreSQL credentials.
*   `JWT_SECRET`: Security salt for tokens.
*   `GROQ_API_KEY`: Key for Llama 3.1 AI features.
*   `EMAIL_USER`, `EMAIL_PASS`: SMTP credentials for OTP emails.

## 🛠️ Development
To start the server in development mode:
```bash
node server.js
```
The database will automatically sync on startup using Sequelize.
