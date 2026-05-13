import { useState, useEffect } from "react";
import { PlayCircle, FileText, Youtube, Upload } from "lucide-react";
import { type Course, api, API_BASE_URL } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

type ContentType = "UPLOAD_VIDEO" | "YOUTUBE_URL" | "PDF_NOTES";

export function FacultyContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [contentType, setContentType] = useState<ContentType>("UPLOAD_VIDEO");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [contentList, setContentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await api.getCourses();
      if (res.success && res.data) {
        setCourses(Array.isArray(res.data) ? res.data : []);
      }
    };
    fetchCourses();
  }, []);

  const fetchContent = async (cId: string) => {
    if (!cId) {
      setContentList([]);
      return;
    }
    const res = await api.getCourseContent(cId);
    if (res.success && res.data) {
      setContentList(Array.isArray(res.data) ? res.data : []);
    }
  };

  const handleCourseChange = (e: any) => {
    const newId = e.target.value;
    setCourseId(newId);
    fetchContent(newId);
  };

  const handleSubmit = async () => {
    if (!courseId || !name) {
      alert("Please select a course and enter a title.");
      return;
    }

    setLoading(true);
    try {
      if (contentType === "YOUTUBE_URL") {
        if (!url) {
          alert("Please enter a YouTube URL.");
          setLoading(false);
          return;
        }
        const res = await api.submitContentLink(courseId, { name, url });
        if (res.success) {
          setName("");
          setUrl("");
          await fetchContent(courseId);
        }
      } else {
        if (!file) {
          alert("Please select a file to upload.");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", name);
        formData.append("type", contentType === "UPLOAD_VIDEO" ? "video" : "pdf");
        
        const res = await api.uploadCourseContent(courseId, formData);
        if (res.success) {
          setName("");
          setFile(null);
          // Clear file input
          const fileInput = document.getElementById("content-file-input") as HTMLInputElement;
          if (fileInput) fileInput.value = "";
          await fetchContent(courseId);
        } else {
          alert("Upload failed: " + res.error);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Upload content"
        subtitle="Manage course materials (Videos, PDF notes, YouTube links)."
      />
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Course</label>
            <select
              value={courseId}
              onChange={handleCourseChange}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
            >
              <option value="">Select course</option>
              {courses.filter(c => c.status?.toUpperCase() === "APPROVED").map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
            >
              <option value="UPLOAD_VIDEO">01. Upload Video</option>
              <option value="YOUTUBE_URL">02. YouTube Video URL</option>
              <option value="PDF_NOTES">03. PDF Notes</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Title</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Introduction to React"
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
            />
          </div>

          {contentType === "YOUTUBE_URL" ? (
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">YouTube URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
              />
            </div>
          ) : (
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {contentType === "UPLOAD_VIDEO" ? "Video File" : "PDF File"}
              </label>
              <div className="relative flex items-center">
                <input
                  id="content-file-input"
                  type="file"
                  accept={contentType === "UPLOAD_VIDEO" ? "video/*" : ".pdf"}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20 transition"
                />
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <Btn onClick={handleSubmit} disabled={loading || !courseId} className="w-full py-3">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4 animate-bounce" /> Uploading...
                </span>
              ) : (
                "Add Course Content"
              )}
            </Btn>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <h4 className="mb-4 text-lg font-bold">Course Content List</h4>
          {!courseId ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Select a course to view contents.
            </div>
          ) : contentList.length > 0 ? (
            <div className="grid gap-3">
              {contentList.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-secondary/30 p-4 transition hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                      {f.type === "youtube" ? (
                        <Youtube className="h-5 w-5 text-red-500" />
                      ) : f.type === "video" ? (
                        <PlayCircle className="h-5 w-5 text-blue-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{f.name}</div>
                      <div className="text-[11px] text-muted-foreground capitalize">{f.type === "youtube" ? "YouTube Link" : f.type}</div>
                    </div>
                  </div>
                  <a 
                    href={f.link.startsWith("http") ? f.link : `${API_BASE_URL.replace("/api", "")}${f.link}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                  >
                    {f.type === "pdf" ? "View PDF" : "Watch"}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              No content added yet.
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
