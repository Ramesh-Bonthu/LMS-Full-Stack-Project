const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const {
  sequelize,
  User,
  Course,
  Assignment,
  Submission,
  Quiz,
  QuizAttempt,
  Announcement,
  AttendanceRecord,
  CourseContent,
} = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 8082);
const JWT_SECRET = "your-secret-key-change-this-in-production-environment-123456789";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:8080", "http://localhost:8082"],
    credentials: true,
  }),
);

// Initialization
sequelize.sync({ alter: true }).then(async () => {
  console.log("Database synced");
  const count = await User.count();
  if (count === 0) {
    await User.bulkCreate([
      { name: "Admin User", email: "admin@example.com", password: bcrypt.hashSync("password123", 10), role: "ADMIN", active: true, isVerified: true },
      { name: "Faculty User", email: "faculty@example.com", password: bcrypt.hashSync("password123", 10), role: "FACULTY", active: true, isVerified: true },
      { name: "Student User", email: "student@example.com", password: bcrypt.hashSync("password123", 10), role: "STUDENT", active: true, isVerified: true },
    ]);
  }
}).catch(err => {
  console.error("Database connection failed", err);
});

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" },
  );
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      ...decoded,
      name: user.name,
      active: user.active,
      role: user.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(String(req.user.role).toUpperCase())) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

function serializeCourse(course, viewerId) {
  const c = course.toJSON();
  return {
    ...c,
    progress:
      viewerId && c.progressByStudent && c.progressByStudent[viewerId]
        ? c.progressByStudent[viewerId]
        : undefined,
  };
}

// Auth endpoints
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters long, include uppercase, lowercase, a number, and a special character." 
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: String(role).toUpperCase(),
      active: true,
      isVerified: false,
      verificationOtp: otp,
    });

    console.log(`[AUTH] OTP for ${email}: ${otp}`);

    return res.status(201).json({ 
      message: "Registration successful. Please verify your email.",
      email: user.email 
    });
  } catch (error) {
    return res.status(500).json({ message: "Error registering user", error: error.message });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });
    if (user.verificationOtp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    await user.update({ isVerified: true, verificationOtp: null });

    return res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    return res.status(500).json({ message: "Error verifying OTP", error: error.message });
  }
});

app.post("/api/auth/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await user.update({ verificationOtp: otp });

    console.log(`[AUTH] New OTP for ${email}: ${otp}`);

    return res.json({ message: "New OTP sent successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Error resending OTP", error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.active) return res.status(403).json({ message: "Account disabled" });
    
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Email not verified. Please verify your email first.",
        requiresVerification: true,
        email: user.email 
      });
    }

    const token = generateToken(user);
    return res.json({ 
      token, 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      message: "Login successful"
    });
  } catch (error) {
    return res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

app.get("/api/auth/validate", verifyToken, async (req, res) => {
  const user = await User.findByPk(req.user.userId);
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: req.headers.authorization.slice(7),
    message: "Token is valid",
  });
});

// Course endpoints
app.get("/api/courses", verifyToken, async (req, res) => {
  const role = String(req.user.role).toUpperCase();
  let whereClause = {};
  
  if (role === "STUDENT") {
    whereClause = { status: "APPROVED" };
  }

  const courses = await Course.findAll({ where: whereClause });
  const viewerId = req.user.userId;
  return res.json(courses.map((course) => serializeCourse(course, viewerId)));
});

app.get("/api/courses/approved", async (req, res) => {
  const courses = await Course.findAll({ where: { status: "APPROVED" } });
  return res.json(courses.map((course) => serializeCourse(course, req.user?.userId)));
});

app.get("/api/courses/:id", async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  return res.json(serializeCourse(course, req.user?.userId));
});

app.post("/api/courses", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  try {
    const { title, code, description } = req.body;
    if (!title || !code) return res.status(400).json({ message: "Title and code are required" });

    const newCourse = await Course.create({
      title,
      code,
      description: description || "",
      facultyId: req.user.userId,
      facultyName: req.user.name,
      status: req.user.role === "ADMIN" ? "APPROVED" : "PENDING",
      studentCount: 0,
      enrolledStudentIds: [],
      progressByStudent: {},
    });

    return res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error creating course:", error.message);
    return res.status(500).json({ message: "Error creating course", error: error.message });
  }
});

app.get("/api/courses/:id/content", async (req, res) => {
  const content = await CourseContent.findAll({ where: { courseId: req.params.id } });
  return res.json(content);
});

app.post("/api/courses/:id/content", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  
  if (course.status !== "APPROVED") {
    return res.status(403).json({ message: "Content can only be added to approved courses" });
  }

  const { name, url, type } = req.body;
  const content = await CourseContent.create({
    courseId: req.params.id,
    name,
    link: url, // DB uses 'link', frontend sends 'url'
    type: type || "youtube",
  });
  return res.status(201).json(content);
});

app.put("/api/courses/:id", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.user.role !== "ADMIN" && course.facultyId !== req.user.userId) {
      return res.status(403).json({ message: "You can only edit your own courses" });
    }

    await course.update(req.body);
    return res.json(course);
  } catch (error) {
    console.error("Error updating course:", error.message);
    return res.status(500).json({ message: "Error updating course", error: error.message });
  }
});

app.delete("/api/courses/:id", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  if (req.user.role !== "ADMIN" && course.facultyId !== req.user.userId) {
    return res.status(403).json({ message: "You can only delete your own courses" });
  }

  await course.destroy();
  return res.json({ message: "Course deleted successfully" });
});

app.post("/api/courses/:id/enroll", verifyToken, requireRole("STUDENT"), async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  
  // Students can only enroll in APPROVED courses
  if (course.status !== "APPROVED") {
    return res.status(400).json({ message: "This course is not yet approved for enrollment. Please try again later." });
  }

  let enrolled = [...(course.enrolledStudentIds || [])];
  const uId = String(req.user.userId);
  if (!enrolled.some(id => String(id) === uId)) {
    enrolled.push(req.user.userId);
    let progress = { ...(course.progressByStudent || {}) };
    progress[uId] = progress[uId] || 0;
    
    course.enrolledStudentIds = enrolled;
    course.progressByStudent = progress;
    course.studentCount = enrolled.length;
    
    course.changed('enrolledStudentIds', true);
    course.changed('progressByStudent', true);
    await course.save();
  }

  return res.json({
    message: "Enrolled successfully",
    course: serializeCourse(course, req.user.userId),
  });
});

app.post("/api/courses/:id/approve", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  await course.update({ status: "APPROVED", rejectionReason: null });
  return res.json(course);
});

app.post("/api/courses/:id/reject", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  await course.update({ status: "REJECTED", rejectionReason: req.body.reason || "Not provided" });
  return res.json(course);
});

app.get("/api/courses/:id/content", verifyToken, async (req, res) => {
  const content = await CourseContent.findAll({ where: { courseId: req.params.id } });
  return res.json(content);
});

app.post("/api/courses/:id/content", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  const content = await CourseContent.create({
    courseId: course.id,
    name: req.body.name || "Untitled Resource",
    type: req.body.type || "youtube",
    link: req.body.url || req.body.link,
  });

  return res.status(201).json(content);
});

app.get("/api/courses/:id/students", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  
  const enrolled = course.enrolledStudentIds || [];
  const students = await User.findAll({ where: { id: enrolled }, attributes: ['id', 'name', 'email'] });
  return res.json(students);
});

// Assignment endpoints
app.get("/api/assignments", verifyToken, async (req, res) => {
  if (req.user.role === "STUDENT") {
    // Only show assignments for courses the student is enrolled in
    const allCourses = await Course.findAll();
    const enrolledCourseIds = allCourses
      .filter(c => {
        const enrolledIds = c.enrolledStudentIds || [];
        const isEnrolled = enrolledIds.some(id => String(id) === String(req.user.userId));
        return isEnrolled;
      })
      .map(c => c.id);
    
    const assignments = await Assignment.findAll({
      where: {
        courseId: { [Op.in]: enrolledCourseIds }
      }
    });

    // Fetch this specific student's submissions to show their individual status/marks
    const studentSubmissions = await Submission.findAll({
      where: { studentId: req.user.userId }
    });

    const enrichedAssignments = assignments.map(a => {
      const sub = studentSubmissions.find(s => s.assignmentId === a.id);
      return {
        ...a.toJSON(),
        status: sub ? sub.status : "PENDING",
        marks: sub ? sub.marks : undefined,
        feedback: sub ? sub.feedback : undefined,
        submissionId: sub ? sub.id : undefined
      };
    });

    return res.json(enrichedAssignments);
  }
  
  const assignments = await Assignment.findAll();
  return res.json(assignments);
});

app.post("/api/assignments", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  try {
    const { title, description, courseId, deadline, totalMarks } = req.body;
    const course = await Course.findByPk(courseId);
    if (!title || !course) return res.status(400).json({ message: "Valid title and course are required" });

    if (course.status !== "APPROVED") {
      return res.status(403).json({ message: "Assignments can only be created for approved courses" });
    }

    const assignment = await Assignment.create({
      title,
      description: description || "",
      courseId: course.id,
      courseName: course.title,
      deadline: deadline ? new Date(deadline) : new Date(),
      totalMarks: Number(totalMarks || 100),
    });

    return res.status(201).json(assignment);
  } catch (error) {
    console.error("Error creating assignment:", error.message);
    return res.status(500).json({ message: "Error creating assignment", error: error.message });
  }
});

app.post("/api/assignments/generate", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ message: "Topic is required" });
  
  const description = `This assignment covers the core concepts of ${topic}. 

Objectives:
1. Explain the fundamental principles of ${topic}.
2. Demonstrate practical application through a mini-project.
3. Analyze real-world scenarios where ${topic} is critical.

Requirements:
- Minimum 500 words report.
- Include code snippets or diagrams where applicable.
- Submit as a single PDF file.`;

  return res.json({ 
    title: `${topic} In-Depth Analysis`, 
    description 
  });
});

app.put("/api/assignments/:id", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });
  await assignment.update(req.body);
  return res.json(assignment);
});

app.get("/api/assignments/:id", async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });
  return res.json(assignment);
});

app.post("/api/assignments/:id/submit", verifyToken, requireRole("STUDENT"), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    let submission = await Submission.findOne({
      where: { assignmentId: assignment.id, studentId: req.user.userId }
    });

    if (submission) {
      await submission.update({
        filePath: req.body.filePath || submission.filePath,
        submittedAt: new Date(),
        status: "SUBMITTED",
        marks: submission.marks >= 0 ? submission.marks : -1,
      });
    } else {
      submission = await Submission.create({
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        studentId: req.user.userId,
        studentName: req.user.name,
        filePath: req.body.filePath || `submission-${req.user.userId}.pdf`,
        submittedAt: new Date(),
        marks: -1,
        feedback: "",
        status: "SUBMITTED",
      });
    }

    return res.status(201).json(submission);
  } catch (error) {
    console.error("Error submitting assignment:", error.message);
    return res.status(500).json({ message: "Error submitting assignment", error: error.message });
  }
});

app.get("/api/assignments/:id/submissions", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  const submissions = await Submission.findAll({ where: { assignmentId: req.params.id } });
  return res.json(submissions);
});

app.get("/api/submissions", verifyToken, async (req, res) => {
  if (req.user.role === "STUDENT") {
    const subs = await Submission.findAll({ where: { studentId: req.user.userId } });
    return res.json(subs);
  }
  const subs = await Submission.findAll();
  return res.json(subs);
});

app.put("/api/submissions/:id/grade", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  const submission = await Submission.findByPk(req.params.id);
  if (!submission) return res.status(404).json({ message: "Submission not found" });

  await submission.update({
    marks: Number(req.body.marks || 0),
    feedback: req.body.feedback || "",
    status: "GRADED",
  });
  return res.json(submission);
});

app.post("/api/quizzes/generate", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ message: "Topic is required" });
  
  const questions = [
    {
      question: `What is the primary purpose of ${topic}?`,
      options: [
        `To handle user interfaces efficiently.`,
        `To perform server-side database migrations.`,
        `To act as a generic data structure.`,
        `To compile native mobile apps.`
      ],
      correctIndex: 0
    },
    {
      question: `Which of the following is a key feature of ${topic}?`,
      options: [
        `Memory leaks`,
        `Rapid execution speed`,
        `Blocking I/O operations`,
        `Garbage accumulation`
      ],
      correctIndex: 1
    },
    {
      question: `When should you ideally use ${topic}?`,
      options: [
        `When performance is not a priority.`,
        `When building scalable and maintainable systems.`,
        `Only for local small scripts.`,
        `Whenever documentation is missing.`
      ],
      correctIndex: 1
    }
  ];

  return res.json({ title: `${topic} Assessment`, questions });
});

app.get("/api/quizzes", verifyToken, async (req, res) => {
  if (req.user.role === "STUDENT") {
    const allCourses = await Course.findAll();
    const enrolledCourseIds = allCourses
      .filter(c => (c.enrolledStudentIds || []).some(id => String(id) === String(req.user.userId)))
      .map(c => c.id);
    
    const quizzes = await Quiz.findAll({
      where: {
        courseId: { [Op.in]: enrolledCourseIds }
      }
    });
    return res.json(quizzes);
  }
  const quizzes = await Quiz.findAll();
  return res.json(quizzes);
});

app.get("/api/quizzes/:id", async (req, res) => {
  const quiz = await Quiz.findByPk(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  return res.json(quiz);
});

app.post("/api/quizzes", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  try {
    const { title, description, courseId, totalQuestions, totalMarks, timeLimit, questions } = req.body;
    const course = await Course.findByPk(courseId);
    if (!title || !course) return res.status(400).json({ message: "Valid title and course are required" });

    if (course.status !== "APPROVED") {
      return res.status(403).json({ message: "Quizzes can only be created for approved courses" });
    }

    const quiz = await Quiz.create({
      title,
      description: description || "",
      courseId: course.id,
      totalQuestions: Number(totalQuestions || (questions ? questions.length : 10)),
      totalMarks: Number(totalMarks || 20),
      timeLimit: Number(timeLimit || 15),
      questions: questions || []
    });

    return res.status(201).json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error.message);
    return res.status(500).json({ message: "Error creating quiz", error: error.message });
  }
});

app.post("/api/quizzes/:id/submit", verifyToken, requireRole("STUDENT"), async (req, res) => {
  const quiz = await Quiz.findByPk(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  
  // Verify student is enrolled in the course
  const course = await Course.findByPk(quiz.courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });
  
  const enrolled = course.enrolledStudentIds || [];
  if (!enrolled.includes(req.user.userId)) {
    return res.status(403).json({ message: "You must be enrolled in this course to submit the quiz" });
  }

  const answers = req.body.answers || req.body;
  
  let marks = 0;
  const totalMarks = Number(quiz.totalMarks || 20);
  const questions = quiz.questions || [];
  
  if (questions.length > 0) {
    const marksPerQuestion = totalMarks / questions.length;
    questions.forEach((q, idx) => {
      // Allow keys like "0": 1 or array index responses
      const studentAnswer = typeof answers[idx] !== 'undefined' ? answers[idx] : null;
      if (Number(studentAnswer) === Number(q.correctIndex)) {
        marks += marksPerQuestion;
      }
    });
  } else {
    // Fallback if no specific questions exist
    const answeredCount = typeof answers === "object" ? Object.keys(answers).length : 0;
    marks = Math.min(totalMarks, answeredCount * 2);
  }
  
  const attempt = await QuizAttempt.create({
    quizId: quiz.id,
    studentId: req.user.userId,
    answers,
    marks,
    submittedAt: new Date(),
  });

  const percent = Math.round((marks / totalMarks) * 100);
  return res.status(201).json({ ...attempt.toJSON(), percentage: percent });
});

// Attendance endpoints
app.get("/api/attendance", verifyToken, async (req, res) => {
  const courses = await Course.findAll();
  let records;
  if (req.user.role === "STUDENT") {
    records = await AttendanceRecord.findAll({ where: { studentId: req.user.userId } });
  } else {
    records = await AttendanceRecord.findAll();
  }
  
  const response = records.map(r => {
    const c = courses.find(course => course.id === r.courseId);
    return {
      ...r.toJSON(),
      courseName: c ? c.title : "Unknown Course"
    };
  });
  
  return res.json(response);
});

app.post("/api/attendance", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  const { studentId, courseId, date, value } = req.body;
  
  // Validate input
  if (!studentId || !courseId || !date) {
    return res.status(400).json({ message: "studentId, courseId, and date are required" });
  }

  const course = await Course.findByPk(courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });

  if (course.status !== "APPROVED") {
    return res.status(403).json({ message: "Attendance can only be marked for approved courses" });
  }
  
  // Verify student exists
  const student = await User.findByPk(studentId);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  
  // Verify attendance value is between 0 and 100
  const attendanceValue = value !== undefined ? Number(value) : 100;
  if (attendanceValue < 0 || attendanceValue > 100) {
    return res.status(400).json({ message: "Attendance value must be between 0 and 100" });
  }
  
  // Extract month from date (e.g. '2026-05-01' -> 'May')
  const monthString = new Date(date).toLocaleString('default', { month: 'short' });
  
  const record = await AttendanceRecord.create({
    studentId: Number(studentId),
    courseId: Number(courseId),
    date: date,
    month: monthString,
    value: attendanceValue,
  });
  return res.status(201).json(record);
});

// Announcements endpoints
function serializeAnnouncement(a) {
  const diffMs = Date.now() - new Date(a.createdAt).getTime();
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    audience: a.audience,
    time: hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`,
    isNew: hours <= 24,
  };
}

app.get("/api/announcements", verifyToken, async (req, res) => {
  const role = String(req.user.role).toUpperCase();
  let whereClause = {};
  
  if (role === "STUDENT") {
    whereClause = {
      [Op.or]: [
        { audience: "ALL" },
        { audience: "STUDENTS" }
      ]
    };
  } else if (role === "FACULTY") {
    whereClause = {
      [Op.or]: [
        { audience: "ALL" },
        { audience: "FACULTY" },
        { audience: "STUDENTS" }
      ]
    };
  } else if (role === "ADMIN") {
    whereClause = {}; // Admin sees all announcements
  } else {
    // Failsafe
    whereClause = { audience: "ALL" };
  }
  
  const anns = await Announcement.findAll({ where: whereClause, order: [['createdAt', 'DESC']] });
  return res.json(anns.map(serializeAnnouncement));
});

app.post("/api/announcements", verifyToken, requireRole("FACULTY", "ADMIN"), async (req, res) => {
  const audienceValue = (req.body.audience || "ALL").toString().toUpperCase().trim();
  const announcement = await Announcement.create({
    title: req.body.title || "Untitled announcement",
    body: req.body.body || "",
    audience: audienceValue,
  });
  return res.status(201).json(serializeAnnouncement(announcement.toJSON()));
});

app.get("/api/debug/announcements/:role", async (req, res) => {
  const role = req.params.role.toUpperCase();
  let whereClause = {};
  
  if (role === "STUDENT") {
    whereClause = { audience: { [Op.in]: ["ALL", "STUDENTS"] } };
  } else if (role === "FACULTY") {
    whereClause = { audience: { [Op.in]: ["ALL", "FACULTY", "STUDENTS"] } };
  } else if (role === "ADMIN") {
    whereClause = {}; 
  }
  
  const anns = await Announcement.findAll({ where: whereClause, order: [['createdAt', 'DESC']] });
  const allAnns = await Announcement.findAll();
  return res.json({
    role_requested: role,
    applied_where: whereClause,
    filtered_results: anns,
    all_results: allAnns
  });
});

// Performance
app.get("/api/performance", verifyToken, async (req, res) => {
  const courses = await Course.findAll();
  const submissions = await Submission.findAll();
  const assignments = await Assignment.findAll();

  if (req.user.role !== "STUDENT") {
    const aggregates = courses
      .filter((course) => course.status === "APPROVED")
      .map((course) => ({
        subject: course.code,
        marks:
          submissions
            .filter((entry) => assignments.find((a) => a.id === entry.assignmentId)?.courseId === course.id)
            .reduce((sum, entry) => sum + Math.max(entry.marks, 0), 0) || 0,
      }));
    return res.json(aggregates);
  }

  const studentSubmissions = submissions.filter((entry) => entry.studentId === req.user.userId);
  const performance = courses
    .filter((course) => (course.enrolledStudentIds || []).includes(req.user.userId))
    .map((course) => {
      const relatedSubmissions = studentSubmissions.filter(
        (entry) => assignments.find((a) => a.id === entry.assignmentId)?.courseId === course.id,
      );
      const graded = relatedSubmissions.filter((entry) => entry.marks >= 0);
      const average =
        graded.length > 0
          ? Math.round(graded.reduce((sum, entry) => sum + entry.marks, 0) / graded.length)
          : (course.progressByStudent || {})[req.user.userId] || 0;
      return { subject: course.code, marks: average };
    });

  return res.json(performance);
});

// Admin stats and user endpoints
app.get("/api/admin/users", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const users = await User.findAll();
  return res.json(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      status: user.active ? "Active" : "Pending",
    })),
  );
});

app.post("/api/admin/users/:id/approve", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await user.update({ active: true });
  return res.json({ message: "User approved", user });
});

app.post("/api/admin/users/:id/reject", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await user.update({ active: false });
  return res.json({ message: "User rejected", user });
});

app.get("/api/admin/stats", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const [totalUsers, activeUsers, totalCourses, approvedCourses, pendingApprovals, totalAssignments, totalSubmissions] = await Promise.all([
    User.count(),
    User.count({ where: { active: true } }),
    Course.count(),
    Course.count({ where: { status: "APPROVED" } }),
    Course.count({ where: { status: "PENDING" } }),
    Assignment.count(),
    Submission.count()
  ]);

  return res.json({
    totalUsers,
    activeUsers,
    totalCourses,
    approvedCourses,
    pendingApprovals,
    totalAssignments,
    totalSubmissions,
  });
});

app.get("/api/admin/enrollment-trend", verifyToken, requireRole("ADMIN"), async (req, res) => {
  // Compute fake enrollment trend for now based on total user count over the last 6 weeks
  const count = await User.count({ where: { role: 'STUDENT' } });
  return res.json([
    { week: "W1", students: Math.floor(count * 0.2) },
    { week: "W2", students: Math.floor(count * 0.4) },
    { week: "W3", students: Math.floor(count * 0.6) },
    { week: "W4", students: Math.floor(count * 0.8) },
    { week: "W5", students: Math.floor(count * 0.9) },
    { week: "W6", students: count },
  ]);
});

app.get("/api/health", async (req, res) => {
  return res.json({
    status: "Backend is running",
    timestamp: new Date().toISOString(),
    runtime: "node",
  });
});

app.listen(PORT, () => {
  console.log(`LMS backend is running on http://localhost:${PORT}`);
  console.log("Demo credentials:");
  console.log("  Admin: admin@example.com / password123");
  console.log("  Faculty: faculty@example.com / password123");
  console.log("  Student: student@example.com / password123");
});
