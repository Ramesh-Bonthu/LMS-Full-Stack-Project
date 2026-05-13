import { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { type PerformanceRecord, api } from "@/lib/api";
import { PageHeader, Card } from "../../shared/UIPrimitives";

export function AdminReports() {
  const [performanceData, setPerformanceData] = useState<PerformanceRecord[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const perfRes = await api.getPerformance();
      if (perfRes.success && perfRes.data) {
        setPerformanceData(Array.isArray(perfRes.data) ? perfRes.data : []);
      }
      
      const trendRes = await api.getEnrollmentTrend();
      if (trendRes.success && trendRes.data) {
        setTrendData(Array.isArray(trendRes.data) ? trendRes.data : []);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <PageHeader title="Reports" subtitle="Analytics across courses and performance." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-2 font-display text-lg font-bold">Average performance</h3>
          <div className="h-64">
            {performanceData.length > 0 ? (
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
                <Bar dataKey="marks" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            ) : <div className="text-center text-muted-foreground py-10">No performance data</div>}
          </div>
        </Card>
        <Card>
          <h3 className="mb-2 font-display text-lg font-bold">Enrollment growth</h3>
          <div className="h-64">
            {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="enr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
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
                  dataKey="students"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#enr)"
                />
              </AreaChart>
            </ResponsiveContainer>
            ) : <div className="text-center text-muted-foreground py-10">No trend data</div>}
          </div>
        </Card>
      </div>
    </>
  );
}
