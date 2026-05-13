# Lumen LMS Frontend

The React-based frontend for Lumen LMS, built with a focus on aesthetics, responsiveness, and user experience.

## 🎨 Design Philosophy

- **Soft UI**: Clean, light aesthetics with subtle shadows and gradients.
- **Dynamic Interaction**: Real-time progress tracking and reactive notifications.
- **Role-Based Views**: Tailored experiences for Students, Faculty, and Admins.

## 🛠️ Technology Stack

- **Framework**: React 18+ (Vite)
- **Routing**: TanStack Router (Type-safe routing)
- **Styling**: TailwindCSS & Vanilla CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Data Fetching**: Axios / Fetch API

## 📂 Core Components

- **`DashboardShell.tsx`**: The main layout container with sidebar and dynamic notification bell.
- **`DisplayCards.tsx`**: Reusable cards for Courses, Assignments, and Stats.
- **`UIPrimitives.tsx`**: Custom buttons, pills, and card components.

## 🚀 Dashboard Features

### Student
- **Home**: Welcome message, enrolled courses, and upcoming deadlines.
- **Courses**: Interactive course content player (YouTube, Videos, PDFs).
- **Assignments**: Upload system with status tracking.

### Faculty
- **Course Builder**: Create and manage course content and status.
- **Submission Portal**: View student PDFs and provide grades/feedback.
- **Analytics**: Track student enrollment and performance.

### Admin
- **Approvals**: Review and approve/reject new course requests.
- **User Management**: Monitor and manage all platform users.

## 🔧 Setup

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Build for production: `npm run build`

---
Lumen LMS Frontend · Designed for learning.
