const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Quiz", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    courseId: { type: DataTypes.INTEGER },
    totalQuestions: { type: DataTypes.INTEGER, defaultValue: 10 },
    totalMarks: { type: DataTypes.INTEGER, defaultValue: 20 },
    timeLimit: { type: DataTypes.INTEGER, defaultValue: 15 },
    questions: { type: DataTypes.JSON, defaultValue: [] },
  });
};
