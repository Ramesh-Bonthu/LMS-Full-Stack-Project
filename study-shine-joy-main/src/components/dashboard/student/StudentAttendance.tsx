import { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { Loader, CalendarCheck, CheckCircle2, XCircle } from "lucide-react";
import { type AttendanceRecord, api } from "@/lib/api";
import { PageHeader, Card } from "../../shared/UIPrimitives";

export function StudentAttendance() {
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

  const totalConducted = attendanceData.reduce((sum, a: any) => {
    const stored = localStorage.getItem(`attendance_periods_${a.courseId}_${a.date}`);
    const pCond = Number(a.periodsConducted || stored || 1);
    return sum + pCond;
  }, 0);

  const totalAttended = attendanceData.reduce((sum, a: any) => {
    const stored = localStorage.getItem(`attendance_periods_${a.courseId}_${a.date}`);
    const pCond = Number(a.periodsConducted || stored || 1);
    const pAtt = typeof a.periodsAttended === "number" && a.periodsAttended > 0
      ? a.periodsAttended
      : a.value > 0
      ? pCond
      : 0;
    return sum + pAtt;
  }, 0);

  const overall = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 0;

  return (
    <>
      <PageHeader title="Attendance Record" subtitle="Track your course attendance and period participation." />
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

      <div className="mt-5">
        <Card className="p-6">
          <h3 className="mb-4 font-display text-lg font-bold flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" /> Detailed Attendance History
          </h3>
          {attendanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Course Name</th>
                    <th className="pb-3 font-semibold">Classes Conducted</th>
                    <th className="pb-3 font-semibold font-center">Status & Participation</th>
                  </tr>
                </thead>
                <tbody>
                  {[...attendanceData]
                    .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
                    .map((record: any, idx) => {
                      const storedPeriods = localStorage.getItem(`attendance_periods_${record.courseId}_${record.date}`);
                      const pConducted = Number(record.periodsConducted || storedPeriods || 1);
                      const pAttended =
                        typeof record.periodsAttended === "number" && record.periodsAttended > 0
                          ? record.periodsAttended
                          : record.value > 0
                          ? pConducted
                          : 0;
                      const isPresent = record.value > 0 || record.status?.toUpperCase() === "PRESENT";

                      return (
                        <tr key={record.id || idx} className="border-b border-border/50 transition hover:bg-secondary/40">
                          <td className="py-3.5 font-bold text-foreground">{record.date || record.month}</td>
                          <td className="py-3.5 text-foreground font-semibold">{record.courseName || "Course"}</td>
                          <td className="py-3.5 text-muted-foreground font-semibold">
                            {pConducted} Period{pConducted > 1 ? "s" : ""}
                          </td>
                          <td className="py-3.5">
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-500">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Present ({pAttended}/{pConducted} Periods)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-3 py-1 text-xs font-bold text-destructive">
                                <XCircle className="h-3.5 w-3.5" /> Absent (0/{pConducted} Periods)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No attendance records logged yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}
