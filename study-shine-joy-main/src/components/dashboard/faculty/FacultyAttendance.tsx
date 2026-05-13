import { useState, useEffect } from "react";
import { type Course, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

export function FacultyAttendance() {
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
