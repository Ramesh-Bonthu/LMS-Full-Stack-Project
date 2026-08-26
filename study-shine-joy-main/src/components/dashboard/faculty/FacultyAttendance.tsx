import { useState, useEffect } from "react";
import { CalendarCheck, Users, CheckCircle2, XCircle, Clock, Plus, Minus, Lock } from "lucide-react";
import { type Course, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

interface FacultyAttendanceProps {
  course?: Course | null;
}

export function FacultyAttendance({ course }: FacultyAttendanceProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(course ? String(course.id) : "");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(course || null);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [periodsConducted, setPeriodsConducted] = useState<number>(1);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<number | string, "PRESENT" | "ABSENT">>({});
  const [saving, setSaving] = useState(false);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState<boolean>(false);

  // Sync course prop
  useEffect(() => {
    if (course) {
      setSelectedCourseId(String(course.id));
      setSelectedCourse(course);
    }
  }, [course]);

  // Fetch Courses list if no course prop passed
  useEffect(() => {
    if (!course) {
      const fetchCourses = async () => {
        const res = await api.getCourses();
        if (res.success && res.data) {
          setCourses(Array.isArray(res.data) ? res.data : []);
        }
      };
      fetchCourses();
    }
  }, [course]);

  // Check if attendance for selectedCourseId and date has already been submitted
  const checkAttendanceForDate = async (cId: string, attDate: string, studentList: any[]) => {
    if (!cId || !attDate) return;
    try {
      const res = await api.getAttendance();
      if (res.success && Array.isArray(res.data)) {
        const recordsForDate = res.data.filter(
          (r: any) => String(r.courseId) === String(cId) && String(r.date) === String(attDate)
        );

        if (recordsForDate.length > 0) {
          setIsAlreadySubmitted(true);
          const firstRec = recordsForDate[0];
          const storedPeriods = localStorage.getItem(`attendance_periods_${cId}_${attDate}`);
          if (storedPeriods) {
            setPeriodsConducted(Number(storedPeriods));
          } else if (firstRec.periodsConducted) {
            setPeriodsConducted(Number(firstRec.periodsConducted));
          }

          const existingMap: Record<number | string, "PRESENT" | "ABSENT"> = {};
          recordsForDate.forEach((r: any) => {
            existingMap[r.studentId] = (r.status || (r.value > 0 ? "PRESENT" : "ABSENT")).toUpperCase() as any;
          });

          // Fill missing with default PRESENT
          studentList.forEach((s: any) => {
            if (!existingMap[s.id]) existingMap[s.id] = "PRESENT";
          });

          setAttendanceMap(existingMap);
        } else {
          setIsAlreadySubmitted(false);
        }
      }
    } catch (err) {
      console.error("Error checking date attendance:", err);
    }
  };

  // Fetch enrolled students whenever course ID changes
  const fetchStudents = async (cId: string) => {
    if (!cId) return;
    try {
      setLoading(true);
      const res = await api.getCourseStudents(cId);
      let studentList: any[] = [];

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        studentList = res.data;
      } else {
        const usersRes = await api.getUsers();
        if (usersRes.success && Array.isArray(usersRes.data)) {
          studentList = usersRes.data.filter((u: any) => u.role?.toUpperCase() === "STUDENT");
        }
      }

      setStudents(studentList);

      // Mark ALL students as PRESENT by default initially
      const initialMap: Record<number | string, "PRESENT" | "ABSENT"> = {};
      studentList.forEach((s: any) => {
        initialMap[s.id] = "PRESENT";
      });
      setAttendanceMap(initialMap);

      // Check if already submitted for date
      await checkAttendanceForDate(cId, date, studentList);
    } catch (err) {
      console.error("Error fetching students for attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchStudents(selectedCourseId);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId && date && students.length > 0) {
      checkAttendanceForDate(selectedCourseId, date, students);
    }
  }, [date]);

  const handleSelectCourse = (cId: string) => {
    setSelectedCourseId(cId);
    const found = courses.find((c) => String(c.id) === String(cId));
    if (found) {
      setSelectedCourse(found);
    } else {
      setSelectedCourse(null);
    }
  };

  const toggleAttendance = (studentId: number | string, status: "PRESENT" | "ABSENT") => {
    if (isAlreadySubmitted) return; // Locked if already submitted
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (isAlreadySubmitted) {
      alert(`Attendance for ${date} has already been submitted.`);
      return;
    }
    if (!selectedCourseId || !date) {
      alert("Please ensure course and date are selected.");
      return;
    }

    setSaving(true);
    try {
      for (const student of students) {
        const status = attendanceMap[student.id] || "PRESENT";
        const value = status === "PRESENT" ? 100 : 0;

        await api.markAttendance({
          studentId: Number(student.id),
          courseId: Number(selectedCourseId),
          date: date,
          status: status,
          periodsConducted: periodsConducted,
          value: value,
        });
      }
      localStorage.setItem(`attendance_periods_${selectedCourseId}_${date}`, String(periodsConducted));
      setIsAlreadySubmitted(true);
      alert(`Attendance saved & submitted successfully for ${date} (${periodsConducted} period(s))!`);
    } catch (err: any) {
      console.error("Error saving attendance:", err);
      alert("Error saving attendance: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === "PRESENT").length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === "ABSENT").length;

  return (
    <div className="space-y-6">
      {!course && <PageHeader title="Mark Attendance" subtitle="Track and record student presence for your courses." />}

      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold font-display flex items-center gap-2 text-foreground">
              <CalendarCheck className="h-5 w-5 text-primary" /> Mark Course Attendance
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              All enrolled students are marked PRESENT by default. Toggle absent students before submitting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {presentCount} Present
            </span>
            <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" /> {absentCount} Absent
            </span>
          </div>
        </div>

        {/* Already Submitted Status Banner */}
        {isAlreadySubmitted && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 mb-6 flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <Lock className="h-5 w-5 shrink-0" />
            <div>
              <div className="text-sm font-bold">Attendance Already Submitted & Locked</div>
              <div className="text-xs opacity-90">
                Attendance for {date} ({periodsConducted} period{periodsConducted > 1 ? "s" : ""}) has already been recorded in the database. Select a different date to record new attendance.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Controls: Target Course, Date, and Classes/Periods Conducted Today Counter */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Target Course
              </label>
              {selectedCourse ? (
                <input
                  readOnly
                  value={`${selectedCourse.title} (${selectedCourse.code})`}
                  className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm font-semibold text-foreground cursor-not-allowed outline-none"
                />
              ) : (
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleSelectCourse(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring/40 transition"
                >
                  <option value="">Select Target Course</option>
                  {courses
                    .filter((c) => c.status?.toUpperCase() === "APPROVED")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.code})
                      </option>
                    ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Attendance Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/40 transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Classes / Periods Taken Today
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5">
                <button
                  type="button"
                  disabled={isAlreadySubmitted}
                  onClick={() => setPeriodsConducted((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 rounded-lg bg-secondary text-foreground font-bold hover:bg-primary/20 transition flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex-1 text-center font-bold text-sm text-primary whitespace-nowrap">
                  {periodsConducted} Period{periodsConducted > 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  disabled={isAlreadySubmitted}
                  onClick={() => setPeriodsConducted((p) => Math.min(10, p + 1))}
                  className="h-8 w-8 rounded-lg bg-secondary text-foreground font-bold hover:bg-primary/20 transition flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Enrolled Students Attendance Marking List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Enrolled Students List ({students.length} Total)
                </h4>
                <span className="text-[11px] text-muted-foreground italic">
                  {isAlreadySubmitted ? "Attendance Locked for this Date" : `Marking for ${periodsConducted} period(s) on ${date}`}
                </span>
              </div>

              {students.map((st) => {
                const status = attendanceMap[st.id] || "PRESENT";
                const isPresent = status === "PRESENT";
                return (
                  <div
                    key={st.id}
                    className={`rounded-2xl border p-4 transition shadow-sm flex flex-wrap items-center justify-between gap-3 ${
                      isPresent
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-destructive/30 bg-destructive/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-xl">
                        ID: #{st.id}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span>{st.name}</span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              isPresent
                                ? "bg-emerald-500/20 text-emerald-500"
                                : "bg-destructive/20 text-destructive"
                            }`}
                          >
                            {isPresent ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {isPresent ? `PRESENT (${periodsConducted}/${periodsConducted} Periods)` : `ABSENT (0/${periodsConducted} Periods)`}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{st.email || `student${st.id}@lms.edu`}</div>
                      </div>
                    </div>

                    {/* Toggle Buttons: Present / Absent */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isAlreadySubmitted}
                        onClick={() => toggleAttendance(st.id, "PRESENT")}
                        className={`inline-flex items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          isPresent
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-secondary text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-500"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Present
                      </button>

                      <button
                        type="button"
                        disabled={isAlreadySubmitted}
                        onClick={() => toggleAttendance(st.id, "ABSENT")}
                        className={`inline-flex items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          !isPresent
                            ? "bg-destructive text-white shadow-sm"
                            : "bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Absent
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Centered Save Attendance Button */}
              <div className="flex justify-center pt-4 border-t border-border">
                {isAlreadySubmitted ? (
                  <button
                    disabled
                    className="px-8 py-3 text-sm font-semibold rounded-full min-w-[280px] justify-center bg-secondary text-muted-foreground opacity-60 cursor-not-allowed border border-border flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" /> Attendance Already Submitted for {date}
                  </button>
                ) : (
                  <Btn
                    onClick={handleSaveAttendance}
                    disabled={saving}
                    className="px-8 py-3 text-sm font-semibold rounded-full min-w-[220px] justify-center shadow-glow"
                  >
                    {saving ? "Saving Attendance..." : "Submit & Save Attendance"}
                  </Btn>
                )}
              </div>
            </div>
          ) : selectedCourseId ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground font-semibold">
              No enrolled students found for this course.
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground font-semibold">
              Please select a course to mark attendance.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
