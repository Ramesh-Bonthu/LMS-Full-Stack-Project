# Study Shine Joy - Frontend Application

A high-performance, responsive React application that provides a premium user experience for students and educators.

## 🎨 UI/UX Philosophy
*   **Modern Aesthetics**: Dark-mode support, vibrant gradients, and glassmorphism.
*   **Interactive Components**: Powered by Framer Motion for smooth transitions and Lucide for sharp iconography.
*   **Mobile First**: Fully responsive layout using Tailwind CSS grid and flexbox systems.

## 🧱 Key Components

### Dashboard Shell
A centralized navigation system that dynamically adapts the sidebar and top navigation based on the user's role (Admin, Faculty, or Student).

### AI Interview Room
*   **Live Stream**: Real-time camera feed integration.
*   **Speech Core**: Implements the Web Speech API for low-latency voice-to-text and text-to-speech.
*   **Visual Feedback**: Animated waves and speaking indicators.

### Quiz Interface
A clean, timed assessment environment with real-time score calculation and instant feedback.

## ⚙️ Core Logic

### API Client (`/src/lib/api.ts`)
A centralized Axios-like wrapper that handles:
*   Automatic `Authorization` header injection.
*   Multipart/FormData requests for file uploads.
*   Standardized error handling and toast notifications.

### State Management
Uses React's native `useState` and `useEffect` combined with the centralized API client to manage live data across dashboards without unnecessary complexity.

## 🚀 Getting Started
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Build for production: `npm run build`

## 📂 Project Structure
*   `/src/components/dashboard`: Role-specific dashboard views.
*   `/src/components/shared`: Reusable UI primitives (Buttons, Cards, Modals).
*   `/src/lib`: Core utility functions and API service.
*   `/src/styles`: Global CSS and theme configuration.
