require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME || "lms_db",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);

const User = require("./User")(sequelize);
const Course = require("./Course")(sequelize);
const Assignment = require("./Assignment")(sequelize);
const Submission = require("./Submission")(sequelize);
const Quiz = require("./Quiz")(sequelize);
const QuizAttempt = require("./QuizAttempt")(sequelize);
const Announcement = require("./Announcement")(sequelize);
const AttendanceRecord = require("./AttendanceRecord")(sequelize);
const CourseContent = require("./CourseContent")(sequelize);
const Notification = require("./Notification")(sequelize);
const Resource = require("./Resource")(sequelize);

// Associations
Course.hasMany(CourseContent, { foreignKey: "courseId", as: "contents" });
CourseContent.belongsTo(Course, { foreignKey: "courseId" });

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
  Notification,
  Resource,
};
