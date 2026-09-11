import { useEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Home,
  BookOpen,
  ClipboardList,
  FileQuestion,
  BarChart3,
  CalendarCheck,
  Bell,
  User,
  Upload,
  Users,
  ShieldCheck,
  Megaphone,
  LineChart,
  LogOut,
  Bot
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { type Role, roleMeta } from "@/lib/lms-data";
import { api } from "@/lib/api";
import { useState } from "react";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const navByRole: Record<Role, NavItem[]> = {
  student: [
    { to: "", label: "Home", icon: Home },
    { to: "courses", label: "Course Management", icon: BookOpen },
    { to: "attendance", label: "Attendance", icon: CalendarCheck },
    { to: "mock-interviews", label: "Mock Interviews", icon: Bot },
    { to: "library", label: "Library", icon: BookOpen },
    { to: "notifications", label: "Notifications", icon: Bell },
    { to: "profile", label: "Profile", icon: User },
  ],
  faculty: [
    { to: "", label: "Home", icon: Home },
    { to: "courses", label: "Course Management", icon: BookOpen },
    { to: "notifications", label: "Notifications", icon: Bell },
    { to: "library", label: "Library", icon: BookOpen },
    { to: "profile", label: "Profile", icon: User },
  ],
  admin: [
    { to: "", label: "Overview", icon: Home },
    { to: "users", label: "Users", icon: Users },
    { to: "announcements", label: "Announcements", icon: Megaphone },
    { to: "library", label: "Library", icon: BookOpen },
    { to: "reports", label: "Reports", icon: LineChart },
  ],
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { role } = useParams({ strict: false }) as { role: Role };
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isSuperAdmin = user?.email === "admin@example.com";
  let items = navByRole[role] ?? navByRole.student;

  if (role === "admin" && !isSuperAdmin) {
    items = [
      { to: "", label: "Overview", icon: Home },
      { to: "users", label: "Users", icon: Users },
      { to: "courses", label: "Course approvals", icon: ShieldCheck },
      { to: "announcements", label: "Announcements", icon: Megaphone },
      { to: "library", label: "Library", icon: BookOpen },
      { to: "reports", label: "Reports", icon: LineChart },
    ];
  }

  const meta = roleMeta[role] ?? roleMeta.student;

  const basePath = `/dashboard/${role}`;
  const currentSub = location.pathname.replace(basePath, "").replace(/^\//, "") || "";

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const res = await api.getUnreadNotificationsCount();
      if (res.success && res.data) {
        setUnreadCount(res.data.count);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Prevent accessing dashboards not intended for their actual DB role
  useEffect(() => {
    if (user && user.role !== role) {
      navigate({ to: `/dashboard/${user.role}` });
    }
  }, [user, role, navigate]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Fixed Sidebar */}
      <aside className="hidden w-[270px] shrink-0 flex-col border-r border-[#121b38] bg-[#070c1e] p-4.5 text-white md:flex h-screen sticky top-0 overflow-y-auto">
        <Link to="/" className="mb-8 flex items-center gap-3 px-1.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-md shadow-blue-500/25">
            <GraduationCap className="h-5.5 w-5.5 stroke-[2.2]" />
          </div>
          <div>
            <div className="font-display text-xl font-extrabold tracking-tight leading-tight text-white">Vignan's LMS</div>
            <div className="text-[12px] font-medium text-slate-400 capitalize">{meta.label} workspace</div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1.5">
          {items.map((item) => {
            const active = currentSub === item.to;
            return (
              <Link
                key={item.to || "home"}
                to="/dashboard/$role/$section"
                params={{ role, section: item.to || "home" }}
                className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[14.5px] font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#172454] text-[#3b82f6] shadow-sm border border-[#2b3a78]/50 font-bold"
                    : "text-slate-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className={`h-5 w-5 stroke-[2.2] ${active ? "text-[#3b82f6]" : "text-white"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-4 flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[14.5px] font-semibold text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-rose-400"
        >
          <LogOut className="h-5 w-5 stroke-[2]" />
          Logout
        </button>
      </aside>

      {/* Main Content Area (Independent Scrollbar) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur shadow-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {meta.label}
            </div>
            <div className="font-display text-lg font-bold">{meta.tagline}</div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/$role/$section"
              params={{ role, section: "notifications" }}
              className="relative rounded-full border border-border bg-card p-2 transition hover:bg-secondary"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
              )}
            </Link>
            <Link
              to="/dashboard/$role/$section"
              params={{ role, section: "profile" }}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 transition hover:bg-secondary"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                {user?.name?.[0]?.toUpperCase() || meta.label[0]}
              </div>
              <span className="hidden text-sm font-medium sm:inline">
                {user?.name || meta.label}
              </span>
            </Link>
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-x-hidden p-6 md:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
