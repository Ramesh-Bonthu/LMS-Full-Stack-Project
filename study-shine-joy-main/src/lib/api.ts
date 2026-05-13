// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8082/api";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  token: string;
  message?: string;
}

export interface Course {
  id: number;
  title: string;
  code: string;
  description?: string;
  facultyId?: number;
  facultyName?: string;
  status?: string;
  studentCount?: number;
  progress?: number;
  rejectionReason?: string;
  completedContentIds?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  courseId?: number;
  courseName?: string;
  deadline?: string;
  totalMarks?: number;
  status?: string;
  marks?: number;
  feedback?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Submission {
  id: number;
  assignmentId: number;
  assignmentTitle?: string;
  studentId: number;
  studentName?: string;
  filePath?: string;
  submittedAt?: string;
  marks?: number;
  feedback?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  courseId?: number;
  totalQuestions?: number;
  totalMarks?: number;
  timeLimit?: number;
  questions?: Question[];
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id?: number;
  studentId?: number;
  courseId?: number;
  courseName?: string;
  date?: string;
  month: string;
  value: number;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  time: string;
  isNew?: boolean;
  audience?: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  isRead: boolean;
  createdAt: string;
}

export interface Resource {
  id: number;
  title: string;
  description?: string;
  type: "PDF" | "VIDEO" | "LINK" | "DOC";
  url: string;
  facultyId?: number;
  courseId?: number;
  category?: string;
  createdAt?: string;
}

export interface PerformanceRecord {
  subject: string;
  marks: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt?: string;
  status?: string;
  bio?: string;
  profilePicture?: string;
  skills?: string[];
  socialLinks?: Record<string, string>;
}

export interface UserProfile extends AdminUser {}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalAssignments: number;
  totalSubmissions: number;
  activeUsers: number;
  approvedCourses: number;
  pendingApprovals: number;
}

class ApiClient {
  public API_BASE_URL: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.API_BASE_URL = baseUrl;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem("authToken");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const token = this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        cache: "no-store",
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.message || `HTTP ${response.status}`,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : undefined;
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  private async requestFormData<T>(
    endpoint: string,
    formData: FormData,
    method: "POST" | "PUT" = "POST",
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {};

    const token = this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.message || `HTTP ${response.status}`,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : undefined;
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // AUTH ENDPOINTS
  async login(email: string, password: string) {
    const res = await this.request<AuthApiUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.success && res.data?.token) {
      localStorage.setItem("authToken", res.data.token);
      // Store the user data directly from response
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: String(res.data.id),
          name: res.data.name,
          email: res.data.email,
          role: res.data.role.toLowerCase(),
        }),
      );
    }
    return res;
  }

  async register(name: string, email: string, password: string, role: string) {
    return this.request<{ message: string; email: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    });
  }

  async verifyOtp(email: string, otp: string) {
    return this.request<{ message: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  }

  async resendOtp(email: string) {
    return this.request<{ message: string }>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }

  async validateToken() {
    const response = await this.request<AuthApiUser>("/auth/validate", { method: "GET" });
    if (response.success && response.data?.token) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: String(response.data.id),
          name: response.data.name,
          email: response.data.email,
          role: response.data.role.toLowerCase(),
        }),
      );
    }
    return response;
  }

  getCurrentUser() {
    try {
      const user = localStorage.getItem("user");
      if (!user || user === "undefined") {
        return null;
      }
      return JSON.parse(user);
    } catch (error) {
      // If parsing fails, clear corrupted data
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      return null;
    }
  }

  // COURSE ENDPOINTS
  async getCourses() {
    return this.request("/courses", { method: "GET" });
  }

  async getCourseById(courseId: string) {
    return this.request(`/courses/${courseId}`, { method: "GET" });
  }

  async createCourse(courseData: Partial<Course>) {
    return this.request("/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(courseId: string, courseData: Partial<Course>) {
    return this.request(`/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(courseData),
    });
  }

  async enrollCourse(courseId: string) {
    return this.request(`/courses/${courseId}/enroll`, { method: "POST" });
  }

  async approveCourse(courseId: string) {
    return this.request(`/courses/${courseId}/approve`, { method: "POST" });
  }

  async rejectCourse(courseId: string, reason: string) {
    return this.request(`/courses/${courseId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // ASSIGNMENT ENDPOINTS
  async getAssignments() {
    return this.request("/assignments", { method: "GET" });
  }

  async getAssignmentById(assignmentId: string) {
    return this.request(`/assignments/${assignmentId}`, { method: "GET" });
  }

  async createAssignment(assignmentData: Partial<Assignment>) {
    return this.request("/assignments", {
      method: "POST",
      body: JSON.stringify(assignmentData),
    });
  }

  async generateAssignment(topic: string) {
    return this.request<{ title: string; description: string }>("/assignments/generate", {
      method: "POST",
      body: JSON.stringify({ topic }),
    });
  }

  async submitAssignment(assignmentId: string, formData: FormData) {
    return this.requestFormData(`/assignments/${assignmentId}/submit`, formData);
  }

  async getSubmissions(assignmentId?: string) {
    const endpoint = assignmentId ? `/assignments/${assignmentId}/submissions` : "/assignments/submissions";
    return this.request(endpoint, { method: "GET" });
  }

  async gradeSubmission(submissionId: string, marks: number, feedback: string) {
    return this.request(`/assignments/submissions/${submissionId}/grade`, {
      method: "PUT",
      body: JSON.stringify({ marks, feedback }),
    });
  }

  // QUIZ ENDPOINTS
  async generateQuiz(topic: string) {
    return this.request("/quizzes/generate", {
      method: "POST",
      body: JSON.stringify({ topic }),
    });
  }

  async getQuizzes() {
    return this.request("/quizzes", { method: "GET" });
  }

  async getQuizById(quizId: string) {
    return this.request(`/quizzes/${quizId}`, { method: "GET" });
  }

  async createQuiz(quizData: Partial<Quiz>) {
    return this.request("/quizzes", {
      method: "POST",
      body: JSON.stringify(quizData),
    });
  }

  async submitQuizAttempt(quizId: string, answers: Record<string, unknown>) {
    return this.request(`/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify(answers),
    });
  }

  // ATTENDANCE ENDPOINTS
  async getAttendance() {
    return this.request("/attendance", { method: "GET" });
  }

  async markAttendance(attendanceData: Record<string, unknown>) {
    return this.request("/attendance", {
      method: "POST",
      body: JSON.stringify(attendanceData),
    });
  }

  // ANNOUNCEMENTS ENDPOINTS
  async getAnnouncements() {
    return this.request("/announcements", { method: "GET" });
  }

  async createAnnouncement(announcementData: Partial<Announcement>) {
    return this.request("/announcements", {
      method: "POST",
      body: JSON.stringify(announcementData),
    });
  }

  // NOTIFICATION ENDPOINTS
  async getNotifications() {
    return this.request<Notification[]>("/notifications", { method: "GET" });
  }

  async markNotificationAsRead(id: number) {
    return this.request(`/notifications/${id}/mark-read`, { method: "PUT" });
  }

  async markAllNotificationsAsRead() {
    return this.request("/notifications/mark-all-read", { method: "PUT" });
  }

  async getUnreadNotificationsCount() {
    return this.request<{ count: number }>("/notifications/unread-count", { method: "GET" });
  }

  // RESOURCE ENDPOINTS
  async getResources() {
    return this.request<Resource[]>("/resources", { method: "GET" });
  }

  async createResource(data: Partial<Resource>) {
    return this.request<Resource>("/resources", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteResource(id: number) {
    return this.request(`/resources/${id}`, { method: "DELETE" });
  }

  // PERFORMANCE ENDPOINTS
  async getPerformance() {
    return this.request("/performance", { method: "GET" });
  }

  // ADMIN ENDPOINTS
  async getUsers() {
    return this.request("/admin/users", { method: "GET" });
  }

  async approveUser(userId: string) {
    return this.request(`/admin/users/${userId}/approve`, { method: "POST" });
  }

  async rejectUser(userId: string) {
    return this.request(`/admin/users/${userId}/reject`, { method: "POST" });
  }

  async getAdminStats() {
    return this.request("/admin/stats", { method: "GET" });
  }

  // CONTENT UPLOAD
  async getCourseContent(courseId: string) {
    return this.request(`/courses/${courseId}/content`, { method: "GET" });
  }

  async submitContentLink(courseId: string, data: { name: string; url: string }) {
    return this.request(`/courses/${courseId}/content`, {
      method: "POST",
      body: JSON.stringify({ name: data.name, url: data.url, type: 'youtube' }),
    });
  }

  async uploadCourseContent(courseId: string, formData: FormData) {
    return this.requestFormData(`/courses/${courseId}/content/upload`, formData);
  }

  async markContentComplete(courseId: string, contentId: string) {
    return this.request<{ message: string; course: Course }>(`/courses/${courseId}/content/${contentId}/complete`, {
      method: "POST",
    });
  }

  async getCourseStudents(courseId: string) {
    return this.request(`/courses/${courseId}/students`, { method: "GET" });
  }

  async getEnrollmentTrend() {
    return this.request("/admin/enrollment-trend", { method: "GET" });
  }

  // PROFILE ENDPOINTS
  async getUserProfile() {
    return this.request<UserProfile>("/users/profile", { method: "GET" });
  }

  async updateProfile(data: Partial<UserProfile>) {
    return this.request<{ message: string; user: UserProfile }>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Public request method for custom endpoints
  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, options);
  }
}

export const api = new ApiClient(API_BASE_URL);
export { API_BASE_URL };
