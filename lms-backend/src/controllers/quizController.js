const { Quiz, QuizAttempt, Course, CourseContent, Notification, User } = require("../models");
const { Op } = require("sequelize");
const { generateCompletion } = require("../utils/aiService");

exports.generateQuizQuestions = async (req, res) => {
  const { topic, courseId, count = 5 } = req.body;
  if (!topic && !courseId) return res.status(400).json({ message: "Topic or Course ID is required" });

  // Fetch course content & syllabus context
  let courseContentContext = "";
  let targetCourseTitle = topic || "Course Assessment";

  try {
    let course = null;
    if (courseId) {
      course = await Course.findByPk(courseId);
    }
    if (!course && topic) {
      course = await Course.findOne({
        where: {
          title: { [Op.like]: `%${topic}%` }
        }
      });
    }

    if (course) {
      targetCourseTitle = `${course.title} (${course.code})`;
      if (course.content) {
        courseContentContext += `\nOFFICIAL COURSE SYLLABUS & EXTRACTED TEXT:\n${course.content}\n`;
      }
      if (course.description) {
        courseContentContext += `\nCOURSE DESCRIPTION & OVERVIEW:\n${course.description}\n`;
      }
      // Also fetch uploaded lesson files for this course
      const moduleContents = await CourseContent.findAll({ where: { courseId: course.id } });
      if (moduleContents && moduleContents.length > 0) {
        const moduleTitles = moduleContents.map((m, i) => `${i + 1}. ${m.name} (${m.type})`).join("\n");
        courseContentContext += `\nCOURSE LESSONS & UPLOADED MATERIALS:\n${moduleTitles}\n`;
      }
    }
  } catch (err) {
    console.warn("Could not fetch course content context:", err.message);
  }

  const getFallbackQuiz = () => ({
    title: topic ? `${topic} Quiz (${targetCourseTitle})` : `${targetCourseTitle} Quiz`,
    questions: Array.from({ length: Number(count) }).map((_, i) => ({
      question: `Which fundamental principle governs ${topic || targetCourseTitle} (Question ${i + 1})?`,
      options: [
        `Primary mechanism of ${topic || targetCourseTitle}`,
        `Secondary operational architecture`,
        `Alternative execution cycle`,
        `Non-standard memory configuration`
      ],
      correctIndex: 0
    }))
  });

  try {
    const topicFocus = topic || targetCourseTitle;
    const prompt = `You are a senior computer science university professor creating a technical exam quiz for the subject "${targetCourseTitle}".

SPECIFIC TOPIC TO TEST: "${topicFocus}"

STRICT GENERATION MANDATE:
1. Generate exactly ${count} high-quality, technical multiple-choice questions specifically and directly testing subject concepts of "${topicFocus}".
2. DO NOT ask meta-questions about the course overview description, file names, or lesson titles (e.g. NEVER ask "What is the title of the first lesson?" or "How is COA characterized in description?").
3. Every question MUST test real technical concepts, definitions, architecture principles, and formulas for "${topicFocus}".
4. Provide 4 plausible multiple-choice options (Option A, B, C, D) and specify the 0-indexed integer (0, 1, 2, or 3) for the correct option (correctIndex).

${courseContentContext ? `Reference Context (Use only for technical depth on ${topicFocus}):\n${courseContentContext}\n` : ""}

Return ONLY a valid raw JSON object matching this exact schema:
{
  "title": "${topic ? `${topic} Quiz` : `${targetCourseTitle} Quiz`}",
  "questions": [
    {
      "question": "Clear technical question directly about ${topicFocus}",
      "options": ["Plausible Option 0", "Plausible Option 1", "Plausible Option 2", "Plausible Option 3"],
      "correctIndex": 0
    }
  ]
}`;

    const textResponse = await generateCompletion({ prompt, jsonMode: true });
    const cleanedText = textResponse.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const result = JSON.parse(cleanedText);
    return res.json(result);
  } catch (error) {
    console.error("AI Quiz Generation Error (using fallback questions):", error.message);
    return res.json(getFallbackQuiz());
  }
};

exports.getAllQuizzes = async (req, res) => {
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
};

exports.getQuizById = async (req, res) => {
  const quizId = Number(req.params.id);
  if (isNaN(quizId)) {
    return res.status(400).json({ message: "Invalid Quiz ID format" });
  }
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  return res.json(quiz);
};

exports.createQuiz = async (req, res) => {
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

    // Notify all enrolled students
    const enrolledIds = course.enrolledStudentIds || [];
    if (enrolledIds.length > 0) {
      const notifications = enrolledIds.map(studentId => ({
        userId: studentId,
        title: "New Quiz Available",
        message: `A new quiz "${quiz.title}" has been created for ${course.title}. Good luck!`,
        type: "INFO",
        isRead: false,
        createdAt: new Date()
      }));
      await Notification.bulkCreate(notifications);
    }

    return res.status(201).json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error.message);
    return res.status(500).json({ message: "Error creating quiz", error: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  const quiz = await Quiz.findByPk(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  const course = await Course.findByPk(quiz.courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });

  const enrolled = course.enrolledStudentIds || [];
  if (!enrolled.includes(req.user.userId)) {
    return res.status(403).json({ message: "You must be enrolled in this course to submit the quiz" });
  }

  const answers = req.body.answers || req.body;
  const tabSwitches = Number(req.body.tabSwitches || 0);
  const malpractice = Boolean(req.body.malpractice || req.body.autoSubmitted || tabSwitches > 0);

  let marks = 0;
  const totalMarks = Number(quiz.totalMarks || 20);
  const questions = quiz.questions || [];

  if (malpractice) {
    marks = 0; // STRICT ZERO MARKS FOR MALPRACTICE!
  } else if (questions.length > 0) {
    const marksPerQuestion = totalMarks / questions.length;
    questions.forEach((q, idx) => {
      const studentAnswer = typeof answers[idx] !== 'undefined' ? answers[idx] : null;
      if (Number(studentAnswer) === Number(q.correctIndex)) {
        marks += marksPerQuestion;
      }
    });
  } else {
    const answeredCount = typeof answers === "object" ? Object.keys(answers).length : 0;
    marks = Math.min(totalMarks, answeredCount * 2);
  }

  const attempt = await QuizAttempt.create({
    quizId: quiz.id,
    studentId: req.user.userId,
    answers,
    marks: Math.round(marks),
    malpractice,
    tabSwitches,
    submittedAt: new Date(),
  });

  const percent = Math.round((marks / totalMarks) * 100);
  return res.status(201).json({
    ...attempt.toJSON(),
    percentage: percent,
    totalMarks: totalMarks
  });
};

exports.getQuizAttempts = async (req, res) => {
  try {
    const { id } = req.params;
    const attempts = await QuizAttempt.findAll({
      where: { quizId: id },
      order: [["id", "DESC"]]
    });

    // Group by studentId to get only the latest attempt per student
    const latestAttemptsMap = new Map();
    attempts.forEach(attempt => {
      if (!latestAttemptsMap.has(attempt.studentId)) {
        latestAttemptsMap.set(attempt.studentId, attempt);
      }
    });

    const uniqueAttempts = Array.from(latestAttemptsMap.values());
    const studentIds = uniqueAttempts.map(a => a.studentId);
    const users = await User.findAll({ where: { id: { [Op.in]: studentIds } } });
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const enriched = uniqueAttempts.map(a => {
      const student = userMap[a.studentId];
      const isMalpractice = Boolean(a.malpractice || (a.tabSwitches && a.tabSwitches > 0));
      const finalMarks = isMalpractice ? 0 : Number(a.marks || 0);
      const totalM = 20; // Default total marks baseline if not set
      const percent = isMalpractice ? 0 : Math.round((finalMarks / totalM) * 100);

      return {
        ...a.toJSON(),
        studentId: a.studentId,
        studentName: student ? student.name : `Student #${a.studentId}`,
        studentEmail: student ? student.email : "",
        malpractice: isMalpractice,
        marks: finalMarks,
        percentage: percent,
        tabSwitches: a.tabSwitches || 0,
      };
    });

    return res.json(enriched);
  } catch (err) {
    console.error("Error fetching quiz attempts:", err.message);
    return res.status(500).json({ message: "Error fetching quiz attempts", error: err.message });
  }
};

exports.getMyQuizAttempts = async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const attempts = await QuizAttempt.findAll({
      where: { studentId },
      order: [["id", "DESC"]]
    });
    return res.json(attempts);
  } catch (err) {
    console.error("Error fetching my quiz attempts:", err.message);
    return res.status(500).json({ message: "Error fetching my quiz attempts" });
  }
};

exports.updateQuizAttemptMarks = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { marks } = req.body;
    const attempt = await QuizAttempt.findByPk(attemptId);
    if (!attempt) return res.status(404).json({ message: "Quiz attempt not found" });

    const newMarks = Math.min(20, Math.max(0, Number(marks || 0)));
    await attempt.update({
      marks: newMarks,
      malpractice: false
    });

    return res.json({ success: true, attempt });
  } catch (err) {
    console.error("Error updating quiz attempt marks:", err.message);
    return res.status(500).json({ message: "Error updating quiz attempt marks" });
  }
};
