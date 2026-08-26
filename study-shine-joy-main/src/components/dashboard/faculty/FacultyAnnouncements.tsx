import { useState, useEffect } from "react";
import { Megaphone, Plus, X, Calendar, Users, FileText, Bell, Sparkles } from "lucide-react";
import { type Announcement, type Course, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

interface FacultyAnnouncementsProps {
  course?: Course | null;
  isAddAnnouncementOpen?: boolean;
  onCloseModal?: () => void;
  onAnnouncementCreated?: () => void;
}

export function FacultyAnnouncements({
  course,
  isAddAnnouncementOpen = false,
  onCloseModal,
  onAnnouncementCreated,
}: FacultyAnnouncementsProps) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(course ? String(course.id) : "");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(course || null);
  const [loading, setLoading] = useState(false);

  // Modal toggle state
  const [isModalOpen, setIsModalOpen] = useState(isAddAnnouncementOpen);

  // Form states for Add Announcement Modal
  const [title, setTitle] = useState(course ? `${course.title} Update` : "");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("STUDENTS");
  const [submitting, setSubmitting] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (course) {
      setSelectedCourseId(String(course.id));
      setSelectedCourse(course);
      setTitle(`${course.title} Update`);
    }
  }, [course]);

  useEffect(() => {
    setIsModalOpen(isAddAnnouncementOpen);
  }, [isAddAnnouncementOpen]);

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

  // Fetch Announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.getAnnouncements();
      if (res.success && res.data) {
        const all = Array.isArray(res.data) ? res.data : [];
        if (selectedCourseId) {
          // Show announcements relevant to selected course or public
          setItems(all.filter((a: any) => !a.courseId || String(a.courseId) === String(selectedCourseId)));
        } else {
          setItems(all);
        }
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedCourseId]);

  const handleSelectCourse = (cId: string) => {
    setSelectedCourseId(cId);
    const found = courses.find((c) => String(c.id) === String(cId));
    if (found) {
      setSelectedCourse(found);
      setTitle(`${found.title} Update`);
    } else {
      setSelectedCourse(null);
      setTitle("");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onCloseModal) onCloseModal();
  };

  // Handle Post Announcement Submit
  const handlePostAnnouncement = async () => {
    if (!title.trim()) {
      alert("Please enter Announcement Title.");
      return;
    }
    if (!body.trim()) {
      alert("Please enter Announcement Message.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createAnnouncement({
        title,
        body,
        audience,
        courseId: selectedCourseId ? Number(selectedCourseId) : undefined,
      } as any);

      if (res.success) {
        alert("Announcement posted successfully!");
        setTitle(course ? `${course.title} Update` : "");
        setBody("");
        setAudience("STUDENTS");
        handleCloseModal();
        await fetchAnnouncements();
        if (onAnnouncementCreated) onAnnouncementCreated();
      } else {
        alert("Failed to post announcement: " + (res.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Error creating announcement:", err);
      alert("Error creating announcement: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!course && <PageHeader title="Course Announcements" subtitle="Broadcast updates, schedules, and alerts to your students." />}

      {/* Main Announcements Grid Display */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold font-display flex items-center gap-2 text-foreground">
              <Megaphone className="h-5 w-5 text-primary" /> Published Course Announcements
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              View all broadcasted updates and announcements sent to students.
            </p>
          </div>
          <Btn onClick={() => setIsModalOpen(true)} className="text-xs font-bold shadow-glow">
            <Plus className="h-4 w-4" /> Add Announcement
          </Btn>
        </div>

        {/* Announcements List (Top 4 Recent Announcements Only) */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {items.slice(0, 4).map((item, idx) => (
              <div
                key={item.id || idx}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary flex items-center gap-1">
                      <Megaphone className="h-3.5 w-3.5" /> Broadcast #{idx + 1}
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                      {item.audience === "STUDENTS" ? "Students Only" : "Public (All)"}
                    </span>
                  </div>

                  <h4 className="font-display text-base font-bold text-foreground mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line mb-3">
                    {item.body}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground pt-3 border-t border-border">
                  <span className="flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-lg">
                    <Calendar className="h-3 w-3 text-primary" />
                    {item.time || "Recently Posted"}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active Notice
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h4 className="text-sm font-bold text-foreground mb-1">No announcements posted yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              Click "+ Add Announcement" above to broadcast an update or alert to your course students.
            </p>
            <Btn onClick={() => setIsModalOpen(true)} className="text-xs font-bold">
              <Plus className="h-4 w-4" /> Add Announcement
            </Btn>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* "+ ADD ANNOUNCEMENT" DIALOG BOX / MODAL OVERLAY */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" /> Add New Announcement
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Broadcast an update or notification to your students.
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
                    <option value="">Select Target Course (Optional)</option>
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

              {/* Announcement Title & Audience */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Announcement Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Midterm Exam Schedule Update"
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Target Audience
                  </label>
                  <input
                    readOnly
                    value="Enrolled Students Only"
                    className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm font-semibold text-foreground cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Announcement Message / Body */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Announcement Message / Details
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write full announcement details, guidelines, venue, or links..."
                  rows={5}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                />
              </div>

              {/* Centered Submit Button */}
              <div className="flex justify-center pt-3 border-t border-border">
                <Btn
                  onClick={handlePostAnnouncement}
                  disabled={submitting}
                  className="px-8 py-3 text-sm font-semibold rounded-full min-w-[220px] justify-center shadow-glow"
                >
                  {submitting ? "Posting Announcement..." : "Post Announcement to Students"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
