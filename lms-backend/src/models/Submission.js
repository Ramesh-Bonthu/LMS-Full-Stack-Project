const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Submission", {
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
};
