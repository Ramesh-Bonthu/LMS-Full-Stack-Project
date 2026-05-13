const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, notificationController.getNotifications);
router.get("/unread-count", verifyToken, notificationController.getUnreadCount);
router.put("/mark-all-read", verifyToken, notificationController.markAllAsRead);
router.put("/:id/mark-read", verifyToken, notificationController.markAsRead);

module.exports = router;
