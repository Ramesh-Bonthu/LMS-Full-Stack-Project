import { type Role } from "@/lib/lms-data";

// Shared Components
import { NotificationsPage } from "./NotificationsPage";
import { ProfilePage } from "./ProfilePage";
import { LibraryPage } from "./LibraryPage";

// Student Components
import { 
  StudentHome, 
  StudentCourses, 
  StudentAssignments, 
  StudentQuizzes, 
  StudentPerformance, 
  StudentAttendance,
  MockInterviews
} from "./dashboard/student";

// Faculty Components
import { 
  FacultyHome, 
  FacultyCourses, 
  FacultyAssignments, 
  FacultyQuizzes, 
  FacultyContent, 
  FacultyAttendance,
  FacultySubmissions,
  FacultyAnnouncements
} from "./dashboard/faculty";

// Admin Components
import { 
  AdminHome, 
  AdminUsers, 
  AdminCourses, 
  AdminReports,
  AdminAnnouncements
} from "./dashboard/admin";

// Re-exporting all modular components to maintain compatibility
export * from "./shared/UIPrimitives";
export * from "./shared/DisplayCards";
export * from "./NotificationsPage";
export * from "./ProfilePage";
export * from "./LibraryPage";
export * from "./dashboard/student";
export * from "./dashboard/faculty";
export * from "./dashboard/admin";

export function DashboardSection({ role, section }: { role: Role; section: string }) {
  // Common Sections
  if (section === "notifications") return <NotificationsPage />;
  if (section === "profile") return <ProfilePage role={role} />;
  if (section === "library") return <LibraryPage />;

  // Student Sections
  if (role === "student") {
    switch (section) {
      case "home": return <StudentHome />;
      case "courses": return <StudentCourses />;
      case "assignments": return <StudentCourses />;
      case "quizzes": return <StudentCourses />;
      case "performance": return <StudentHome />;
      case "attendance": return <StudentAttendance />;
      case "mock-interviews": return <MockInterviews />;

      default: return <StudentHome />;
    }
  }

  // Faculty Sections
  if (role === "faculty") {
    switch (section) {
      case "home": return <FacultyHome />;
      case "courses":
      case "assignments":
      case "quizzes":
      case "content":
      case "attendance":
      case "submissions":
      case "announcements":
        return <FacultyCourses />;
      default: return <FacultyHome />;
    }
  }

  // Admin Sections
  if (role === "admin") {
    switch (section) {
      case "home": return <AdminHome />;
      case "users": return <AdminUsers />;
      case "courses": return <AdminCourses />;
      case "reports": return <AdminReports />;
      case "announcements": return <AdminAnnouncements />;
      default: return <AdminHome />;
    }
  }

  return <div>Section not found: {section}</div>;
}
