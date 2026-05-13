import { useState, useEffect } from "react";
import { Loader, Plus } from "lucide-react";
import { type Course, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader, Card, Btn, StatusPill } from "../../shared/UIPrimitives";

export function FacultyCourses() {
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
        const facultyId = Number(user?.userId || user?.id || 0);
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
  }, [user?.id, user?.userId, user?.role]);

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
