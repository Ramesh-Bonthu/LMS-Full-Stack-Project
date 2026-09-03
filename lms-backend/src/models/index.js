require("dotenv").config();
const { Sequelize } = require("sequelize");

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === "true" ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || "lms_db",
    process.env.DB_USER || "postgres",
    process.env.DB_PASSWORD || "",
    {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: process.env.DB_SSL === "true" ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    }
  );
}

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
const MockInterview = require("./MockInterview")(sequelize);


// Associations
Course.hasMany(CourseContent, { foreignKey: "courseId", as: "contents" });
CourseContent.belongsTo(Course, { foreignKey: "courseId" });
Resource.belongsTo(User, { foreignKey: "facultyId", as: "faculty" });
User.hasMany(Resource, { foreignKey: "facultyId", as: "resources" });
Resource.belongsTo(Course, { foreignKey: "courseId", as: "course" });
Course.hasMany(Resource, { foreignKey: "courseId", as: "resources" });

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
  MockInterview,
};
