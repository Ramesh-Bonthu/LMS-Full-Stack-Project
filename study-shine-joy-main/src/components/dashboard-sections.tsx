import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { motion } from "framer-motion";
import {
  Upload,
  CheckCircle2,
  Clock,
  Star,
  PlayCircle,
  Plus,
  Megaphone,
  Search,
  TrendingUp,
  Loader,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { type Role } from "@/lib/lms-data";
import {
  type AdminUser,
  type AdminStats,
  type Announcement,
  type Assignment,
  type AttendanceRecord,
  type Course,
  type PerformanceRecord,
  type Quiz,
  type Submission,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

/* --------------------------- shared primitives --------------------------- */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-soft ${className}`}>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-warn/20 text-warn-foreground",
    Submitted: "bg-primary-soft text-primary",
    Evaluated: "bg-success/20 text-success-foreground",
    Approved: "bg-success/20 text-success-foreground",
    Active: "bg-success/20 text-success-foreground",
    Rejected: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        map[status] ?? "bg-secondary text-secondary-foreground"
      }`}
    >
      {status}
    </span>
  );
}

function Btn({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "soft";
}) {
  const styles = {
    primary: "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95",
    ghost: "border border-border bg-card hover:bg-secondary",
    soft: "bg-primary-soft text-primary hover:bg-primary-soft/70",
  }[variant];
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

/* ============================== STUDENT ============================== */

function StudentHome() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<Assignment[]>([]);
  const [latestAnnouncements, setLatestAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const coursesRes = await api.getCourses();
        if (coursesRes.success && coursesRes.data) {
          const uId = String(user?.id || "");
          const enrolledCourses = Array.isArray(coursesRes.data) 
            ? coursesRes.data.filter(c => c.enrolledStudentIds && c.enrolledStudentIds.some(id => String(id) === uId))
            : [];
          setCourses(enrolledCourses.slice(0, 4));
        }

        const assignmentsRes = await api.getAssignments();
        if (assignmentsRes.success && assignmentsRes.data) {
          setStudentAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
        }

        const announcementsRes = await api.getAnnouncements();
        if (announcementsRes.success && announcementsRes.data) {
          setLatestAnnouncements(
            Array.isArray(announcementsRes.data) ? announcementsRes.data.slice(0, 3) : [],
          );
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const enrolledCount = courses.length;
  const pendingCount = studentAssignments.filter(
    (a) => a.status?.toLowerCase() === "pending",
  ).length;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || "User"} 👋`}
        subtitle="Here's what's happening in your learning journey today."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Enrolled courses", value: enrolledCount, icon: PlayCircle },
          { label: "Pending tasks", value: pendingCount, icon: Clock },
          { label: "Avg. grade", value: "A-", icon: Star },
        ].map((s) => (
          <Card key={s.label}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="mt-1 font-display text-3xl font-bold">{s.value}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Continue learning</h3>
            <span className="text-xs text-muted-foreground">{courses.length} courses</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : courses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.map((c) => (
                <DynamicCourseCard key={c.id} course={c} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No enrolled courses yet</div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">Announcements</h3>
          <div className="space-y-3">
            {latestAnnouncements.map((n) => (
              <div key={n.id} className="rounded-xl border border-border bg-secondary/50 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{n.title}</div>
                  {n.isNew && <span className="h-2 w-2 rounded-full bg-accent" />}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                <div className="mt-1.5 text-[11px] text-muted-foreground">{n.time}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h3 className="mb-4 font-display text-lg font-bold">Upcoming deadlines</h3>
        <DynamicAssignmentTable assignments={studentAssignments} />
      </Card>
    </>
  );
}

function DynamicCourseCard({ course }: { course: Course }) {
  const courseColors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
    "from-green-500 to-green-600",
  ];
  const color = courseColors[course.id % courseColors.length];
  const progress = course.progress || 65;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="overflow-hidden rounded-2xl border border-border bg-gradient-card"
    >
      <div className={`h-20 bg-gradient-to-br ${color}`} />
      <div className="p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {course.code || "COURSE"}
        </div>
        <div className="mt-0.5 font-semibold leading-snug">{course.name || course.title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {course.instructor || course.facultyName || "Faculty"}
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StudentCourseDetails({ course, onBack }: { course: Course; onBack: () => void }) {
  const [contentList, setContentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const res = await api.getCourseContent(course.id.toString());
      if (res.success && res.data) {
        setContentList(Array.isArray(res.data) ? res.data : []);
      }
      setLoading(false);
    };
    fetchContent();
  }, [course.id]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Btn variant="soft" onClick={onBack} className="rounded-full px-3 py-1 text-xs">
          &larr; Back to courses
        </Btn>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{course.title || course.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{course.code} · {course.instructor || course.facultyName || "Faculty"}</p>
        </div>
      </div>
      
      <Card>
        <h3 className="mb-4 font-display text-lg font-bold">Course Content</h3>
        {loading ? (
          <div className="flex justify-center py-10">
             <Loader className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : contentList.length > 0 ? (
          <div className="space-y-3">
            {contentList.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4 transition hover:bg-secondary/60"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <PlayCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold">{f.name}</span>
                    <div className="text-[11px] text-muted-foreground">Video Link</div>
                  </div>
                </div>
                <a 
                  href={f.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="rounded-full bg-primary-soft px-4 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-soft/80"
                >
                  Watch
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-muted-foreground">No content has been added to this course yet.</div>
        )}
      </Card>
    </>
  );
}

function StudentCourses() {
  const { user } = useAuth();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<"MY_COURSES" | "ALL_COURSES">("MY_COURSES");

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getCourses();
      if (res.success && res.data) {
        const courses = Array.isArray(res.data) ? res.data : [];
        setAllCourses(courses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmEnroll = window.confirm("Are you sure you want to enroll in this course?");
    if (!confirmEnroll) return;
    
    try {
      const res = await api.enrollCourse(courseId.toString());
      if (res.success) {
        // Refresh courses to get updated enrolled list
        await fetchCourses();
        setActiveTab("MY_COURSES");
        alert("Successfully enrolled in the course!");
      } else {
        alert("Enrollment failed: " + res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isEnrolled = (c: Course) => {
    if (!user || (!user.userId && !user.id)) return false;
    const uId = user.userId || user.id;
    if (c.enrolledStudentIds && Array.isArray(c.enrolledStudentIds)) {
      return c.enrolledStudentIds.some(id => String(id) === String(uId));
    }
    return false;
  };

  const displayCourses = allCourses.filter((c) => {
    if (c.status?.toUpperCase() !== "APPROVED" && activeTab === "ALL_COURSES") return false;
    if (activeTab === "MY_COURSES" && !isEnrolled(c)) return false;
    const searchMatch = (c.name || c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (c.code || "").toLowerCase().includes(searchTerm.toLowerCase());
    return searchMatch;
  });

  if (selectedCourse) {
    return <StudentCourseDetails course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="Manage and enroll in courses."
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search courses…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        }
      />
      
      <div className="mb-6 flex gap-2 border-b border-border pb-px text-sm font-medium text-muted-foreground">
        <button
          onClick={() => setActiveTab("MY_COURSES")}
          className={`pb-2 transition ${
            activeTab === "MY_COURSES"
              ? "border-b-2 border-primary text-foreground font-semibold"
              : "border-b-2 border-transparent hover:text-foreground"
          }`}
        >
          My Courses
        </button>
        <button
          onClick={() => setActiveTab("ALL_COURSES")}
          className={`pb-2 transition ${
            activeTab === "ALL_COURSES"
              ? "border-b-2 border-primary text-foreground font-semibold"
              : "border-b-2 border-transparent hover:text-foreground"
          }`}
        >
          Explore Courses
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : displayCourses.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayCourses.map((c) => (
            <div key={c.id} onClick={() => setSelectedCourse(c)} className="cursor-pointer relative group">
              <DynamicCourseCard course={c} />
              {!isEnrolled(c) && (
                 <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition z-10 flex">
                   <button 
                     className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                     onClick={(e) => handleEnroll(c.id, e)}
                   >
                     Enroll
                   </button>
                 </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? "No courses match your search" : "No courses found."}
          </p>
        </div>
      )}
    </>
  );
}

function DynamicAssignmentTable({ 
  assignments, 
  onSelect 
}: { 
  assignments: Assignment[]; 
  onSelect?: (a: Assignment) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2 font-medium">Title</th>
            <th className="py-2 font-medium">Course</th>
            <th className="py-2 font-medium">Due</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {assignments.length > 0 ? (
            assignments.map((a) => (
              <tr key={a.id} className="border-t border-border transition hover:bg-secondary/40">
                <td className="py-3 font-medium">{a.title}</td>
                <td className="py-3 text-muted-foreground">
                  {a.courseName || a.course || "Course"}
                </td>
                <td className="py-3 text-muted-foreground">
                  {a.deadline ? new Date(a.deadline).toLocaleDateString() : a.due || "TBD"}
                </td>
                <td className="py-3">
                  <StatusPill status={a.status || "Pending"} />
                </td>
                <td className="py-3 text-right">
                  <button 
                    onClick={() => onSelect?.(a)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary-soft/70"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {(!a.status || a.status?.toLowerCase() === "pending") ? "Upload" : "View"}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="py-8 text-center text-muted-foreground">
                No assignments yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.getAssignments();
      if (res.success && res.data) {
        setAssignments(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  if (selectedAssignment) {
    return (
      <AssignmentDetailView 
        assignment={selectedAssignment} 
        onBack={() => {
          setSelectedAssignment(null);
          fetchAssignments();
        }} 
      />
    );
  }

  return (
    <>
      <PageHeader title="Assignments" subtitle="Submit your work and track evaluation." />
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <DynamicAssignmentTable 
            assignments={assignments} 
            onSelect={setSelectedAssignment}
          />
        )}
      </Card>
    </>
  );
}

function AssignmentDetailView({ assignment, onBack }: { assignment: Assignment; onBack: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    // Simulate a file upload with FormData
    const formData = new FormData();
    formData.append("file", new Blob(["Assignment Content"], { type: "text/plain" }), "submission.pdf");
    
    try {
      const res = await api.submitAssignment(assignment.id.toString(), formData);
      if (res.success) {
        setSubmissionSuccess(true);
        setTimeout(onBack, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isGraded = assignment.marks !== undefined && assignment.marks >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-secondary/40"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="font-display text-2xl font-bold">{assignment.title}</h2>
          <p className="text-sm text-muted-foreground">{assignment.courseName || "Assignment Details"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-bold text-primary">Instructions</h3>
          <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
            {assignment.description || "No instructions provided."}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 font-display text-sm font-bold">Details</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground">Deadline</div>
                <div className="font-medium">
                  {assignment.deadline ? new Date(assignment.deadline).toLocaleString() : "No deadline"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Marks</div>
                <div className="font-medium">{assignment.totalMarks || 100} points</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="mt-1">
                  <StatusPill status={assignment.status || "Pending"} />
                </div>
              </div>
            </div>
          </Card>

          {isGraded ? (
            <Card className="border-success/30 bg-success/5">
              <h3 className="mb-2 font-display text-sm font-bold text-success">Grade & Feedback</h3>
              <div className="text-3xl font-bold text-success mb-2">
                {assignment.marks}/{assignment.totalMarks || 100}
              </div>
              <p className="text-sm text-muted-foreground italic">
                "{assignment.feedback || "Good job!"}"
              </p>
            </Card>
          ) : (
            <Card>
              <h3 className="mb-4 font-display text-sm font-bold">Submission</h3>
              {submissionSuccess ? (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="mb-2 rounded-full bg-success/20 p-2 text-success">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-success">Submitted Successfully!</p>
                  <p className="text-xs text-muted-foreground mt-1">Redirecting...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Upload your completed assignment as a PDF file.
                  </p>
                  <div className="rounded-xl border-2 border-dashed border-border p-6 text-center transition hover:border-primary/50">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-xs font-medium">Click to select file</p>
                  </div>
                  <Btn 
                    className="w-full" 
                    onClick={handleSubmit} 
                    disabled={submitting || assignment.status === "SUBMITTED"}
                  >
                    {submitting ? "Submitting..." : assignment.status === "SUBMITTED" ? "Already Submitted" : "Submit Assignment"}
                  </Btn>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const res = await api.getQuizzes();
        if (res.success && res.data) {
          setQuizzes(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [activeQuiz]);

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    try {
      setLoading(true);
      const res = await api.submitQuizAttempt(activeQuiz.id.toString(), answers);
      if (res.success) {
        setResult(res.data);
      } else {
        alert("Failed to submit: " + res.error);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-success" />
        <h2 className="font-display text-2xl font-bold">Quiz Submitted!</h2>
        <p className="mt-2 text-muted-foreground">You scored {result.percentage}% ({result.marks} marks)</p>
        <Btn className="mt-8" onClick={() => { setResult(null); setActiveQuiz(null); setAnswers({}); }}>
          Back to Quizzes
        </Btn>
      </div>
    );
  }

  if (activeQuiz) {
    const questions = activeQuiz.questions || [];
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader title={activeQuiz.title} subtitle={`Time Limit: ${activeQuiz.timeLimit || 15} minutes`} />
        {questions.length > 0 ? (
          questions.map((q, qIndex) => (
            <Card key={qIndex} className="p-6">
              <h3 className="text-lg font-medium mb-4">{qIndex + 1}. {q.question}</h3>
              <div className="space-y-3">
                {q.options.map((opt: string, oIndex: number) => (
                  <label key={oIndex} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/40 cursor-pointer transition">
                    <input 
                      type="radio" 
                      name={`question_${qIndex}`} 
                      value={oIndex}
                      checked={answers[qIndex] === oIndex}
                      onChange={() => setAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                      className="h-4 w-4 text-primary"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-muted-foreground">No questions available for this module.</Card>
        )}
        <div className="flex justify-end gap-3 pt-6">
          <Btn variant="ghost" onClick={() => setActiveQuiz(null)}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={loading || questions.length === 0}>
            {loading ? "Submitting..." : "Submit Answers"}
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Quizzes" subtitle="Quick checks to stay sharp." />
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : quizzes.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => (
            <Card key={q.id}>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Course: {q.courseId || "N/A"}
              </div>
              <div className="mt-1 font-display text-lg font-bold">{q.title || "Quiz"}</div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{q.totalQuestions || (q.questions ? q.questions.length : 0)} questions</span>
                <span>·</span>
                <span>{q.timeLimit || 15} min</span>
              </div>
              <Btn className="mt-5 w-full justify-center" onClick={() => setActiveQuiz(q)}>
                <PlayCircle className="h-4 w-4" />
                Start quiz
              </Btn>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No quizzes available yet</p>
        </div>
      )}
    </>
  );
}

function StudentPerformance() {
  const [performanceData, setPerformanceData] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const res = await api.getPerformance();
        if (res.success && res.data) {
          setPerformanceData(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error("Error fetching performance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  return (
    <>
      <PageHeader title="Performance" subtitle="Marks and grades across your courses." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Marks by subject</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2.5 py-0.5 text-xs font-medium text-success-foreground">
              <TrendingUp className="h-3 w-3" /> +6% this term
            </span>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="subject" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="marks" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">Grade summary</h3>
          <div className="space-y-3">
            {performanceData.map((p) => (
              <div
                key={p.subject}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3"
              >
                <div className="text-sm font-medium">{p.subject}</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{p.marks}/100</span>
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
                    {p.marks >= 85 ? "A" : p.marks >= 70 ? "B" : "C"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function StudentAttendance() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await api.getAttendance();
        if (res.success && res.data) {
          setAttendanceData(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const overall = attendanceData.length
    ? Math.round(attendanceData.reduce((s, a) => s + a.value, 0) / attendanceData.length)
    : 0;
  return (
    <>
      <PageHeader title="Attendance" subtitle="Stay on top of your class hours." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <div className="text-xs text-muted-foreground">Overall</div>
          <div className="mt-1 font-display text-5xl font-bold text-primary">{overall}%</div>
          <p className="mt-2 text-sm text-muted-foreground">
            You're well above the 75% requirement. Keep showing up.
          </p>
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="mb-2 font-display text-lg font-bold">Monthly trend</h3>
          <div className="h-64">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={[60, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#att)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
      
      <div className="mt-5">
        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">Attendance History</h3>
          {attendanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Course</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData
                    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
                    .map((record, idx) => (
                    <tr key={record.id || idx} className="border-b border-border/50 transition hover:bg-secondary/40">
                      <td className="py-3 font-medium">{record.date || record.month}</td>
                      <td className="py-3 text-muted-foreground">{record.courseName || "Unknown Course"}</td>
                      <td className="py-3">
                        {record.value > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-1 text-xs font-medium text-success">
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-1 text-xs font-medium text-destructive">
                            Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attendance records found.</p>
          )}
        </Card>
      </div>
    </>
  );
}

function NotificationsPage() {
  const [notificationData, setNotificationData] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.getAnnouncements();
        if (res.success && res.data) {
          setNotificationData(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchAnnouncements();
  }, []);
  return (
    <>
      <PageHeader title="Notifications" subtitle="All your latest updates." />
      <Card>
        <div className="space-y-3">
          {notificationData.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4"
            >
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
                <Megaphone className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{n.title}</div>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{n.body}</p>
              </div>
              {n.isNew && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                  NEW
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function ProfilePage({ role }: { role: Role }) {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account details." />
      <Card>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary text-3xl font-bold text-primary-foreground shadow-glow">
            {role[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold">{user?.name || "Lumen User"}</div>
            <div className="text-sm text-muted-foreground">
              {role === "student"
                ? "Student"
                : role === "faculty"
                  ? "Faculty Member"
                  : "System Administrator"}
            </div>
          </div>
          <Btn variant="ghost">Edit profile</Btn>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["Email", user?.email || "N/A"],
            ["Role", role.toUpperCase()],
            ["Status", "Active"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="text-xs text-muted-foreground">{k}</div>
              <div className="mt-0.5 font-medium">{v}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ============================== FACULTY ============================== */

function FacultyHome() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const coursesRes = await api.getCourses();
        if (coursesRes.success && coursesRes.data) {
          const all = Array.isArray(coursesRes.data) ? coursesRes.data : [];
          setCourses(all.filter(c => c.status?.toUpperCase() !== "REJECTED"));
        }

        const submissionsRes = await api.getSubmissions();
        if (submissionsRes.success && submissionsRes.data) {
          setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data.slice(0, 4) : []);
        }
      } catch (error) {
        console.error("Error fetching faculty data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeCourses = courses.filter((c) => c.status?.toUpperCase() === "APPROVED").length;
  const totalStudents = courses.reduce((acc, c) => acc + (c.studentCount || 0), 0);

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.name?.split(" ")[0] || "Faculty"} 🌿`}
        subtitle="Your teaching at a glance."
        action={
          <Btn>
            <Plus className="h-4 w-4" /> New course
          </Btn>
        }
      />
      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Active courses", value: activeCourses },
          { label: "Pending submissions", value: submissions.length },
          { label: "Students taught", value: totalStudents },
        ].map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-display text-3xl font-bold">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">My courses</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : courses.length > 0 ? (
            <div className="space-y-3">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3"
                >
                  <div>
                    <div className="font-medium">{c.name || c.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.studentCount || 0} students enrolled
                    </div>
                  </div>
                  <StatusPill status={c.status || "PENDING"} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">No courses yet</div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">Recent submissions</h3>
          {submissions.length > 0 ? (
            <div className="space-y-3">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3"
                >
                  <div>
                    <div className="font-medium">{s.studentName || "Student"}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.assignmentTitle || `Assignment #${s.assignmentId}`} ·{" "}
                      {new Date(s.submittedAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                  {s.marks ? (
                    <span className="rounded-full bg-success/20 px-2.5 py-0.5 text-xs font-bold text-success-foreground">
                      {s.marks}/20
                    </span>
                  ) : (
                    <Btn variant="soft" className="px-3 py-1 text-xs">
                      Evaluate
                    </Btn>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">No submissions yet</div>
          )}
        </Card>
      </div>
    </>
  );
}



function FacultyContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [contentList, setContentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await api.getCourses();
      if (res.success && res.data) {
        setCourses(Array.isArray(res.data) ? res.data : []);
      }
    };
    fetchCourses();
  }, []);

  const fetchContent = async (cId: string) => {
    if (!cId) {
      setContentList([]);
      return;
    }
    const res = await api.getCourseContent(cId);
    if (res.success && res.data) {
      setContentList(Array.isArray(res.data) ? res.data : []);
    }
  };

  const handleCourseChange = (e: any) => {
    const newId = e.target.value;
    setCourseId(newId);
    fetchContent(newId);
  };

  const handleSubmit = async () => {
    if (!courseId || !name || !url) return;
    setLoading(true);
    const res = await api.submitContentLink(courseId, { name, url });
    if (res.success) {
      setName("");
      setUrl("");
      await fetchContent(courseId);
    }
    setLoading(false);
  };

  return (
    <>
      <PageHeader
        title="Upload content"
        subtitle="Add YouTube links to your courses."
      />
      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={courseId}
            onChange={handleCourseChange}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 sm:col-span-2"
          >
            <option value="">Select course</option>
            {courses.filter(c => c.status?.toUpperCase() === "APPROVED").map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Content Title (e.g. Introduction video)"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube Link (https://...)"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <div className="sm:col-span-2">
            <Btn onClick={handleSubmit} disabled={loading}>
              {loading ? "Adding..." : "Add Content Link"}
            </Btn>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="mb-3 font-semibold">Course Content</h4>
          {!courseId ? (
            <p className="text-sm text-muted-foreground">Select a course to view contents.</p>
          ) : contentList.length > 0 ? (
            <div className="space-y-2">
              {contentList.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <PlayCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{f.name}</span>
                  </div>
                  <a href={f.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                    Watch
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No content added yet.</p>
          )}
        </div>
      </Card>
    </>
  );
}





function FacultyAttendance() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [marked, setMarked] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await api.getCourses();
      if (res.success && res.data) {
        setCourses(Array.isArray(res.data) ? res.data : []);
      }
    };
    fetchCourses();
  }, []);

  const handleCourseChange = async (e: any) => {
    const newId = e.target.value;
    setCourseId(newId);
    setMarked({});
    if (!newId) {
      setStudents([]);
      return;
    }
    const res = await api.getCourseStudents(newId);
    if (res.success && res.data) {
      setStudents(Array.isArray(res.data) ? res.data : []);
    }
  };

  const markStudent = (studentId: number, status: string) => {
    setMarked(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!courseId || !date) return;
    setLoading(true);
    for (const studentId of Object.keys(marked)) {
      const status = marked[Number(studentId)];
      const value = status === 'Present' ? 100 : 0;
      await api.markAttendance({
        studentId: Number(studentId),
        courseId: Number(courseId),
        date: date,
        value,
      });
    }
    alert("Attendance saved!");
    setLoading(false);
  };

  return (
    <>
      <PageHeader title="Mark attendance" subtitle="Track student presence." />
      <Card>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
          <select
            value={courseId}
            onChange={handleCourseChange}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 w-full sm:w-1/2"
          >
            <option value="">Select course</option>
            {courses.filter(c => c.status?.toUpperCase() === "APPROVED").map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 w-full sm:w-1/3"
          />
        </div>
        
        {courseId && students.length > 0 ? (
          <>
            <div className="space-y-2">
              {students.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3"
                >
                  <span className="font-medium">{s.name}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => markStudent(s.id, 'Present')}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${marked[s.id] === 'Present' ? 'bg-success text-success-foreground' : 'bg-success/20 text-success-foreground hover:bg-success/30'}`}
                    >
                      Present
                    </button>
                    <button 
                      onClick={() => markStudent(s.id, 'Absent')}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${marked[s.id] === 'Absent' ? 'bg-destructive text-destructive-foreground' : 'bg-destructive/15 text-destructive hover:bg-destructive/25'}`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <Btn onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save attendance"}</Btn>
            </div>
          </>
        ) : courseId ? (
          <p className="text-sm text-muted-foreground mt-4">No students enrolled in this course.</p>
        ) : null}
      </Card>
    </>
  );
}



/* ============================== ADMIN ============================== */









function AdminReports() {
  const [performanceData, setPerformanceData] = useState<PerformanceRecord[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const perfRes = await api.getPerformance();
      if (perfRes.success && perfRes.data) {
        setPerformanceData(Array.isArray(perfRes.data) ? perfRes.data : []);
      }
      
      const trendRes = await api.getEnrollmentTrend();
      if (trendRes.success && trendRes.data) {
        setTrendData(Array.isArray(trendRes.data) ? trendRes.data : []);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <PageHeader title="Reports" subtitle="Analytics across courses and performance." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-2 font-display text-lg font-bold">Average performance</h3>
          <div className="h-64">
            {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="subject" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="marks" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            ) : <div className="text-center text-muted-foreground py-10">No performance data</div>}
          </div>
        </Card>
        <Card>
          <h3 className="mb-2 font-display text-lg font-bold">Enrollment growth</h3>
          <div className="h-64">
            {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="enr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#enr)"
                />
              </AreaChart>
            </ResponsiveContainer>
            ) : <div className="text-center text-muted-foreground py-10">No trend data</div>}
          </div>
        </Card>
      </div>
    </>
  );
}

/* --------------------------- router --------------------------- */

function FacultyCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getCourses();
      if (res.success && res.data) {
        const facultyId = Number(user?.id || 0);
        setCourses(
          Array.isArray(res.data)
            ? res.data.filter((course) => 
                (course.facultyId === facultyId || user?.role === "admin") && 
                course.status?.toUpperCase() !== "REJECTED"
              )
            : [],
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user?.id, user?.role]);

  const handleCreate = async () => {
    if (!title || !code) return;
    const res = await api.createCourse({ title, code, description });
    if (res.success) {
      setTitle("");
      setCode("");
      setDescription("");
      await fetchCourses();
    }
  };

  return (
    <>
      <PageHeader title="Courses" subtitle="Create and manage your courses." />
      <Card>
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Course title"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Course code"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <Btn onClick={handleCreate}>
              <Plus className="h-4 w-4" /> Create course
            </Btn>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2">Course</th>
                  <th className="py-2">Students</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-t border-border">
                    <td className="py-3 font-medium">{course.title}</td>
                    <td className="py-3 text-muted-foreground">{course.studentCount || 0}</td>
                    <td className="py-3">
                      <StatusPill status={course.status || "PENDING"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function FacultyAssignments() {
  const [assignmentsData, setAssignmentsData] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchData = async () => {
    const [assignmentsRes, coursesRes] = await Promise.all([
      api.getAssignments(),
      api.getCourses(),
    ]);
    if (assignmentsRes.success && assignmentsRes.data) {
      setAssignmentsData(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
    }
    if (coursesRes.success && coursesRes.data) {
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!title || !courseId) return;
    const res = await api.createAssignment({
      title,
      description,
      courseId: Number(courseId),
      deadline: deadline || undefined,
      totalMarks: 100,
    });
    if (res.success) {
      setTitle("");
      setDeadline("");
      setDescription("");
      setCourseId("");
      await fetchData();
    }
  };

  const handleAI = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    try {
      const res = await api.generateAssignment(aiTopic);
      if (res.success && res.data) {
        setTitle(res.data.title);
        setDescription(res.data.description);
        setAiTopic("");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <PageHeader title="Assignments" subtitle="Create assignments and track submissions." />
      
      <Card className="mb-4 bg-accent-soft/20 border-accent/20">
        <h3 className="mb-3 font-display text-sm font-bold flex items-center gap-2 text-accent">
          <Sparkles className="h-4 w-4" /> AI Assignment Generator
        </h3>
        <div className="flex gap-2">
          <input
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="Topic (e.g. 'Advanced Java Streams')"
            className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <Btn variant="soft" onClick={handleAI} disabled={isGenerating || !aiTopic}>
            {isGenerating ? "Generating..." : "Generate AI Prompt"}
          </Btn>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">Select course</option>
            {courses.filter(c => c.status?.toUpperCase() === "APPROVED").map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description / instructions"
            rows={3}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <Btn onClick={handleCreate}>Publish to students</Btn>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="mb-4 font-display text-lg font-bold">Published assignments</h3>
        <DynamicAssignmentTable assignments={assignmentsData} />
      </Card>
    </>
  );
}

function FacultySubmissions() {
  const [submissionData, setSubmissionData] = useState<Submission[]>([]);

  const fetchSubmissions = async () => {
    const res = await api.getSubmissions();
    if (res.success && res.data) {
      setSubmissionData(Array.isArray(res.data) ? res.data : []);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleGrade = async (submission: Submission) => {
    const marks = window.prompt(
      "Enter marks",
      submission.marks && submission.marks >= 0 ? String(submission.marks) : "0",
    );
    if (marks === null) return;
    const feedback = window.prompt("Enter feedback", submission.feedback || "") ?? "";
    const res = await api.gradeSubmission(submission.id.toString(), Number(marks), feedback);
    if (res.success) {
      await fetchSubmissions();
    }
  };

  return (
    <>
      <PageHeader title="Submissions" subtitle="Evaluate student work and give feedback." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2">Student</th>
                <th className="py-2">Assignment</th>
                <th className="py-2">Submitted</th>
                <th className="py-2">Marks</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissionData.map((submission) => (
                <tr key={submission.id} className="border-t border-border">
                  <td className="py-3 font-medium">{submission.studentName}</td>
                  <td className="py-3 text-muted-foreground">{submission.assignmentTitle}</td>
                  <td className="py-3 text-muted-foreground">
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="py-3">
                    {submission.marks !== undefined && submission.marks >= 0
                      ? `${submission.marks}/100`
                      : "-"}
                  </td>
                  <td className="py-3 text-right">
                    <Btn variant="soft" className="text-xs" onClick={() => handleGrade(submission)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {submission.marks !== undefined && submission.marks >= 0
                        ? "Update"
                        : "Evaluate"}
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function FacultyAnnouncements() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [items, setItems] = useState<Announcement[]>([]);

  const fetchAnnouncements = async () => {
    const res = await api.getAnnouncements();
    if (res.success && res.data) {
      setItems(Array.isArray(res.data) ? res.data : []);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSend = async () => {
    if (!title || !body) return;
    const res = await api.createAnnouncement({ title, body, audience: "STUDENTS" });
    if (res.success) {
      setTitle("");
      setBody("");
      await fetchAnnouncements();
    }
  };

  return (
    <>
      <PageHeader title="Announcements" subtitle="Send updates to your enrolled students." />
      <Card>
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your announcement..."
            rows={4}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <div>
            <Btn onClick={handleSend}>
              <Megaphone className="h-4 w-4" /> Send
            </Btn>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.time}</div>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function AdminUsers() {
  const [usersData, setUsersData] = useState<AdminUser[]>([]);

  const fetchUsers = async () => {
    const res = await api.getUsers();
    if (res.success && res.data) {
      setUsersData(Array.isArray(res.data) ? res.data : []);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: number) => {
    const res = await api.approveUser(userId.toString());
    if (res.success) await fetchUsers();
  };

  const handleReject = async (userId: number) => {
    const res = await api.rejectUser(userId.toString());
    if (res.success) await fetchUsers();
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Approve, manage and monitor users." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2">Name</th>
                <th className="py-2">Role</th>
                <th className="py-2">Status</th>
                <th className="py-2">Joined</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {usersData.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="py-3 font-medium">{entry.name}</td>
                  <td className="py-3 text-muted-foreground">{entry.role}</td>
                  <td className="py-3">
                    <StatusPill status={entry.active ? "Active" : "Rejected"} />
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Btn
                        variant="soft"
                        className="px-3 py-1 text-xs"
                        onClick={() => handleApprove(entry.id)}
                      >
                        Approve
                      </Btn>
                      <button
                        onClick={() => handleReject(entry.id)}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-secondary"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);

  const fetchCourses = async () => {
    const res = await api.getCourses();
    if (res.success && res.data) {
      setCourses(
        Array.isArray(res.data)
          ? res.data.filter((course) => course.status?.toUpperCase() === "PENDING")
          : [],
      );
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleApprove = async (courseId: number) => {
    const res = await api.approveCourse(courseId.toString());
    if (res.success) await fetchCourses();
  };

  const handleReject = async (courseId: number) => {
    const reason = window.prompt("Reason for rejection", "Needs revision") || "Needs revision";
    const res = await api.rejectCourse(courseId.toString(), reason);
    if (res.success) await fetchCourses();
  };

  return (
    <>
      <PageHeader title="Course approvals" subtitle="Review courses submitted by faculty." />
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <Card key={course.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-lg font-bold">{course.title}</div>
                <div className="text-xs text-muted-foreground">
                  Submitted by {course.facultyName || "Faculty"}
                </div>
              </div>
              <StatusPill status={course.status || "PENDING"} />
            </div>
            <div className="mt-4 flex gap-2">
              <Btn
                variant="soft"
                className="px-3 py-1 text-xs"
                onClick={() => handleApprove(course.id)}
              >
                Approve
              </Btn>
              <button
                onClick={() => handleReject(course.id)}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-secondary"
              >
                Reject
              </button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function AdminAnnouncements() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [items, setItems] = useState<Announcement[]>([]);

  const fetchAnnouncements = async () => {
    const res = await api.getAnnouncements();
    if (res.success && res.data) {
      setItems(Array.isArray(res.data) ? res.data : []);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleBroadcast = async () => {
    if (!title || !body) return;
    const res = await api.createAnnouncement({ title, body, audience });
    if (res.success) {
      setTitle("");
      setBody("");
      await fetchAnnouncements();
    }
  };

  return (
    <>
      <PageHeader title="Global announcements" subtitle="Send messages to the whole campus." />
      <Card>
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a clear, concise message..."
            rows={5}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="ALL">All</option>
            <option value="STUDENTS">Students</option>
            <option value="FACULTY">Faculty</option>
          </select>
          <div>
            <Btn onClick={handleBroadcast}>
              <Megaphone className="h-4 w-4" /> Broadcast
            </Btn>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">
                {item.audience} · {item.time}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function AdminHome() {
  const [stats, setStats] = useState<{ label: string; value: number | string; delta: string }[]>(
    [],
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, coursesRes, trendRes] = await Promise.all([api.getAdminStats(), api.getCourses(), api.getEnrollmentTrend()]);
      if (statsRes.success && statsRes.data) {
        const data = statsRes.data as AdminStats;
        setStats([
          { label: "Total users", value: data.totalUsers, delta: `${data.activeUsers} active` },
          {
            label: "Active courses",
            value: data.approvedCourses,
            delta: `${data.pendingApprovals} pending`,
          },
          {
            label: "Total assignments",
            value: data.totalAssignments,
            delta: `${data.totalSubmissions} submissions`,
          },
          { label: "System health", value: "98%", delta: "Stable" },
        ]);
      }
      if (coursesRes.success && coursesRes.data) {
        setCourses(
          Array.isArray(coursesRes.data)
            ? coursesRes.data.filter((course) => course.status?.toUpperCase() === "PENDING")
            : [],
        );
      }
      if (trendRes.success && trendRes.data) {
        setTrendData(Array.isArray(trendRes.data) ? trendRes.data : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (courseId: number) => {
    const res = await api.approveCourse(courseId.toString());
    if (res.success) await fetchData();
  };

  const handleReject = async (courseId: number) => {
    const res = await api.rejectCourse(courseId.toString(), "Rejected by admin");
    if (res.success) await fetchData();
  };

  return (
    <>
      <PageHeader title="System overview" subtitle="A real-time pulse of the platform." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className="mt-1 font-display text-3xl font-bold">{stat.value}</div>
            <div className="mt-1 text-xs text-success-foreground">{stat.delta}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-2 font-display text-lg font-bold">Enrollment trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="var(--color-accent)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-accent)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-lg font-bold">Pending approvals</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border border-border bg-secondary/40 p-3"
                >
                  <div className="font-medium">{course.title}</div>
                  <div className="mt-2 flex gap-2">
                    <Btn
                      variant="soft"
                      className="px-3 py-1 text-xs"
                      onClick={() => handleApprove(course.id)}
                    >
                      Approve
                    </Btn>
                    <button
                      onClick={() => handleReject(course.id)}
                      className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-secondary"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function FacultyQuizzes() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [topic, setTopic] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await api.getCourses();
      if (res.success && res.data) {
        setCourses(Array.isArray(res.data) ? res.data : []);
      }
    };
    fetchCourses();
  }, []);

  const handleGenerate = async () => {
    if (!topic || !selectedCourseId) return alert("Select course and topic");
    setLoading(true);
    try {
      const res = await api.generateQuiz(topic);
      if (res.success && res.data) {
        setGeneratedQuiz(res.data);
      } else {
        alert("Generation failed: " + res.error);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedQuiz || !selectedCourseId) return;
    setLoading(true);
    try {
      const res = await api.createQuiz({
        title: generatedQuiz.title,
        description: "AI Generated Assessment",
        courseId: Number(selectedCourseId),
        questions: generatedQuiz.questions,
      });
      if (res.success) {
        alert("Quiz published successfully!");
        setGeneratedQuiz(null);
        setTopic("");
      } else {
        alert("Failed to publish: " + res.error);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Quiz Generator" subtitle="Generate topic-based quizzes using AI." />
      <Card>
        <div className="grid gap-4 max-w-2xl">
          <select 
            value={selectedCourseId} 
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">Select Target Course</option>
            {courses.filter(c => c.status?.toUpperCase() === "APPROVED").map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <div className="flex gap-2">
            <input
              placeholder="Enter Quiz Topic (e.g. React Hooks, Node.js Events)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <Btn onClick={handleGenerate} disabled={loading || !topic || !selectedCourseId}>
              {loading ? "Generating..." : "Generate AI Quiz"}
            </Btn>
          </div>
        </div>
      </Card>
      
      {generatedQuiz && (
        <div className="mt-8 space-y-4 max-w-2xl">
          <h3 className="font-display text-lg font-bold">Preview: {generatedQuiz.title}</h3>
          {(generatedQuiz.questions || []).map((q: any, i: number) => (
            <Card key={i} className="p-4 bg-secondary/20">
              <div className="font-medium mb-2">{i + 1}. {q.question}</div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {q.options.map((opt: string, optIdx: number) => (
                  <li key={optIdx} className={q.correctIndex === optIdx ? "text-success font-medium flex items-center" : "flex items-center"}>
                    {optIdx === q.correctIndex && <CheckCircle2 className="inline h-3 w-3 mr-1"/>}
                    {opt}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          <Btn onClick={handleSave} disabled={loading} className="w-full">
            Publish to Course
          </Btn>
        </div>
      )}
    </>
  );
}

export function DashboardSection({ role, section }: { role: Role; section: string }) {
  const key = `${role}:${section}`;
  switch (key) {
    case "student:home":
      return <StudentHome />;
    case "student:courses":
      return <StudentCourses />;
    case "student:assignments":
      return <StudentAssignments />;
    case "student:quizzes":
      return <StudentQuizzes />;
    case "student:performance":
      return <StudentPerformance />;
    case "student:attendance":
      return <StudentAttendance />;
    case "student:notifications":
      return <NotificationsPage />;
    case "student:profile":
      return <ProfilePage role="student" />;

    case "faculty:home":
      return <FacultyHome />;
    case "faculty:courses":
      return <FacultyCourses />;
    case "faculty:content":
      return <FacultyContent />;
    case "faculty:quizzes":
      return <FacultyQuizzes />;
    case "faculty:assignments":
      return <FacultyAssignments />;
    case "faculty:submissions":
      return <FacultySubmissions />;
    case "faculty:attendance":
      return <FacultyAttendance />;
    case "faculty:announcements":
      return <FacultyAnnouncements />;
    case "faculty:profile":
      return <ProfilePage role="faculty" />;

    case "admin:home":
      return <AdminHome />;
    case "admin:users":
      return <AdminUsers />;
    case "admin:courses":
      return <AdminCourses />;
    case "admin:announcements":
      return <AdminAnnouncements />;
    case "admin:reports":
      return <AdminReports />;

    default:
      // Default to home
      if (role === "faculty") return <FacultyHome />;
      if (role === "admin") return <AdminHome />;
      return <StudentHome />;
  }
}
