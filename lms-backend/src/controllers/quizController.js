const { Quiz, QuizAttempt, Course } = require("../models");
const { Op } = require("sequelize");

exports.generateQuizQuestions = async (req, res) => {
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
    marks,
    submittedAt: new Date(),
  });

  const percent = Math.round((marks / totalMarks) * 100);
  return res.status(201).json({ ...attempt.toJSON(), percentage: percent });
};
