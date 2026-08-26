import { useState, useEffect } from "react";
import { Loader, BookOpen, Edit, X, Save, FileText, Upload, Download, CheckCircle2, PlayCircle, Youtube, Plus, ArrowLeft, Users, FileCheck } from "lucide-react";
import { type Course, api, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader, Card, Btn, StatusPill } from "../../shared/UIPrimitives";

type ContentType = "UPLOAD_VIDEO" | "YOUTUBE_URL" | "PDF_NOTES";

export function FacultyCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Selected course details view & files list
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContents, setCourseContents] = useState<any[]>([]);
  const [contentsLoading, setContentsLoading] = useState(false);

  // New Content upload state in detailed view
  const [showAddContent, setShowAddContent] = useState(false);
  const [contentType, setContentType] = useState<ContentType>("PDF_NOTES");
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
            ? res.data.filter((course) =>
                (course.facultyId === facultyId || user?.role === "admin") &&
                course.status?.toUpperCase() !== "REJECTED"
              )
            : [],
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user?.id, user?.userId, user?.role]);

  // Fetch ordered contents for selected course
  const fetchCourseContents = async (courseId: number) => {
    try {
      setContentsLoading(true);
      const res = await api.getCourseContent(courseId.toString());
      if (res.success && res.data) {
        setCourseContents(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error("Error fetching course contents:", err);
    } finally {
      setContentsLoading(false);
    }
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowAddContent(false);
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
      setSubmitting(true);
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
        await fetchCourses();
        alert("Course created and PDF syllabus processed successfully!");
      } else {
        alert("Failed to create course: " + (res.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Error creating course:", err);
      alert("Error creating course: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddContentToFileList = async () => {
    if (!selectedCourse || !contentName) {
      alert("Please enter a title for the content file.");
      return;
    }

    setUploadingContent(true);
    try {
      if (contentType === "YOUTUBE_URL") {
        if (!youtubeUrl) {
          alert("Please enter a YouTube URL.");
          setUploadingContent(false);
          return;
        }
        const res = await api.submitContentLink(selectedCourse.id.toString(), { name: contentName, url: youtubeUrl });
        if (res.success) {
          setContentName("");
          setYoutubeUrl("");
          setShowAddContent(false);
          await fetchCourseContents(selectedCourse.id);
        } else {
          alert("Failed to add link: " + res.error);
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
          setShowAddContent(false);
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

  // Detailed Course View (When card is clicked)
  if (selectedCourse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Btn variant="soft" onClick={() => setSelectedCourse(null)} className="rounded-full px-4 py-2 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to All Courses
          </Btn>
          <Btn onClick={() => setShowAddContent(!showAddContent)} className="text-xs">
            <Plus className="h-4 w-4" /> {showAddContent ? "Close File Uploader" : "Add Content File"}
          </Btn>
        </div>

        {/* Course Header Info */}
        <Card className="bg-gradient-to-r from-primary/5 via-card to-card border-primary/20 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {selectedCourse.code}
                </span>
                <StatusPill status={selectedCourse.status || "PENDING"} />
              </div>
              <h1 className="text-2xl font-bold md:text-3xl font-display">{selectedCourse.title}</h1>
              {selectedCourse.description && (
                <p className="mt-2 text-sm text-muted-foreground max-w-3xl">{selectedCourse.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
              <Users className="h-4 w-4 text-primary" /> {selectedCourse.studentCount || 0} Enrolled Students
            </div>
          </div>
        </Card>

        {/* Add File Uploader Panel */}
        {showAddContent && (
          <Card className="border-2 border-primary/30 p-5 bg-primary/5 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-primary">
              <Upload className="h-4 w-4" /> Upload New Course Resource File
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="PDF_NOTES">📄 PDF Document / Notes</option>
                  <option value="UPLOAD_VIDEO">🎥 Video File (.mp4, .mov)</option>
                  <option value="YOUTUBE_URL">▶️ YouTube Video Link</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Title / Name</label>
                <input
                  value={contentName}
                  onChange={(e) => setContentName(e.target.value)}
                  placeholder="e.g. Chapter 1 Slides or Tutorial Video"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              {contentType === "YOUTUBE_URL" ? (
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">YouTube URL</label>
                  <input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Select File</label>
                  <input
                    type="file"
                    accept={contentType === "UPLOAD_VIDEO" ? "video/*" : ".pdf"}
                    onChange={(e) => setContentFile(e.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1 file:text-xs file:font-semibold file:text-primary"
                  />
                </div>
              )}

              <div className="sm:col-span-2 mt-2">
                <Btn onClick={handleAddContentToFileList} disabled={uploadingContent}>
                  {uploadingContent ? "Uploading..." : "Save File to Course"}
                </Btn>
              </div>
            </div>
          </Card>
        )}

        {/* Ordered Top-to-Bottom Files & Syllabus Content */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
            <h3 className="text-lg font-bold font-display flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" /> Ordered Course Content & Files
            </h3>
            <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              {(selectedCourse.pdfUrl ? 1 : 0) + courseContents.length} Total Files
            </span>
          </div>

          <div className="space-y-4">
            {/* Top Item #01: Official Course Syllabus PDF */}
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
                      <div className="text-xs text-muted-foreground">Main Syllabus Document & Quiz Reference Material</div>
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

                {/* Extracted Syllabus Notes Preview */}
                {selectedCourse.content && (
                  <div className="mt-3 pt-3 border-t border-emerald-500/20">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                      Extracted Text Syllabus (AI Prompt Context):
                    </div>
                    <div className="max-h-36 overflow-y-auto rounded-xl bg-background/80 p-3 text-xs font-mono whitespace-pre-line text-muted-foreground border border-emerald-500/20">
                      {selectedCourse.content}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Items #02, #03, #04... Additional Course Content Files */}
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
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No content files uploaded yet. Click "Add Content File" above to add study resources.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  // Dashboard Course Cards Grid View
  return (
    <>
      <PageHeader title="Courses" subtitle="Create and manage your course cards and PDF syllabus content." />

      {/* Course Creation Card Form */}
      <Card className="mb-8">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" /> Create New Course
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Course title (e.g., Java Programming Course)"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Course code (e.g., JAVA101)"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Course Description & Overview"
            rows={2}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 sm:col-span-2"
          />

          {/* PDF Upload Input Box */}
          <div className="sm:col-span-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center transition hover:border-primary/60">
            <input
              type="file"
              accept=".pdf"
              id="course-pdf-upload"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="course-pdf-upload" className="cursor-pointer flex flex-col items-center justify-center">
              <Upload className="h-8 w-8 text-primary mb-2 animate-pulse" />
              <span className="text-sm font-bold text-foreground">
                {pdfFile ? `📄 Attached PDF: ${pdfFile.name}` : "Upload Course Content (PDF File Only)"}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {pdfFile
                  ? `Size: ${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload`
                  : "Click to select the official course syllabus PDF document. Text will be automatically extracted for AI Quiz generation."}
              </span>
            </label>
          </div>

          <div className="sm:col-span-2 mt-2">
            <Btn onClick={handleCreateCourse} disabled={submitting}>
              {submitting ? "Processing PDF..." : "Create course"}
            </Btn>
          </div>
        </div>
      </Card>

      {/* Your Created Courses (Card Grid UI) */}
      <section>
        <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
          <h3 className="font-display text-xl font-bold flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" /> Your Created Courses
          </h3>
          <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
            {courses.length} Courses
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : courses.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="group relative cursor-pointer border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 flex flex-col justify-between"
              >
                <div onClick={() => handleSelectCourse(course)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      {course.code || "COURSE"}
                    </span>
                    <StatusPill status={course.status || "PENDING"} />
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
                  <span className="text-xs font-semibold text-primary group-hover:underline">
                    View Files & Ordered Syllabus &rarr;
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground italic">No courses created yet. Fill in the form above to add your first course card.</p>
          </div>
        )}
      </section>
    </>
  );
}
