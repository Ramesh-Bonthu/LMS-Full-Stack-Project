import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Loader, CalendarCheck, CheckCircle2, XCircle, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { type AttendanceRecord, api } from "@/lib/api";
import { PageHeader, Card } from "../../shared/UIPrimitives";

export function StudentAttendance() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

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

  const totalConducted = attendanceData.reduce((sum, a: any) => {
    const stored = localStorage.getItem(`attendance_periods_${a.courseId}_${a.date}`);
    const pCond = Number(a.periodsConducted || stored || 1);
    return sum + pCond;
  }, 0);

  const totalAttended = attendanceData.reduce((sum, a: any) => {
    const stored = localStorage.getItem(`attendance_periods_${a.courseId}_${a.date}`);
    const pCond = Number(a.periodsConducted || stored || 1);
    const pAtt =
      typeof a.periodsAttended === "number" && a.periodsAttended > 0
        ? a.periodsAttended
        : a.value > 0
        ? pCond
        : 0;
    return sum + pAtt;
  }, 0);

  const overall = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 0;

  // Group attendance records by Course / Subject
  const courseGroupMap: Record<
    string,
    {
      courseName: string;
      courseId: number | string;
      records: any[];
      totalConducted: number;
      totalAttended: number;
      rate: number;
    }
  > = {};

  attendanceData.forEach((record: any) => {
    const cName = record.courseName || `Course #${record.courseId || "Unknown"}`;
    if (!courseGroupMap[cName]) {
      courseGroupMap[cName] = {
        courseName: cName,
        courseId: record.courseId || 0,
        records: [],
        totalConducted: 0,
        totalAttended: 0,
        rate: 0,
      };
    }

    const storedPeriods = localStorage.getItem(`attendance_periods_${record.courseId}_${record.date}`);
    const pConducted = Number(record.periodsConducted || storedPeriods || 1);
    const pAttended =
      typeof record.periodsAttended === "number" && record.periodsAttended > 0
        ? record.periodsAttended
        : record.value > 0
        ? pConducted
        : 0;

    courseGroupMap[cName].records.push({
      ...record,
      pConducted,
      pAttended,
    });
    courseGroupMap[cName].totalConducted += pConducted;
    courseGroupMap[cName].totalAttended += pAttended;
  });

  // Calculate rate for each course group
  Object.keys(courseGroupMap).forEach((key) => {
    const group = courseGroupMap[key];
    group.rate =
      group.totalConducted > 0 ? Math.round((group.totalAttended / group.totalConducted) * 100) : 0;
    // Sort records descending by date
    group.records.sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  });

  const toggleCourseExpand = (cName: string) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [cName]: !prev[cName],
    }));
  };

  return (
    <>
      <PageHeader title="Attendance Record" subtitle="Track your course attendance and period participation." />
      
      {/* Top Summary Row (Remains Intact) */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overall Attendance Rate</div>
          <div className="mt-2 font-display text-5xl font-bold text-primary">{overall}%</div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
            <span>Attended Classes:</span>
            <span className="font-bold text-foreground">{totalAttended} / {totalConducted} Periods</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {overall >= 75
              ? "Great job! You are well above the 75% minimum attendance requirement."
              : "Warning: Your attendance is below 75%. Please ensure you attend upcoming classes."}
          </p>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h3 className="mb-2 font-display text-lg font-bold">Attendance Score Trend</h3>
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
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} domain={[0, 100]} />
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

      {/* Subject-Wise Expandable Detailed Attendance History */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-display text-lg font-bold flex items-center gap-2 text-foreground">
            <CalendarCheck className="h-5 w-5 text-primary" /> Subject-wise Detailed Attendance History
          </h3>
          <span className="text-xs text-muted-foreground font-semibold">
            {Object.keys(courseGroupMap).length} Subjects Enrolled
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : Object.keys(courseGroupMap).length > 0 ? (
          <div className="space-y-4">
            {Object.keys(courseGroupMap).map((cName) => {
              const group = courseGroupMap[cName];
              const isExpanded = Boolean(expandedCourses[cName]);
              const isGoodRate = group.rate >= 75;

              return (
                <div
                  key={cName}
                  className="rounded-[28px] border border-border/80 bg-card p-1.5 shadow-sm transition hover:border-primary/40 overflow-hidden"
                >
                  {/* Subject Card Header */}
                  <div
                    onClick={() => toggleCourseExpand(cName)}
                    className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer bg-card hover:bg-secondary/30 transition rounded-[24px]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-display text-base font-bold text-foreground">{group.courseName}</h4>
                        <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                          Attended: <span className="font-bold text-foreground">{group.totalAttended} / {group.totalConducted} Periods</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3.5 py-1 text-xs font-bold ${
                          isGoodRate
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}
                      >
                        {group.rate}% Overall Attendance
                      </span>

                      <button className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full hover:bg-primary/20 transition">
                        <span>{isExpanded ? "Hide Breakdown" : "View Date-wise Breakdown"}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Date-Wise Attendance Breakdown Table */}
                  {isExpanded && (
                    <div className="border-t border-border bg-secondary/20 p-5 animate-in fade-in duration-200">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
                              <th className="pb-3 font-semibold">Date</th>
                              <th className="pb-3 font-semibold">Classes / Periods Conducted</th>
                              <th className="pb-3 font-semibold">Status & Participation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.records.map((record: any, idx: number) => {
                              const isPresent = record.value > 0 || record.status?.toUpperCase() === "PRESENT";

                              return (
                                <tr
                                  key={record.id || idx}
                                  className="border-b border-border/50 transition hover:bg-card/60"
                                >
                                  <td className="py-3 font-bold text-foreground">{record.date || record.month}</td>
                                  <td className="py-3 text-muted-foreground font-semibold">
                                    {record.pConducted} Period{record.pConducted > 1 ? "s" : ""}
                                  </td>
                                  <td className="py-3">
                                    {isPresent ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-500">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Present ({record.pAttended}/{record.pConducted} Periods)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-3 py-1 text-xs font-bold text-destructive">
                                        <XCircle className="h-3.5 w-3.5" /> Absent (0/{record.pConducted} Periods)
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-xs text-muted-foreground italic">
            No attendance records logged yet.
          </div>
        )}
      </div>
    </>
  );
}
