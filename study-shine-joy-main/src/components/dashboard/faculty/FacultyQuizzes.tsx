import { useState, useEffect } from "react";
import { Sparkles, BookOpen, FileText } from "lucide-react";
import { type Course, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

export function FacultyQuizzes() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await api.getCourses();
      if (res.success && res.data) {
        setCourses(Array.isArray(res.data) ? res.data : []);
      }
    };
    fetchCourses();
  }, []);

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    const found = courses.find((c) => String(c.id) === String(courseId));
    if (found) {
      setSelectedCourse(found);
      setTopic(found.title);
    } else {
      setSelectedCourse(null);
      setTopic("");
    }
  };

  const handleGenerate = async () => {
    if (!selectedCourseId) return alert("Please select a target course.");
    setLoading(true);
    try {
      const res = await api.generateQuiz(topic || selectedCourse?.title || "Quiz", numQuestions, selectedCourseId);
      if (res.success && res.data) {
        setGeneratedQuiz(res.data);
      } else {
        alert("Generation failed: " + res.error);
      }
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedQuiz || !selectedCourseId) return;
    setLoading(true);
    try {
      const res = await api.createQuiz({
        title: generatedQuiz.title,
        description: "AI Generated Assessment derived strictly from Course Syllabus",
        courseId: Number(selectedCourseId),
        questions: generatedQuiz.questions,
        totalMarks: 20,
        timeLimit: 15,
        totalQuestions: generatedQuiz.questions.length,
      });
      if (res.success) {
        alert("Quiz published to enrolled students successfully!");
        setGeneratedQuiz(null);
        setTopic("");
        setSelectedCourseId("");
        setSelectedCourse(null);
      } else {
        alert("Failed to publish: " + res.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Publish error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Quiz Generator" subtitle="Generate topic & syllabus-based quizzes using AI." />

      <Card>
        <div className="grid gap-4 max-w-2xl">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1 uppercase tracking-wider">
              Select Target Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleSelectCourse(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
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
          </div>

          {selectedCourse && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-primary">
                <BookOpen className="h-4 w-4" /> Syllabus Content Connected
              </span>
              {selectedCourse.pdfUrl ? (
                <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                  <FileText className="h-3.5 w-3.5" /> PDF Syllabus Ready
                </span>
              ) : (
                <span className="italic">Course Description & Overview Ready</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic / Focus Area (e.g. Memory Management)"
              className="flex-1 min-w-[200px] rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <input
              type="number"
              min="1"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              placeholder="Questions Count"
              className="w-28 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <Btn onClick={handleGenerate} disabled={loading || !selectedCourseId}>
              <Sparkles className="h-4 w-4 animate-spin-slow" />
              {loading ? "Analyzing Syllabus..." : "Generate AI Quiz"}
            </Btn>
          </div>
        </div>

        {generatedQuiz && (
          <div className="mt-8 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-bold font-display">{generatedQuiz.title}</h3>
                <p className="text-xs text-emerald-500 font-semibold">
                  ✓ Generated strictly from the course syllabus & uploaded content
                </p>
              </div>
              <Btn onClick={handleSave} disabled={loading}>
                Publish Quiz to Students
              </Btn>
            </div>

            {generatedQuiz.questions.map((q: any, idx: number) => (
              <div key={idx} className="rounded-2xl border border-border p-4 bg-secondary/20 shadow-sm">
                <p className="font-semibold text-sm mb-3">
                  {idx + 1}. {q.question}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt: string, oIdx: number) => (
                    <div
                      key={oIdx}
                      className={`p-2.5 rounded-xl text-xs font-medium transition ${
                        oIdx === q.correctIndex
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold"
                          : "bg-card border border-border text-muted-foreground"
                      }`}
                    >
                      {opt} {oIdx === q.correctIndex && "✓"}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
