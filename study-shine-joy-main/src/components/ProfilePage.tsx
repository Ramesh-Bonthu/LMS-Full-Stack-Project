import { useState, useEffect } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Globe, 
  Github, 
  Twitter, 
  Linkedin,
  Plus,
  Loader,
  Key,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { type UserProfile, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "./shared/UIPrimitives";
import { toast } from "sonner";

export function ProfilePage({ role }: { role: Role }) {
  const { user: authUser, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [socials, setSocials] = useState<Record<string, string>>({});

  // Change Password State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getUserProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setEditName(res.data.name);
        setEditBio(res.data.bio || "");
        setSkills(res.data.skills || []);
        setSocials(res.data.socialLinks || {});
      }
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await api.updateProfile({
        name: editName,
        bio: editBio,
        skills,
        socialLinks: socials
      });
      if (res.success) {
        toast.success("Profile updated successfully");
        updateUser({ name: editName });
        setIsEditing(false);
        fetchProfile();
      } else {
        toast.error(res.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Password Strength Requirements
  const passwordRequirements = [
    { label: "At least 8 characters length", met: newPassword.length >= 8 },
    { label: "At least 1 lowercase letter (a-z)", met: /[a-z]/.test(newPassword) },
    { label: "At least 1 capital letter (A-Z)", met: /[A-Z]/.test(newPassword) },
    { label: "At least 1 digit (0-9)", met: /\d/.test(newPassword) },
    { label: "At least 1 special character (!@#$%^&*)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
  ];

  const isPasswordStrong = passwordRequirements.every((r) => r.met);
  const isMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) return toast.error("Current Password is required");
    if (!newPassword) return toast.error("New Password is required");
    if (!isPasswordStrong) {
      return toast.error("New Password must satisfy all 5 complexity requirements (8+ chars, uppercase, lowercase, digit, and special char)");
    }
    if (newPassword !== confirmPassword) return toast.error("New Password and Confirm Password do not match");

    try {
      setIsChangingPassword(true);
      const res = await api.changePassword(oldPassword, newPassword);

      if (res.success) {
        toast.success(res.message || "Your password has been changed successfully! A confirmation email has been sent.");
        setIsChangePasswordOpen(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (profile) {
          setProfile({ ...profile, isDefaultPassword: false });
        }
      } else {
        toast.error(res.error || "Failed to change password. Please verify current password.");
      }
    } catch (error: any) {
      toast.error(error.message || "Error changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  // Profile Completion Percentage Breakdown (Total 100%)
  const completionItems = [
    { label: "Basic Info (Name & Email)", completed: !!(profile?.name && profile?.email), weight: 20 },
    { label: "About Me / Bio", completed: !!(profile?.bio && profile.bio.trim().length > 0), weight: 20 },
    { label: "Skills & Expertise", completed: !!(skills && skills.length > 0), weight: 20 },
    { label: "GitHub Link", completed: !!(socials.github && socials.github.trim().length > 0), weight: 10 },
    { label: "LinkedIn Link", completed: !!(socials.linkedin && socials.linkedin.trim().length > 0), weight: 10 },
    { label: "Twitter Link", completed: !!(socials.twitter && socials.twitter.trim().length > 0), weight: 10 },
    { label: "Website Link", completed: !!(socials.website && socials.website.trim().length > 0), weight: 10 },
  ];

  const completionPercentage = completionItems.reduce((acc, item) => acc + (item.completed ? item.weight : 0), 0);

  if (loading && !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Profile" 
        subtitle="Manage your identity and public presence."
        action={
          !isEditing ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Compact Profile Completion Progress Widget */}
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2 shadow-xs">
                <Sparkles className={`h-4 w-4 ${completionPercentage === 100 ? "text-emerald-500" : "text-primary"}`} />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Profile:</span>
                  <span className={`text-xs font-extrabold ${completionPercentage === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}>
                    {completionPercentage}%
                  </span>
                </div>
                <div className="w-16 sm:w-20 bg-secondary rounded-full h-2 overflow-hidden border border-border/40 shrink-0">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      completionPercentage === 100
                        ? "bg-emerald-500"
                        : completionPercentage >= 50
                        ? "bg-[#2563eb]"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              <Btn 
                variant="outline"
                onClick={() => setIsChangePasswordOpen(true)}
                className="flex items-center gap-2 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold cursor-pointer"
              >
                <Key className="h-4 w-4" /> Change Password
              </Btn>

              <Btn onClick={() => setIsEditing(true)} className="cursor-pointer">
                <Edit3 className="h-4 w-4" /> Edit Profile
              </Btn>
            </div>
          ) : (
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" /> Cancel
              </Btn>
              <Btn onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Changes"}
              </Btn>
            </div>
          )
        }
      />

      {/* DEFAULT PASSWORD INITIAL WARNING BANNER */}
      {profile?.isDefaultPassword && (
        <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 p-4 mb-6 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-xl shrink-0 shadow-md">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 font-display flex items-center gap-2">
                Initial Default Password Security Warning
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                You are currently signed in with a default initial password. For security reasons, please update your password immediately.
              </p>
            </div>
          </div>
          <Btn
            onClick={() => setIsChangePasswordOpen(true)}
            className="bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold py-2.5 px-4 shadow-sm cursor-pointer shrink-0"
          >
            <Key className="h-4 w-4 mr-1.5" /> Change Password Now
          </Btn>
        </div>
      )}




      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Avatar & Basic Info */}
        <div className="space-y-6">
          <Card className="text-center">
            <div className="relative mx-auto mb-4 h-32 w-32">
              <div className="flex h-full w-full items-center justify-center rounded-3xl bg-[#2563eb] text-5xl font-bold text-white shadow-xl">
                {profile?.name?.[0] || role?.[0].toUpperCase()}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 rounded-xl bg-card p-2 shadow-lg border border-border hover:bg-secondary">
                  <Edit3 className="h-4 w-4 text-primary" />
                </button>
              )}
            </div>
            <h2 className="text-xl font-bold">
              {isEditing ? (
                <div className="relative">
                  <input 
                    value={editName}
                    disabled={true}
                    readOnly={true}
                    title="Faculty name is fixed and cannot be modified"
                    className="w-full rounded-lg border border-border/80 bg-secondary/40 px-3 py-1 text-center font-bold text-foreground/80 cursor-not-allowed outline-none select-none"
                  />
                </div>
              ) : (
                profile?.name
              )}
            </h2>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mt-1">
              {role}
            </p>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Social Links</h3>
            <div className="space-y-3">
              {[
                { id: 'github', icon: Github, label: 'GitHub' },
                { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
                { id: 'twitter', icon: Twitter, label: 'Twitter' },
                { id: 'website', icon: Globe, label: 'Website' },
              ].map(social => (
                <div key={social.id} className="flex items-center gap-3">
                  <social.icon className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <input 
                      placeholder={`${social.label} URL`}
                      value={socials[social.id] || ""}
                      onChange={e => setSocials({ ...socials, [social.id]: e.target.value })}
                      className="flex-1 rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground truncate">
                      {socials[social.id] || `Not linked`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Bio & Skills */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">About Me</h3>
            {isEditing ? (
              <textarea 
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                rows={5}
                placeholder="Tell us about yourself..."
                className="w-full rounded-xl border border-border bg-secondary/50 p-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground italic">
                {profile?.bio || "No bio provided yet. Add one to let people know who you are!"}
              </p>
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map(skill => (
                <span 
                  key={skill} 
                  className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary"
                >
                  {skill}
                  {isEditing && (
                    <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
              {skills.length === 0 && !isEditing && (
                <p className="text-sm text-muted-foreground">No skills added yet.</p>
              )}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <input 
                  placeholder="Add a skill (e.g. React, Python)"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  className="flex-1 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Btn onClick={addSkill} variant="soft">
                  <Plus className="h-4 w-4" /> Add
                </Btn>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Account Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</div>
                  <div className="text-sm font-medium">{profile?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20">
                <Shield className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Account Status</div>
                  <div className="text-sm font-medium">{profile?.isVerified ? "Verified" : "Unverified"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Joined On</div>
                  <div className="text-sm font-medium">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20">
                <UserIcon className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">User ID</div>
                  <div className="text-sm font-medium">#{profile?.id}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CHANGE PASSWORD DIALOG MODAL */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-foreground">Change Account Password</h3>
                  <p className="text-xs text-muted-foreground">Verify old password and enter your new password</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-muted-foreground hover:text-foreground transition rounded-lg p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Old Password */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    required
                    type={showOldPassword ? "text" : "password"}
                    placeholder="Enter current password"
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
                  New Password *
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
                    {passwordRequirements.map((req, idx) => (
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

              {/* Actions */}
              <div className="mt-6 flex gap-3 pt-2">
                <Btn
                  type="button"
                  variant="ghost"
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={isChangingPassword}
                >
                  Cancel
                </Btn>
                <Btn
                  type="submit"
                  className="flex-1 cursor-pointer bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isChangingPassword || !isPasswordStrong || !isMatch}
                >
                  {isChangingPassword ? <Loader className="h-4 w-4 animate-spin" /> : "Update Password ✓"}
                </Btn>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

