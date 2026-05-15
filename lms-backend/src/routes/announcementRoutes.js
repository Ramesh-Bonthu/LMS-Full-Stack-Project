const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const { verifyToken, requireRole } = require("../middleware/auth");

router.get("/", verifyToken, announcementController.getAllAnnouncements);
router.post("/", verifyToken, requireRole("FACULTY", "ADMIN"), announcementController.createAnnouncement);
router.get("/debug/:role", verifyToken, requireRole("ADMIN"), announcementController.debugAnnouncements);

module.exports = router;
