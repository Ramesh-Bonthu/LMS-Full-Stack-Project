const { User, Course, Assignment, Submission, QuizAttempt, Quiz, AttendanceRecord } = require("../models");
const { sendAdminUserOtpEmail, sendWelcomeCredentialsEmail } = require("../utils/mailer");

// In-memory store for OTPs generated during HOD / Faculty account creation
const adminOtpStore = new Map();

exports.getAllUsers = async (req, res) => {
  const users = await User.findAll();
  const defaultYears = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const defaultBranches = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"];
  const defaultSems = ["Sem 1", "Sem 2"];

  return res.json(
    users.map((user, idx) => {
      let history = [];
      if (Array.isArray(user.loginHistory)) {
        history = user.loginHistory;
      } else if (typeof user.loginHistory === "string") {
        try {
          const parsed = JSON.parse(user.loginHistory);
          if (Array.isArray(parsed)) history = parsed;
        } catch (e) {
          history = [];
        }
      }
      if (history.length === 0 && user.lastLogin) {
        history = [user.lastLogin];
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || null,
        year: user.year || defaultYears[idx % defaultYears.length],
        branch: user.branch || defaultBranches[idx % defaultBranches.length],
        sem: user.sem || defaultSems[idx % defaultSems.length],
        section: user.section || "A",
        rollNo: user.rollNo || null,
        facultyId: user.facultyId || null,
        hodId: user.hodId || null,
        active: user.active,
        createdAt: user.createdAt,
        status: user.active ? "Active" : "Pending",
        lastLogin: user.lastLogin || null,
        loginCount: user.loginCount || (user.lastLogin ? 1 : 0),
        loginHistory: history,
      };
    })
  );
};

// STEP 1: Generate & Send OTP to candidate email address for HOD / Faculty creation
exports.sendCreateUserOtp = async (req, res) => {
  try {
    const { email, role, name } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Target Email address is required." });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const existingUser = await User.findOne({ where: { email: emailTrimmed } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: `A user with email ${emailTrimmed} already exists in ANITS LMS.` });
    }

    const creatorEmail = req.user?.email || "";
    const creatorBranch = req.user?.branch || "";
    const isSuperAdmin = creatorEmail === "admin@example.com" || !creatorBranch;

    let targetRole = (role || "").toUpperCase();
    if (isSuperAdmin) {
      if (!["ADMIN", "FACULTY", "STUDENT"].includes(targetRole)) {
        targetRole = "ADMIN";
      }
    } else {
      if (!["FACULTY", "STUDENT"].includes(targetRole)) {
        targetRole = "FACULTY";
      }
    }

    const roleTitle = targetRole === "ADMIN" ? "Department HOD" : targetRole === "STUDENT" ? "Student Account" : "Faculty Member";

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    adminOtpStore.set(emailTrimmed, { otp, expiresAt, role: targetRole });

    // Send OTP email
    await sendAdminUserOtpEmail(emailTrimmed, otp, roleTitle);

    return res.status(200).json({
      success: true,
      message: `A 6-digit Verification OTP has been sent to ${emailTrimmed}.`,
      email: emailTrimmed,
    });
  } catch (error) {
    console.error("Error sending user creation OTP:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to send verification OTP email." });
  }
};

// STEP 2: Verify OTP and Create HOD / Faculty / Student Account with Welcome Credential Email
exports.verifyAndCreateUser = async (req, res) => {
  try {
    const { name, email, password, role, branch, phone, year, sem, section, rollNo, facultyId, hodId, otp } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: "Name and Email are required." });
    }

    if (!otp) {
      return res.status(400).json({ success: false, error: "Verification OTP is required." });
    }

    const emailTrimmed = email.trim().toLowerCase();

    // Verify OTP from adminOtpStore
    const storedRecord = adminOtpStore.get(emailTrimmed);
    if (!storedRecord) {
      return res.status(400).json({ success: false, error: "No OTP request found for this email. Please click 'Send Verification OTP' again." });
    }

    if (Date.now() > storedRecord.expiresAt) {
      adminOtpStore.delete(emailTrimmed);
      return res.status(400).json({ success: false, error: "Verification OTP has expired. Please request a new OTP code." });
    }

    if (storedRecord.otp !== otp.trim()) {
      return res.status(400).json({ success: false, error: "Invalid Verification OTP code. Please enter the exact 6-digit code sent to your email." });
    }

    // Double check email existence
    const existingUser = await User.findOne({ where: { email: emailTrimmed } });
    if (existingUser) {
      adminOtpStore.delete(emailTrimmed);
      return res.status(400).json({ success: false, error: `A user with email ${emailTrimmed} already exists.` });
    }

    const bcrypt = require("bcryptjs");
    const defaultPassword = password || "password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const creatorEmail = req.user?.email || "";
    const creatorBranch = req.user?.branch || "";
    const isSuperAdmin = creatorEmail === "admin@example.com" || !creatorBranch;

    let userRole = (role || storedRecord.role || "").toUpperCase();
    let targetBranch = (branch || "CSE").toUpperCase();

    if (isSuperAdmin) {
      if (!["ADMIN", "FACULTY", "STUDENT"].includes(userRole)) {
        userRole = "ADMIN";
      }
    } else {
      if (!["FACULTY", "STUDENT"].includes(userRole)) {
        userRole = "FACULTY";
      }
      if (creatorBranch) {
        targetBranch = creatorBranch.toUpperCase();
      }
    }

    const newUser = await User.create({
      name: name.trim(),
      email: emailTrimmed,
      password: hashedPassword,
      role: userRole,
      branch: targetBranch,
      phone: phone ? phone.trim() : null,
      year: year || (userRole === "STUDENT" ? "3rd Year" : "ALL"),
      sem: sem || (userRole === "STUDENT" ? "Sem 1" : "ALL"),
      section: section || (userRole === "STUDENT" ? "A" : "ALL"),
      rollNo: rollNo ? rollNo.trim() : userRole === "STUDENT" ? `22${targetBranch}01` : null,
      facultyId: facultyId ? facultyId.trim() : userRole === "FACULTY" ? `FAC${targetBranch}${Math.floor(10 + Math.random() * 90)}` : null,
      hodId: hodId ? hodId.trim() : userRole === "ADMIN" ? `HOD${targetBranch}01` : null,
      active: true,
      isVerified: true,
    });

    // Clear stored OTP
    adminOtpStore.delete(emailTrimmed);

    // Send Welcome Email with Login Credentials
    await sendWelcomeCredentialsEmail({
      email: emailTrimmed,
      password: defaultPassword,
      name: newUser.name,
      role: userRole,
      branch: targetBranch,
    });

    const roleTitle = userRole === "ADMIN" ? `Department HOD (${targetBranch})` : userRole === "STUDENT" ? `Student (${targetBranch})` : `Faculty (${targetBranch})`;

    return res.status(201).json({
      success: true,
      message: `Email Verified & ${roleTitle} account created successfully! Login credentials have been emailed to ${emailTrimmed}.`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        branch: newUser.branch,
        phone: newUser.phone,
        active: newUser.active,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating user after OTP verification:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to create user account." });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, branch, phone, year, sem, section, rollNo, facultyId, hodId } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ success: false, error: "Name and Email are required." });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const existingUser = await User.findOne({ where: { email: emailTrimmed } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: `A user with email ${emailTrimmed} already exists.` });
    }

    const bcrypt = require("bcryptjs");
    const defaultPassword = password || "password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Enforce Hierarchy Permissions:
    // Main Admin (admin@example.com) -> Creates HODs (role: ADMIN)
    // Department HOD -> Creates Faculty (role: FACULTY) for their own department branch
    const creatorEmail = req.user?.email || "";
    const creatorBranch = req.user?.branch || "";
    const isSuperAdmin = creatorEmail === "admin@example.com" || !creatorBranch;

    let userRole = (role || "").toUpperCase();
    let targetBranch = (branch || "CSE").toUpperCase();

    if (isSuperAdmin) {
      userRole = "ADMIN"; // Super Admin creates HODs only
    } else {
      userRole = "FACULTY"; // Department HOD creates Faculty members only
      if (creatorBranch) {
        targetBranch = creatorBranch.toUpperCase();
      }
    }

    const newUser = await User.create({
      name: name.trim(),
      email: emailTrimmed,
      password: hashedPassword,
      role: userRole,
      branch: targetBranch,
      phone: phone ? phone.trim() : null,
      year: year || "ALL",
      sem: sem || "ALL",
      section: section || "ALL",
      rollNo: rollNo ? rollNo.trim() : null,
      facultyId: facultyId ? facultyId.trim() : userRole === "FACULTY" ? `FAC${targetBranch}${Math.floor(10 + Math.random() * 90)}` : null,
      hodId: hodId ? hodId.trim() : userRole === "ADMIN" ? `HOD${targetBranch}01` : null,
      active: true,
      isVerified: true,
    });

    return res.status(201).json({
      success: true,
      message: `${userRole === "ADMIN" ? `Department HOD (${targetBranch})` : `Faculty (${targetBranch})`} account created successfully!`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        branch: newUser.branch,
        phone: newUser.phone,
        active: newUser.active,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to create user account." });
  }
};


exports.approveUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await user.update({ active: true });
  return res.json({ message: "User approved", user });
};

exports.rejectUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await user.update({ active: false });
  return res.json({ message: "User rejected", user });
};

exports.getStats = async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalCourses,
    approvedCourses,
    pendingApprovals,
    totalAssignments,
    totalSubmissions,
    totalQuizzes,
    totalQuizAttempts,
  ] = await Promise.all([
    User.count(),
    User.count({ where: { active: true } }),
    Course.count(),
    Course.count({ where: { status: "APPROVED" } }),
    Course.count({ where: { status: "PENDING" } }),
    Assignment.count(),
    Submission.count(),
    Quiz.count(),
    QuizAttempt.count(),
  ]);

  return res.json({
    totalUsers,
    activeUsers,
    totalCourses,
    approvedCourses,
    pendingApprovals,
    totalAssignments,
    totalSubmissions,
    totalQuizzes,
    totalQuizAttempts,
  });
};

exports.getEnrollmentTrend = async (req, res) => {
  try {
    const [quizzes, quizAttempts, assignments, submissions, attendanceRecords, users, courses] = await Promise.all([
      Quiz.findAll().catch(() => []),
      QuizAttempt.findAll().catch(() => []),
      Assignment.findAll().catch(() => []),
      Submission.findAll().catch(() => []),
      AttendanceRecord.findAll().catch(() => []),
      User.findAll({ where: { role: "STUDENT" } }).catch(() => []),
      Course.findAll().catch(() => []),
    ]);

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name; });

    const branchesList = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"];
    const yearsList = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    const semsList = ["Sem 1", "Sem 2"];
    const regulationsList = ["R20", "R22", "R23"];

    // 1. QUIZ MODULES ANALYTICS (SCALED TO 100% BASED ON EACH QUIZ'S TOTAL MARKS)
    const quizAnalytics = quizzes.map((quiz, idx) => {
      const attempts = quizAttempts.filter(a => String(a.quizId) === String(quiz.id));
      const attemptCount = attempts.length;
      const maxMarks = quiz.totalMarks || 20;
      let avgPct = 0;
      if (attemptCount > 0) {
        const sumPct = attempts.reduce((acc, curr) => {
          const pct = maxMarks > 0 ? (Number(curr.marks || 0) / maxMarks) * 100 : Number(curr.marks || 0);
          return acc + pct;
        }, 0);
        avgPct = Math.round(sumPct / attemptCount);
      }

      // Metadata for Year, Branch, Sem, Regulation
      const course = courses.find(c => String(c.id) === String(quiz.courseId));
      const year = yearsList[idx % yearsList.length];
      const branch = (course && course.branch && course.branch !== "ALL") ? course.branch : branchesList[idx % branchesList.length];
      const sem = semsList[idx % semsList.length];
      const regulation = (course && course.regulation && course.regulation !== "ALL") ? course.regulation : regulationsList[idx % regulationsList.length];

      // Individual student breakdown for this quiz
      const individualStudents = attempts.map((a, sIdx) => {
        const studentName = userMap[a.studentId] || `Student #${a.studentId || sIdx + 1}`;
        const pct = maxMarks > 0 ? Math.round((Number(a.marks || 0) / maxMarks) * 100) : Number(a.marks || 0);
        return {
          id: a.id,
          period: studentName,
          quizAvg: Math.min(100, Math.max(0, pct)),
          rawMarks: a.marks || 0,
          totalMarks: maxMarks,
        };
      });

      return {
        id: quiz.id,
        period: quiz.title || `Quiz #${quiz.id}`,
        quizAvg: Math.min(100, Math.max(0, avgPct)),
        completedAttempts: attemptCount,
        totalMarks: maxMarks,
        year,
        branch,
        sem,
        regulation,
        individualItems: individualStudents,
      };
    });

    // 2. ASSIGNMENT ANALYTICS (SCALED TO 100% BASED ON EACH ASSIGNMENT'S TOTAL MARKS)
    const assignmentAnalytics = assignments.map((assign, idx) => {
      const subs = submissions.filter(s => String(s.assignmentId) === String(assign.id) && s.status !== "PENDING");
      const subCount = subs.length;
      const maxMarks = assign.totalMarks || 100;
      let avgPct = 0;
      const gradedSubs = subs.filter(s => s.marks >= 0);
      if (gradedSubs.length > 0) {
        const sumPct = gradedSubs.reduce((acc, curr) => {
          const pct = maxMarks > 0 ? (Number(curr.marks || 0) / maxMarks) * 100 : Number(curr.marks || 0);
          return acc + pct;
        }, 0);
        avgPct = Math.round(sumPct / gradedSubs.length);
      }

      // Metadata for Year, Branch, Sem, Regulation
      const course = courses.find(c => String(c.id) === String(assign.courseId));
      const year = yearsList[(idx + 1) % yearsList.length];
      const branch = (course && course.branch && course.branch !== "ALL") ? course.branch : branchesList[(idx + 1) % branchesList.length];
      const sem = semsList[(idx + 1) % semsList.length];
      const regulation = (course && course.regulation && course.regulation !== "ALL") ? course.regulation : regulationsList[(idx + 1) % regulationsList.length];

      // Individual student breakdown for this assignment
      const individualStudents = subs.map((s, sIdx) => {
        const studentName = s.studentName || userMap[s.studentId] || `Student #${s.studentId || sIdx + 1}`;
        const pct = maxMarks > 0 ? Math.round((Number(s.marks || 0) / maxMarks) * 100) : Number(s.marks || 0);
        return {
          id: s.id,
          period: studentName,
          assignmentAvg: Math.min(100, Math.max(0, pct)),
          rawMarks: s.marks || 0,
          totalMarks: maxMarks,
        };
      });

      return {
        id: assign.id,
        period: assign.title || `Assignment #${assign.id}`,
        assignmentAvg: Math.min(100, Math.max(0, avgPct)),
        totalSubmissions: subCount,
        totalMarks: maxMarks,
        year,
        branch,
        sem,
        regulation,
        individualItems: individualStudents,
      };
    });

    // 3. ATTENDANCE ANALYTICS (REAL DB DATA)
    const attendanceMapByDate = {};
    attendanceRecords.forEach(rec => {
      const d = rec.date;
      if (!attendanceMapByDate[d]) {
        attendanceMapByDate[d] = { total: 0, present: 0 };
      }
      attendanceMapByDate[d].total += 1;
      if (rec.status?.toUpperCase() === "PRESENT" || rec.value > 0) {
        attendanceMapByDate[d].present += 1;
      }
    });

    const attendanceAnalytics = Object.keys(attendanceMapByDate).map((d, idx) => {
      const item = attendanceMapByDate[d];
      const rate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
      const recordsForDate = attendanceRecords.filter(r => r.date === d);

      const year = yearsList[idx % yearsList.length];
      const branch = branchesList[idx % branchesList.length];
      const sem = semsList[idx % semsList.length];

      const individualStudents = recordsForDate.map((r, sIdx) => {
        const studentName = userMap[r.studentId] || `Student #${r.studentId || sIdx + 1}`;
        const isPresent = r.status?.toUpperCase() === "PRESENT" || r.value > 0;
        return {
          id: r.id,
          period: studentName,
          attendanceRate: isPresent ? 100 : 0,
          status: isPresent ? "PRESENT" : "ABSENT",
        };
      });

      return {
        period: d,
        attendanceRate: rate,
        presentCount: item.present,
        absentCount: item.total - item.present,
        totalSessions: item.total,
        year,
        branch,
        sem,
        date: d,
        individualItems: individualStudents,
      };
    });

    // OVERALL SUMMARY ACCUMULATED STATS (SCALED TO PERCENTAGES)
    const totalQuizModulesCount = quizzes.length;
    const totalQuizAttempts = quizAttempts.length;
    const overallQuizAvg = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((acc, curr) => {
          const q = quizzes.find(quiz => String(quiz.id) === String(curr.quizId));
          const maxMarks = q?.totalMarks || 20;
          const pct = maxMarks > 0 ? (Number(curr.marks || 0) / maxMarks) * 100 : Number(curr.marks || 0);
          return acc + pct;
        }, 0) / quizAttempts.length)
      : 0;

    const totalAssignmentsCount = assignments.length;
    const totalSubmissionsCount = submissions.filter(s => s.status !== "PENDING").length;
    const gradedSubmissions = submissions.filter(s => s.marks >= 0);
    const overallAssignmentAvg = gradedSubmissions.length > 0
      ? Math.round(gradedSubmissions.reduce((acc, curr) => {
          const ass = assignments.find(a => String(a.id) === String(curr.assignmentId));
          const maxMarks = ass?.totalMarks || 100;
          const pct = maxMarks > 0 ? (Number(curr.marks || 0) / maxMarks) * 100 : Number(curr.marks || 0);
          return acc + pct;
        }, 0) / gradedSubmissions.length)
      : 0;

    // Unique dates/sessions matching the bars in Attendance chart
    const totalAttendanceSessions = Object.keys(attendanceMapByDate).length;
    const totalAttendanceRecords = attendanceRecords.length;
    const presentAttendanceCount = attendanceRecords.filter(r => r.status?.toUpperCase() === "PRESENT" || r.value > 0).length;
    const overallAttendanceRate = totalAttendanceRecords > 0
      ? Math.round((presentAttendanceCount / totalAttendanceRecords) * 100)
      : 0;

    return res.json({
      quizzes: quizAnalytics,
      assignments: assignmentAnalytics,
      attendance: attendanceAnalytics,
      stats: {
        totalQuizModules: totalQuizModulesCount,
        quizAvg: overallQuizAvg,
        completedQuizzesCount: totalQuizAttempts,
        totalAssignments: totalAssignmentsCount,
        assignmentAvg: overallAssignmentAvg,
        totalSubmissionsCount: totalSubmissionsCount,
        overallAttendanceRate: overallAttendanceRate,
        totalAttendanceSessions: totalAttendanceSessions,
      }
    });
  } catch (error) {
    console.error("Error fetching analytics trend:", error);
    return res.status(500).json({ message: "Error fetching analytics trend", error: error.message });
  }
};

exports.getUserActivityLogs = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const roleUpper = (user.role || "").toUpperCase();

    // 1. Fetch Submissions (Assignments taken by student)
    let userSubmissions = [];
    if (roleUpper === "STUDENT") {
      const rawSubmissions = await Submission.findAll({
        where: { studentId: userId },
        order: [["updatedAt", "DESC"]],
      });

      userSubmissions = await Promise.all(
        rawSubmissions.map(async (sub) => {
          let assignmentTitle = "Assignment #" + sub.assignmentId;
          let courseTitle = "General Course";
          let maxMarks = 100;

          if (sub.assignmentId) {
            const ass = await Assignment.findByPk(sub.assignmentId);
            if (ass) {
              assignmentTitle = ass.title;
              maxMarks = ass.totalMarks || 100;
              if (ass.courseId) {
                const c = await Course.findByPk(ass.courseId);
                if (c) courseTitle = c.title;
              }
            }
          }

          const rawMarks = Number(sub.marks || 0);
          const pctScore = maxMarks > 0 ? Math.min(100, Math.round((rawMarks / maxMarks) * 100)) : 0;

          return {
            id: sub.id,
            assignmentId: sub.assignmentId,
            assignmentTitle,
            courseTitle,
            marks: rawMarks,
            maxMarks,
            pctScore,
            status: sub.status || (sub.marks >= 0 ? "GRADED" : "SUBMITTED"),
            submittedAt: sub.submittedAt || sub.createdAt || sub.updatedAt,
            feedback: sub.feedback || null,
          };
        })
      );
    }

    // 2. Fetch Quiz Attempts (Quizzes taken by student)
    let userQuizAttempts = [];
    if (roleUpper === "STUDENT") {
      const rawAttempts = await QuizAttempt.findAll({
        where: { studentId: userId },
        order: [["createdAt", "DESC"]],
      });

      userQuizAttempts = await Promise.all(
        rawAttempts.map(async (att) => {
          let quizTitle = "Quiz #" + att.quizId;
          let courseTitle = "General Course";
          let totalQuestions = att.totalQuestions || 10;

          if (att.quizId) {
            const q = await Quiz.findByPk(att.quizId);
            if (q) {
              quizTitle = q.title;
              if (q.totalQuestions) totalQuestions = q.totalQuestions;
              if (q.courseId) {
                const c = await Course.findByPk(q.courseId);
                if (c) courseTitle = c.title;
              }
            }
          }

          const rawScore = Number(att.score || 0);
          const maxPossible = totalQuestions > 0 ? totalQuestions : 10;
          const pctScore = Math.min(100, Math.round((rawScore / maxPossible) * 100));

          return {
            id: att.id,
            quizId: att.quizId,
            quizTitle,
            courseTitle,
            score: rawScore,
            totalQuestions: maxPossible,
            pctScore,
            completedAt: att.completedAt || att.createdAt,
          };
        })
      );
    }

    // 3. Fetch Attendance Records for Student
    let attendanceSummary = {
      totalSessions: 0,
      attendedSessions: 0,
      absentSessions: 0,
      attendancePercentage: 0,
      records: [],
    };

    if (roleUpper === "STUDENT") {
      const allRecords = await AttendanceRecord.findAll({
        order: [["date", "DESC"]],
      });

      const studentRecords = allRecords.filter((rec) => {
        if (rec.studentId && String(rec.studentId) === String(userId)) return true;
        if (rec.branch && rec.branch === user.branch && rec.section && rec.section === user.section) return true;
        return false;
      });

      const total = studentRecords.length;
      const attended = studentRecords.filter(
        (r) => r.status?.toUpperCase() === "PRESENT" || r.value > 0
      ).length;
      const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

      attendanceSummary = {
        totalSessions: total,
        attendedSessions: attended,
        absentSessions: Math.max(0, total - attended),
        attendancePercentage: pct,
        records: studentRecords.slice(0, 15).map((r) => ({
          id: r.id,
          date: r.date,
          status: r.status || (r.value > 0 ? "PRESENT" : "ABSENT"),
          subject: r.subject || "General",
        })),
      };
    }

    const avgAssignmentMarks =
      userSubmissions.length > 0
        ? Math.round(userSubmissions.reduce((acc, s) => acc + s.pctScore, 0) / userSubmissions.length)
        : 0;

    const avgQuizMarks =
      userQuizAttempts.length > 0
        ? Math.round(userQuizAttempts.reduce((acc, q) => acc + q.pctScore, 0) / userQuizAttempts.length)
        : 0;

    let history = [];
    if (Array.isArray(user.loginHistory)) {
      history = user.loginHistory;
    } else if (typeof user.loginHistory === "string") {
      try {
        const parsed = JSON.parse(user.loginHistory);
        if (Array.isArray(parsed)) history = parsed;
      } catch (e) {
        history = [];
      }
    }
    if (history.length === 0 && user.lastLogin) {
      history = [user.lastLogin];
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch || "CSE",
        year: user.year || "3rd Year",
        sem: user.sem || "Sem 1",
        section: user.section || "A",
        phone: user.phone || null,
        rollNo: user.rollNo || null,
        facultyId: user.facultyId || null,
        hodId: user.hodId || null,
        active: user.active,
        isVerified: user.isVerified,
        isDefaultPassword: user.isDefaultPassword,
        bio: user.bio || "",
        createdAt: user.createdAt,
        lastLogin: user.lastLogin || null,
        loginCount: user.loginCount || (user.lastLogin ? 1 : 0),
        loginHistory: history,
      },
      stats: {
        assignmentsTaken: userSubmissions.length,
        avgAssignmentMarks,
        quizzesTaken: userQuizAttempts.length,
        avgQuizMarks,
        attendancePercentage: attendanceSummary.attendancePercentage,
      },
      submissions: userSubmissions,
      quizzes: userQuizAttempts,
      attendance: attendanceSummary,
    });
  } catch (error) {
    console.error("Error fetching user activity logs:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
