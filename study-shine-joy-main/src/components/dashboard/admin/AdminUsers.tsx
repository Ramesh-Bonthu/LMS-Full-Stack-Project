import { useState, useEffect } from "react";
import { ShieldCheck, GraduationCap, Users, UserCheck, Search, Plus, X, UserPlus, Loader, Clock, Calendar, Award, FileText, CheckCircle2, User } from "lucide-react";
import { type AdminUser, type UserActivityLogsResponse, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader, Card, Btn, StatusPill } from "../../shared/UIPrimitives";
import { toast } from "sonner";

type RoleFilter = "ALL" | "ADMIN" | "FACULTY" | "STUDENT";

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.email === "admin@example.com";
  const hodBranch = currentUser?.branch || "";

  const [usersData, setUsersData] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("Overall");
  const [branchFilter, setBranchFilter] = useState("Overall");
  const [semFilter, setSemFilter] = useState("Overall");

  // User Activity & Performance Logs Modal States
  const [selectedUserLogs, setSelectedUserLogs] = useState<UserActivityLogsResponse | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeLogsTab, setActiveLogsTab] = useState<"overview" | "login" | "assignments" | "quizzes" | "attendance">("overview");

  const handleOpenUserLogs = async (userItem: any) => {
    try {
      setIsLogsModalOpen(true);
      setLogsLoading(true);
      setActiveLogsTab("overview");
      const res = await api.getUserActivityLogs(userItem.id);
      if (res.success && res.data) {
        setSelectedUserLogs(res.data);
      } else {
        toast.error("Failed to load user activity logs.");
      }
    } catch (err: any) {
      console.error("Error loading logs:", err);
      toast.error(err.message || "Error fetching activity logs.");
    } finally {
      setLogsLoading(false);
    }
  };

  // Create New User Modal Dialog States & Step Wizard
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserBranch, setNewUserBranch] = useState(hodBranch || "CSE");
  const [newUserRole, setNewUserRole] = useState(isSuperAdmin ? "ADMIN" : "FACULTY");
  const [newUserPassword, setNewUserPassword] = useState("password123");
  const [newUserStaffId, setNewUserStaffId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(45);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      if (res.success && res.data) {
        setUsersData(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 45-second Resend OTP Cooldown Countdown Timer
  useEffect(() => {
    let timer: any;
    if (isCreateModalOpen && createStep === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCreateModalOpen, createStep, resendCooldown]);

  const resetCreateForm = () => {
    setIsCreateModalOpen(false);
    setCreateStep(1);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPhone("");
    setNewUserBranch(hodBranch || "CSE");
    setNewUserRole(isSuperAdmin ? "ADMIN" : "FACULTY");
    setNewUserPassword("password123");
    setNewUserStaffId("");
    setOtpCode("");
    setResendCooldown(45);
    setIsSubmitting(false);
  };

  // Step 1: Send OTP to Candidate Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newUserName.trim()) return toast.error("Full Name is required");
    if (!newUserEmail.trim()) return toast.error("Email Address is required");

    if (createStep === 2 && resendCooldown > 0) {
      return toast.error(`Please wait ${resendCooldown} seconds before requesting a new OTP.`);
    }

    try {
      setIsSubmitting(true);
      const targetRole = isSuperAdmin ? "ADMIN" : "FACULTY";

      const res = await api.sendUserOtp({
        email: newUserEmail,
        name: newUserName,
        role: targetRole,
      });

      if (res.success) {
        toast.success(res.message || `Verification OTP sent to ${newUserEmail}`);
        setCreateStep(2);
        setResendCooldown(45); // Reset 45-second timer
      } else {
        toast.error(res.error || "Failed to send verification OTP");
      }
    } catch (error: any) {
      toast.error(error.message || "Error sending verification OTP");
    } finally {
      setIsSubmitting(false);
    }
  };


  // Step 2: Verify OTP and Create Account with Credentials Mail
  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return toast.error("Please enter the 6-digit OTP code");
    if (otpCode.trim().length !== 6) return toast.error("OTP code must be exactly 6 digits");

    try {
      setIsSubmitting(true);

      const targetRole = isSuperAdmin ? "ADMIN" : "FACULTY";
      const targetBranch = isSuperAdmin ? newUserBranch : hodBranch;

      const payload: any = {
        name: newUserName,
        email: newUserEmail,
        phone: newUserPhone,
        branch: targetBranch,
        role: targetRole,
        password: newUserPassword || "password123",
        otp: otpCode.trim(),
      };

      if (targetRole === "ADMIN") {
        payload.hodId = newUserStaffId;
      } else if (targetRole === "FACULTY") {
        payload.facultyId = newUserStaffId;
      }

      const res = await api.verifyAndCreateUser(payload);

      if (res.success) {
        toast.success(res.message || "Email verified & account created! Login credentials sent to email.");
        resetCreateForm();
        await fetchUsers();
      } else {
        toast.error(res.error || "Failed to verify OTP or create user");
      }
    } catch (error: any) {
      toast.error(error.message || "Error creating user account");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleApprove = async (userId: number) => {
    const res = await api.approveUser(userId.toString());
    if (res.success) await fetchUsers();
  };

  const handleReject = async (userId: number) => {
    const res = await api.rejectUser(userId.toString());
    if (res.success) await fetchUsers();
  };

  // Scope user data for department HOD vs Super Admin
  const scopedUsers = (isSuperAdmin || !hodBranch)
    ? usersData
    : usersData.filter((u: any) => u.branch === hodBranch);

  // Counts by role
  const totalCount = scopedUsers.length;
  const adminUsers = scopedUsers.filter((u) => u.role?.toUpperCase() === "ADMIN");
  const facultyUsers = scopedUsers.filter((u) => u.role?.toUpperCase() === "FACULTY");
  const studentUsers = scopedUsers.filter((u) => u.role?.toUpperCase() === "STUDENT");

  const getSemOptionsForYear = (yr: string) => {
    if (yr === "1st Year") return ["Overall", "1st Sem", "2nd Sem"];
    if (yr === "2nd Year") return ["Overall", "3rd Sem", "4th Sem"];
    if (yr === "3rd Year") return ["Overall", "5th Sem", "6th Sem"];
    if (yr === "4th Year") return ["Overall", "7th Sem", "8th Sem"];
    return ["Overall", "1st Sem", "2nd Sem", "3rd Sem", "4th Sem", "5th Sem", "6th Sem", "7th Sem", "8th Sem"];
  };

  const handleYearFilterChange = (newYear: string) => {
    setYearFilter(newYear);
    const validSemOptions = getSemOptionsForYear(newYear);
    if (!validSemOptions.includes(semFilter)) {
      setSemFilter("Overall");
    }
  };

  // Filtered users for table
  const filteredUsers = scopedUsers
    .filter((u: any) => {
      if (selectedRole !== "ALL" && u.role?.toUpperCase() !== selectedRole) return false;
      if (yearFilter !== "Overall" && u.year !== yearFilter) return false;
      if (branchFilter !== "Overall" && u.branch !== branchFilter) return false;
      if (semFilter !== "Overall") {
        const uSem = (u.sem || "").toLowerCase();
        const fSem = semFilter.toLowerCase();
        if (uSem !== fSem && !uSem.includes(fSem) && !fSem.includes(uSem)) return false;
      }
      return true;
    })
    .filter(
      (u: any) =>
        (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.rollNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.facultyId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.hodId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.role || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  const roleCardConfigs = [
    {
      role: "ADMIN" as RoleFilter,
      title: "Admin Users",
      count: adminUsers.length,
      subtitle: "System Administrators",
      icon: ShieldCheck,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    },
    {
      role: "FACULTY" as RoleFilter,
      title: "Faculty Members",
      count: facultyUsers.length,
      subtitle: "Course Instructors",
      icon: GraduationCap,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    {
      role: "STUDENT" as RoleFilter,
      title: "Student Users",
      count: studentUsers.length,
      subtitle: "Enrolled Learners",
      icon: Users,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">User Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isSuperAdmin
              ? "Oversee platform members and create new Department HOD accounts."
              : `Manage ${hodBranch} Department staff and create new Faculty member accounts.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* New Create Button */}
          <Btn
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 text-xs font-bold shadow-glow py-2.5 px-4 bg-[#2563eb] text-white hover:bg-[#1d4ed8] cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Create
          </Btn>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-2.5 flex items-center gap-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Members</div>
              <div className="text-xl font-bold text-primary font-display">{totalCount} Users Registered</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 ROLE CATEGORY CARDS */}
      <div className="grid gap-5 md:grid-cols-3">
        {roleCardConfigs.map((cfg) => {
          const Icon = cfg.icon;
          const isSelected = selectedRole === cfg.role;

          return (
            <Card
              key={cfg.role}
              onClick={() => setSelectedRole(isSelected ? "ALL" : cfg.role)}
              className={`p-5 cursor-pointer transition-all duration-200 border-2 relative overflow-hidden ${
                isSelected
                  ? `border-primary bg-primary-soft/30 shadow-md ring-2 ring-primary/20 scale-[1.02]`
                  : "border-border bg-card hover:border-primary/40 hover:shadow-soft"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${cfg.bgColor} ${cfg.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isSelected ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isSelected ? "Filter Active ✓" : "Click to Filter"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-foreground">{cfg.title}</h3>
                  <div className="font-display text-2xl font-extrabold text-foreground">
                    {cfg.count} <span className="text-xs font-semibold text-muted-foreground">members</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{cfg.subtitle}</p>
              </div>

              {isSelected && (
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                  <div className="absolute transform rotate-45 bg-primary text-white text-[9px] font-bold py-0.5 right-[-35px] top-[15px] w-[120px] text-center shadow">
                    SELECTED
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* MEMBERS LIST TABLE CARD */}
      <Card className="p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-5">
          <div>
            <h3 className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {selectedRole === "ALL"
                ? `All Platform Members (${filteredUsers.length})`
                : `${selectedRole} Members List (${filteredUsers.length})`}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedRole === "ALL"
                ? "Showing all registered users. Click any card above to filter by role."
                : `Filtered to display registered ${selectedRole.toLowerCase()} accounts.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Inline Filter Controls: Year, Branch, Sem */}
            <div className="flex flex-wrap items-center gap-1.5 bg-secondary/50 p-1 rounded-2xl border border-border w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-card px-2.5 py-1 rounded-xl border border-border text-xs font-medium">
                <span className="text-muted-foreground font-semibold">Year:</span>
                <select
                  value={yearFilter}
                  onChange={(e) => handleYearFilterChange(e.target.value)}
                  className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="Overall">Overall</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-card px-2.5 py-1 rounded-xl border border-border text-xs font-medium">
                <span className="text-muted-foreground font-semibold">Branch:</span>
                <select
                  value={(!isSuperAdmin && hodBranch) ? hodBranch : branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  disabled={!isSuperAdmin && !!hodBranch}
                  className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer disabled:opacity-80"
                >
                  {(!isSuperAdmin && hodBranch) ? (
                    <option value={hodBranch}>{hodBranch}</option>
                  ) : (
                    <>
                      <option value="Overall">Overall</option>
                      <option value="CSE">CSE</option>
                      <option value="AI & ML">AI & ML</option>
                      <option value="AI & DS">AI & DS</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-card px-2.5 py-1 rounded-xl border border-border text-xs font-medium">
                <span className="text-muted-foreground font-semibold">Sem:</span>
                <select
                  value={semFilter}
                  onChange={(e) => setSemFilter(e.target.value)}
                  className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  {getSemOptionsForYear(yearFilter).map((semOpt) => (
                    <option key={semOpt} value={semOpt}>
                      {semOpt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(selectedRole !== "ALL" || yearFilter !== "Overall" || branchFilter !== "Overall" || semFilter !== "Overall") && (
              <button
                onClick={() => {
                  setSelectedRole("ALL");
                  setYearFilter("Overall");
                  setBranchFilter("Overall");
                  setSemFilter("Overall");
                }}
                className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition cursor-pointer"
              >
                Clear Filters
              </button>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search by name, email, phone, roll no, or staff ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-full border border-border bg-card py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-ring/40 w-full sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Members List Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
                  <th className="pb-3 font-semibold">User Details</th>
                  <th className="pb-3 font-semibold">ID / Roll No</th>
                  <th className="pb-3 font-semibold">Role & Branch</th>
                  <th className="pb-3 font-semibold">Academic Info</th>
                  <th className="pb-3 font-semibold">Account Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((entry: any) => {
                  const roleStr = entry.role?.toUpperCase() || "USER";
                  const roleBadgeClass =
                    roleStr === "ADMIN"
                      ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                      : roleStr === "FACULTY"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

                  const displayId =
                    roleStr === "STUDENT"
                      ? entry.rollNo || "N/A"
                      : roleStr === "FACULTY"
                      ? entry.facultyId || "N/A"
                      : entry.hodId || "N/A";

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => handleOpenUserLogs(entry)}
                      className="border-b border-border/50 transition hover:bg-primary/5 cursor-pointer group"
                      title="Click to view full user activity logs & details"
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold font-display text-sm shrink-0">
                            {entry.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{entry.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {entry.email} {entry.phone ? `• ${entry.phone}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 font-mono text-[11px] font-bold text-foreground">
                        {displayId}
                      </td>

                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase ${roleBadgeClass}`}>
                            {roleStr === "ADMIN" ? "HOD / ADMIN" : roleStr}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-lg">
                            {entry.branch || "General"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5">
                        {roleStr === "STUDENT" ? (
                          <div className="flex items-center gap-1.5 text-foreground font-medium text-[11px]">
                            <span className="font-semibold text-primary">{entry.year || "1st Year"}</span> • 
                            <span>{entry.sem || "1st Sem"}</span> • 
                            <span className="rounded bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-bold">Sec {entry.section || "A"}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Department Staff</span>
                        )}
                      </td>

                      <td className="py-3.5">
                        <StatusPill status={entry.active ? "Active" : "Rejected"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground italic">
            No users found matching the selected filter.
          </div>
        )}
      </Card>

      {/* CREATE NEW USER DIALOG MODAL (2-STEP OTP & CREDENTIAL MAIL FLOW) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-foreground">
                    {createStep === 1
                      ? isSuperAdmin
                        ? "Create New Department HOD"
                        : `Create New Faculty Member (${hodBranch})`
                      : "Verify Email Address 🔐"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {createStep === 1
                      ? isSuperAdmin
                        ? "Step 1/2: Fill HOD details to send verification OTP."
                        : `Step 1/2: Fill Faculty details to send verification OTP.`
                      : `Step 2/2: Enter the 6-digit OTP sent to ${newUserEmail}`}
                  </p>
                </div>
              </div>
              <button
                onClick={resetCreateForm}
                className="text-muted-foreground hover:text-foreground transition rounded-lg p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* STEP 1: Details & Send OTP Form */}
            {createStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Full Name *
                  </label>
                  <input
                    required
                    placeholder={isSuperAdmin ? "e.g. Dr. K. V. Ramana (HOD)" : "e.g. Prof. S. Sharma"}
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                  />
                </div>

                {/* Email & Phone Number Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      placeholder={isSuperAdmin ? "e.g. hodcse@anits.edu.in" : "e.g. faculty.cse@anits.edu.in"}
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                    />
                  </div>
                </div>

                {/* User Role Permission & Branch / Department Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Assigned Role / Permission
                    </label>
                    <div className="w-full rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2.5 text-sm font-bold text-purple-600 dark:text-purple-300 flex items-center justify-between">
                      <span>{isSuperAdmin ? "🛡️ Department HOD (ADMIN)" : "🎓 Faculty Member (FACULTY)"}</span>
                      <span className="text-[10px] uppercase tracking-wide bg-purple-500/20 px-2 py-0.5 rounded font-extrabold">
                        LOCKED
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Branch / Department *
                    </label>
                    {isSuperAdmin ? (
                      <select
                        value={newUserBranch}
                        onChange={(e) => setNewUserBranch(e.target.value)}
                        className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer uppercase"
                      >
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="MECH">MECH</option>
                        <option value="CIVIL">CIVIL</option>
                        <option value="IT">IT</option>
                        <option value="AI & ML">AI & ML</option>
                        <option value="AI & DS">AI & DS</option>
                      </select>
                    ) : (
                      <div className="w-full rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-sm font-bold text-primary flex items-center justify-between">
                        <span>{hodBranch} Department</span>
                        <span className="text-[10px] uppercase tracking-wide bg-primary/20 px-2 py-0.5 rounded font-extrabold">
                          HOD BRANCH
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Default Password & Custom Staff ID Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Default Password
                    </label>
                    <input
                      type="text"
                      placeholder="password123"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      {isSuperAdmin ? "HOD Staff ID (Optional)" : "Faculty Staff ID (Optional)"}
                    </label>
                    <input
                      placeholder={isSuperAdmin ? "e.g. HODCSE01" : "e.g. FACCSE01"}
                      value={newUserStaffId}
                      onChange={(e) => setNewUserStaffId(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Step 1 Action Buttons */}
                <div className="mt-6 flex gap-3 pt-2">
                  <Btn type="button" variant="ghost" className="flex-1 cursor-pointer" onClick={resetCreateForm} disabled={isSubmitting}>
                    Cancel
                  </Btn>
                  <Btn type="submit" className="flex-1 cursor-pointer bg-[#2563eb] text-white hover:bg-[#1d4ed8]" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      "Send Verification OTP →"
                    )}
                  </Btn>
                </div>
              </form>
            ) : (
              /* STEP 2: Verify OTP & Create Account Form */
              <form onSubmit={handleVerifyAndCreate} className="space-y-5">
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-blue-800 dark:text-blue-200">
                    <span>📩 Verification Code Sent</span>
                  </div>
                  <p>
                    We have dispatched a 6-digit OTP code to <strong className="underline">{newUserEmail}</strong>. Please enter the code below to verify the email address.
                  </p>
                </div>

                {/* 6-Digit OTP Code Input */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2 text-center">
                    Enter 6-Digit OTP Verification Code *
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center text-3xl font-mono font-bold tracking-[12px] py-3.5 rounded-xl border-2 border-primary/40 bg-secondary/20 text-primary outline-none focus:ring-4 focus:ring-primary/20"
                  />
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-[11px] text-emerald-700 dark:text-emerald-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <span>✨ What happens upon verification?</span>
                  </div>
                  <p className="text-[11px] opacity-90">
                    Once verified, the account for <strong>{newUserName}</strong> will be registered, and a welcome email containing their <strong>Login Email & Password</strong> will be automatically delivered to their inbox.
                  </p>
                </div>

                {/* Step 2 Action Buttons */}
                <div className="mt-6 space-y-2 pt-2">
                  <Btn type="submit" className="w-full py-3 text-sm font-bold cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      "Verify OTP & Create Account ✓"
                    )}
                  </Btn>

                  <div className="flex gap-2 pt-1">
                    <Btn type="button" variant="ghost" className="flex-1 text-xs cursor-pointer" onClick={() => setCreateStep(1)} disabled={isSubmitting}>
                      ← Edit Details
                    </Btn>
                    <Btn 
                      type="button" 
                      variant="ghost" 
                      className="flex-1 text-xs cursor-pointer text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed" 
                      onClick={() => handleSendOtp()} 
                      disabled={isSubmitting || resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                    </Btn>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* USER ACTIVITY & PERFORMANCE LOGS MODAL DIALOG */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground font-bold font-display text-lg shadow-md shrink-0">
                  {selectedUserLogs?.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {selectedUserLogs?.user?.name || "User Logs"}
                    </h3>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20 uppercase">
                      {selectedUserLogs?.user?.role || "USER"}
                    </span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                      {selectedUserLogs?.user?.branch || "GENERAL"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedUserLogs?.user?.email} • Detailed Activity & Performance Audit
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsLogsModalOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {logsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Loading user activity and logs...</span>
              </div>
            ) : selectedUserLogs ? (
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
                  {[
                    { id: "overview", label: "Overview & Info", icon: User },
                    { id: "login", label: "Login Logs", icon: Clock },
                    { id: "assignments", label: `Assignments (${selectedUserLogs.submissions?.length || 0})`, icon: FileText },
                    { id: "quizzes", label: `Quizzes (${selectedUserLogs.quizzes?.length || 0})`, icon: Award },
                    { id: "attendance", label: `Attendance (${selectedUserLogs.stats?.attendancePercentage || 0}%)`, icon: Calendar },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveLogsTab(tab.id as any)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        activeLogsTab === tab.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB 1: OVERVIEW & INFO */}
                {activeLogsTab === "overview" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Roll / Staff ID</div>
                        <div className="mt-1 font-mono text-sm font-bold text-foreground">
                          {selectedUserLogs.user.rollNo || selectedUserLogs.user.facultyId || selectedUserLogs.user.hodId || "N/A"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Academic Info</div>
                        <div className="mt-1 text-sm font-bold text-foreground">
                          {selectedUserLogs.user.year} • {selectedUserLogs.user.sem} (Sec {selectedUserLogs.user.section})
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Phone & Contact</div>
                        <div className="mt-1 text-sm font-bold text-foreground">
                          {selectedUserLogs.user.phone || "Not Provided"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Account Status</div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${selectedUserLogs.user.active ? "bg-emerald-500" : "bg-destructive"}`} />
                          <span className="text-sm font-bold">{selectedUserLogs.user.active ? "Active" : "Inactive"}</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Email Verification</div>
                        <div className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Verified Email
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Joined Platform</div>
                        <div className="mt-1 text-sm font-bold text-foreground">
                          {new Date(selectedUserLogs.user.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </div>
                      </div>
                    </div>

                    {selectedUserLogs.user.bio && (
                      <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                        <div className="text-xs font-bold uppercase text-muted-foreground mb-1">About / Bio</div>
                        <p className="text-xs text-foreground leading-relaxed">{selectedUserLogs.user.bio}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: LOGIN LOGS */}
                {activeLogsTab === "login" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Last Login Timestamp</div>
                        <div className="mt-1 text-base font-bold text-primary">
                          {selectedUserLogs.user.lastLogin
                            ? new Date(selectedUserLogs.user.lastLogin).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Never Logged In"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Total Sessions</div>
                        <div className="mt-1 text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                          {selectedUserLogs.user.loginCount || 1} Logins
                        </div>
                      </div>

                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Security Status</div>
                        <div className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4" /> Password Configured
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border p-4 space-y-3">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Login Security & Access Record</h4>
                      <div className="divide-y divide-border/50 text-xs">
                        <div className="py-2.5 flex items-center justify-between">
                          <span className="text-muted-foreground">Last Recorded Web Session</span>
                          <span className="font-bold text-foreground">
                            {selectedUserLogs.user.lastLogin
                              ? new Date(selectedUserLogs.user.lastLogin).toLocaleString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                          <span className="text-muted-foreground">Authentication Method</span>
                          <span className="font-bold text-foreground">JWT Session Auth</span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                          <span className="text-muted-foreground">Default Password Status</span>
                          <span className={`font-bold ${selectedUserLogs.user.isDefaultPassword ? "text-amber-500" : "text-emerald-500"}`}>
                            {selectedUserLogs.user.isDefaultPassword ? "Default Password Active" : "Custom Password Set ✓"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: ASSIGNMENTS */}
                {activeLogsTab === "assignments" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Assignments Taken</div>
                        <div className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                          {selectedUserLogs.stats.assignmentsTaken} Submitted
                        </div>
                      </div>

                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Average Score</div>
                        <div className="mt-1 text-2xl font-extrabold text-primary">
                          {selectedUserLogs.stats.avgAssignmentMarks}%
                        </div>
                      </div>
                    </div>

                    {selectedUserLogs.submissions && selectedUserLogs.submissions.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-border">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border bg-secondary/50 text-muted-foreground uppercase font-bold">
                              <th className="p-3">Assignment Title</th>
                              <th className="p-3">Course</th>
                              <th className="p-3">Marks Obtained</th>
                              <th className="p-3">Percentage</th>
                              <th className="p-3">Submitted On</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {selectedUserLogs.submissions.map((sub) => (
                              <tr key={sub.id} className="hover:bg-secondary/20">
                                <td className="p-3 font-bold text-foreground">{sub.assignmentTitle}</td>
                                <td className="p-3 text-muted-foreground">{sub.courseTitle}</td>
                                <td className="p-3 font-mono font-bold text-foreground">
                                  {sub.marks} / {sub.maxMarks}
                                </td>
                                <td className="p-3">
                                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                    {sub.pctScore}%
                                  </span>
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {new Date(sub.submittedAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                        No assignment submissions recorded for this student yet.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: QUIZZES */}
                {activeLogsTab === "quizzes" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Quizzes Attempted</div>
                        <div className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                          {selectedUserLogs.stats.quizzesTaken} Completed
                        </div>
                      </div>

                      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Average Quiz Score</div>
                        <div className="mt-1 text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                          {selectedUserLogs.stats.avgQuizMarks}%
                        </div>
                      </div>
                    </div>

                    {selectedUserLogs.quizzes && selectedUserLogs.quizzes.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-border">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border bg-secondary/50 text-muted-foreground uppercase font-bold">
                              <th className="p-3">Quiz Title</th>
                              <th className="p-3">Course</th>
                              <th className="p-3">Score</th>
                              <th className="p-3">Percentage</th>
                              <th className="p-3">Completed Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {selectedUserLogs.quizzes.map((q) => (
                              <tr key={q.id} className="hover:bg-secondary/20">
                                <td className="p-3 font-bold text-foreground">{q.quizTitle}</td>
                                <td className="p-3 text-muted-foreground">{q.courseTitle}</td>
                                <td className="p-3 font-mono font-bold text-foreground">
                                  {q.score} / {q.totalQuestions}
                                </td>
                                <td className="p-3">
                                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-bold text-amber-600 dark:text-amber-400">
                                    {q.pctScore}%
                                  </span>
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {new Date(q.completedAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                        No quiz attempts recorded for this student yet.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: ATTENDANCE */}
                {activeLogsTab === "attendance" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Attendance Percentage</div>
                        <div className="mt-1 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                          {selectedUserLogs.stats.attendancePercentage}%
                        </div>
                      </div>

                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Attended Sessions</div>
                        <div className="mt-1 text-2xl font-extrabold text-primary">
                          {selectedUserLogs.attendance?.attendedSessions || 0} / {selectedUserLogs.attendance?.totalSessions || 0}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Absent Sessions</div>
                        <div className="mt-1 text-2xl font-extrabold text-destructive">
                          {selectedUserLogs.attendance?.absentSessions || 0} Sessions
                        </div>
                      </div>
                    </div>

                    {selectedUserLogs.attendance?.records && selectedUserLogs.attendance.records.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-border">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border bg-secondary/50 text-muted-foreground uppercase font-bold">
                              <th className="p-3">Date</th>
                              <th className="p-3">Subject / Course</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {selectedUserLogs.attendance.records.map((rec) => (
                              <tr key={rec.id} className="hover:bg-secondary/20">
                                <td className="p-3 font-medium text-foreground">{rec.date}</td>
                                <td className="p-3 text-muted-foreground">{rec.subject}</td>
                                <td className="p-3">
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 font-bold uppercase text-[10px] ${
                                      rec.status?.toUpperCase() === "PRESENT"
                                        ? "bg-emerald-500/10 text-emerald-600"
                                        : "bg-destructive/10 text-destructive"
                                    }`}
                                  >
                                    {rec.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                        No individual attendance session records logged yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}
