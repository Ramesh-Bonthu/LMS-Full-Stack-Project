import { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  X,
  Clock,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Eye
} from "lucide-react";
import { type Course, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

interface QuestionInput {
  question: string;
  options: string[];
  correctIndex: number;
}

interface FacultyQuizzesProps {
  course?: Course | null;
  isAddQuizOpen?: boolean;
  onCloseModal?: () => void;
  onQuizCreated?: () => void;
}

export function FacultyQuizzes({ course, isAddQuizOpen = false, onCloseModal, onQuizCreated }: FacultyQuizzesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(course ? String(course.id) : "");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(course || null);
  const [publishedQuizzes, setPublishedQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Modal toggle & Process selection state
  const [isModalOpen, setIsModalOpen] = useState(isAddQuizOpen);
  const [selectProcess, setSelectProcess] = useState<"AI_GENERATED" | "MANUAL">("AI_GENERATED");

  // AI Quiz Generator state
  const [topic, setTopic] = useState(course?.title || "");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loadingAI, setLoadingAI] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);

  // Manual Quiz Form state (Google Form style)
  const [manualTitle, setManualTitle] = useState(course ? `${course.title} Quiz` : "Course Quiz");
  const [manualDescription, setManualDescription] = useState("Official Course Assessment Quiz");
  const [manualQuestions, setManualQuestions] = useState<QuestionInput[]>([
    {
      question: "",
      options: ["", "", "", ""],
      correctIndex: 0,
    },
  ]);
  const [submittingManual, setSubmittingManual] = useState(false);

  // Selected quiz detail modal state (When quiz card is clicked)
  const [selectedQuizForDetails, setSelectedQuizForDetails] = useState<any | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [showQuizQuestions, setShowQuizQuestions] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (course) {
      setSelectedCourseId(String(course.id));
      setSelectedCourse(course);
      setTopic(course.title);
      setManualTitle(`${course.title} Quiz`);
    }
  }, [course]);

  useEffect(() => {
    setIsModalOpen(isAddQuizOpen);
  }, [isAddQuizOpen]);

  // Fetch Courses list if no course prop passed
  useEffect(() => {
    if (!course) {
      const fetchCourses = async () => {
        const res = await api.getCourses();
        if (res.success && res.data) {
          setCourses(Array.isArray(res.data) ? res.data : []);
        }
      };
      fetchCourses();
    }
  }, [course]);

  // Fetch published quizzes for this course (or all quizzes if no cId)
  const fetchPublishedQuizzes = async (cId?: string) => {
    try {
      setLoadingQuizzes(true);
      const res = await api.getQuizzes();
      if (res.success && res.data) {
        const allQuizzes = Array.isArray(res.data) ? res.data : [];
        if (cId) {
          setPublishedQuizzes(allQuizzes.filter((q: any) => String(q.courseId) === String(cId)));
        } else {
          setPublishedQuizzes(allQuizzes);
        }
      }
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    fetchPublishedQuizzes(selectedCourseId);
  }, [selectedCourseId]);

  const handleSelectCourse = (cId: string) => {
    setSelectedCourseId(cId);
    const found = courses.find((c) => String(c.id) === String(cId));
    if (found) {
      setSelectedCourse(found);
      setTopic(found.title);
      setManualTitle(`${found.title} Quiz`);
    } else {
      setSelectedCourse(null);
      setTopic("");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onCloseModal) onCloseModal();
  };

  // Click handler when faculty clicks on any published quiz card
  const handleSelectQuizForDetails = async (quiz: any) => {
    setSelectedQuizForDetails(quiz);
    setShowQuizQuestions(false);
    setLoadingAttempts(true);

    try {
      const res = await api.getQuizAttempts(quiz.id.toString());
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Group by studentId and keep ONLY the latest attempt per student
        const latestMap = new Map();
        res.data.forEach((att: any) => {
          if (!latestMap.has(att.studentId)) {
            latestMap.set(att.studentId, att);
          }
        });
        setQuizAttempts(Array.from(latestMap.values()));
      } else {
        setQuizAttempts([]);
      }
    } catch (err) {
      console.error("Error fetching attempts:", err);
      setQuizAttempts([]);
    } finally {
      setLoadingAttempts(false);
    }
  };

  // ------------------- AI QUIZ HANDLERS -------------------
  const handleGenerateAI = async () => {
    if (!selectedCourseId) return alert("Please select a target course.");
    setLoadingAI(true);
    try {
      const res = await api.generateQuiz(topic || selectedCourse?.title || "Quiz", numQuestions, selectedCourseId);
      if (res.success && res.data) {
        setGeneratedQuiz(res.data);
      } else {
        alert("AI Generation failed: " + res.error);
      }
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      alert("Error: " + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handlePublishAIQuiz = async () => {
    if (!generatedQuiz || !selectedCourseId) return;
    setLoadingAI(true);
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
        alert("AI Quiz published successfully!");
        setGeneratedQuiz(null);
        handleCloseModal();
        await fetchPublishedQuizzes(selectedCourseId);
        if (onQuizCreated) onQuizCreated();
      } else {
        alert("Failed to publish AI Quiz: " + res.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Publish error: " + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  // ------------------- MANUAL QUIZ HANDLERS (GOOGLE FORM STYLE) -------------------
  const handleAddQuestionCard = () => {
    setManualQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
      },
    ]);
  };

  const handleRemoveQuestionCard = (index: number) => {
    if (manualQuestions.length === 1) {
      alert("At least one question is required.");
      return;
    }
    setManualQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleQuestionTextChange = (index: number, text: string) => {
    setManualQuestions((prev) => {
      const updated = [...prev];
      updated[index].question = text;
      return updated;
    });
  };

  const handleOptionTextChange = (qIndex: number, oIndex: number, text: string) => {
    setManualQuestions((prev) => {
      const updated = [...prev];
      const newOpts = [...updated[qIndex].options];
      newOpts[oIndex] = text;
      updated[qIndex].options = newOpts;
      return updated;
    });
  };

  const handleCorrectIndexChange = (qIndex: number, cIndex: number) => {
    setManualQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].correctIndex = cIndex;
      return updated;
    });
  };

  const handlePublishManualQuiz = async () => {
    if (!selectedCourseId) {
      alert("Please select a target course.");
      return;
    }
    if (!manualTitle.trim()) {
      alert("Please enter a Quiz Title.");
      return;
    }

    for (let i = 0; i < manualQuestions.length; i++) {
      const q = manualQuestions[i];
      if (!q.question.trim()) {
        alert(`Question ${i + 1} text cannot be empty.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          alert(`Option ${j + 1} for Question ${i + 1} cannot be empty.`);
          return;
        }
      }
    }

    setSubmittingManual(true);
    try {
      const res = await api.createQuiz({
        title: manualTitle,
        description: manualDescription || "Manual Course Quiz",
        courseId: Number(selectedCourseId),
        questions: manualQuestions,
        totalMarks: manualQuestions.length * 5,
        timeLimit: 15,
        totalQuestions: manualQuestions.length,
      });

      if (res.success) {
        alert("Manual Quiz published successfully!");
        setManualQuestions([
          {
            question: "",
            options: ["", "", "", ""],
            correctIndex: 0,
          },
        ]);
        handleCloseModal();
        await fetchPublishedQuizzes(selectedCourseId);
        if (onQuizCreated) onQuizCreated();
      } else {
        alert("Failed to publish manual quiz: " + res.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error creating manual quiz: " + err.message);
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {!course && <PageHeader title="Quiz Management" subtitle="Create, generate, and manage course quizzes." />}

      {/* Main Quizzes List Display */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold font-display flex items-center gap-2 text-foreground">
              <FileQuestion className="h-5 w-5 text-primary" /> Published Course Quizzes
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any quiz to view student scores, malpractice status, and questions.
            </p>
          </div>
          <Btn onClick={() => setIsModalOpen(true)} className="text-xs font-bold shadow-glow">
            <Plus className="h-4 w-4" /> Add Quiz
          </Btn>
        </div>

        {/* Quizzes Grid / List */}
        {loadingQuizzes ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : publishedQuizzes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {publishedQuizzes.map((quiz, idx) => (
              <div
                key={quiz.id || idx}
                onClick={() => handleSelectQuizForDetails(quiz)}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary flex items-center gap-1">
                      <FileQuestion className="h-3.5 w-3.5" /> Quiz #{idx + 1}
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
                      Published
                    </span>
                  </div>

                  <h4 className="font-display text-base font-bold text-foreground mb-1 group-hover:text-primary transition">
                    {quiz.title}
                  </h4>
                  {quiz.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{quiz.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-lg">
                      <HelpCircle className="h-3.5 w-3.5 text-primary" />
                      {quiz.questions?.length || quiz.totalQuestions || 0} Questions
                    </span>
                    <span className="flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-lg">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      {quiz.totalMarks || 20} Marks
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-primary group-hover:underline flex items-center gap-0.5">
                    View Results &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <FileQuestion className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h4 className="text-sm font-bold text-foreground mb-1">No quizzes created yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              Click "+ Add Quiz" above to create an AI-generated or manual quiz for your students.
            </p>
            <Btn onClick={() => setIsModalOpen(true)} className="text-xs font-bold">
              <Plus className="h-4 w-4" /> Add Quiz
            </Btn>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* QUIZ DETAILS & STUDENT ATTEMPTS MODAL OVERLAY */}
      {/* ========================================================================= */}
      {selectedQuizForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {selectedCourse ? selectedCourse.code : "COURSE"}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
                    Published Quiz
                  </span>
                </div>
                <h2 className="text-xl font-bold font-display text-foreground">{selectedQuizForDetails.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedQuizForDetails.questions?.length || selectedQuizForDetails.totalQuestions || 0} Questions · {selectedQuizForDetails.totalMarks || 20} Total Marks · {selectedQuizForDetails.timeLimit || 15} Mins
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Btn
                  variant={showQuizQuestions ? "primary" : "soft"}
                  onClick={() => setShowQuizQuestions(!showQuizQuestions)}
                  className="text-xs font-bold px-3.5 py-1.5"
                >
                  <Eye className="h-4 w-4" />
                  {showQuizQuestions ? "Hide Questions" : "Show Questions"}
                </Btn>
                <button
                  onClick={() => setSelectedQuizForDetails(null)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Expansible Quiz Questions List (Show Questions Button Toggle) */}
            {showQuizQuestions && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4 animate-in fade-in duration-150">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" /> Quiz Assignment Questions & Answer Key
                </h3>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {(selectedQuizForDetails.questions || []).map((q: any, qIdx: number) => (
                    <div key={qIdx} className="rounded-xl border border-border bg-card p-3.5 text-xs">
                      <p className="font-bold text-foreground mb-2">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(q.options || []).map((opt: string, oIdx: number) => (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg text-xs font-medium transition ${
                              oIdx === q.correctIndex
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold"
                                : "bg-secondary/40 border border-border text-muted-foreground"
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === q.correctIndex && "✓ (Correct Answer)"}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Attempts & Scores Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Student Quiz Results & Anti-Cheating Logs
                </h3>
                <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                  {quizAttempts.length} Completed Attempts
                </span>
              </div>

              {loadingAttempts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : quizAttempts.length > 0 ? (
                <div className="space-y-3">
                  {quizAttempts.map((attempt) => {
                    const isMalpractice = Boolean(attempt.malpractice || attempt.tabSwitches > 0);
                    return (
                      <div
                        key={attempt.id}
                        className={`rounded-2xl border p-4 transition shadow-sm flex flex-wrap items-center justify-between gap-3 ${
                          isMalpractice
                            ? "border-destructive/40 bg-destructive/5"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-xl">
                            ID: #{attempt.studentId}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                              <span>{attempt.studentName}</span>
                              {isMalpractice ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2.5 py-0.5 text-[10px] font-bold text-destructive">
                                  <AlertTriangle className="h-3 w-3" /> MALPRACTICE DETECTED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                                  <CheckCircle2 className="h-3 w-3" /> Clean Submission
                                </span>
                              )}
                            </div>
                            {attempt.submittedAt && (
                              <div className="text-[11px] text-muted-foreground">
                                Submitted: {attempt.submittedAt}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold text-primary">
                            {attempt.marks} / {selectedQuizForDetails.totalMarks || 20} Marks
                          </div>
                          <div className="text-[11px] font-semibold text-muted-foreground">
                            Score: {attempt.percentage || Math.round((attempt.marks / (selectedQuizForDetails.totalMarks || 20)) * 100)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground font-semibold">
                  No students have attempted this quiz yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* "+ ADD QUIZ" DIALOG BOX / MODAL OVERLAY */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                  <FileQuestion className="h-5 w-5 text-primary" /> Add New Quiz
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create an AI-generated syllabus quiz or build a custom manual quiz.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* 1. DEFAULT COURSE NAME (Read-Only Input Box, No Dropdown Arrow) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Target Course
                </label>
                {selectedCourse ? (
                  <input
                    readOnly
                    value={`${selectedCourse.title} (${selectedCourse.code})`}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm font-semibold text-foreground cursor-not-allowed outline-none"
                  />
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleSelectCourse(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring/40 transition"
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
                )}
              </div>

              {/* 2. SELECT PROCESS DROPDOWN */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Select Process
                </label>
                <select
                  value={selectProcess}
                  onChange={(e) => setSelectProcess(e.target.value as "AI_GENERATED" | "MANUAL")}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring/40 transition"
                >
                  <option value="AI_GENERATED">01. AI Generated Quiz</option>
                  <option value="MANUAL">02. Manual Quiz</option>
                </select>
              </div>

              {/* ---------------- PROCESS 01: AI GENERATED QUIZ ---------------- */}
              {selectProcess === "AI_GENERATED" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> AI Quiz Configuration
                      </span>
                      {selectedCourse?.pdfUrl && (
                        <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" /> PDF Syllabus Context Connected
                        </span>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Topic / Focus Area
                        </label>
                        <input
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g. Memory Management or Topic Title"
                          className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Question Count
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={numQuestions}
                          onChange={(e) => setNumQuestions(Number(e.target.value))}
                          className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                        />
                      </div>
                    </div>

                    <div className="flex justify-center pt-2">
                      <Btn onClick={handleGenerateAI} disabled={loadingAI || !selectedCourseId} className="px-6 py-2.5 text-xs font-bold">
                        <Sparkles className="h-4 w-4 animate-spin-slow" />
                        {loadingAI ? "Analyzing Syllabus & Generating..." : "Generate AI Quiz"}
                      </Btn>
                    </div>
                  </div>

                  {/* AI Generated Preview & Publish */}
                  {generatedQuiz && (
                    <div className="space-y-4 pt-2 border-t border-border animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <div>
                          <h4 className="text-base font-bold font-display text-foreground">{generatedQuiz.title}</h4>
                          <p className="text-xs text-emerald-500 font-semibold">
                            ✓ Questions generated strictly from course content
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {generatedQuiz.questions.map((q: any, idx: number) => (
                          <div key={idx} className="rounded-xl border border-border p-3.5 bg-secondary/20">
                            <p className="font-semibold text-xs mb-2">
                              {idx + 1}. {q.question}
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {q.options.map((opt: string, oIdx: number) => (
                                <div
                                  key={oIdx}
                                  className={`p-2 rounded-lg text-xs font-medium ${
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

                      <div className="flex justify-center pt-3">
                        <Btn onClick={handlePublishAIQuiz} disabled={loadingAI} className="px-8 py-3 text-sm font-semibold rounded-full min-w-[220px] justify-center shadow-glow">
                          {loadingAI ? "Publishing Quiz..." : "Publish AI Quiz to Students"}
                        </Btn>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- PROCESS 02: MANUAL QUIZ (GOOGLE FORM STYLE BUILDER) ---------------- */}
              {selectProcess === "MANUAL" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Quiz Details */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                        Quiz Title
                      </label>
                      <input
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="e.g. Midterm Practice Quiz"
                        className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                        Description
                      </label>
                      <input
                        value={manualDescription}
                        onChange={(e) => setManualDescription(e.target.value)}
                        placeholder="e.g. Chapter 1 & 2 Evaluation"
                        className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                      />
                    </div>
                  </div>

                  {/* Google Form Style Questions List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Questions List ({manualQuestions.length} Total)
                      </h4>
                    </div>

                    {manualQuestions.map((q, qIndex) => (
                      <div key={qIndex} className="rounded-2xl border border-border bg-secondary/15 p-4 space-y-3 relative shadow-sm">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                              {qIndex + 1}
                            </span>
                            Question {qIndex + 1}
                          </span>
                          {manualQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionCard(qIndex)}
                              className="text-muted-foreground hover:text-destructive transition p-1"
                              title="Delete Question"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Question Text Input */}
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Enter Question Text
                          </label>
                          <input
                            value={q.question}
                            onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                            placeholder={`e.g. What is the primary function of ${selectedCourse?.title || "this topic"}?`}
                            className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                          />
                        </div>

                        {/* 4 Options Grid */}
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            4 Multiple-Choice Options
                          </label>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-muted-foreground w-5 text-center">
                                  {String.fromCharCode(65 + oIndex)}.
                                </span>
                                <input
                                  value={opt}
                                  onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                  className={`flex-1 rounded-xl border bg-card px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/40 ${
                                    q.correctIndex === oIndex ? "border-emerald-500 font-semibold" : "border-border"
                                  }`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Correct Option Dropdown Selector */}
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Select Correct Option Answer
                          </label>
                          <select
                            value={q.correctIndex}
                            onChange={(e) => handleCorrectIndexChange(qIndex, Number(e.target.value))}
                            className="w-full sm:w-64 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-ring/40"
                          >
                            <option value={0}>Option A (Correct Answer)</option>
                            <option value={1}>Option B (Correct Answer)</option>
                            <option value={2}>Option C (Correct Answer)</option>
                            <option value={3}>Option D (Correct Answer)</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic + Add Question Button */}
                  <div className="flex justify-center">
                    <Btn
                      type="button"
                      variant="soft"
                      onClick={handleAddQuestionCard}
                      className="rounded-full px-5 py-2 text-xs font-bold border border-primary/20"
                    >
                      <Plus className="h-4 w-4" /> Add Question #{manualQuestions.length + 1}
                    </Btn>
                  </div>

                  {/* Submit Manual Quiz Centered Button */}
                  <div className="flex justify-center pt-3 border-t border-border">
                    <Btn
                      onClick={handlePublishManualQuiz}
                      disabled={submittingManual}
                      className="px-8 py-3 text-sm font-semibold rounded-full min-w-[220px] justify-center shadow-glow"
                    >
                      {submittingManual ? "Publishing Quiz..." : "Submit & Publish Quiz"}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
