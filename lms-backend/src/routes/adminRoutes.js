const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, requireRole } = require("../middleware/auth");

router.get("/users", verifyToken, requireRole("ADMIN"), adminController.getAllUsers);
router.post("/users", verifyToken, requireRole("ADMIN"), adminController.createUser);
router.post("/users/send-otp", verifyToken, requireRole("ADMIN"), adminController.sendCreateUserOtp);
router.post("/users/verify-and-create", verifyToken, requireRole("ADMIN"), adminController.verifyAndCreateUser);
router.post("/users/:id/approve", verifyToken, requireRole("ADMIN"), adminController.approveUser);
router.post("/users/:id/reject", verifyToken, requireRole("ADMIN"), adminController.rejectUser);
router.get("/stats", verifyToken, requireRole("ADMIN"), adminController.getStats);
router.get("/enrollment-trend", verifyToken, requireRole("ADMIN"), adminController.getEnrollmentTrend);

router.get("/users/:id/activity-logs", verifyToken, requireRole("ADMIN"), adminController.getUserActivityLogs);

module.exports = router;
