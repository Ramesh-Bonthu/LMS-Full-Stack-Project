import { motion } from "framer-motion";
import { Upload, FileText } from "lucide-react";
import { type Course, type Assignment, API_BASE_URL } from "@/lib/api";
import { Card, StatusPill } from "./UIPrimitives";

export function DynamicCourseCard({ course }: { course: Course }) {
  const color = "from-blue-600 via-indigo-600 to-primary";
  const rawProg = Number(course.progress) || 0;
  const progress = Math.min(100, Math.max(0, Math.round(rawProg > 100 ? 100 : rawProg)));

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition"
    >
      <div>
        <div className={`h-20 bg-gradient-to-br ${color}`} />
        <div className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {course.code || "COURSE"}
          </div>
          <div className="mt-1 font-bold leading-snug line-clamp-2 min-h-[2.5rem] flex items-center text-foreground">
            {course.name || course.title}
          </div>
          <div className="mt-1 text-xs text-muted-foreground font-medium">
            {course.facultyName || "Faculty User"}
          </div>
        </div>
      </div>
      <div className="p-4 pt-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Progress</span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
            style={{ width: `${progress}%` }}
          />
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
