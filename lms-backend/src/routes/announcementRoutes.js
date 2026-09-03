const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const { verifyToken, requireRole } = require("../middleware/auth");

router.get("/", verifyToken, announcementController.getAllAnnouncements);
router.post("/", verifyToken, requireRole("FACULTY", "ADMIN"), announcementController.createAnnouncement);
router.put("/:id", verifyToken, requireRole("FACULTY", "ADMIN"), announcementController.updateAnnouncement);
router.delete("/:id", verifyToken, requireRole("FACULTY", "ADMIN"), announcementController.deleteAnnouncement);
router.get("/debug/:role", verifyToken, requireRole("ADMIN"), announcementController.debugAnnouncements);

module.exports = router;
