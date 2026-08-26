const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const { verifyToken, requireRole } = require("../middleware/auth");

router.post("/generate", verifyToken, requireRole("FACULTY", "ADMIN"), quizController.generateQuizQuestions);
router.get("/", verifyToken, quizController.getAllQuizzes);
router.get("/:id", verifyToken, quizController.getQuizById);
router.get("/:id/attempts", verifyToken, requireRole("FACULTY", "ADMIN"), quizController.getQuizAttempts);
router.post("/", verifyToken, requireRole("FACULTY", "ADMIN"), quizController.createQuiz);
router.post("/:id/submit", verifyToken, requireRole("STUDENT"), quizController.submitQuiz);

module.exports = router;
