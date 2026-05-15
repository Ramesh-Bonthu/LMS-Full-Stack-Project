import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { type Course, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

export function FacultyQuizzes() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [selectedCourseId, setSelectedCourseId] = useState("");
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

  const handleGenerate = async () => {
    if (!topic || !selectedCourseId) return alert("Select course and topic");
    setLoading(true);
    try {
      const res = await api.generateQuiz(topic, numQuestions);
      if (res.success && res.data) {
        setGeneratedQuiz(res.data);
      } else {
        alert("Generation failed: " + res.error);
      }
    } catch(err) {
      console.error(err);
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
        description: "AI Generated Assessment",
        courseId: Number(selectedCourseId),
        questions: generatedQuiz.questions,
        totalMarks: 20,
        timeLimit: 15,
        totalQuestions: generatedQuiz.questions.length
      });
      if (res.success) {
        alert("Quiz published successfully!");
        setGeneratedQuiz(null);
        setTopic("");
      } else {
        alert("Failed to publish: " + res.error);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Quiz Generator" subtitle="Generate topic-based quizzes using AI." />
      <Card>
        <div className="grid gap-4 max-w-2xl">
          <select 
            value={selectedCourseId} 
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">Select Target Course</option>
            {courses.filter(c => c.status?.toUpperCase() === "APPROVED").map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <div className="flex gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (e.g. 'React Hooks')"
              className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <input
              type="number"
              min="1"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              placeholder="Count"
              className="w-24 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <Btn onClick={handleGenerate} disabled={loading || !topic}>
              <Sparkles className="h-4 w-4" />
              {loading ? "Generating..." : "Generate Quiz"}
            </Btn>
          </div>
        </div>

        {generatedQuiz && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-xl font-bold">{generatedQuiz.title}</h3>
              <Btn onClick={handleSave} disabled={loading}>Publish Quiz</Btn>
            </div>
            {generatedQuiz.questions.map((q: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-border p-4 bg-secondary/20">
                <p className="font-semibold mb-3">{idx + 1}. {q.question}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt: string, oIdx: number) => (
                    <div key={oIdx} className={`p-2 rounded-lg text-sm ${oIdx === q.correctIndex ? 'bg-success/20 text-success-foreground border border-success/30' : 'bg-card border border-border'}`}>
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
