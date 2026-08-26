import { useState, useEffect } from "react";
import { Loader, PlayCircle, Clock, Star, TrendingUp, Megaphone } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { type Course, type Assignment, type Announcement, type PerformanceRecord, api, formatRelativeTime } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader, Card } from "../../shared/UIPrimitives";
import { DynamicCourseCard, DynamicAssignmentTable } from "../../shared/DisplayCards";

export function StudentHome() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<Assignment[]>([]);
  const [latestAnnouncements, setLatestAnnouncements] = useState<Announcement[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Enrolled Courses
        const coursesRes = await api.getCourses();
        if (coursesRes.success && coursesRes.data) {
          const uId = String(user?.id || "");
          const enrolledCourses = Array.isArray(coursesRes.data)
            ? coursesRes.data.filter((c) => c.enrolledStudentIds && c.enrolledStudentIds.some((id) => String(id) === uId))
            : [];
          setCourses(enrolledCourses);
        }

        // 2. Fetch Assignments
        const assignmentsRes = await api.getAssignments();
        if (assignmentsRes.success && assignmentsRes.data) {
          setStudentAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
        }

        // 3. Fetch Announcements
        const announcementsRes = await api.getAnnouncements();
        if (announcementsRes.success && announcementsRes.data) {
          setLatestAnnouncements(
            Array.isArray(announcementsRes.data) ? announcementsRes.data.slice(0, 4) : []
          );
        }

        // 4. Fetch Performance Marks Data
        const perfRes = await api.getPerformance();
        if (perfRes.success && perfRes.data) {
          setPerformanceData(Array.isArray(perfRes.data) ? perfRes.data : []);
        }
      } catch (error) {
        console.error("Error fetching student dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const enrolledCount = courses.length;
  const pendingCount = studentAssignments.filter(
    (a) => a.status?.toLowerCase() === "pending"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || "User"} 👋`}
        subtitle="Here's what's happening in your learning journey today."
      />

      {/* Stats Row */}
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

      {/* 1. Continue Learning (Single Line Flexbox Slider Row) */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" /> Continue learning
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Resume your enrolled course modules</p>
          </div>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {courses.length} Enrolled Courses
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : courses.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-primary/40 transition">
            {courses.map((c) => (
              <div key={c.id} className="min-w-[290px] max-w-[320px] flex-shrink-0">
                <DynamicCourseCard course={c} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm">No enrolled courses found.</div>
        )}
      </Card>

      {/* 2. Marks by Subject Performance Graph (Left 2 cols) & Announcements (Right 1 col) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Graph: Marks by Subject */}
        <Card className="p-6 lg:col-span-2 shadow-soft">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Marks by subject
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Your academic performance across enrolled subjects</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-500">
              <TrendingUp className="h-3.5 w-3.5" /> +6% this term
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="subject" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="marks" fill="var(--color-primary)" radius={[8, 8, 0, 0]} maxBarSize={55} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No performance records available yet.
              </div>
            )}
          </div>
        </Card>

        {/* Announcements (Beside Graph) */}
        <Card className="p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" /> Announcements
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">Latest Broadcasts</span>
            </div>

            <div className="space-y-3">
              {latestAnnouncements.length > 0 ? (
                latestAnnouncements.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-border bg-secondary/30 p-3.5 transition hover:border-primary/40 hover:bg-secondary/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-bold text-foreground line-clamp-1">{n.title}</div>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{n.body}</p>
                    <div className="mt-2 text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" /> {formatRelativeTime(n.createdAt) || n.time || "Just now"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">No announcements posted yet.</div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Upcoming Deadlines (Below Graph & Announcements Row) */}
      <Card className="p-6 shadow-soft">
        <h3 className="mb-4 font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Upcoming deadlines
        </h3>
        <DynamicAssignmentTable assignments={studentAssignments} />
      </Card>
    </div>
  );
}
