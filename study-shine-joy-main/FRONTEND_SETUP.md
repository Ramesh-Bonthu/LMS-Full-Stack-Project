# Frontend Setup & Configuration Guide

## 📋 Quick Overview

The Study Shine Joy LMS frontend is a modern, full-stack React application built with TanStack Start, TypeScript, and TailwindCSS. This guide provides comprehensive setup instructions.

## 🚀 Quick Start (30 seconds)

```bash
cd study-shine-joy-main
npm install
npm run dev
```

Frontend runs on: **http://localhost:8080** (or specified port)

## 🛠️ Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or Bun v1.0.0+)
- **Git**: For version control
- **Backend**: Running on http://localhost:8082

## 📦 Installation Steps

### 1. Navigate to Frontend Directory
```bash
cd study-shine-joy-main
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using Bun (faster):
```bash
bun install
```

### 3. Environment Configuration

Create `.env` file in frontend root:

```env
VITE_API_URL=http://localhost:8082/api
VITE_APP_NAME=Study Shine Joy
VITE_APP_VERSION=1.0.0
```

### 4. Verify Backend Connection

Ensure backend is running:
```bash
curl http://localhost:8082/api/health
```

## ▶️ Running the Frontend

### Start Development Server
```bash
npm run dev
```

### Access Application
Open browser: **http://localhost:8080**

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # Radix UI components
│   ├── dashboard-sections.tsx
│   ├── DashboardShell.tsx
│   ├── Landing.tsx
│   └── ProtectedRoute.tsx
│
├── routes/                    # TanStack Router
│   ├── __root.tsx
│   ├── index.tsx
│   ├── auth.login.tsx
│   ├── auth.register.tsx
│   └── dashboard.$role.$section.tsx
│
├── hooks/                     # Custom hooks
│   ├── useApi.ts
│   └── useMobile.tsx
│
├── lib/                       # Utilities
│   ├── api.ts
│   ├── auth.tsx
│   ├── lms-data.ts
│   └── utils.ts
│
└── styles.css
```

## 💻 Available Scripts

### Development Commands

```bash
# Start dev server
npm run dev

# Build for development
npm run build:dev

# Preview production build
npm preview

# Run linting
npm run lint

# Format code
npm run format
```

### Production Commands

```bash
# Build for production
npm run build
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | http://localhost:8082/api | Backend API URL |
| VITE_APP_NAME | Study Shine Joy | App name |
| VITE_APP_VERSION | 1.0.0 | App version |

## 🎨 Styling

The project uses **TailwindCSS** for styling with:
- Utility-first approach
- Custom color palette
- Responsive design utilities
- Dark mode support

## 🔌 API Integration

### Using the useApi Hook

```tsx
import { useApi } from '@/hooks/useApi';

export function CourseList() {
  const { data: courses, loading, error } = useApi('/courses');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {courses.map(course => (
        <li key={course.id}>{course.name}</li>
      ))}
    </ul>
  );
}
```

### Direct API Calls

```tsx
import { api } from '@/lib/api';

// GET
const courses = await api.get('/courses');

// POST
const newCourse = await api.post('/courses', { name: 'Web Dev' });

// PUT
await api.put('/courses/1', { name: 'Updated' });

// DELETE
await api.delete('/courses/1');
```

## 🔐 Authentication

### Using Auth Context

```tsx
import { useAuth } from '@/lib/auth';

export function Profile() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <Navigate to="/auth/login" />;

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Routes

```tsx
<ProtectedRoute 
  requiredRole="ADMIN"
  component={AdminDashboard}
/>
```

## 📱 Responsive Design

### Mobile Detection

```tsx
import { useMobile } from '@/hooks/use-mobile';

export function Navigation() {
  const isMobile = useMobile();
  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

### Responsive Breakpoints

- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

## 🧪 Development Best Practices

### Component Structure

```tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  className?: string;
  children: React.ReactNode;
}

export function MyComponent({ className, children }: ComponentProps) {
  return (
    <div className={cn('base-classes', className)}>
      {children}
    </div>
  );
}
```

### Type Safety

Always define proper TypeScript interfaces:

```tsx
interface Course {
  id: number;
  name: string;
  description: string;
  enrolled: number;
}

interface CourseCardProps {
  course: Course;
  onEnroll: (id: number) => void;
}
```

## 🐛 Debugging

### Console Debugging

```tsx
// Log component renders
console.log('Props:', props);

// Log API responses
api.get('/courses').then(data => {
  console.log('Courses:', data);
});

// Error logging
console.error('Error:', error);
```

### React DevTools

Install React DevTools Chrome extension for advanced debugging.

## 🚀 Building for Production

### Production Build

```bash
npm run build
```

Creates optimized `dist/` directory with:
- Minified JavaScript
- Optimized CSS
- Compressed assets

### Deploy to Cloudflare Pages

```bash
npm run build
wrangler deploy
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### API Connection Issues

```bash
# Verify backend is running
curl http://localhost:8082/api/health

# Update .env
VITE_API_URL=http://localhost:8082/api
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check for errors
npx tsc --noEmit
```

## 📋 Pre-Flight Checklist

- [ ] Node.js v18+ installed
- [ ] Dependencies installed
- [ ] `.env` file created
- [ ] Backend running on 8082
- [ ] Dev server starts
- [ ] Can access frontend
- [ ] Can login with demo credentials
- [ ] No TypeScript errors
- [ ] Responsive design works
- [ ] API calls successful

---

**Frontend Version**: 1.0.0  
**Last Updated**: April 2026  
**Status**: Production Ready ✅

- Auth login, registration, token validation, logout
- Protected dashboard routes by role
- Courses, approvals, and enrollment flows
- Assignments, submissions, and grading endpoints
- Quizzes and quiz submission
- Attendance, announcements, performance, and admin stats endpoints

## Notes

- File uploads are mocked in the Node backend using in-memory records.
- Data is stored in memory, so restarting the backend resets demo data.
