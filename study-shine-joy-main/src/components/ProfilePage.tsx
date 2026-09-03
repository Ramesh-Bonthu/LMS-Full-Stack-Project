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
  Loader
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

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

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
            <Btn onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4" /> Edit Profile
            </Btn>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Avatar & Basic Info */}
        <div className="space-y-6">
          <Card className="text-center">
            <div className="relative mx-auto mb-4 h-32 w-32">
              <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-5xl font-bold text-white shadow-xl">
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
    </>
  );
}
