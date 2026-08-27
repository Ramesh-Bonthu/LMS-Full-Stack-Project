import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, ClipboardList, Trophy, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { roleMeta, type Role } from "@/lib/lms-data";
import { useEffect } from "react";

const roleAccent: Record<Role, string> = {
  student: "from-sky-100 to-blue-100",
  faculty: "from-violet-100 to-purple-100",
  admin: "from-emerald-100 to-teal-100",
};

export function Landing() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate({
        to: "/dashboard/$role/$section",
        params: { role: user.role, section: "home" },
        replace: true,
      });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-hero">
      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">Vignan's LMS</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition">
            Features
          </a>
          <a href="#roles" className="hover:text-foreground transition">
            Roles
          </a>
          <a href="#workflow" className="hover:text-foreground transition">
            Workflow
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/auth/login"
            className="rounded-full border border-foreground px-5 py-2 text-sm font-medium transition hover:bg-foreground hover:text-background"
          >
            Sign in
          </Link>
          <Link
            to="/auth/register"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition hover:opacity-90"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-24 text-center">

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl"
        >
          Learning, beautifully{" "}
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            organized.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground"
        >
          One LMS for students, faculty and admins — courses, assignments, quizzes and analytics,
          all in a soft, distraction-free workspace.
        </motion.p>

        {/* Role picker */}
        <div id="roles" className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
          {(Object.keys(roleMeta) as Role[]).map((role, i) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
            >
              <Link
                to="/auth/login"
                className="group relative block overflow-hidden rounded-3xl border border-border bg-card p-6 text-left shadow-soft transition hover:-translate-y-1 hover:shadow-glow"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${roleAccent[role]} opacity-70`}
                />
                <div className="relative">
                  <div className="text-4xl">{roleMeta[role].emoji}</div>
                  <h3 className="mt-6 text-xl font-bold">{roleMeta[role].label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{roleMeta[role].tagline}</p>
                  <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Get started
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "Courses & content",
              text: "Beautiful course pages with PDFs, videos and structured units.",
            },
            {
              icon: ClipboardList,
              title: "Assignments & quizzes",
              text: "Submit, evaluate and review with instant feedback loops.",
            },
            {
              icon: Trophy,
              title: "Performance tracking",
              text: "Visual marks, attendance and progress at a glance.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-border bg-gradient-card p-7 shadow-soft"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h4 className="mt-5 text-lg font-bold">{f.title}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="mx-auto max-w-7xl px-6 pb-28">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft md:p-12">
          <h2 className="text-3xl font-bold md:text-4xl">How it flows</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            From course creation to performance — one clear path.
          </p>
          <ol className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              "Faculty creates",
              "Admin approves",
              "Student enrolls",
              "Content & tasks",
              "Submit & quiz",
              "Track performance",
            ].map((step, i) => (
              <li
                key={step}
                className="rounded-2xl border border-border bg-secondary/60 p-4 text-sm"
              >
                <div className="font-display text-2xl font-bold text-primary">0{i + 1}</div>
                <div className="mt-1 font-medium">{step}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Vignan's LMS · Crafted for calm learning
      </footer>
    </div>
  );
}
