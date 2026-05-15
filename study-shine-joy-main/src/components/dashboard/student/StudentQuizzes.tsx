import { useState, useEffect } from "react";
import { Loader, PlayCircle, CheckCircle2 } from "lucide-react";
import { type Quiz, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

export function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const res = await api.getQuizzes();
        if (res.success && res.data) {
          setQuizzes(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [activeQuiz]);

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    try {
      setLoading(true);
      const res = await api.submitQuizAttempt(activeQuiz.id.toString(), answers);
      if (res.success) {
        setResult(res.data);
      } else {
        alert("Failed to submit: " + res.error);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-success" />
        <h2 className="font-display text-2xl font-bold">Quiz Submitted!</h2>
        <p className="mt-2 text-muted-foreground">You scored {result.percentage}% ({result.marks} out of {result.totalMarks || 20} marks)</p>
        <Btn className="mt-8" onClick={() => { setResult(null); setActiveQuiz(null); setAnswers({}); }}>
          Back to Quizzes
        </Btn>
      </div>
    );
  }

  if (activeQuiz) {
    const questions = activeQuiz.questions || [];
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader title={activeQuiz.title} subtitle={`Time Limit: ${activeQuiz.timeLimit || 15} minutes`} />
        {questions.length > 0 ? (
          questions.map((q, qIndex) => (
            <Card key={qIndex} className="p-6">
              <h3 className="text-lg font-medium mb-4">{qIndex + 1}. {q.question}</h3>
              <div className="space-y-3">
                {q.options.map((opt: string, oIndex: number) => (
                  <label key={oIndex} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/40 cursor-pointer transition">
                    <input 
                      type="radio" 
                      name={`question_${qIndex}`} 
                      value={oIndex}
                      checked={answers[qIndex] === oIndex}
                      onChange={() => setAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                      className="h-4 w-4 text-primary"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-muted-foreground">No questions available for this module.</Card>
        )}
        <div className="flex justify-end gap-3 pt-6">
          <Btn variant="ghost" onClick={() => setActiveQuiz(null)}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={loading || questions.length === 0}>
            {loading ? "Submitting..." : "Submit Answers"}
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Quizzes" subtitle="Quick checks to stay sharp." />
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : quizzes.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => (
            <Card key={q.id}>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Course: {q.courseId || "N/A"}
              </div>
              <div className="mt-1 font-display text-lg font-bold">{q.title || "Quiz"}</div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{q.totalQuestions || (q.questions ? q.questions.length : 0)} questions</span>
                <span>·</span>
                <span>{q.timeLimit || 15} min</span>
              </div>
              <Btn className="mt-5 w-full justify-center" onClick={() => setActiveQuiz(q)}>
                <PlayCircle className="h-4 w-4" />
                Start quiz
              </Btn>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No quizzes available yet</p>
        </div>
      )}
    </>
  );
}
