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
import { Loader } from "lucide-react";
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

  const overall = attendanceData.length
    ? Math.round(attendanceData.reduce((s, a) => s + a.value, 0) / attendanceData.length)
    : 0;

  return (
    <>
      <PageHeader title="Attendance" subtitle="Stay on top of your class hours." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <div className="text-xs text-muted-foreground">Overall</div>
          <div className="mt-1 font-display text-5xl font-bold text-primary">{overall}%</div>
          <p className="mt-2 text-sm text-muted-foreground">
            You're well above the 75% requirement. Keep showing up.
          </p>
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="mb-2 font-display text-lg font-bold">Monthly trend</h3>
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
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={[60, 100]} />
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
        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">Attendance History</h3>
          {attendanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Course</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData
                    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
                    .map((record, idx) => (
                    <tr key={record.id || idx} className="border-b border-border/50 transition hover:bg-secondary/40">
                      <td className="py-3 font-medium">{record.date || record.month}</td>
                      <td className="py-3 text-muted-foreground">{record.courseName || "Unknown Course"}</td>
                      <td className="py-3">
                        {record.value > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-1 text-xs font-medium text-success">
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-1 text-xs font-medium text-destructive">
                            Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attendance records found.</p>
          )}
        </Card>
      </div>
    </>
  );
}
