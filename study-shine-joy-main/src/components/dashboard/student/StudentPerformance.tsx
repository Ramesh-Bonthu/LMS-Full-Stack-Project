import { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { Loader, TrendingUp } from "lucide-react";
import { type PerformanceRecord, api } from "@/lib/api";
import { PageHeader, Card } from "../../shared/UIPrimitives";

export function StudentPerformance() {
  const [performanceData, setPerformanceData] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const res = await api.getPerformance();
        if (res.success && res.data) {
          setPerformanceData(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error("Error fetching performance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  return (
    <>
      <PageHeader title="Performance" subtitle="Marks and grades across your courses." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Marks by subject</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2.5 py-0.5 text-xs font-medium text-success-foreground">
              <TrendingUp className="h-3 w-3" /> +6% this term
            </span>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="subject" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="marks" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">Grade summary</h3>
          <div className="space-y-3">
            {performanceData.map((p) => (
              <div
                key={p.subject}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3"
              >
                <div className="text-sm font-medium">{p.subject}</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{p.marks}/100</span>
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
                    {p.marks >= 85 ? "A" : p.marks >= 70 ? "B" : "C"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
