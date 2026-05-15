const express = require("express");
const router = express.Router();
const mockInterviewController = require("../controllers/mockInterviewController");
const { verifyToken } = require("../middleware/auth");

const multer = require("multer");
const upload = multer({ dest: "uploads/resumes/" });

router.get("/history", verifyToken, mockInterviewController.getHistory);
router.post("/start", verifyToken, upload.single("resume"), mockInterviewController.startSession);
router.post("/chat", verifyToken, mockInterviewController.chat);
router.post("/:id/end", verifyToken, mockInterviewController.endSession);

module.exports = router;
