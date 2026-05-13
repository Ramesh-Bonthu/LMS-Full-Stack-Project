const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Course", {
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
};
