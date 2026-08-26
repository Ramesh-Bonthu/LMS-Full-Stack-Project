import { useState, useEffect } from "react";
import { type Course, api, API_BASE_URL } from "@/lib/api";
import { FileText } from "lucide-react";
import { PageHeader, Card, Btn, StatusPill } from "../../shared/UIPrimitives";

export function AdminCourses() {
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
                <div className="font-display text-lg font-bold">{course.title} ({course.code})</div>
                <div className="text-xs text-muted-foreground">
                  Submitted by {course.facultyName || "Faculty"}
                </div>
              </div>
              <StatusPill status={course.status || "PENDING"} />
            </div>

            {course.pdfUrl && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 p-2.5 text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Course PDF Attached
                </span>
                <a
                  href={`${API_BASE_URL.replace("/api", "")}${course.pdfUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-500 hover:underline"
                >
                  View PDF &rarr;
                </a>
              </div>
            )}

            {course.description && (
              <p className="mt-2 text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-xl border border-border">
                <strong>Description:</strong> {course.description}
              </p>
            )}

            {course.content && (
              <div className="mt-2 text-xs bg-primary/5 p-2.5 rounded-xl border border-primary/20">
                <strong className="text-primary block mb-1">Extracted PDF Syllabus Text:</strong>
                <p className="text-muted-foreground whitespace-pre-line max-h-32 overflow-y-auto">{course.content}</p>
              </div>
            )}
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
        {courses.length === 0 && (
          <div className="md:col-span-2 py-12 text-center text-muted-foreground">
            No courses pending approval at the moment.
          </div>
        )}
      </div>
    </>
  );
}
