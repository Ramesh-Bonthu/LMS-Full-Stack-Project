import { useState, useEffect } from "react";
import { Megaphone, Plus, X, Calendar, Users, FileText, Bell } from "lucide-react";
import { type Announcement, type Course, api, formatRelativeTime } from "@/lib/api";
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
  const [selectedCourseId, setSelectedCourseId] = useState<string>(course ? String(course.id) : "");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(isAddAnnouncementOpen);

  const [title, setTitle] = useState(course ? `${course.title} Update` : "");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (course) {
      setSelectedCourseId(String(course.id));
      setTitle(`${course.title} Update`);
    }
  }, [course]);

  useEffect(() => {
    setIsModalOpen(isAddAnnouncementOpen);
  }, [isAddAnnouncementOpen]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.getAnnouncements("ANNOUNCEMENT");
      if (res.success && res.data) {
        const all = Array.isArray(res.data) ? res.data : [];
        // Filter exclusively for official announcements
        const officialOnly = all.filter(
          (a: any) => !a.category || a.category.toUpperCase() === "ANNOUNCEMENT"
        );

        const activeCId = selectedCourseId || (course ? String(course.id) : "");

        if (activeCId) {
          const courseCode = (course?.code || "").toLowerCase().trim();
          const courseTitle = (course?.title || course?.name || "").toLowerCase().trim();

          const courseAnns = officialOnly.filter((a: any) => {
            if (a.courseId && String(a.courseId) === String(activeCId)) return true;
            const aTitle = (a.title || "").toLowerCase();
            if (courseCode && aTitle.includes(courseCode)) return true;
            if (courseTitle && aTitle.includes(courseTitle)) return true;
            return false;
          });
          setItems(courseAnns);
        } else {
          setItems(officialOnly);
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onCloseModal) onCloseModal();
  };

  const handlePostAnnouncement = async () => {
    if (!title.trim()) return alert("Please enter Announcement Title.");
    if (!body.trim()) return alert("Please enter Announcement Message.");

    try {
      setSubmitting(true);
      const res = await api.createAnnouncement({
        title,
        body,
        audience: "STUDENTS",
        category: "ANNOUNCEMENT",
        courseId: selectedCourseId ? Number(selectedCourseId) : undefined,
      } as any);

      if (res.success) {
        alert("Announcement posted successfully!");
        setTitle(course ? `${course.title} Update` : "");
        setBody("");
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
      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold font-display flex items-center gap-2 text-foreground">
              <Megaphone className="h-5 w-5 text-primary" /> Published Course Announcements
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              View all official broadcasted updates and announcements sent to students.
            </p>
          </div>
          <Btn onClick={() => setIsModalOpen(true)} className="text-xs font-bold shadow-glow">
            <Plus className="h-4 w-4" /> Add Announcement
          </Btn>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item, idx) => (
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
                      Official Notice
                    </span>
                  </div>
                  <h4 className="font-display text-base font-bold text-foreground mb-2">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line mb-3">{item.body}</p>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground pt-3 border-t border-border">
                  <span className="flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-lg">
                    <Calendar className="h-3 w-3 text-primary" />
                    {formatRelativeTime(item.createdAt) || item.time || "Just now"}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active Notice
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
            <Megaphone className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <h4 className="text-sm font-bold text-foreground">No announcements posted yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Click "+ Add Announcement" above to broadcast an official update or alert to your course students.
            </p>
            <Btn onClick={() => setIsModalOpen(true)} className="text-xs font-bold shadow-glow">
              <Plus className="h-4 w-4" /> Add Announcement
            </Btn>
          </div>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" /> Post Course Announcement
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Broadcast an official announcement to students enrolled in {course ? course.title : "this course"}.
                </p>
              </div>
              <button onClick={handleCloseModal} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
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
                  Announcement Message / Details
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write full announcement details, guidelines, or venue..."
                  rows={5}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Btn variant="soft" onClick={handleCloseModal} className="text-xs">
                  Cancel
                </Btn>
                <Btn onClick={handlePostAnnouncement} disabled={submitting} className="text-xs font-bold shadow-glow">
                  {submitting ? "Posting..." : "Broadcast Announcement"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
