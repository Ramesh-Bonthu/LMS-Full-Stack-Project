const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("CourseContent", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    courseId: { type: DataTypes.INTEGER },
    name: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING },
    link: { type: DataTypes.STRING },
  });
};
