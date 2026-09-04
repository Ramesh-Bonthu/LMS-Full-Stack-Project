import { useState, useEffect } from "react";
import { Megaphone, Edit3, Trash2, Filter, X, Save, CheckCircle } from "lucide-react";
import { type Announcement, api, formatRelativeTime } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";
import { toast } from "sonner";

export function AdminAnnouncements() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Audience Filter State
  const [filterAudience, setFilterAudience] = useState<"ALL_FILTER" | "STUDENTS" | "FACULTY" | "ALL">("ALL_FILTER");

  // Edit Modal State
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editAudience, setEditAudience] = useState("ALL");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.getAnnouncements("ANNOUNCEMENT");
      if (res.success && res.data) {
        const officialOnly = (Array.isArray(res.data) ? res.data : []).filter(
          (a: any) => !a.category || a.category.toUpperCase() === "ANNOUNCEMENT"
        );
        setItems(officialOnly);
      }
    } catch (error) {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      return toast.error("Headline and message body are required");
    }
    try {
      setSubmitting(true);
      const res = await api.createAnnouncement({ title, body, audience, category: "ANNOUNCEMENT" });
      if (res.success) {
        toast.success("Broadcast announcement sent successfully!");
        setTitle("");
        setBody("");
        setAudience("ALL");
        await fetchAnnouncements();
      } else {
        toast.error(res.error || "Failed to broadcast announcement");
      }
    } catch (error) {
      toast.error("Error sending broadcast announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (item: Announcement, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditItem(item);
    setEditTitle(item.title);
    setEditBody(item.body);
    setEditAudience(item.audience || "ALL");
  };

  const handleSaveEdit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editItem) return;
    if (!editTitle.trim() || !editBody.trim()) {
      return toast.error("Headline and message body cannot be empty");
    }
    try {
      setSavingEdit(true);
      const targetId = editItem.id;
      const res = await api.updateAnnouncement(targetId, {
        title: editTitle,
        body: editBody,
        audience: editAudience,
      });

      if (res.success) {
        const nowIso = new Date().toISOString();
        toast.success("Announcement updated successfully!");
        setItems((prev) =>
          prev.map((item) =>
            item.id === targetId
              ? { ...item, title: editTitle, body: editBody, audience: editAudience, createdAt: nowIso, time: "Just now" }
              : item
          )
        );
        setEditItem(null);
        fetchAnnouncements();
      } else {
        toast.error(res.error || "Failed to update announcement");
      }
    } catch (error) {
      toast.error("Error updating announcement");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!window.confirm("Are you sure you want to delete this announcement across campus?")) return;
    try {
      // Optimistic removal
      setItems((prev) => prev.filter((item) => item.id !== id));
      const res = await api.deleteAnnouncement(id);
      if (res.success) {
        toast.success("Announcement deleted");
        fetchAnnouncements();
      } else {
        toast.error(res.error || "Failed to delete announcement");
        fetchAnnouncements();
      }
    } catch (error) {
      toast.error("Error deleting announcement");
      fetchAnnouncements();
    }
  };

  // Filtered Items
  const filteredItems = items.filter((item) => {
    if (filterAudience === "ALL_FILTER") return true;
    const itemAud = (item.audience || "ALL").toUpperCase();
    return itemAud === filterAudience;
  });

  return (
    <>
      <PageHeader title="Global Announcements" subtitle="Broadcast and manage messages across the entire campus." />
      
      {/* Broadcast Form Card */}
      <Card>
        <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Create New Broadcast</h3>
        </div>

        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline / Announcement Title..."
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a clear, concise message to broadcast..."
            rows={4}
            className="rounded-xl border border-border bg-card p-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Audience:</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="rounded-xl border border-border bg-secondary/30 px-3.5 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="ALL">🌐 All Campus (Everyone)</option>
                <option value="STUDENTS">🎓 Students Only</option>
                <option value="FACULTY">🏫 Faculty Only</option>
              </select>
            </div>

            <Btn type="button" onClick={handleBroadcast} disabled={submitting} className="shadow-glow">
              <Megaphone className="h-4 w-4" /> {submitting ? "Broadcasting..." : "Broadcast Message"}
            </Btn>
          </div>
        </div>
      </Card>

      {/* Published Announcements List with Filter Dropdown */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-foreground">Campus Announcements History</h3>
            <p className="text-xs text-muted-foreground">Manage, edit, or delete broadcasted announcements.</p>
          </div>

          {/* Audience Filter Dropdown */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/20 px-3.5 py-2 min-w-[240px]">
            <Filter className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">Filter:</span>
            <select
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value as any)}
              className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer text-foreground"
            >
              <option value="ALL_FILTER" className="bg-card">All Announcements ({items.length})</option>
              <option value="STUDENTS" className="bg-card">Students Only ({items.filter(i => (i.audience || "").toUpperCase() === "STUDENTS").length})</option>
              <option value="FACULTY" className="bg-card">Faculty Only ({items.filter(i => (i.audience || "").toUpperCase() === "FACULTY").length})</option>
              <option value="ALL" className="bg-card">Campus-Wide ALL ({items.filter(i => (i.audience || "").toUpperCase() === "ALL").length})</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid gap-4">
            {filteredItems.map((item) => {
              const aud = (item.audience || "ALL").toUpperCase();
              return (
                <div key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${
                        aud === "STUDENTS" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                        aud === "FACULTY" ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" :
                        "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      }`}>
                        {aud === "STUDENTS" ? "🎓 Students Only" : aud === "FACULTY" ? "🏫 Faculty Only" : "🌐 Campus-Wide (ALL)"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {formatRelativeTime(item.createdAt) || item.time || "Just now"}
                      </span>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(item, e)}
                        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition bg-secondary/50 px-2.5 py-1 rounded-lg border border-border/50 cursor-pointer"
                        title="Edit Announcement"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-primary" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="flex items-center gap-1 text-xs font-semibold text-destructive hover:bg-destructive/20 transition bg-destructive/10 px-2.5 py-1 rounded-lg border border-destructive/20 cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-base text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.body}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
            <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h4 className="text-base font-bold text-foreground mb-1">No announcements found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No broadcast messages match the selected audience filter.
            </p>
          </div>
        )}
      </div>

      {/* Edit Announcement Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" /> Edit Announcement
              </h3>
              <button 
                type="button"
                onClick={() => setEditItem(null)}
                className="text-muted-foreground hover:text-foreground transition rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Headline / Title *
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Target Audience *
                </label>
                <select
                  value={editAudience}
                  onChange={(e) => setEditAudience(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="ALL">🌐 All Campus (Everyone)</option>
                  <option value="STUDENTS">🎓 Students Only</option>
                  <option value="FACULTY">🏫 Faculty Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Message Body *
                </label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-secondary/30 p-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Btn type="button" variant="ghost" className="flex-1" onClick={() => setEditItem(null)} disabled={savingEdit}>
                Cancel
              </Btn>
              <Btn type="button" className="flex-1" onClick={handleSaveEdit} disabled={savingEdit}>
                <Save className="h-4 w-4" /> {savingEdit ? "Saving..." : "Save Changes"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

