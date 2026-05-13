const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { verifyToken, requireRole } = require("../middleware/auth");

router.get("/", verifyToken, attendanceController.getAttendance);
router.post("/", verifyToken, requireRole("FACULTY", "ADMIN"), attendanceController.markAttendance);

module.exports = router;
