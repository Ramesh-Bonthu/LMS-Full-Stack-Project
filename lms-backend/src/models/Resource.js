const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Resource", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    type: { type: DataTypes.STRING, defaultValue: "PDF" }, // PDF, VIDEO, LINK, DOC
    url: { type: DataTypes.STRING, allowNull: false },
    facultyId: { type: DataTypes.INTEGER },
    courseId: { type: DataTypes.INTEGER },
    category: { type: DataTypes.STRING, defaultValue: "General" },
    branch: { type: DataTypes.STRING, defaultValue: "ALL" },
    regulation: { type: DataTypes.STRING, defaultValue: "ALL" },
    fileSize: { type: DataTypes.BIGINT },
    coverUrl: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: "APPROVED" }, // APPROVED, PENDING_APPROVAL, REJECTED
    isApproved: { type: DataTypes.BOOLEAN, defaultValue: true },
  });
};


