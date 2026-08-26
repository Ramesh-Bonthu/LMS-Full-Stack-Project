const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Assignment", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    pdfUrl: { type: DataTypes.STRING },
    courseId: { type: DataTypes.INTEGER },
    courseName: { type: DataTypes.STRING },
    deadline: { type: DataTypes.DATE },
    totalMarks: { type: DataTypes.INTEGER, defaultValue: 100 },
  });
};
