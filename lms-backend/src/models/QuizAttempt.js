const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("QuizAttempt", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    quizId: { type: DataTypes.INTEGER },
    studentId: { type: DataTypes.INTEGER },
    answers: { type: DataTypes.JSON },
    marks: { type: DataTypes.INTEGER },
    submittedAt: { type: DataTypes.DATE },
  });
};
