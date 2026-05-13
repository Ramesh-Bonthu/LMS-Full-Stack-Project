const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, requireRole } = require("../middleware/auth");

router.get("/users", verifyToken, requireRole("ADMIN"), adminController.getAllUsers);
router.post("/users/:id/approve", verifyToken, requireRole("ADMIN"), adminController.approveUser);
router.post("/users/:id/reject", verifyToken, requireRole("ADMIN"), adminController.rejectUser);
router.get("/stats", verifyToken, requireRole("ADMIN"), adminController.getStats);
router.get("/enrollment-trend", verifyToken, requireRole("ADMIN"), adminController.getEnrollmentTrend);

module.exports = router;
