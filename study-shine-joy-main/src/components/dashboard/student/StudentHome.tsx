import { useState, useEffect } from "react";
import { Loader, PlayCircle, Clock, Star } from "lucide-react";
import { type Course, type Assignment, type Announcement, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader, Card } from "../../shared/UIPrimitives";
import { DynamicCourseCard, DynamicAssignmentTable } from "../../shared/DisplayCards";

export function StudentHome() {
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
  }, [user?.id]);

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
