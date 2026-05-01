# Lumen LMS — Learning, Beautifully Organized

Lumen LMS is a modern, distraction-free Learning Management System designed for students, faculty, and administrators. It features a clean, pastel-themed interface, robust role-based access control, and a secure, verified workflow for course management.

---

## 🌟 Key Features

### 🔐 Security & Access Control
- **Two-Step Verification (OTP)**: All new Student and Faculty accounts require email verification via a 6-digit OTP before they can access the platform.
- **Strong Password Enforcement**: Strict criteria (8+ characters, uppercase, lowercase, numbers, and special symbols) to protect user accounts.
- **Role-Based Permissions**: Distinct dashboards and capabilities for Students, Faculty, and Admins.
- **Course Status Enforcement**: Only **APPROVED** courses can host content, assignments, quizzes, or attendance records.

### 👩‍🏫 Faculty Workflow
- **Course Creation**: Create courses and wait for Admin approval.
- **Content Management**: Upload YouTube videos and learning resources once a course is approved.
- **Assessment**: Create assignments (with AI-generated prompts) and AI-powered quizzes.
- **Grading**: Review student submissions, provide feedback, and assign marks.
- **Attendance**: Mark daily attendance for students enrolled in their courses.

### 👨‍🎓 Student Experience
- **Course Exploration**: Browse the catalog of approved courses and enroll instantly.
- **Learning Path**: Access structured course content, submit assignments, and take quizzes.
- **Performance Tracking**: View marks, feedback, and attendance trends through a visual dashboard.
- **Notifications**: Stay updated with announcements from faculty and admins.

### 🛡️ Admin Oversight
- **Quality Control**: Review and Approve/Reject pending courses created by faculty.
- **User Management**: Activate/Deactivate users and oversee the platform's community.
- **Analytics**: View system-wide stats, enrollment trends, and performance reports.
- **Global Announcements**: Send notifications to all users or specific roles.

---

## 🛠️ Tech Stack

- **Frontend**: React (TypeScript), TanStack Router, TanStack Query, Framer Motion (Animations), Tailwind CSS, Lucide React (Icons), Recharts (Analytics).
- **Backend**: Node.js, Express, Sequelize (ORM), JWT (Authentication), Bcrypt (Security).
- **Database**: SQLite (Development-ready, persistent storage).

---

## 🚀 Getting Started

### 1. Database Setup
The system uses SQLite. On initial startup, it automatically creates the database file (`lms_db.sqlite`) and seeds it with default demo credentials.

### 2. Default Credentials
- **Admin**: `admin@example.com` / `password123`
- **Faculty**: `faculty@example.com` / `password123`
- **Student**: `student@example.com` / `password123`

### 3. Workflow Example
1. **Faculty** signs up and verifies via OTP.
2. **Faculty** creates a "Modern Web Design" course.
3. **Admin** logs in, reviews the course, and clicks **Approve**.
4. **Student** signs up, verifies, and enrolls in the approved course.
5. **Faculty** now uploads a video link and creates an assignment.
6. **Student** completes the task and submits it for grading.

---

## 🧹 Database Reset
To start with a completely fresh state:
1. Stop the backend server.
2. Delete the `lms-backend/lms_db.sqlite` file.
3. Restart the backend. The default demo accounts will be recreated automatically.

---
*Lumen LMS · Crafted for calm and secure learning.*
