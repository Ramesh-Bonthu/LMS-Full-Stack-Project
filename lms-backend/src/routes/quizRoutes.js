const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const { verifyToken, requireRole } = require("../middleware/auth");

// Static routes MUST come before parameterized /:id routes
router.get("/my-attempts", verifyToken, quizController.getMyQuizAttempts);
router.get("/all-attempts", verifyToken, requireRole("FACULTY", "ADMIN"), quizController.getAllQuizAttempts);
router.post("/generate", verifyToken, requireRole("FACULTY", "ADMIN"), quizController.generateQuizQuestions);
router.get("/", verifyToken, quizController.getAllQuizzes);
router.post("/", verifyToken, requireRole("FACULTY", "ADMIN"), quizController.createQuiz);

// Parameterized sub-routes
router.put("/attempts/:attemptId", verifyToken, requireRole("FACULTY", "ADMIN"), quizController.updateQuizAttemptMarks);
router.get("/:id/attempts", verifyToken, requireRole("FACULTY", "ADMIN"), quizController.getQuizAttempts);
router.post("/:id/submit", verifyToken, requireRole("STUDENT"), quizController.submitQuiz);
router.get("/:id", verifyToken, quizController.getQuizById);

module.exports = router;
