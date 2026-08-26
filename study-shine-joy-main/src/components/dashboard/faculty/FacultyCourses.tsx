import { useState, useEffect } from "react";
import {
  Loader,
  BookOpen,
  X,
  FileText,
  Upload,
  Download,
  PlayCircle,
  Youtube,
  Plus,
  ArrowLeft,
  Users,
  FileCheck,
  ClipboardList,
  FileQuestion,
  CalendarCheck,
  Megaphone,
  BarChart3,
  Layers,
  CloudUpload
} from "lucide-react";
import { type Course, api, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader, Card, Btn, StatusPill } from "../../shared/UIPrimitives";

// Sub-module components for tabbed course workspace
import { FacultyQuizzes } from "./FacultyQuizzes";
import { FacultyAssignments } from "./FacultyAssignments";
import { FacultySubmissions } from "./FacultySubmissions";
import { FacultyAttendance } from "./FacultyAttendance";
import { FacultyAnnouncements } from "./FacultyAnnouncements";

type ContentType = "UPLOAD_VIDEO" | "YOUTUBE_URL" | "PDF_NOTES";
type CourseTab = "modules" | "quizzes" | "assignments" | "submissions" | "attendance" | "announcements" | "analytics";

export function FacultyCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal dialog states
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);

  // New Course form states
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submittingCourse, setSubmittingCourse] = useState(false);

  // Selected course workspace state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<CourseTab>("modules");
  const [courseContents, setCourseContents] = useState<any[]>([]);
  const [contentsLoading, setContentsLoading] = useState(false);

  // Upload Content form states inside course
  const [contentType, setContentType] = useState<ContentType>("UPLOAD_VIDEO");
  const [contentName, setContentName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [uploadingContent, setUploadingContent] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getCourses();
      if (res.success && res.data) {
        const facultyId = Number(user?.userId || user?.id || 0);
        setCourses(
          Array.isArray(res.data)
            ? res.data.filter(
                (course) =>
                  (course.facultyId === facultyId || user?.role === "admin") &&
                  course.status?.toUpperCase() !== "REJECTED"
              )
            : []
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user?.id, user?.userId, user?.role]);

  // Fetch content files for the selected course
  const fetchCourseContents = async (courseId: number) => {
    try {
      setContentsLoading(true);
      const res = await api.getCourseContent(courseId.toString());
      if (res.success && res.data) {
        setCourseContents(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error("Error fetching course contents:", err);
    } fontally {
      setContentsLoading(false);
    }
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setActiveTab("modules");
    setIsAddContentOpen(false);
    fetchCourseContents(course.id);
  };

  const handleCreateCourse = async () => {
    if (!title || !code) {
      alert("Please enter both Course Title and Course Code.");
      return;
    }
    if (!pdfFile) {
      alert("Please upload the official Course Content PDF file.");
      return;
    }

    try {
      setSubmittingCourse(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("code", code);
      formData.append("description", description);
      formData.append("pdf", pdfFile);

      const res = await api.createCourse(formData);
      if (res.success) {
        setTitle("");
        setCode("");
        setDescription("");
        setPdfFile(null);
        setIsAddCourseOpen(false);
        await fetchCourses();
        alert("Course created and PDF syllabus processed successfully!");
      } else {
        alert("Failed to create course: " + (res.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Error creating course:", err);
      alert("Error creating course: " + err.message);
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleAddContentSubmit = async () => {
    if (!selectedCourse) return;
    if (!contentName) {
      alert("Please enter a title for the content.");
      return;
    }

    setUploadingContent(true);
    try {
      if (contentType === "YOUTUBE_URL") {
        if (!youtubeUrl) {
          alert("Please enter a valid YouTube URL.");
          setUploadingContent(false);
          return;
        }
        const res = await api.submitContentLink(selectedCourse.id.toString(), {
          name: contentName,
          url: youtubeUrl,
        });
        if (res.success) {
          setContentName("");
          setYoutubeUrl("");
          setIsAddContentOpen(false);
          await fetchCourseContents(selectedCourse.id);
        } else {
          alert("Failed to add YouTube link: " + res.error);
        }
      } else {
        if (!contentFile) {
          alert("Please select a file to upload.");
          setUploadingContent(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", contentFile);
        formData.append("name", contentName);
        formData.append("type", contentType === "UPLOAD_VIDEO" ? "video" : "pdf");

        const res = await api.uploadCourseContent(selectedCourse.id.toString(), formData);
        if (res.success) {
          setContentName("");
          setContentFile(null);
          setIsAddContentOpen(false);
          await fetchCourseContents(selectedCourse.id);
        } else {
          alert("Upload failed: " + res.error);
        }
      }
    } catch (err: any) {
      console.error("Content upload error:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingContent(false);
    }
  };

  // =========================================================================
  // DETAILED COURSE WORKSPACE VIEW (When a course card is opened)
  // =========================================================================
  if (selectedCourse) {
    return (
      <div className="space-y-6">
        {/* Top Header & Navigation Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Btn variant="soft" onClick={() => setSelectedCourse(null)} className="rounded-xl px-4 py-2 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </Btn>
          <Btn onClick={() => setIsAddContentOpen(true)} className="text-xs">
            <Plus className="h-4 w-4" /> Add Content
          </Btn>
        </div>

        {/* Course Banner Info Header */}
        <Card className="bg-gradient-to-r from-primary/5 via-card to-card border-primary/20 p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {selectedCourse.code}
                </span>
                <StatusPill status={selectedCourse.status || "APPROVED"} />
                {selectedCourse.pdfUrl && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <FileText className="h-3 w-3" /> PDF Syllabus Attached
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold md:text-3xl font-display">{selectedCourse.title}</h1>
              {selectedCourse.description && (
                <p className="mt-2 text-sm text-muted-foreground max-w-3xl leading-relaxed">
                  {selectedCourse.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-secondary px-3.5 py-2 rounded-xl">
              <Users className="h-4 w-4 text-primary" /> {selectedCourse.studentCount || 0} Enrolled Students
            </div>
          </div>
        </Card>

        {/* Sub-Modules Tabs Bar */}
        <div className="border-b border-border">
          <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-none">
            {[
              { id: "modules", label: "Content / Modules", icon: Layers },
              { id: "quizzes", label: "Quizzes", icon: FileQuestion },
              { id: "assignments", label: "Assignments", icon: ClipboardList },
              { id: "submissions", label: "Submissions", icon: FileCheck },
              { id: "attendance", label: "Attendance", icon: CalendarCheck },
              { id: "announcements", label: "Announcements", icon: Megaphone },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
            ].map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as CourseTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition whitespace-nowrap border-b-2 ${
                    active
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === "modules" && (
          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
              <h3 className="text-base font-bold font-display flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> Course Materials & Modules
              </h3>
              <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                {(selectedCourse.pdfUrl ? 1 : 0) + courseContents.length} Files
              </span>
            </div>

            <div className="space-y-4">
              {/* Item #01: Course Syllabus PDF */}
              {selectedCourse.pdfUrl && (
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 transition hover:bg-emerald-500/10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold text-xs">
                        01
                      </span>
                      <div>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                          <span>Official Course Syllabus PDF</span>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                            AI Quiz Context
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">Main Syllabus Document & AI Quiz Reference</div>
                      </div>
                    </div>

                    <a
                      href={`${API_BASE_URL.replace("/api", "")}${selectedCourse.pdfUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow hover:opacity-90 transition"
                    >
                      <Download className="h-3.5 w-3.5" /> Download PDF
                    </a>
                  </div>

                  {selectedCourse.content && (
                    <div className="mt-3 pt-3 border-t border-emerald-500/20">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                        Extracted Syllabus Text (AI Prompt Context):
                      </div>
                      <div className="max-h-36 overflow-y-auto rounded-xl bg-background/80 p-3 text-xs font-mono whitespace-pre-line text-muted-foreground border border-emerald-500/20">
                        {selectedCourse.content}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Uploaded Video, PDF, YouTube Files */}
              {contentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : courseContents.length > 0 ? (
                courseContents.map((item, index) => {
                  const itemNumber = (selectedCourse.pdfUrl ? index + 2 : index + 1).toString().padStart(2, "0");
                  return (
                    <div
                      key={item.id || index}
                      className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition hover:bg-secondary/40 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary font-bold text-xs text-muted-foreground">
                          {itemNumber}
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          {item.type === "youtube" ? (
                            <Youtube className="h-5 w-5 text-red-500" />
                          ) : item.type === "video" ? (
                            <PlayCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <FileText className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{item.name}</div>
                          <div className="text-[11px] text-muted-foreground capitalize">
                            {item.type === "youtube" ? "YouTube Video Resource" : `${item.type.toUpperCase()} File`}
                          </div>
                        </div>
                      </div>

                      <a
                        href={item.link && item.link.startsWith("http") ? item.link : `${API_BASE_URL.replace("/api", "")}${item.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary-soft/80 transition"
                      >
                        {item.type === "pdf" ? "View PDF" : "Open Media"}
                      </a>
                    </div>
                  );
                })
              ) : !selectedCourse.pdfUrl ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                  No content files uploaded yet. Click "+ Add Content" at the top to add study resources.
                </div>
              ) : null}
            </div>
          </Card>
        )}

        {activeTab === "quizzes" && <FacultyQuizzes />}
        {activeTab === "assignments" && <FacultyAssignments />}
        {activeTab === "submissions" && <FacultySubmissions />}
        {activeTab === "attendance" && <FacultyAttendance />}
        {activeTab === "announcements" && <FacultyAnnouncements />}
        {activeTab === "analytics" && (
          <Card className="p-6">
            <h3 className="text-base font-bold mb-4 font-display flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Course Performance Analytics
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                <div className="text-xs text-muted-foreground font-semibold">Total Enrolled</div>
                <div className="text-2xl font-bold text-primary mt-1">{selectedCourse.studentCount || 0} Students</div>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                <div className="text-xs text-muted-foreground font-semibold">Total Course Materials</div>
                <div className="text-2xl font-bold text-primary mt-1">{(selectedCourse.pdfUrl ? 1 : 0) + courseContents.length} Files</div>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                <div className="text-xs text-muted-foreground font-semibold">Course Status</div>
                <div className="text-2xl font-bold text-emerald-500 mt-1">{selectedCourse.status || "APPROVED"}</div>
              </div>
            </div>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* UPLOAD CONTENT DIALOG BOX / MODAL OVERLAY (Matches Screenshot #3) */}
        {/* ========================================================================= */}
        {isAddContentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl p-6 overflow-hidden">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold font-display text-foreground">Upload content</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage course materials (Videos, PDF notes, YouTube links).
                  </p>
                </div>
                <button
                  onClick={() => setIsAddContentOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* SELECT COURSE */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Select Course
                  </label>
                  <select
                    disabled
                    className="w-full rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm font-semibold outline-none text-foreground"
                  >
                    <option>{selectedCourse.title} ({selectedCourse.code})</option>
                  </select>
                </div>

                {/* CONTENT TYPE */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                  >
                    <option value="UPLOAD_VIDEO">01. Upload Video</option>
                    <option value="PDF_NOTES">02. PDF Document / Notes</option>
                    <option value="YOUTUBE_URL">03. YouTube Video Link</option>
                  </select>
                </div>

                {/* CONTENT TITLE */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Content Title
                  </label>
                  <input
                    value={contentName}
                    onChange={(e) => setContentName(e.target.value)}
                    placeholder="e.g. Introduction to React"
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                  />
                </div>

                {/* FILE / YOUTUBE INPUT */}
                {contentType === "YOUTUBE_URL" ? (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      YouTube Link URL
                    </label>
                    <input
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      {contentType === "UPLOAD_VIDEO" ? "Video File" : "PDF File"}
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm">
                      <input
                        type="file"
                        accept={contentType === "UPLOAD_VIDEO" ? "video/*" : ".pdf"}
                        onChange={(e) => setContentFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-foreground hover:file:bg-secondary/80"
                      />
                    </div>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <div className="pt-2">
                  <Btn
                    onClick={handleAddContentSubmit}
                    disabled={uploadingContent}
                    className="w-full py-3 text-sm font-semibold rounded-xl"
                  >
                    {uploadingContent ? "Uploading Content..." : "Add Course Content"}
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // MAIN COURSE MANAGEMENT VIEW (Card List + Add New Course Modal)
  // =========================================================================
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl text-foreground">Course Management</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create, teach, and manage your courses and learning resources.
          </p>
        </div>
        <Btn onClick={() => setIsAddCourseOpen(true)} className="rounded-xl px-4 py-2.5 text-xs font-bold shadow-glow">
          <Plus className="h-4 w-4" /> Add New Course
        </Btn>
      </div>

      {/* Your Created Courses (Card Grid) */}
      <section>
        <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
          <h3 className="font-display text-lg font-bold flex items-center gap-2 text-foreground">
            <BookOpen className="h-5 w-5 text-primary" /> Your Created Courses
          </h3>
          <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
            {courses.length} Courses
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : courses.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                onClick={() => handleSelectCourse(course)}
                className="group relative cursor-pointer border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      {course.code || "COURSE"}
                    </span>
                    <StatusPill status={course.status || "APPROVED"} />
                  </div>

                  <h4 className="font-display text-lg font-bold group-hover:text-primary transition line-clamp-1">
                    {course.title}
                  </h4>

                  {course.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    {course.pdfUrl ? (
                      <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full font-semibold">
                        <FileText className="h-3.5 w-3.5" /> PDF Syllabus Attached
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground bg-secondary px-2.5 py-1 rounded-full font-medium">
                        No PDF
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-muted-foreground bg-secondary px-2.5 py-1 rounded-full font-medium">
                      <Users className="h-3.5 w-3.5" /> {course.studentCount || 0} Students
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-1">
                    Manage Course Workspace &rarr;
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h4 className="text-base font-bold text-foreground mb-1">No courses created yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              Click "+ Add New Course" above to create your first teaching course and upload its PDF syllabus.
            </p>
            <Btn onClick={() => setIsAddCourseOpen(true)} className="rounded-xl px-4 py-2 text-xs">
              <Plus className="h-4 w-4" /> Add New Course
            </Btn>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* CREATE NEW COURSE DIALOG BOX / MODAL OVERLAY (Matches Screenshot #1 & #2) */}
      {/* ========================================================================= */}
      {isAddCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-lg font-bold font-display flex items-center gap-2 text-foreground">
                <BookOpen className="h-5 w-5 text-primary" /> Create New Course
              </h3>
              <button
                onClick={() => setIsAddCourseOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Course Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Course title (e.g., Java Programming Course)"
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Course Code
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Course code (e.g., JAVA101)"
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Description & Overview
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Course Description & Overview"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                />
              </div>

              {/* PDF Syllabus Upload Box (Exact match to screenshot #1 & #2) */}
              <div className="sm:col-span-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center transition hover:border-primary/60">
                <input
                  type="file"
                  accept=".pdf"
                  id="modal-course-pdf-upload"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="modal-course-pdf-upload" className="cursor-pointer flex flex-col items-center justify-center">
                  <CloudUpload className="h-9 w-9 text-primary mb-2 animate-pulse" />
                  <span className="text-sm font-bold text-foreground">
                    {pdfFile ? `📄 Attached PDF: ${pdfFile.name}` : "Upload Course Content (PDF File Only)"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 max-w-md">
                    {pdfFile
                      ? `Size: ${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload`
                      : "Click to select the official course syllabus PDF document. Text will be automatically extracted for AI Quiz generation."}
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2 pt-2">
                <Btn
                  onClick={handleCreateCourse}
                  disabled={submittingCourse}
                  className="w-full py-3 text-sm font-semibold rounded-xl"
                >
                  {submittingCourse ? "Processing PDF & Creating Course..." : "Create course"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
