const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Announcement", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT },
    audience: { type: DataTypes.STRING, defaultValue: "ALL" },
  });
};
