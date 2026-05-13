const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("AttendanceRecord", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER },
    courseId: { type: DataTypes.INTEGER },
    date: { type: DataTypes.STRING },
    month: { type: DataTypes.STRING },
    value: { type: DataTypes.INTEGER },
  });
};
