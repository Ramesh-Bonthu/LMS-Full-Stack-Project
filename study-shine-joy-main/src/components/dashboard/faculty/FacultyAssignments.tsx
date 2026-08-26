import { useState, useEffect } from "react";
import { Upload, FileText, Download } from "lucide-react";
import { type Assignment, type Course, api, API_BASE_URL } from "@/lib/api";
import { PageHeader, Card, Btn, StatusPill } from "../../shared/UIPrimitives";
import { DynamicAssignmentTable } from "../../shared/DisplayCards";

export function FacultyAssignments() {
  const [assignmentsData, setAssignmentsData] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [assignmentsRes, coursesRes] = await Promise.all([
      api.getAssignments(),
      api.getCourses(),
    ]);
    if (assignmentsRes.success && assignmentsRes.data) {
      setAssignmentsData(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
    }
    if (coursesRes.success && coursesRes.data) {
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!title || !courseId) {
      alert("Please enter Assignment Title and select a Course.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("courseId", courseId);
      formData.append("description", description);
      if (deadline) formData.append("deadline", deadline);
      formData.append("totalMarks", "100");
      if (pdfFile) {
        formData.append("pdf", pdfFile);
      }

      const res = await api.createAssignment(formData);
      if (res.success) {
        setTitle("");
        setDeadline("");
        setDescription("");
        setCourseId("");
        setPdfFile(null);
        await fetchData();
        alert("Assignment created & published successfully!");
      } else {
        alert("Failed to create assignment: " + res.error);
      }
    } catch (err: any) {
      console.error("Error creating assignment:", err);
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Assignments" subtitle="Create assignments and track student submissions." />

      {/* Assignment Creation Form */}
      <Card className="mb-6">
        <h3 className="text-base font-bold mb-4 font-display">Create New Assignment</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment Title (e.g. Data Structures Problem Set 1)"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 sm:col-span-2"
          >
            <option value="">Select Course</option>
            {courses.filter(c => c.status?.toUpperCase() === "APPROVED").map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.code})
              </option>
            ))}
          </select>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Assignment Description / Instructions"
            rows={3}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 sm:col-span-2"
          />

          {/* PDF Question Paper Upload Field */}
          <div className="sm:col-span-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center transition hover:border-primary/60">
            <input
              type="file"
              accept=".pdf"
              id="assignment-pdf-upload"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="assignment-pdf-upload" className="cursor-pointer flex flex-col items-center justify-center">
              <Upload className="h-6 w-6 text-primary mb-1" />
              <span className="text-sm font-bold text-foreground">
                {pdfFile ? `📄 Question Paper Attached: ${pdfFile.name}` : "Upload Assignment Question Paper (PDF Only)"}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {pdfFile
                  ? `Size: ${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to publish`
                  : "Attach official question paper PDF file for students to download & solve."}
              </span>
            </label>
          </div>

          <div className="sm:col-span-2 mt-2">
            <Btn onClick={handleCreate} disabled={submitting}>
              {submitting ? "Publishing..." : "Publish to students"}
            </Btn>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-display text-lg font-bold">Published Assignments</h3>
        <DynamicAssignmentTable 
          assignments={[...assignmentsData].sort((a, b) => (b.id || 0) - (a.id || 0))} 
        />
      </Card>
    </>
  );
}
