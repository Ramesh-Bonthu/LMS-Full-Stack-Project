const { Assignment, Submission, Course, Notification } = require("../models");
const { Op } = require("sequelize");

exports.getAllAssignments = async (req, res) => {
  if (req.user.role === "STUDENT") {
    // Only show assignments for courses the student is enrolled in
    const allCourses = await Course.findAll();
    const enrolledCourseIds = allCourses
      .filter(c => {
        const enrolledIds = c.enrolledStudentIds || [];
        const isEnrolled = enrolledIds.some(id => String(id) === String(req.user.userId));
        return isEnrolled;
      })
      .map(c => c.id);
    
    const assignments = await Assignment.findAll({
      where: {
        courseId: { [Op.in]: enrolledCourseIds }
      }
    });

    // Fetch this specific student's submissions to show their individual status/marks
    const studentSubmissions = await Submission.findAll({
      where: { studentId: req.user.userId }
    });

    const enrichedAssignments = assignments.map(a => {
      const sub = studentSubmissions.find(s => s.assignmentId === a.id);
      return {
        ...a.toJSON(),
        status: sub ? sub.status : "PENDING",
        marks: sub ? sub.marks : undefined,
        feedback: sub ? sub.feedback : undefined,
        submissionId: sub ? sub.id : undefined
      };
    });

    return res.json(enrichedAssignments);
  }
  
  const assignments = await Assignment.findAll();
  return res.json(assignments);
};

exports.getAssignmentById = async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });
  return res.json(assignment);
};

exports.createAssignment = async (req, res) => {
  try {
    const { title, description, courseId, deadline, totalMarks } = req.body;
    const course = await Course.findByPk(courseId);
    if (!title || !course) return res.status(400).json({ message: "Valid title and course are required" });

    if (course.status !== "APPROVED") {
      return res.status(403).json({ message: "Assignments can only be created for approved courses" });
    }

    let pdfUrl = "";
    if (req.file) {
      pdfUrl = `/uploads/${req.file.filename}`;
    }

    const assignment = await Assignment.create({
      title,
      description: description || "",
      pdfUrl: pdfUrl,
      courseId: course.id,
      courseName: course.title,
      deadline: deadline ? new Date(deadline) : new Date(),
      totalMarks: Number(totalMarks || 100),
    });

    // Notify all enrolled students
    const enrolledIds = course.enrolledStudentIds || [];
    if (enrolledIds.length > 0) {
      const notifications = enrolledIds.map(studentId => ({
        userId: studentId,
        title: "New Assignment Posted 📝",
        message: `A new assignment "${assignment.title}" has been posted for ${course.title}. Deadline: ${assignment.deadline.toLocaleDateString()}.`,
        type: "INFO",
      }));
      await Notification.bulkCreate(notifications);
    }

    return res.status(201).json(assignment);
  } catch (error) {
    console.error("Error creating assignment:", error.message);
    return res.status(500).json({ message: "Error creating assignment", error: error.message });
  }
};

exports.generateAssignmentDescription = async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ message: "Topic is required" });
  
  const description = `This assignment covers the core concepts of ${topic}. 

Objectives:
1. Explain the fundamental principles of ${topic}.
2. Demonstrate practical application through a mini-project.
3. Analyze real-world scenarios where ${topic} is critical.

Requirements:
- Minimum 500 words report.
- Include code snippets or diagrams where applicable.
- Submit as a single PDF file.`;

  return res.json({ 
    title: `${topic} In-Depth Analysis`, 
    description 
  });
};

exports.updateAssignment = async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });
  await assignment.update(req.body);
  return res.json(assignment);
};

exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    let submission = await Submission.findOne({
      where: { assignmentId: assignment.id, studentId: req.user.userId }
    });

    if (!req.file) {
      return res.status(400).json({ message: "Assignment submission requires a PDF file" });
    }

    const filePath = `/uploads/${req.file.filename}`;

    if (submission) {
      await submission.update({
        filePath,
        submittedAt: new Date(),
        status: "SUBMITTED",
        marks: submission.marks >= 0 ? submission.marks : -1,
      });
    } else {
      submission = await Submission.create({
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        studentId: req.user.userId,
        studentName: req.user.name,
        filePath,
        submittedAt: new Date(),
        marks: -1,
        feedback: "",
        status: "SUBMITTED",
      });
    }

    // Check if all enrolled students have submitted
    const course = await Course.findByPk(assignment.courseId);
    const enrolledIds = course.enrolledStudentIds || [];
    const submissionsCount = await Submission.count({
      where: { assignmentId: assignment.id, status: { [Op.ne]: "PENDING" } }
    });

    if (submissionsCount >= enrolledIds.length && enrolledIds.length > 0) {
      // Notify faculty
      await Notification.create({
        userId: course.facultyId,
        title: "All Submissions Received 🎓",
        message: `All enrolled students have submitted the assignment "${assignment.title}". You can now start grading.`,
        type: "SUCCESS",
      });
    }

    return res.status(201).json(submission);
  } catch (error) {
    console.error("Error submitting assignment:", error.message);
    return res.status(500).json({ message: "Error submitting assignment", error: error.message });
  }
};

exports.getAssignmentSubmissions = async (req, res) => {
  const submissions = await Submission.findAll({ where: { assignmentId: req.params.id } });
  return res.json(submissions);
};

exports.getAllSubmissions = async (req, res) => {
  if (req.user.role === "STUDENT") {
    const subs = await Submission.findAll({ where: { studentId: req.user.userId } });
    return res.json(subs);
  }
  const subs = await Submission.findAll();
  return res.json(subs);
};

exports.gradeSubmission = async (req, res) => {
  const submission = await Submission.findByPk(req.params.id);
  if (!submission) return res.status(404).json({ message: "Submission not found" });

  await submission.update({
    marks: Number(req.body.marks || 0),
    feedback: req.body.feedback || "",
    status: "GRADED",
  });

  // Create notification for the student
  await Notification.create({
    userId: submission.studentId,
    title: "Assignment Graded 📝",
    message: `Your submission for "${submission.assignmentTitle}" has been graded. Marks: ${req.body.marks}/100.`,
    type: "SUCCESS",
  });

  return res.json(submission);
};
