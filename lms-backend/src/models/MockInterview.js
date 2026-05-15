const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("MockInterview", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER },
    studentName: { type: DataTypes.STRING },
    type: { 
      type: DataTypes.STRING,
      defaultValue: "TOPIC"
    },
    subject: { type: DataTypes.STRING }, // e.g. "React Hooks", "Frontend Dev"
    resumeText: { type: DataTypes.TEXT }, // Content of the uploaded resume
    transcript: { 
      type: DataTypes.JSON, 
      defaultValue: [] 
    }, // Array of { role: 'ai'|'user', content: string }
    feedback: { type: DataTypes.TEXT },
    score: { type: DataTypes.INTEGER },
    status: { 
      type: DataTypes.STRING,
      defaultValue: "STARTED"
    },
    duration: { type: DataTypes.INTEGER }, // in seconds
  });
};
