import { useState, useEffect } from "react";
import { Loader, Search, PlayCircle, FileText, Youtube, CheckCircle2, BookOpen } from "lucide-react";
import { type Course, api, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";
import { DynamicCourseCard } from "../../shared/DisplayCards";

export function StudentCourses() {
  const { user } = useAuth();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getCourses();
      if (res.success && res.data) {
        const courses = Array.isArray(res.data) ? res.data : [];
        setAllCourses(courses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmEnroll = window.confirm("Are you sure you want to enroll in this course?");
    if (!confirmEnroll) return;
    
    try {
      const res = await api.enrollCourse(courseId.toString());
      if (res.success) {
        await fetchCourses();
        alert("Successfully enrolled in the course!");
      } else {
        alert("Enrollment failed: " + res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isEnrolled = (c: Course) => {
    if (!user || !c || !c.enrolledStudentIds) return false;
    const uId = user.userId || user.id;
    if (!uId) return false;
    return Array.isArray(c.enrolledStudentIds) && c.enrolledStudentIds.some(id => String(id) === String(uId));
  };

  const myCourses = allCourses.filter(isEnrolled).filter(c => 
    (c.name || c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exploreCourses = allCourses.filter(c => c.status?.toUpperCase() === "APPROVED" && !isEnrolled(c)).filter(c => 
    (c.name || c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedCourse) {
    return <StudentCourseDetails course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="Manage and enroll in courses."
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search courses…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        }
      />
      
      <div className="space-y-10">
        {/* My Courses Section */}
        <section>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-display text-xl font-bold flex items-center gap-2 text-primary">
              <BookOpen className="h-5 w-5" /> My Courses
            </h3>
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              {myCourses.length} active
            </span>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : myCourses.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {myCourses.map((c) => (
                <div key={c.id} onClick={() => setSelectedCourse(c)} className="cursor-pointer relative group">
                  <DynamicCourseCard course={c} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card/50 p-8 text-center">
              <p className="text-muted-foreground italic">You haven't enrolled in any courses yet.</p>
            </div>
          )}
        </section>

        {/* Explore Courses Section */}
        <section>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-display text-xl font-bold flex items-center gap-2 text-accent">
              <Search className="h-5 w-5" /> Explore New Courses
            </h3>
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              {exploreCourses.length} available
            </span>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : exploreCourses.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {exploreCourses.map((c) => (
                <div key={c.id} className="relative group">
                  <DynamicCourseCard course={c} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-2xl z-10">
                    <button 
                      className="rounded-full bg-white px-6 py-2 text-sm font-bold text-black shadow-xl hover:scale-105 transition transform"
                      onClick={(e) => handleEnroll(c.id, e)}
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card/50 p-8 text-center">
              <p className="text-muted-foreground italic">No new courses available to explore right now.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}



function StudentCourseDetails({ course: initialCourse, onBack }: { course: Course; onBack: () => void }) {
  const [course, setCourse] = useState<Course>(initialCourse);
  const [contentList, setContentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const res = await api.getCourseContent(course.id.toString());
      if (res.success && res.data) {
        setContentList(Array.isArray(res.data) ? res.data : []);
      }
      setLoading(false);
    };
    fetchContent();
  }, [course.id]);

  const handleMarkComplete = async (contentId: number) => {
    // Only mark complete if not already in the list
    if (course.completedContentIds?.includes(contentId)) return;

    try {
      const res = await api.markContentComplete(course.id.toString(), contentId.toString());
      if (res.success && res.data?.course) {
        // Update local state instantly
        setCourse(res.data.course);
      }
    } catch (err) {
      console.error("Failed to mark content as complete:", err);
    }
  };

  const isCompleted = (contentId: number) => {
    return course.completedContentIds?.includes(contentId);
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Btn variant="soft" onClick={onBack} className="rounded-full px-3 py-1 text-xs">
            &larr; Back
          </Btn>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{course.title || course.name}</h1>
            <p className="text-sm text-muted-foreground">{course.code} · {course.facultyName || "Faculty"}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-sm font-bold text-primary">{course.progress || 0}% Complete</span>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out" 
              style={{ width: `${course.progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Course Syllabus & PDF Download */}
      {(course.content || course.pdfUrl) && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Course Syllabus & Study Material
            </h3>
            {course.pdfUrl && (
              <a
                href={`${API_BASE_URL.replace("/api", "")}${course.pdfUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-500 hover:bg-emerald-500/20 transition"
              >
                <FileText className="h-4 w-4" /> Download Official Course PDF
              </a>
            )}
          </div>
          {course.content && (
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed bg-secondary/20 p-4 rounded-2xl border border-border max-h-60 overflow-y-auto">
              {course.content}
            </p>
          )}
        </Card>
      )}

      <Card>
        <h3 className="mb-4 font-display text-lg font-bold">Course Content Files & Resources</h3>
        {loading ? (
          <div className="flex justify-center py-10">
             <Loader className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : contentList.length > 0 ? (
          <div className="space-y-3">
            {contentList.map((f) => (
              <div
                key={f.id}
                className={`flex items-center justify-between rounded-xl border p-4 transition ${
                  isCompleted(f.id) 
                    ? "border-green-500/20 bg-green-500/5 hover:bg-green-500/10" 
                    : "border-border bg-secondary/30 hover:bg-secondary/60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isCompleted(f.id) ? "bg-green-500/10" : "bg-primary/10"}`}>
                    {f.type === "youtube" ? (
                      <Youtube className={`h-5 w-5 ${isCompleted(f.id) ? "text-green-500" : "text-red-500"}`} />
                    ) : f.type === "video" ? (
                      <PlayCircle className={`h-5 w-5 ${isCompleted(f.id) ? "text-green-500" : "text-primary"}`} />
                    ) : (
                      <FileText className={`h-5 w-5 ${isCompleted(f.id) ? "text-green-500" : "text-orange-500"}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{f.name}</span>
                      {isCompleted(f.id) && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground capitalize">{f.type === "youtube" ? "YouTube Link" : f.type}</div>
                  </div>
                </div>
                <a 
                  href={f.link && f.link.startsWith("http") ? f.link : (f.link ? `${API_BASE_URL.replace("/api", "")}${f.link}` : "#")} 
                  target="_blank" 
                  rel="noreferrer" 
                  onClick={() => handleMarkComplete(f.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    isCompleted(f.id)
                      ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                      : "bg-primary-soft text-primary hover:bg-primary-soft/80"
                  }`}
                >
                  {isCompleted(f.id) ? "Completed" : (f.type === "pdf" ? "View PDF" : "Watch")}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-muted-foreground">No content has been added to this course yet.</div>
        )}
      </Card>
    </>
  );
}
