import { useState, useEffect } from "react";
import { FileText, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { type Submission, api, API_BASE_URL } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";
import { toast } from "sonner";

export function FacultySubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState<number | null>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [viewedSubmissions, setViewedSubmissions] = useState<Set<number>>(new Set());

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.getSubmissions();
      if (res.success && res.data) {
        setSubmissions(Array.isArray(res.data) ? res.data : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleGrade = async () => {
    if (!gradingId) return;
    if (!viewedSubmissions.has(gradingId)) {
      toast.error("You must view the student's submission file before grading.");
      return;
    }
    if (!marks) {
      toast.error("Please enter marks.");
      return;
    }
    const res = await api.gradeSubmission(String(gradingId), Number(marks), feedback);
    if (res.success) {
      toast.success("Submission graded successfully");
      setGradingId(null);
      setMarks("");
      setFeedback("");
      await fetchSubmissions();
    }
  };

  const markAsViewed = (id: number) => {
    setViewedSubmissions(prev => new Set(prev).add(id));
  };

  const pendingSubmissions = submissions.filter(s => s.status !== "GRADED");
  const gradedSubmissions = submissions
    .filter(s => s.status === "GRADED")
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 6);

  return (
    <>
      <PageHeader title="Submissions" subtitle="Review and grade student work." />
      
      <div className="space-y-8">
        {/* Need to Verify Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warn" /> Need to Verify
            </h3>
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              {pendingSubmissions.length} pending
            </span>
          </div>
          <Card>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Loading submissions...</div>
            ) : pendingSubmissions.length > 0 ? (
              <div className="space-y-4">
                {pendingSubmissions.map((sub) => (
                  <SubmissionItem 
                    key={sub.id} 
                    sub={sub} 
                    gradingId={gradingId} 
                    setGradingId={setGradingId}
                    marks={marks}
                    setMarks={setMarks}
                    feedback={feedback}
                    setFeedback={setFeedback}
                    handleGrade={handleGrade}
                    viewedSubmissions={viewedSubmissions}
                    markAsViewed={markAsViewed}
                  />
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto h-10 w-10 text-success/30 mb-2" />
                <p>All caught up! No pending submissions.</p>
              </div>
            )}
          </Card>
        </section>

        {/* Already Graded Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" /> Already Graded
            </h3>
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              {gradedSubmissions.length} graded
            </span>
          </div>
          <Card>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Loading submissions...</div>
            ) : gradedSubmissions.length > 0 ? (
              <div className="space-y-4">
                {gradedSubmissions.map((sub) => (
                  <SubmissionItem 
                    key={sub.id} 
                    sub={sub} 
                    gradingId={gradingId} 
                    setGradingId={setGradingId}
                    marks={marks}
                    setMarks={setMarks}
                    feedback={feedback}
                    setFeedback={setFeedback}
                    handleGrade={handleGrade}
                    viewedSubmissions={viewedSubmissions}
                    markAsViewed={markAsViewed}
                  />
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">No graded submissions yet.</div>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}

function SubmissionItem({ 
  sub, gradingId, setGradingId, marks, setMarks, feedback, setFeedback, handleGrade, viewedSubmissions, markAsViewed 
}: any) {
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4 transition hover:bg-secondary/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold">{sub.assignmentTitle}</div>
            <div className="text-xs text-muted-foreground">
              Student: {sub.studentName} · Submitted {new Date(sub.submittedAt || "").toLocaleString()}
            </div>
          </div>
        </div>
        <div className="text-right">
          {sub.status === "GRADED" ? (
            <div className="flex items-center gap-1 text-sm font-bold text-success">
              <CheckCircle2 className="h-4 w-4" /> Graded ({sub.marks}/100)
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm font-bold text-warn">
              <AlertCircle className="h-4 w-4" /> Pending
            </div>
          )}
        </div>
      </div>

      {gradingId === sub.id ? (
        <div className="mt-4 grid gap-3 rounded-xl bg-background p-4 shadow-inner">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Marks</label>
              <input
                type="number"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
                placeholder="e.g. 85"
              />
            </div>
            <div className="flex items-end gap-2">
              <Btn onClick={handleGrade} className="w-full">Submit Grade</Btn>
              <Btn variant="ghost" onClick={() => setGradingId(null)}>Cancel</Btn>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
              placeholder="Write constructive feedback..."
              rows={2}
            />
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground italic truncate max-w-[70%]">
            {sub.feedback ? `Feedback: ${sub.feedback}` : "No feedback given yet."}
          </p>
          <div className="flex items-center gap-2">
            <Btn 
              size="sm" 
              variant="soft" 
              disabled={!viewedSubmissions.has(sub.id) && sub.status !== "GRADED"}
              onClick={() => {
                setGradingId(sub.id);
                setMarks(sub.marks >= 0 ? String(sub.marks) : "");
                setFeedback(sub.feedback || "");
              }}
            >
              {sub.status === "GRADED" ? "Update Grade" : viewedSubmissions.has(sub.id) ? "Grade Now" : "View File to Grade"}
            </Btn>
            {sub.filePath && (
              <a 
                href={`${API_BASE_URL.replace("/api", "")}${sub.filePath}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => markAsViewed(sub.id)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold transition hover:bg-secondary"
              >
                <ExternalLink className="h-3 w-3" />
                View File
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
