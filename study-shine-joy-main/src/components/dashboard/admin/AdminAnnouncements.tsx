import { useState, useEffect } from "react";
import { Megaphone } from "lucide-react";
import { type Announcement, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "../../shared/UIPrimitives";

export function AdminAnnouncements() {
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
      <PageHeader title="Global announcements" subtitle="Send messages to the whole campus." />
      <Card>
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a clear, concise message..."
            rows={5}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="ALL">All</option>
            <option value="STUDENTS">Students</option>
            <option value="FACULTY">Faculty</option>
          </select>
          <div>
            <Btn onClick={handleBroadcast}>
              <Megaphone className="h-4 w-4" /> Broadcast
            </Btn>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">
                {item.audience} · {item.time}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
