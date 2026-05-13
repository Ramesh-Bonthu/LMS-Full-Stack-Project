# Lumen LMS (Study Shine Joy)

Lumen LMS is a modern, full-stack Learning Management System designed for a calm and focused experience. It provides specialized dashboards for Students, Faculty, and Administrators to manage courses, assignments, and performance.

## 🌟 Key Features

- **Multi-Role Dashboards**: Custom interfaces for Students (learning), Faculty (teaching), and Admins (management).
- **Automated Notifications**: Real-time alerts for course approvals, graded assignments, and new content.
- **Course Approval Workflow**: Faculty submit courses for Admin review to maintain quality.
- **Assignment & Quiz System**: Submit PDF assignments, take quizzes, and receive instant feedback.
- **Email OTP Verification**: Secure signup process requiring email verification.
- **Attendance & Performance**: Visual tracking of student progress and engagement.

## 🏗️ Architecture

The project is split into two main parts:
- **Backend**: Node.js & Express API with Sequelize ORM and PostgreSQL/SQLite database.
- **Frontend**: React & Vite with TanStack Router and Lucide icons.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (or SQLite for development)

### Quick Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd study-shine-joy-main
   ```

2. **Backend Setup**:
   ```bash
   cd lms-backend
   npm install
   # Configure .env with your DB and Email credentials
   npm start
   ```

3. **Frontend Setup**:
   ```bash
   cd ../study-shine-joy-main
   npm install
   npm run dev
   ```

## 📄 Documentation

- [Backend Documentation](file:///c:/study-shine-joy-main/lms-backend/README.md)
- [Frontend Documentation](file:///c:/study-shine-joy-main/study-shine-joy-main/README.md)

---
© 2026 Lumen LMS · Crafted for calm learning.
