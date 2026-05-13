const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const courseRoutes = require("./courseRoutes");
const assignmentRoutes = require("./assignmentRoutes");
const quizRoutes = require("./quizRoutes");
const attendanceRoutes = require("./attendanceRoutes");
const announcementRoutes = require("./announcementRoutes");
const adminRoutes = require("./adminRoutes");
const miscRoutes = require("./miscRoutes");
const userRoutes = require("./userRoutes");
const notificationRoutes = require("./notificationRoutes");
const resourceRoutes = require("./resourceRoutes");

router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/quizzes", quizRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/announcements", announcementRoutes);
router.use("/admin", adminRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);
router.use("/resources", resourceRoutes);
router.use("/", miscRoutes);

module.exports = router;
