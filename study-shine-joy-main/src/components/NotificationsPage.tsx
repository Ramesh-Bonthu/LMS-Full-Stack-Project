import { useState, useEffect } from "react";
import { Megaphone, Bell, CheckCircle2, AlertCircle, Info, Loader } from "lucide-react";
import { type Announcement, type Notification, api, formatRelativeTime } from "@/lib/api";
import { PageHeader, Card, Btn } from "./shared/UIPrimitives";
import { toast } from "sonner";

const cleanTitle = (str: string) =>
  (str || "").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "").trim();

export function NotificationsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [annRes, notifRes] = await Promise.all([
        api.getAnnouncements("ANNOUNCEMENT"),
        api.getNotifications()
      ]);
      
      if (annRes.success && annRes.data) {
        const officialOnly = (Array.isArray(annRes.data) ? annRes.data : []).filter(
          (a: any) => !a.category || a.category.toUpperCase() === "ANNOUNCEMENT"
        );
        setAnnouncements(officialOnly);
      }
      if (notifRes.success && notifRes.data) {
        const sorted = (Array.isArray(notifRes.data) ? notifRes.data : [])
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(sorted.slice(0, 6));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkRead = async (id: number) => {
    const res = await api.markNotificationAsRead(id);
    if (res.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const handleMarkAllRead = async () => {
    const res = await api.markAllNotificationsAsRead();
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <PageHeader 
        title="Notifications" 
        subtitle="Stay updated with the latest alerts and announcements."
        action={
          unreadCount > 0 && (
            <Btn variant="soft" onClick={handleMarkAllRead}>
              Mark all as read
            </Btn>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Specific Notifications */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            <Bell className="h-5 w-5 text-primary" /> Personal Alerts
          </h3>
          <Card className="min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                    className={`flex items-start gap-3 rounded-xl border p-4 transition cursor-pointer ${
                      n.isRead 
                        ? "border-border bg-secondary/20 opacity-75" 
                        : "border-primary/20 bg-primary/5 shadow-sm"
                    }`}
                  >
                    <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${
                      n.type === 'SUCCESS' ? 'bg-success/20 text-success' : 
                      n.type === 'WARNING' ? 'bg-warn/20 text-warn' : 
                      'bg-primary/20 text-primary'
                    }`}>
                      {n.type === 'SUCCESS' ? <CheckCircle2 className="h-4 w-4" /> : 
                       n.type === 'WARNING' ? <AlertCircle className="h-4 w-4" /> : 
                       <Info className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">{cleanTitle(n.title)}</div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary mt-1" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No new alerts.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Global Announcements */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            <Megaphone className="h-5 w-5 text-accent" /> Announcements
          </h3>
          <Card className="min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4"
                  >
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
                      <Megaphone className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">{cleanTitle(a.title)}</div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(a.createdAt) || a.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{a.body}</p>
                    </div>
                    {a.isNew && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                        NEW
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Megaphone className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
