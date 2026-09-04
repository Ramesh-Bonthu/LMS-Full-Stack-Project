require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

const sequelize = new Sequelize(
  process.env.DB_NAME || "lms_db",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      // Optional: use this if you're using a hosted DB that requires SSL
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false
      // }
    },
  }
);

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verificationOtp: { type: DataTypes.STRING },
});

const Course = sequelize.define("Course", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  facultyId: { type: DataTypes.INTEGER },
  facultyName: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "PENDING" },
  studentCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  enrolledStudentIds: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  progressByStudent: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  rejectionReason: { type: DataTypes.STRING },
});

const Assignment = sequelize.define("Assignment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  courseId: { type: DataTypes.INTEGER },
  courseName: { type: DataTypes.STRING },
  deadline: { type: DataTypes.DATE },
  totalMarks: { type: DataTypes.INTEGER, defaultValue: 100 },
});

const Submission = sequelize.define("Submission", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assignmentId: { type: DataTypes.INTEGER },
  assignmentTitle: { type: DataTypes.STRING },
  studentId: { type: DataTypes.INTEGER },
  studentName: { type: DataTypes.STRING },
  filePath: { type: DataTypes.STRING },
  submittedAt: { type: DataTypes.DATE },
  marks: { type: DataTypes.INTEGER, defaultValue: -1 },
  feedback: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: "SUBMITTED" },
});

const Quiz = sequelize.define("Quiz", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  courseId: { type: DataTypes.INTEGER },
  totalQuestions: { type: DataTypes.INTEGER, defaultValue: 10 },
  totalMarks: { type: DataTypes.INTEGER, defaultValue: 20 },
  timeLimit: { type: DataTypes.INTEGER, defaultValue: 15 },
  questions: { type: DataTypes.JSON, defaultValue: [] },
});

const QuizAttempt = sequelize.define("QuizAttempt", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quizId: { type: DataTypes.INTEGER },
  studentId: { type: DataTypes.INTEGER },
  answers: { type: DataTypes.JSON },
  marks: { type: DataTypes.INTEGER },
  submittedAt: { type: DataTypes.DATE },
});

const Announcement = sequelize.define("Announcement", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.TEXT },
  audience: { type: DataTypes.STRING, defaultValue: "ALL" },
  courseId: { type: DataTypes.INTEGER, allowNull: true },
  authorName: { type: DataTypes.STRING, defaultValue: "Faculty Instructor" },
  authorRole: { type: DataTypes.STRING, defaultValue: "FACULTY" },
  category: { type: DataTypes.STRING, defaultValue: "ANNOUNCEMENT" },
  replies: { type: DataTypes.JSON, defaultValue: [] },
});

const AttendanceRecord = sequelize.define("AttendanceRecord", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.INTEGER },
  courseId: { type: DataTypes.INTEGER },
  date: { type: DataTypes.STRING },
  month: { type: DataTypes.STRING },
  value: { type: DataTypes.INTEGER },
});

const CourseContent = sequelize.define("CourseContent", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  courseId: { type: DataTypes.INTEGER },
  name: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  link: { type: DataTypes.STRING },
});

module.exports = {
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
};
