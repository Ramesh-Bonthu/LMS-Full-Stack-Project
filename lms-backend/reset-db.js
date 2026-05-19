require("dotenv").config();
const { sequelize, User } = require("./src/models");
const bcrypt = require("bcryptjs");

async function resetDatabase() {
  try {
    console.log("Connecting to the database...");
    await sequelize.authenticate();
    
    console.log("Dropping all tables and re-syncing (force: true)...");
    await sequelize.sync({ force: true });
    
    console.log("Creating default users...");
    await User.bulkCreate([
      { name: "Admin User", email: "admin@example.com", password: bcrypt.hashSync("password123", 10), role: "ADMIN", active: true, isVerified: true },
      { name: "Faculty User", email: "faculty@example.com", password: bcrypt.hashSync("password123", 10), role: "FACULTY", active: true, isVerified: true },
      { name: "Student User", email: "student@example.com", password: bcrypt.hashSync("password123", 10), role: "STUDENT", active: true, isVerified: true },
    ]);
    
    console.log("Database reset successfully! The default users have been recreated.");
    process.exit(0);
  } catch (error) {
    console.error("An error occurred while resetting the database:", error);
    process.exit(1);
  }
}

resetDatabase();
