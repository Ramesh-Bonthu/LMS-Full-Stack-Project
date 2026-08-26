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
    title: `${targetCourseTitle} Quiz`,
    questions: Array.from({ length: Number(count) }).map((_, i) => ({
      question: `What is a core concept covered in ${targetCourseTitle} (Question ${i + 1})?`,
      options: [
        `Primary rule of ${targetCourseTitle}`,
        `Secondary implementation detail`,
        `Alternative configuration method`,
        `Unrelated system module`
      ],
      correctIndex: 0
    }))
  });

  try {
    const prompt = `You are a senior university professor creating an official exam quiz for the course "${targetCourseTitle}".

${courseContentContext ? `CRITICAL MANDATE: Base ALL quiz questions strictly and directly on the following course syllabus and study material:\n${courseContentContext}\n\nEvery question MUST test specific concepts mentioned in the syllabus text above.` : `Generate a technical quiz about "${targetCourseTitle}".`}

Create exactly ${count} multiple-choice questions testing key concepts from this course syllabus.
Return ONLY a raw JSON object with this exact structure:
{
  "title": "${targetCourseTitle} Quiz",
  "questions": [
    {
      "question": "Question text derived directly from the syllabus material",
      "options": ["Option A", "Option B", "Option C", "Option D"],
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
  const quiz = await Quiz.findByPk(req.params.id);
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
        title: "New Quiz Available 🧠",
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
  const malpractice = Boolean(req.body.malpractice || tabSwitches > 0);

  let marks = 0;
  const totalMarks = Number(quiz.totalMarks || 20);
  const questions = quiz.questions || [];

  if (questions.length > 0) {
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
      return {
        ...a.toJSON(),
        studentId: a.studentId,
        studentName: student ? student.name : `Student #${a.studentId}`,
        studentEmail: student ? student.email : "",
        malpractice: isMalpractice,
        tabSwitches: a.tabSwitches || 0,
      };
    });

    return res.json(enriched);
  } catch (err) {
    console.error("Error fetching quiz attempts:", err.message);
    return res.status(500).json({ message: "Error fetching quiz attempts", error: err.message });
  }
};
