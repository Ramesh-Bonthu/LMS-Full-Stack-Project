import { useState, useEffect } from "react";
import { Megaphone } from "lucide-react";
import { type Announcement, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

export function FacultyAnnouncements() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [items, setItems] = useState<Announcement[]>([]);

  const fetchAnnouncements = async () => {
    const res = await api.getAnnouncements();
    if (res.success && res.data) {
      setItems(Array.isArray(res.data) ? res.data : []);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleBroadcast = async () => {
    if (!title || !body) return;
    const res = await api.createAnnouncement({ title, body, audience });
    if (res.success) {
      setTitle("");
      setBody("");
      await fetchAnnouncements();
    }
  };

  return (
    <>
      <PageHeader title="Course Announcements" subtitle="Send updates to your students." />
      <Card>
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement Title"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What would you like to announce?"
            rows={4}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <div className="flex items-center justify-between">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none"
            >
              <option value="ALL">Public (All)</option>
              <option value="STUDENTS">Students only</option>
            </select>
            <Btn onClick={handleBroadcast}>
              <Megaphone className="h-4 w-4" /> Post Announcement
            </Btn>
          </div>
        </div>
      </Card>

      <div className="mt-6 space-y-4">
        <h3 className="font-display text-lg font-bold">Recent Announcements</h3>
        {items.length > 0 ? (
          items.slice(0, 5).map((item) => (
            <Card key={item.id} className="bg-secondary/10">
              <div className="flex items-center justify-between">
                <div className="font-bold">{item.title}</div>
                <span className="text-[10px] text-muted-foreground">{item.time}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </Card>
          ))
        ) : (
          <p className="text-center py-10 text-muted-foreground">No announcements posted yet.</p>
        )}
      </div>
    </>
  );
}
