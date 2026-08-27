import { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Upload,
  FileText,
  Download,
  X,
  Calendar,
  Award,
  Users,
  CheckCircle2,
  Eye,
  AlertCircle,
  Clock,
  Edit3
} from "lucide-react";
import { type Assignment, type Course, api, API_BASE_URL } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

interface FacultyAssignmentsProps {
  course?: Course | null;
  isAddAssignmentOpen?: boolean;
  onCloseModal?: () => void;
  onAssignmentCreated?: () => void;
}

export function FacultyAssignments({
  course,
  isAddAssignmentOpen = false,
  onCloseModal,
  onAssignmentCreated,
}: FacultyAssignmentsProps) {
  const [assignmentsData, setAssignmentsData] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(course ? String(course.id) : "");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(course || null);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Modal toggle state
  const [isModalOpen, setIsModalOpen] = useState(isAddAssignmentOpen);

  // Form states for Add Assignment
  const [title, setTitle] = useState(course ? `${course.title} Assignment 1` : "");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Selected assignment detail modal state (When assignment card is clicked)
  const [selectedAssignmentForDetails, setSelectedAssignmentForDetails] = useState<any | null>(null);
  const [enrolledStudentRows, setEnrolledStudentRows] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Viewed file tracking per student (View File must be clicked before Grade & Correction is enabled)
  const [viewedFiles, setViewedFiles] = useState<Record<string | number, boolean>>({});

  // Grading Dialog Box state
  const [gradingTargetStudent, setGradingTargetStudent] = useState<any | null>(null);
  const [gradingMarks, setGradingMarks] = useState<number>(100);
  const [gradingFeedback, setGradingFeedback] = useState<string>("");
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (course) {
      setSelectedCourseId(String(course.id));
      setSelectedCourse(course);
      setTitle(`${course.title} Assignment 1`);
    }
  }, [course]);

  useEffect(() => {
    setIsModalOpen(isAddAssignmentOpen);
  }, [isAddAssignmentOpen]);

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

  // Fetch published assignments for this course (or all if cId is empty)
  const fetchPublishedAssignments = async (cId?: string) => {
    try {
      setLoadingAssignments(true);
      const res = await api.getAssignments();
      if (res.success && res.data) {
        const all = Array.isArray(res.data) ? res.data : [];
        if (cId) {
          setAssignmentsData(all.filter((a: any) => String(a.courseId) === String(cId)));
        } else {
          setAssignmentsData(all);
        }
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchPublishedAssignments(selectedCourseId);
  }, [selectedCourseId]);

  const handleSelectCourse = (cId: string) => {
    setSelectedCourseId(cId);
    const found = courses.find((c) => String(c.id) === String(cId));
    if (found) {
      setSelectedCourse(found);
      setTitle(`${found.title} Assignment 1`);
    } else {
      setSelectedCourse(null);
      setTitle("");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onCloseModal) onCloseModal();
  };

  // Click handler when faculty clicks on any published assignment card
  const handleSelectAssignmentForDetails = async (assignment: any) => {
    setSelectedAssignmentForDetails(assignment);
    setShowInstructions(false);
    setGradingTargetStudent(null);
    setViewedFiles({});
    setLoadingSubmissions(true);

    try {
      const [subsRes, usersRes] = await Promise.all([
        api.getSubmissions(assignment.id.toString()),
        api.getUsers(),
      ]);

      const submissionsData = subsRes.success && Array.isArray(subsRes.data) ? subsRes.data : [];
      const allUsers = usersRes.success && Array.isArray(usersRes.data) ? usersRes.data : [];

      const studentUsers = allUsers.filter((u: any) => u.role?.toUpperCase() === "STUDENT");

      // Map latest submission per studentId
      const submissionMap = new Map();
      submissionsData.forEach((sub: any) => {
        const sKey = String(sub.studentId);
        if (!submissionMap.has(sKey)) {
          submissionMap.set(sKey, sub);
        }
      });

      const submittedStudentIds = new Set(Array.from(submissionMap.keys()));

      // Target course object
      const targetCourseObj = selectedCourse || course;
      const enrolledIds = targetCourseObj?.enrolledStudentIds || [];

      // Determine target students: include any student who submitted OR is enrolled
      let targetStudents = studentUsers.filter((u: any) => {
        const isSubmitted = submittedStudentIds.has(String(u.id));
        const isEnrolled = Array.isArray(enrolledIds) && enrolledIds.length > 0
          ? enrolledIds.some((eid: any) => String(eid) === String(u.id))
          : true;
        return isSubmitted || isEnrolled;
      });

      // Ensure any student who submitted but was not in studentUsers is also included
      submissionMap.forEach((sub, stId) => {
        if (!targetStudents.some((u: any) => String(u.id) === String(stId))) {
          targetStudents.push({
            id: sub.studentId,
            name: sub.studentName || `Student #${sub.studentId}`,
            email: `student${sub.studentId}@lms.edu`
          });
        }
      });

      if (targetStudents.length === 0) {
        targetStudents = studentUsers;
      }

      // Build comprehensive list for ALL enrolled & submitted students
      const rows = targetStudents.map((st: any) => {
        const sKey = String(st.id);
        const sub = submissionMap.get(sKey);
        const hasSubmitted = Boolean(sub && sub.filePath);
        const isGraded = sub && (sub.status?.toUpperCase() === "GRADED" || (typeof sub.marks === "number" && sub.marks >= 0));

        return {
          studentId: st.id,
          studentName: st.name,
          studentEmail: st.email,
          submitted: hasSubmitted,
          status: isGraded ? "GRADED" : hasSubmitted ? "SUBMITTED" : "NOT SUBMITTED",
          marks: isGraded ? sub.marks : undefined,
          filePath: sub?.filePath || undefined,
          submissionId: sub?.id || undefined,
          submittedAt: sub?.submittedAt ? new Date(sub.submittedAt).toLocaleString() : undefined,
          feedback: sub?.feedback || "",
        };
      });

      setEnrolledStudentRows(rows);
    } catch (err) {
      console.error("Error fetching submissions or students:", err);
      setEnrolledStudentRows([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Open submitted PDF and mark file as viewed for that student
  const handleOpenSubmittedFile = (studentRow: any) => {
    if (!studentRow.filePath) return;
    const url = `${API_BASE_URL.replace("/api", "")}${studentRow.filePath}`;
    window.open(url, "_blank");
    setViewedFiles((prev) => ({ ...prev, [studentRow.studentId]: true }));
  };

  // Open Grading Dialog Box
  const handleOpenGradingDialog = (studentRow: any) => {
    setGradingTargetStudent(studentRow);
    setGradingMarks(studentRow.marks >= 0 ? studentRow.marks : 100);
    setGradingFeedback(studentRow.feedback || "");
  };

  // Save Grade & Correction
  const handleSaveGrade = async () => {
    if (!gradingTargetStudent || !gradingTargetStudent.submissionId) {
      alert("No active submission ID found for grading.");
      return;
    }

    setSubmittingGrade(true);
    try {
      const res = await api.gradeSubmission(
        gradingTargetStudent.submissionId.toString(),
        gradingMarks,
        gradingFeedback
      );

      if (res.success) {
        alert("Grade & Correction feedback submitted successfully!");
        // Update row state
        setEnrolledStudentRows((prev) =>
          prev.map((r) =>
            r.studentId === gradingTargetStudent.studentId
              ? { ...r, status: "GRADED", marks: gradingMarks, feedback: gradingFeedback }
              : r
          )
        );
        setGradingTargetStudent(null);
      } else {
        alert("Failed to save grade: " + (res.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Error grading submission:", err);
      alert("Error grading submission: " + err.message);
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Handle Publish Assignment
  const handlePublishAssignment = async () => {
    if (!selectedCourseId) {
      alert("Please select a target course.");
      return;
    }
    if (!title.trim()) {
      alert("Please enter Assignment Title.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("courseId", selectedCourseId);
      formData.append("description", description || "Official Course Assignment");
      if (deadline) formData.append("deadline", deadline);
      formData.append("totalMarks", "100");
      if (pdfFile) {
        formData.append("pdf", pdfFile);
      }

      const res = await api.createAssignment(formData);
      if (res.success) {
        alert("Assignment published successfully!");
        setTitle("");
        setDeadline("");
        setDescription("");
        setPdfFile(null);
        handleCloseModal();
        await fetchPublishedAssignments(selectedCourseId);
        if (onAssignmentCreated) onAssignmentCreated();
      } else {
        alert("Failed to publish assignment: " + res.error);
      }
    } catch (err: any) {
      console.error("Error creating assignment:", err);
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!course && <PageHeader title="Assignments & Correction" subtitle="Manage assignments, inspect student solutions, and grade submissions." />}

      {/* Main Assignments List Display */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold font-display flex items-center gap-2 text-foreground">
              <ClipboardList className="h-5 w-5 text-primary" /> Published Course Assignments
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any assignment card to view all enrolled students, inspect files, and evaluate grades.
            </p>
          </div>
          <Btn onClick={() => setIsModalOpen(true)} className="text-xs font-bold shadow-glow">
            <Plus className="h-4 w-4" /> Add Assignment
          </Btn>
        </div>

        {/* Assignments Grid / List */}
        {loadingAssignments ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : assignmentsData.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {assignmentsData.map((assign, idx) => (
              <div
                key={assign.id || idx}
                onClick={() => handleSelectAssignmentForDetails(assign)}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5" /> Assignment #{idx + 1}
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
                      Published
                    </span>
                  </div>

                  <h4 className="font-display text-base font-bold text-foreground mb-1 group-hover:text-primary transition">
                    {assign.title}
                  </h4>
                  {assign.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{assign.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-lg">
                      <Calendar className="h-3.5 w-3.5 text-amber-500" />
                      Due: {assign.deadline ? new Date(assign.deadline).toLocaleDateString() : "No Deadline"}
                    </span>
                    <span className="flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-lg">
                      <Award className="h-3.5 w-3.5 text-primary" />
                      {assign.totalMarks || 100} Marks
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-primary group-hover:underline flex items-center gap-0.5">
                    View Submissions & Correction &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h4 className="text-sm font-bold text-foreground mb-1">No assignments created yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              Click "+ Add Assignment" above to create and publish a new assignment for your students.
            </p>
            <Btn onClick={() => setIsModalOpen(true)} className="text-xs font-bold">
              <Plus className="h-4 w-4" /> Add Assignment
            </Btn>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* ASSIGNMENT DETAILS & ALL ENROLLED STUDENT SUBMISSIONS MODAL OVERLAY */}
      {/* ========================================================================= */}
      {selectedAssignmentForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {selectedCourse ? selectedCourse.code : "COURSE"}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
                    Published Assignment
                  </span>
                </div>
                <h2 className="text-xl font-bold font-display text-foreground">{selectedAssignmentForDetails.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Due Date: {selectedAssignmentForDetails.deadline ? new Date(selectedAssignmentForDetails.deadline).toLocaleDateString() : "N/A"} · {selectedAssignmentForDetails.totalMarks || 100} Total Marks
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Btn
                  variant={showInstructions ? "primary" : "soft"}
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-xs font-bold px-3.5 py-1.5"
                >
                  <Eye className="h-4 w-4" />
                  {showInstructions ? "Hide Question Paper" : "Show Question Paper"}
                </Btn>
                <button
                  onClick={() => setSelectedAssignmentForDetails(null)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Question Paper & Instructions Expandable Panel */}
            {showInstructions && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3 animate-in fade-in duration-150">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Assignment Instructions & Question Paper
                </h3>
                {selectedAssignmentForDetails.description && (
                  <p className="text-xs text-foreground leading-relaxed bg-card p-3 rounded-xl border border-border">
                    {selectedAssignmentForDetails.description}
                  </p>
                )}
                {selectedAssignmentForDetails.pdfUrl ? (
                  <a
                    href={`${API_BASE_URL.replace("/api", "")}${selectedAssignmentForDetails.pdfUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:opacity-90 transition"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Official Question Paper PDF
                  </a>
                ) : (
                  <div className="text-xs text-muted-foreground italic">No PDF file attached to this assignment.</div>
                )}
              </div>
            )}

            {/* All Enrolled Students & Submissions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Enrolled Students Submissions & Correction
                </h3>
                <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                  {enrolledStudentRows.length} Enrolled Students
                </span>
              </div>

              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : enrolledStudentRows.length > 0 ? (
                <div className="space-y-3">
                  {enrolledStudentRows.map((stRow) => {
                    const isSubmitted = stRow.submitted;
                    const isGraded = stRow.status === "GRADED";
                    const isFileViewed = viewedFiles[stRow.studentId] === true;

                    return (
                      <div
                        key={stRow.studentId}
                        className={`rounded-2xl border p-4 transition shadow-sm flex flex-wrap items-center justify-between gap-3 ${
                          isGraded
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : isSubmitted
                            ? "border-amber-500/40 bg-amber-500/5"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-xl">
                            ID: #{stRow.studentId}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                              <span>{stRow.studentName}</span>
                              {isGraded ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                                  <CheckCircle2 className="h-3 w-3" /> GRADED ({stRow.marks} / {selectedAssignmentForDetails.totalMarks || 100} Marks)
                                </span>
                              ) : isSubmitted ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                  <FileText className="h-3 w-3" /> SUBMITTED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                                  <Clock className="h-3 w-3" /> NOT SUBMITTED
                                </span>
                              )}
                            </div>
                            {stRow.submittedAt ? (
                              <div className="text-[11px] text-muted-foreground">
                                Submitted: {stRow.submittedAt}
                              </div>
                            ) : (
                              <div className="text-[11px] text-muted-foreground italic">
                                Pending student submission
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2 Buttons Workflow: View File -> Grade & Correction */}
                        <div className="flex items-center gap-2">
                          {/* Button 1: View Submitted File */}
                          {isSubmitted ? (
                            <button
                              onClick={() => handleOpenSubmittedFile(stRow)}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition ${
                                isFileViewed
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                              }`}
                            >
                              <Download className="h-3.5 w-3.5" />
                              {isFileViewed ? "File Viewed ✓" : "View Submitted File"}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-muted-foreground opacity-50 cursor-not-allowed border border-border"
                            >
                              <Download className="h-3.5 w-3.5" /> View File
                            </button>
                          )}

                          {/* Button 2: Grade & Correction (Always enabled if already graded or if file viewed) */}
                          {isSubmitted ? (
                            <Btn
                              onClick={() => handleOpenGradingDialog(stRow)}
                              disabled={!isFileViewed && !isGraded}
                              className={`text-xs font-bold px-4 py-2 ${
                                isFileViewed || isGraded
                                  ? "shadow-glow"
                                  : "opacity-40 cursor-not-allowed bg-secondary text-muted-foreground"
                              }`}
                              title={isFileViewed || isGraded ? "Click to edit grade & provide feedback" : "Please click 'View Submitted File' first to inspect student work"}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              {isGraded ? "Edit Grade" : "Grade & Correction"}
                            </Btn>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground font-semibold">
                  No enrolled students found for this course.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GRADING & CORRECTION DIALOG BOX OVERLAY */}
      {/* ========================================================================= */}
      {gradingTargetStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground font-display flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-primary" /> Grade & Correction
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Evaluating {gradingTargetStudent.studentName} (ID: #{gradingTargetStudent.studentId})
                </p>
              </div>
              <button
                onClick={() => setGradingTargetStudent(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Award Marks (Out of {selectedAssignmentForDetails?.totalMarks || 100})
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedAssignmentForDetails?.totalMarks || 100}
                  value={gradingMarks}
                  onChange={(e) => setGradingMarks(e.target.value === "" ? 0 : Number(e.target.value))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-bold outline-none transition ${
                    gradingMarks > 100 || gradingMarks < 0
                      ? "border-destructive text-destructive bg-destructive/10 focus:ring-2 focus:ring-destructive/40"
                      : "border-border bg-card text-primary focus:ring-2 focus:ring-ring/40"
                  }`}
                />
                {(gradingMarks > 100 || gradingMarks < 0) && (
                  <p className="text-xs font-bold text-destructive flex items-center gap-1.5 mt-1.5 animate-in fade-in">
                    <AlertCircle className="h-4 w-4" /> Marks must be 100 or less (0 - 100 Marks only)
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Faculty Correction Feedback / Comments
                </label>
                <textarea
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="Provide correction feedback, suggestions, or grading notes for the student..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Btn variant="soft" onClick={() => setGradingTargetStudent(null)} className="text-xs">
                  Cancel
                </Btn>
                <Btn
                  onClick={handleSaveGrade}
                  disabled={submittingGrade || gradingMarks > 100 || gradingMarks < 0}
                  className="text-xs font-bold shadow-glow"
                >
                  {submittingGrade ? "Saving Grade..." : "Submit Grade & Correction"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* "+ ADD ASSIGNMENT" DIALOG BOX / MODAL OVERLAY */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" /> Add New Assignment
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create and publish a new assignment for your enrolled students.
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
              {/* Target Course (Read-Only Input Box, No Dropdown Arrow) */}
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

              {/* Assignment Title & Due Date */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Assignment Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Data Structures Problem Set 1"
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Due Date / Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                  />
                </div>
              </div>

              {/* Description / Instructions */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Assignment Description / Instructions
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed instructions, requirements, or problem guidelines..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                />
              </div>

              {/* PDF Question Paper Upload Box */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Question Paper (PDF Only)
                </label>
                <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center transition hover:border-primary/60">
                  <input
                    type="file"
                    accept=".pdf"
                    id="modal-assignment-pdf-upload"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="modal-assignment-pdf-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <Upload className="h-6 w-6 text-primary mb-1.5" />
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
              </div>

              {/* Centered Submit Button */}
              <div className="flex justify-center pt-3 border-t border-border">
                <Btn
                  onClick={handlePublishAssignment}
                  disabled={submitting}
                  className="px-8 py-3 text-sm font-semibold rounded-full min-w-[220px] justify-center shadow-glow"
                >
                  {submitting ? "Publishing Assignment..." : "Publish to students"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
