import { useState, useEffect } from "react";
import { Loader, ArrowLeft, Upload, CheckCircle2, FileText, Download } from "lucide-react";
import { type Assignment, api, API_BASE_URL } from "@/lib/api";
import { PageHeader, Card, Btn, StatusPill } from "../../shared/UIPrimitives";
import { DynamicAssignmentTable } from "../../shared/DisplayCards";

export function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.getAssignments();
      if (res.success && res.data) {
        setAssignments(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const pendingAssignments = assignments.filter(a => a.status === "PENDING");
  const completedAssignments = assignments
    .filter(a => a.status === "SUBMITTED" || a.status === "GRADED")
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 6);

  if (selectedAssignment) {
    return (
      <AssignmentDetailView 
        assignment={selectedAssignment} 
        onBack={() => {
          setSelectedAssignment(null);
          fetchAssignments();
        }} 
      />
    );
  }

  return (
    <>
      <PageHeader title="Assignments" subtitle="Submit your work and track evaluation." />
      
      <div className="space-y-8">
        {/* Pending Assignments Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold flex items-center gap-2 text-warn">
              <Upload className="h-5 w-5" /> Pending Assignments
            </h3>
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              {pendingAssignments.length} to do
            </span>
          </div>
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : pendingAssignments.length > 0 ? (
              <DynamicAssignmentTable 
                assignments={pendingAssignments} 
                onSelect={setSelectedAssignment}
              />
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No pending assignments found. You're all caught up!
              </div>
            )}
          </Card>
        </section>

        {/* Completed Assignments Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" /> Completed Assignments
            </h3>
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              {completedAssignments.length} submitted
            </span>
          </div>
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : completedAssignments.length > 0 ? (
              <DynamicAssignmentTable 
                assignments={completedAssignments} 
                onSelect={setSelectedAssignment}
              />
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No completed assignments found yet.
              </div>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}

function AssignmentDetailView({ assignment, onBack }: { assignment: Assignment; onBack: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a PDF file first.");
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await api.submitAssignment(assignment.id.toString(), formData);
      if (res.success) {
        setSubmissionSuccess(true);
        setTimeout(onBack, 1500);
      } else {
        alert("Submission failed: " + res.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isGraded = assignment.marks !== undefined && assignment.marks >= 0;
  const isSubmitted = assignment.status === "SUBMITTED" || isGraded;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-secondary/40"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="font-display text-2xl font-bold">{assignment.title}</h2>
          <p className="text-sm text-muted-foreground">{assignment.courseName || "Assignment Details"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-bold text-primary">Instructions</h3>
          <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap mb-4">
            {assignment.description || "No instructions provided."}
          </div>

          {/* Question Paper PDF Download Card */}
          {assignment.pdfUrl && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Assignment Question Paper PDF</div>
                  <div className="text-xs text-muted-foreground">Official Questions Document</div>
                </div>
              </div>
              <a
                href={`${API_BASE_URL.replace("/api", "")}${assignment.pdfUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow hover:opacity-90 transition"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </a>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 font-display text-sm font-bold">Details</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground">Deadline</div>
                <div className="font-medium">
                  {assignment.deadline ? new Date(assignment.deadline).toLocaleString() : "No deadline"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Marks</div>
                <div className="font-medium">{assignment.totalMarks || 100} points</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="mt-1">
                  <StatusPill status={assignment.status || "Pending"} />
                </div>
              </div>
            </div>
          </Card>

          {isGraded ? (
            <Card className="border-success/30 bg-success/5">
              <h3 className="mb-2 font-display text-sm font-bold text-success">Grade & Feedback</h3>
              <div className="text-3xl font-bold text-success mb-2">
                {assignment.marks}/{assignment.totalMarks || 100}
              </div>
              <p className="text-sm text-muted-foreground italic">
                "{assignment.feedback || "Good job!"}"
              </p>
            </Card>
          ) : (
            <Card>
              <h3 className="mb-4 font-display text-sm font-bold">Submission</h3>
              {submissionSuccess ? (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="mb-2 rounded-full bg-success/20 p-2 text-success">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-success">Submitted Successfully!</p>
                  <p className="text-xs text-muted-foreground mt-1">Redirecting...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Upload your completed assignment as a PDF file.
                  </p>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="assignment-file"
                    />
                    <label 
                      htmlFor="assignment-file"
                      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                        file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Upload className={`mx-auto h-8 w-8 mb-2 ${file ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-xs font-medium">{file ? file.name : "Click to select PDF file"}</p>
                    </label>
                  </div>
                  <Btn 
                    className="w-full" 
                    onClick={handleSubmit} 
                    disabled={submitting || isSubmitted || !file}
                  >
                    {submitting ? "Submitting..." : isSubmitted ? "Already Submitted" : "Submit Assignment"}
                  </Btn>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
