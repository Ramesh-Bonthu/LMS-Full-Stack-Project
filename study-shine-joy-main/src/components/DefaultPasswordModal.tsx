import { useState } from "react";
import { Key, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle, Loader, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { Btn } from "./shared/UIPrimitives";
import { toast } from "sonner";

interface DefaultPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export function DefaultPasswordModal({ isOpen, onClose, userEmail, userName }: DefaultPasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("password123");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Password Complexity Requirements
  const requirements = [
    { label: "At least 8 characters length", met: newPassword.length >= 8 },
    { label: "At least 1 lowercase letter (a-z)", met: /[a-z]/.test(newPassword) },
    { label: "At least 1 capital letter (A-Z)", met: /[A-Z]/.test(newPassword) },
    { label: "At least 1 digit (0-9)", met: /\d/.test(newPassword) },
    { label: "At least 1 special character (!@#$%^&*)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
  ];

  const isPasswordStrong = requirements.every((r) => r.met);
  const isMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim()) return toast.error("Current password is required");
    if (!newPassword.trim()) return toast.error("New password is required");
    if (!isPasswordStrong) {
      return toast.error("New password must meet all 5 security complexity requirements");
    }
    if (newPassword !== confirmPassword) return toast.error("New password and confirm password do not match");

    try {
      setIsSubmitting(true);
      const res = await api.changePassword(oldPassword.trim(), newPassword.trim());

      if (res.success) {
        toast.success(res.message || "Password updated successfully! Confirmation email sent.");
        onClose();
      } else {
        toast.error(res.error || "Failed to update password. Please check your current password.");
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border-2 border-amber-500/30 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header Alert Icon */}
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold shrink-0 shadow-lg shadow-amber-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
              Action Required: Change Password 🔐
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Your account was created with a default password. Please update it now for security.
            </p>
          </div>
        </div>

        {/* Warning Callout Box */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 mb-4 text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Welcome, {userName || "User"}!</span>
          </div>
          <p className="opacity-90">
            To protect your ANITS LMS account (<strong>{userEmail}</strong>), you must set a strong personalized password before proceeding.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Old Password */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Current Default Password *
            </label>
            <div className="relative">
              <input
                required
                type={showOldPassword ? "text" : "password"}
                placeholder="password123"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              New Personal Password *
            </label>
            <div className="relative">
              <input
                required
                type={showNewPassword ? "text" : "password"}
                placeholder="e.g. Anits@2026"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Live Password Strength Requirements Checklist */}
            {newPassword.length > 0 && (
              <div className="mt-2.5 p-3 rounded-xl border border-border bg-secondary/20 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Password Strength Requirements:
                </div>
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {req.met ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                    )}
                    <span className={req.met ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                required
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Match Status */}
            {confirmPassword.length > 0 && (
              <div className="mt-2.5">
                {isMatch ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl animate-in fade-in duration-150">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Passwords Match Perfectly ✓</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl animate-in fade-in duration-150">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                    <span>Passwords Do Not Match ✗</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2 pt-2">
            <Btn
              type="submit"
              className="w-full py-3 font-bold cursor-pointer bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !isPasswordStrong || !isMatch}
            >
              {isSubmitting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                "Save & Activate New Password ✓"
              )}
            </Btn>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground py-1.5 cursor-pointer"
            >
              Remind Me Later
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

