import { motion } from "framer-motion";
import { Upload, FileText } from "lucide-react";
import { type Course, type Assignment, API_BASE_URL } from "@/lib/api";
import { Card, StatusPill } from "./UIPrimitives";

export function DynamicCourseCard({ course }: { course: Course }) {
  const color = "from-blue-600 via-indigo-600 to-primary";
  const progress = course.progress || 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="overflow-hidden rounded-2xl border border-border bg-gradient-card shadow-sm hover:shadow-md transition"
    >
      <div className={`h-20 bg-gradient-to-br ${color}`} />
      <div className="p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {course.code || "COURSE"}
        </div>
        <div className="mt-0.5 font-semibold leading-snug">{course.name || course.title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {course.facultyName || "Faculty"}
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function DynamicAssignmentTable({ 
  assignments, 
  onSelect 
}: { 
  assignments: Assignment[]; 
  onSelect?: (a: Assignment) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2 font-medium">Title</th>
            <th className="py-2 font-medium">Course</th>
            <th className="py-2 font-medium">Due</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {assignments.length > 0 ? (
            assignments.map((a) => (
              <tr key={a.id} className="border-t border-border transition hover:bg-secondary/40">
                <td className="py-3 font-medium">
                  <div>{a.title}</div>
                  {a.pdfUrl && (
                    <a
                      href={`${API_BASE_URL.replace("/api", "")}${a.pdfUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 hover:underline mt-0.5"
                    >
                      <FileText className="h-3 w-3" /> Question Paper PDF
                    </a>
                  )}
                </td>
                <td className="py-3 text-muted-foreground">
                  {a.courseName || "Course"}
                </td>
                <td className="py-3 text-muted-foreground">
                  {a.deadline ? new Date(a.deadline).toLocaleDateString() : "TBD"}
                </td>
                <td className="py-3">
                  <StatusPill status={a.status || "Pending"} />
                </td>
                <td className="py-3 text-right">
                  <button 
                    onClick={() => onSelect?.(a)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary-soft/70"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {(!a.status || a.status?.toLowerCase() === "pending") ? "Upload" : "View"}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="py-8 text-center text-muted-foreground">
                No assignments yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
