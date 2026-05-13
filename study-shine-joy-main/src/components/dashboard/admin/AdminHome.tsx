import { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { type Course, type AdminStats, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

export function AdminHome() {
  const [stats, setStats] = useState<{ label: string; value: number | string; delta: string }[]>(
    [],
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, coursesRes, trendRes] = await Promise.all([
        api.getAdminStats(), 
        api.getCourses(), 
        api.getEnrollmentTrend()
      ]);
      
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
              {courses.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No courses pending approval
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
