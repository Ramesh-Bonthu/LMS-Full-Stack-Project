# Study Shine Joy - Learning Management System (LMS)

A modern, full-stack Learning Management System built with cutting-edge web technologies. Designed to streamline course management, assignments, quizzes, and student performance tracking with an intuitive user interface.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building for Production](#building-for-production)
- [API Documentation](#api-documentation)
- [Demo Credentials](#demo-credentials)
- [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

Study Shine Joy is a comprehensive Learning Management System that enables educational institutions to:
- Manage courses and curriculum effectively
- Distribute and grade assignments and quizzes
- Track student attendance and performance
- Facilitate communication through announcements
- Monitor learning progress with detailed analytics

The system supports three user roles with distinct permissions:
- **Admin**: Full system control and user management
- **Faculty**: Course creation, assignment posting, and grade management
- **Student**: Course enrollment, assignment submission, and performance tracking

## 🛠️ Technology Stack

### Frontend
- **Framework**: TanStack Start (React Router v7)
- **Language**: TypeScript
- **UI Library**: React 19+
- **Styling**: TailwindCSS with Vite
- **Components**: Radix UI (headless, accessible components)
- **State Management**: TanStack React Query
- **Build Tool**: Vite
- **Package Manager**: Bun / npm
- **Deployment**: Cloudflare Pages

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (development)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **ORM**: Sequelize
- **Port**: 8082

## 📁 Project Structure

```
.
├── study-shine-joy-main/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ui/           # Radix UI components
│   │   │   └── ...
│   │   ├── routes/           # TanStack Router routes
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and helpers
│   │   └── styles.css        # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
│
└── lms-backend/
    ├── server.js             # Express server entry point
    ├── db.js                 # Database configuration
    ├── package.json
    ├── data/db.json          # Sample data
    └── src/
        ├── main/java/        # Spring Boot source (reference)
        └── resources/        # Java resources
```

## ✨ Features

### Authentication & Authorization
- User registration and login
- JWT-based session management
- Role-based access control (RBAC)
- Secure password hashing with bcryptjs

### Course Management
- Create and manage courses
- Course enrollment for students
- Course-specific content organization
- Faculty assignment capabilities

### Assignments
- Create assignments with due dates
- Student submission tracking
- File upload support
- Grading interface for faculty

### Quizzes
- Create quiz questions
- Multiple question types support
- Automatic scoring
- Performance analytics

### Attendance
- Mark attendance by date
- Attendance reports per student
- Attendance tracking per course

### Announcements
- Broadcast important information
- Course-specific announcements
- Notification system

### Performance Analytics
- Student performance metrics
- Course completion status
- Grade distribution
- Progress tracking

### Admin Dashboard
- User management
- System configuration
- Data analytics
- Course oversight

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or Bun package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd study-shine-joy-main
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd study-shine-joy-main
   npm install
   # or
   bun install
   ```

3. **Start the backend server** (in separate terminal)
   ```bash
   cd lms-backend
   npm install
   npm start
   ```
   Backend will run on: `http://localhost:8082`

4. **Start the frontend development server**
   ```bash
   cd study-shine-joy-main
   npm run dev
   # or
   bun run dev
   ```
   Frontend will run on: `http://localhost:8080` or `http://localhost:5173`

## 💻 Development

### Frontend Development

```bash
# Development server with hot reload
npm run dev

# Linting
npm run lint

# Code formatting
npm run format

# Build for development
npm run build:dev

# Preview production build
npm preview
```

### Backend Development

```bash
# Start backend server
npm start

# Backend API: http://localhost:8082
```

## 🔨 Building for Production

### Frontend Build

```bash
npm run build

# Output in dist/ directory
```

### Deployment

The frontend is configured for deployment on Cloudflare Pages, Vercel, Netlify, or any static hosting service.

## 📡 API Documentation

### Base URL
```
http://localhost:8082/api
```

### Protected Endpoints Require
```
Authorization: Bearer <jwt_token>
```

### Key Endpoints

**Authentication:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

**Courses:**
- `GET /courses` - Get all courses
- `POST /courses` - Create course (Faculty/Admin)
- `GET /courses/:id` - Get course details

**Assignments:**
- `GET /courses/:id/assignments` - Get course assignments
- `POST /assignments` - Create assignment (Faculty/Admin)

**Submissions:**
- `POST /submissions` - Submit assignment
- `PUT /submissions/:id/grade` - Grade submission (Faculty/Admin)

**Admin:**
- `GET /admin/users` - Get all users (Admin)
- `GET /admin/analytics` - System analytics (Admin)

## 👥 Demo Credentials

Test the application with these pre-configured accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Faculty | faculty@example.com | password123 |
| Student | student@example.com | password123 |

## 🔒 Security Features

- JWT-based authentication
- bcryptjs password hashing
- CORS protection
- Role-based authorization
- Session management (stateless)
- Protected API endpoints

## 🐛 Troubleshooting

### Frontend Issues

**Port Already in Use**
```bash
npm run dev -- --port 3000
```

**Build Errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Backend Issues

**Port 8082 Already in Use**
```bash
# Windows:
netstat -ano | findstr :8082
taskkill /PID <PID> /F
```

**Database Reset**
```bash
rm data/lms.db
npm start
```

## 📚 Additional Resources

- [TanStack Router Documentation](https://tanstack.com/router)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [Express.js Documentation](https://expressjs.com)

---

**Project Version**: 1.0.0  
**Status**: Production Ready ✅  
**Last Updated**: April 2026
