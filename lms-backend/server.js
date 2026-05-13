require("dotenv").config();
const app = require("./src/app");
const { sequelize, User } = require("./src/models");
const bcrypt = require("bcryptjs");

const PORT = Number(process.env.PORT || 8082);

// Initialization
sequelize.sync({ alter: true }).then(async () => {
  console.log("Database synced");
  const count = await User.count();
  if (count === 0) {
    await User.bulkCreate([
      { name: "Admin User", email: "admin@example.com", password: bcrypt.hashSync("password123", 10), role: "ADMIN", active: true, isVerified: true },
      { name: "Faculty User", email: "faculty@example.com", password: bcrypt.hashSync("password123", 10), role: "FACULTY", active: true, isVerified: true },
      { name: "Student User", email: "student@example.com", password: bcrypt.hashSync("password123", 10), role: "STUDENT", active: true, isVerified: true },
    ]);
    console.log("Default users created");
  }
}).catch(err => {
  console.error("Database connection failed", err);
});

app.listen(PORT, () => {
  console.log(`LMS backend is running on http://localhost:${PORT}`);
  console.log("Demo credentials:");
  console.log("  Admin: admin@example.com / password123");
  console.log("  Faculty: faculty@example.com / password123");
  console.log("  Student: student@example.com / password123");
});
