import { useState, useEffect, useMemo } from "react";
import { Megaphone, Bell, CheckCircle2, AlertCircle, Info, Loader, ChevronLeft, ChevronRight } from "lucide-react";
import { type Announcement, type Notification, api, formatRelativeTime } from "@/lib/api";
import { PageHeader, Card, Btn } from "./shared/UIPrimitives";
import { toast } from "sonner";

const cleanTitle = (str: string) =>
  (str || "").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "").trim();

const ITEMS_PER_PAGE = 10;

export function NotificationsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const [notifPage, setNotifPage] = useState(1);
  const [annPage, setAnnPage] = useState(1);

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
        setNotifications(sorted);
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

  // Sort Notifications by createdAt descending
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || 0) - (a.id || 0);
    });
  }, [notifications]);

  const notifTotalPages = Math.ceil(sortedNotifications.length / ITEMS_PER_PAGE) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (notifPage - 1) * ITEMS_PER_PAGE;
    return sortedNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedNotifications, notifPage]);

  // Sort Announcements by createdAt descending
  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || 0) - (a.id || 0);
    });
  }, [announcements]);

  const annTotalPages = Math.ceil(sortedAnnouncements.length / ITEMS_PER_PAGE) || 1;
  const paginatedAnnouncements = useMemo(() => {
    const start = (annPage - 1) * ITEMS_PER_PAGE;
    return sortedAnnouncements.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAnnouncements, annPage]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <PageHeader 
        title="Notifications & Announcements" 
        subtitle="Stay updated with the latest personal alerts and campus announcements."
        action={
          unreadCount > 0 && (
            <Btn variant="soft" onClick={handleMarkAllRead}>
              Mark all as read ({unreadCount})
            </Btn>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Specific Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold">
              <Bell className="h-5 w-5 text-primary" /> Personal Alerts
            </h3>
            {sortedNotifications.length > 0 && (
              <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                {sortedNotifications.length} Total
              </span>
            )}
          </div>

          <Card className="min-h-[440px] flex flex-col justify-between p-5">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : paginatedNotifications.length > 0 ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {paginatedNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      className={`flex items-start gap-3 rounded-xl border p-4 transition cursor-pointer ${
                        n.isRead 
                          ? "border-border bg-secondary/20 opacity-75" 
                          : "border-primary/20 bg-primary/5 shadow-sm"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                        n.type === 'SUCCESS' ? 'bg-success/20 text-success' : 
                        n.type === 'WARNING' ? 'bg-warn/20 text-warn' : 
                        'bg-primary/20 text-primary'
                      }`}>
                        {n.type === 'SUCCESS' ? <CheckCircle2 className="h-4 w-4" /> : 
                         n.type === 'WARNING' ? <AlertCircle className="h-4 w-4" /> : 
                         <Info className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-sm truncate">{cleanTitle(n.title)}</div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatRelativeTime(n.createdAt) || new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                      </div>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Personal Alerts Pagination */}
                {notifTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border pt-4 text-xs mt-4">
                    <span className="text-muted-foreground font-medium">
                      Page {notifPage} of {notifTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Btn
                        variant="soft"
                        onClick={() => setNotifPage((p) => Math.max(p - 1, 1))}
                        disabled={notifPage === 1}
                        className="h-8 px-3 text-xs gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </Btn>
                      <Btn
                        variant="soft"
                        onClick={() => setNotifPage((p) => Math.min(p + 1, notifTotalPages))}
                        disabled={notifPage === notifTotalPages}
                        className="h-8 px-3 text-xs gap-1"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No new alerts.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Global Announcements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold">
              <Megaphone className="h-5 w-5 text-accent" /> Announcements
            </h3>
            {sortedAnnouncements.length > 0 && (
              <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                {sortedAnnouncements.length} Total
              </span>
            )}
          </div>

          <Card className="min-h-[440px] flex flex-col justify-between p-5">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : paginatedAnnouncements.length > 0 ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {paginatedAnnouncements.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4"
                    >
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft shrink-0">
                        <Megaphone className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-sm truncate">{cleanTitle(a.title)}</div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatRelativeTime(a.createdAt) || a.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">{a.body}</p>
                      </div>
                      {a.isNew && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground shrink-0">
                          NEW
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Global Announcements Pagination */}
                {annTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border pt-4 text-xs mt-4">
                    <span className="text-muted-foreground font-medium">
                      Page {annPage} of {annTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Btn
                        variant="soft"
                        onClick={() => setAnnPage((p) => Math.max(p - 1, 1))}
                        disabled={annPage === 1}
                        className="h-8 px-3 text-xs gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </Btn>
                      <Btn
                        variant="soft"
                        onClick={() => setAnnPage((p) => Math.min(p + 1, annTotalPages))}
                        disabled={annPage === annTotalPages}
                        className="h-8 px-3 text-xs gap-1"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
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

