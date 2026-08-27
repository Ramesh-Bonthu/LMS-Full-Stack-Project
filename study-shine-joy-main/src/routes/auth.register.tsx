import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, BookOpen, Loader2, Lock, Mail, User, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/lms-data";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Register - Vignan's LMS" },
      { name: "description", content: "Register for Vignan's LMS" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp, isAuthenticated, isLoading, user } = useAuth();
  
  const [step, setStep] = useState<"register" | "verify">("register");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as Role,
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate({
        to: "/dashboard/$role/$section",
        params: { role: user.role, section: "home" },
        replace: true,
      });
    }
  }, [isAuthenticated, navigate, user]);

  const passwordCriteria = [
    { label: "At least 8 characters", met: formData.password.length >= 8 },
    { label: "At least one uppercase letter", met: /[A-Z]/.test(formData.password) },
    { label: "At least one lowercase letter", met: /[a-z]/.test(formData.password) },
    { label: "At least one number", met: /\d/.test(formData.password) },
    { label: "At least one special character (!@#$%^&*)", met: /[!@#$%^&*]/.test(formData.password) },
  ];

  const roles: { value: Role; label: string; icon: React.ComponentType<{ className?: string }> }[] =
    [
      { value: "student", label: "Student", icon: BookOpen },
      { value: "faculty", label: "Faculty", icon: User },
      { value: "admin", label: "Admin", icon: User },
    ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!passwordCriteria.every(c => c.met)) {
      setError("Password does not meet all criteria");
      return;
    }

    const result = await register(formData.name, formData.email, formData.password, formData.role);
    if (result.success) {
      setStep("verify");
      setSuccessMsg("Account created! We've sent a verification code to your email.");
      return;
    }

    setError(result.error || "Registration failed");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    const result = await verifyOtp(formData.email, otp);
    if (result.success) {
      navigate({ to: "/auth/login" });
      return;
    }
    setError(result.error || "Verification failed");
  };

  const handleResend = async () => {
    setError("");
    const result = await resendOtp(formData.email);
    if (result.success) {
      setSuccessMsg("A new code has been sent!");
    } else {
      setError(result.error || "Failed to resend code");
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
            <ShieldCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">Secure Learning</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Your data and privacy are our top priority. Register now to join a verified community.
          </p>
          <div className="mt-8 space-y-4">
            {["Email verification required", "Strong password enforcement", "Encrypted data storage"].map(
              (feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
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
        className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 sm:px-12"
      >
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "register" ? (
              <motion.div
                key="register-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold">Create account</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Register to get started with Vignan's LMS
                  </p>
                </div>

                {error && (
                  <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <span className="text-sm text-destructive">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-xl border border-border bg-white px-4 py-3 pl-10 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

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
                    <label className="mb-2 block text-sm font-medium">Join as</label>
                    <div className="grid grid-cols-3 gap-2">
                      {roles.map((roleOption) => (
                        <button
                          key={roleOption.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: roleOption.value })}
                          className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition ${
                            formData.role === roleOption.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card hover:bg-secondary"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <roleOption.icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{roleOption.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full rounded-xl border border-border bg-white px-4 py-3 pl-10 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    {/* Password criteria checklist */}
                    <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {passwordCriteria.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                          <CheckCircle2 className={`h-3.5 w-3.5 ${c.met ? "text-success" : "text-muted-foreground/30"}`} />
                          <span className={c.met ? "text-foreground font-medium" : "text-muted-foreground"}>
                            {c.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full rounded-xl border border-border bg-white px-4 py-3 pl-10 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                      />
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
                        Creating account...
                      </span>
                    ) : (
                      "Create account"
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="verify-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold">Verify email</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enter the 6-digit code we sent to <span className="font-medium text-foreground">{formData.email}</span>
                  </p>
                </div>

                {successMsg && (
                  <div className="mb-6 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="text-sm text-success">{successMsg}</span>
                  </div>
                )}

                {error && (
                  <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <span className="text-sm text-destructive">{error}</span>
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-center">Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-center tracking-[1em] font-display text-2xl rounded-xl border border-border bg-white px-4 py-4 outline-none transition focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-gradient-primary py-3 font-medium text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      "Verify & Continue"
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Resend code
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("register")}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition"
                  >
                    Change email address
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

