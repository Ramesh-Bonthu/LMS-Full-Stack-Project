import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { AlertCircle, Loader2, Lock, LogIn, Mail } from "lucide-react";
import type { Role } from "@/lib/lms-data";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [{ title: "Login - Vignan's LMS" }, { name: "description", content: "Login to Vignan's LMS" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate({
        to: "/dashboard/$role/$section",
        params: { role: user.role, section: "home" },
        replace: true,
      });
    }
  }, [isAuthenticated, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    const result = await login(formData.email, formData.password);
    if (result.success) {
      const userStr = localStorage.getItem("user");
      const userData = userStr ? (JSON.parse(userStr) as { role?: Role }) : null;

      navigate({
        to: "/dashboard/$role/$section",
        params: { role: userData?.role || "student", section: "home" },
      });
      return;
    }

    if (result.requiresVerification) {
      setError("Email not verified. Please check your email for the OTP.");
      // Optionally redirect to register with step=verify, but that requires more state passing.
      // For now, clear the error and tell them to verify.
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <div suppressHydrationWarning className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden flex-1 flex-col items-center justify-center px-8 lg:flex"
      >
        <div className="max-w-md">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-primary shadow-lg">
            <LogIn className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Your learning platform awaits. Sign in to continue.
          </p>
          <div className="mt-8 space-y-4">
            {["Access all your courses", "Submit assignments", "Track your progress"].map(
              (feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm text-primary">+</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12"
      >
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access Vignan's LMS
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
            >
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 pl-10 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium">Password</label>
                <span className="text-xs text-muted-foreground">
                  Use the seeded demo accounts below
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="password123"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 pl-10 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-primary py-3 font-medium text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/auth/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-border/50 bg-secondary/30 p-4">
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Demo credentials
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Student:</span> student@example.com / password123
              </div>
              <div>
                <span className="font-medium">Faculty:</span> faculty@example.com / password123
              </div>
              <div>
                <span className="font-medium">Admin:</span> admin@example.com / password123
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
