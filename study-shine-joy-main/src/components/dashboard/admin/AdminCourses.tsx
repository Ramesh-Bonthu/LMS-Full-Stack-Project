import { useState, useEffect } from "react";
import { type Course, api } from "@/lib/api";
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
        {courses.length === 0 && (
          <div className="md:col-span-2 py-12 text-center text-muted-foreground">
            No courses pending approval at the moment.
          </div>
        )}
      </div>
    </>
  );
}
