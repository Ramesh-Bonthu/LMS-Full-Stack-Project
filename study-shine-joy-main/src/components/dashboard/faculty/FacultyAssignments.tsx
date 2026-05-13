import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { type Assignment, type Course, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";
import { DynamicAssignmentTable } from "../../shared/DisplayCards";

export function FacultyAssignments() {
  const [assignmentsData, setAssignmentsData] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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
    if (!title || !courseId) return;
    const res = await api.createAssignment({
      title,
      description,
      courseId: Number(courseId),
      deadline: deadline || undefined,
      totalMarks: 100,
    });
    if (res.success) {
      setTitle("");
      setDeadline("");
      setDescription("");
      setCourseId("");
      await fetchData();
    }
  };

  const handleAI = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    try {
      const res = await api.generateAssignment(aiTopic);
      if (res.success && res.data) {
        setTitle(res.data.title);
        setDescription(res.data.description);
        setAiTopic("");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <PageHeader title="Assignments" subtitle="Create assignments and track submissions." />
      
      <Card className="mb-4 bg-accent-soft/20 border-accent/20">
        <h3 className="mb-3 font-display text-sm font-bold flex items-center gap-2 text-accent">
          <Sparkles className="h-4 w-4" /> AI Assignment Generator
        </h3>
        <div className="flex gap-2">
          <input
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="Topic (e.g. 'Advanced Java Streams')"
            className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <Btn variant="soft" onClick={handleAI} disabled={isGenerating || !aiTopic}>
            {isGenerating ? "Generating..." : "Generate AI Prompt"}
          </Btn>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
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
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">Select course</option>
            {courses.filter(c => c.status?.toUpperCase() === "APPROVED").map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description / instructions"
            rows={3}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <Btn onClick={handleCreate}>Publish to students</Btn>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="mb-4 font-display text-lg font-bold">Published assignments</h3>
        <DynamicAssignmentTable 
          assignments={[...assignmentsData].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 6)} 
        />
      </Card>
    </>
  );
}
