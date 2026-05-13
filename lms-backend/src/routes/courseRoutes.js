const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { verifyToken, requireRole } = require("../middleware/auth");

const upload = require("../middleware/upload");

router.get("/", verifyToken, courseController.getAllCourses);
router.get("/approved", verifyToken, courseController.getApprovedCourses);
router.get("/:id", verifyToken, courseController.getCourseById);
router.post("/", verifyToken, requireRole("FACULTY", "ADMIN"), courseController.createCourse);
router.put("/:id", verifyToken, requireRole("FACULTY", "ADMIN"), courseController.updateCourse);
router.delete("/:id", verifyToken, requireRole("FACULTY", "ADMIN"), courseController.deleteCourse);
router.post("/:id/enroll", verifyToken, requireRole("STUDENT"), courseController.enrollCourse);
router.post("/:id/approve", verifyToken, requireRole("ADMIN"), courseController.approveCourse);
router.post("/:id/reject", verifyToken, requireRole("ADMIN"), courseController.rejectCourse);
router.get("/:id/content", verifyToken, courseController.getCourseContent);
router.post("/:id/content", verifyToken, requireRole("FACULTY", "ADMIN"), courseController.addCourseContent);
router.post("/:id/content/upload", verifyToken, requireRole("FACULTY", "ADMIN"), upload.single("file"), courseController.uploadCourseContent);
router.post("/:id/content/:contentId/complete", verifyToken, requireRole("STUDENT"), courseController.markContentComplete);
router.get("/:id/students", verifyToken, requireRole("FACULTY", "ADMIN"), courseController.getCourseStudents);

module.exports = router;
