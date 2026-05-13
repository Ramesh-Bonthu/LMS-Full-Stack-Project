const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignmentController");
const { verifyToken, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Static routes first to avoid conflicts with :id parameter
router.get("/", verifyToken, assignmentController.getAllAssignments);
router.get("/submissions", verifyToken, assignmentController.getAllSubmissions);
router.post("/generate", verifyToken, requireRole("FACULTY", "ADMIN"), assignmentController.generateAssignmentDescription);

// Parameterized routes
router.post("/", verifyToken, requireRole("FACULTY", "ADMIN"), assignmentController.createAssignment);
router.get("/:id", verifyToken, assignmentController.getAssignmentById);
router.put("/:id", verifyToken, requireRole("FACULTY", "ADMIN"), assignmentController.updateAssignment);
router.post("/:id/submit", verifyToken, requireRole("STUDENT"), upload.single("file"), assignmentController.submitAssignment);
router.get("/:id/submissions", verifyToken, requireRole("FACULTY", "ADMIN"), assignmentController.getAssignmentSubmissions);
router.put("/submissions/:id/grade", verifyToken, requireRole("FACULTY", "ADMIN"), assignmentController.gradeSubmission);

module.exports = router;
