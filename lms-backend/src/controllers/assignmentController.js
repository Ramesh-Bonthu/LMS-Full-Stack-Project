const { Assignment, Submission, Course, Notification, User } = require("../models");
const { Op } = require("sequelize");
const path = require("path");

exports.getAllAssignments = async (req, res) => {
  const role = String(req.user.role || "").toUpperCase();
  const currentUserId = req.user.userId || req.user.id;

  if (role === "STUDENT") {
    // Only show assignments for courses the student is enrolled in
    const allCourses = await Course.findAll();
    const enrolledCourseIds = allCourses
      .filter(c => {
        const enrolledIds = c.enrolledStudentIds || [];
        const isEnrolled = enrolledIds.some(id => String(id) === String(currentUserId));
        return isEnrolled;
      })
      .map(c => c.id);
    
    const assignments = await Assignment.findAll({
      where: {
        courseId: { [Op.in]: enrolledCourseIds },
        [Op.or]: [{ isApproved: true }, { status: "APPROVED" }, { status: null }]
      }
    });

    // Fetch this specific student's submissions to show their individual status/marks
    const studentSubmissions = await Submission.findAll({
      where: { studentId: currentUserId }
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

  if (role === "FACULTY") {
    const facultyCourses = await Course.findAll({
      where: {
        [Op.or]: [
          { facultyId: currentUserId },
          { facultyName: req.user.name || "" }
        ]
      }
    });
    const facultyCourseIds = facultyCourses.map(c => c.id);
    const assignments = await Assignment.findAll({
      where: {
        courseId: { [Op.in]: facultyCourseIds }
      }
    });
    return res.json(assignments);
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
    let fileSizeInBytes = 0;
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext !== ".pdf" && req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ message: "Only PDF (.pdf) files are allowed for Question Paper PDF." });
      }
      pdfUrl = `/uploads/${req.file.filename}`;
      fileSizeInBytes = req.file.size || 0;
    }

    const FIFTY_MB = 50 * 1024 * 1024;
    const userRole = String(req.user?.role || "").toUpperCase();
    const isOver50MB = fileSizeInBytes > FIFTY_MB && userRole !== "ADMIN" && userRole !== "HOD";

    const assignmentStatus = isOver50MB ? "PENDING_HOD_APPROVAL" : "APPROVED";
    const isApproved = !isOver50MB;

    const assignment = await Assignment.create({
      title,
      description: description || "",
      pdfUrl: pdfUrl,
      courseId: course.id,
      courseName: course.title,
      deadline: deadline ? new Date(deadline) : new Date(),
      totalMarks: Number(totalMarks || 100),
      fileSize: fileSizeInBytes,
      status: assignmentStatus,
      isApproved: isApproved,
    });

    if (isOver50MB) {
      const hods = await User.findAll({
        where: {
          [Op.or]: [
            { role: "ADMIN" },
            { role: "HOD" },
            { branch: course.branch || req.user.branch || "CSE" }
          ]
        }
      });
      if (hods.length > 0) {
        const notifications = hods.map(h => ({
          userId: h.id,
          title: "Pending HOD Approval (>50MB Assignment Attachment)",
          message: `Faculty ${req.user?.name || "Instructor"} created assignment "${assignment.title}" with a >50MB PDF attachment (${(fileSizeInBytes / (1024 * 1024)).toFixed(1)}MB) in course "${course.title}". HOD approval required to publish.`,
          type: "WARNING",
          isRead: false
        }));
        await Notification.bulkCreate(notifications);
      }
    } else {
      // Notify all enrolled students if <= 50MB
      const enrolledIds = course.enrolledStudentIds || [];
      if (enrolledIds.length > 0) {
        const notifications = enrolledIds.map(studentId => ({
          userId: studentId,
          title: "New Assignment Posted",
          message: `A new assignment "${assignment.title}" has been posted for ${course.title}. Deadline: ${assignment.deadline.toLocaleDateString()}.`,
          type: "INFO",
          isRead: false
        }));
        await Notification.bulkCreate(notifications);
      }
    }

    const noticeMessage = isOver50MB 
      ? "Assignment created! File size exceeds 50MB and requires Department HOD approval before publishing to students."
      : "Assignment created & published successfully.";

    return res.status(201).json({ ...assignment.toJSON(), message: noticeMessage });
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
      return res.status(400).json({ message: "Assignment submission requires a PDF file (.pdf)" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== ".pdf" || req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "Only PDF (.pdf) files are allowed for Assignment submission." });
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
        title: "All Submissions Received",
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
  const role = String(req.user?.role || "").toUpperCase();
  const currentUserId = req.user?.userId || req.user?.id;

  if (role === "STUDENT") {
    const subs = await Submission.findAll({ where: { studentId: currentUserId } });
    return res.json(subs);
  }

  if (role === "FACULTY") {
    const facultyCourses = await Course.findAll({
      where: {
        [Op.or]: [
          { facultyId: currentUserId },
          { facultyName: req.user.name || "" }
        ]
      }
    });
    const facultyCourseIds = facultyCourses.map(c => c.id);
    const facultyAssignments = await Assignment.findAll({
      where: { courseId: { [Op.in]: facultyCourseIds } }
    });
    const assignmentIds = facultyAssignments.map(a => a.id);
    const subs = await Submission.findAll({
      where: { assignmentId: { [Op.in]: assignmentIds } }
    });
    return res.json(subs);
  }

  const subs = await Submission.findAll();
  return res.json(subs);
};

exports.gradeSubmission = async (req, res) => {
  const submission = await Submission.findByPk(req.params.id);
  if (!submission) return res.status(404).json({ message: "Submission not found" });

  const rawMarks = Number(req.body.marks || 0);
  const finalMarks = Math.min(100, Math.max(0, isNaN(rawMarks) ? 0 : rawMarks));

  await submission.update({
    marks: finalMarks,
    feedback: req.body.feedback || "",
    status: "GRADED",
  });

  // Create notification for the student
  await Notification.create({
    userId: submission.studentId,
    title: "Assignment Graded",
    message: `Your submission for "${submission.assignmentTitle}" has been graded. Marks: ${finalMarks}/100.`,
    type: "SUCCESS",
  });

  return res.json(submission);
};

exports.updateAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const assignment = await Assignment.findByPk(id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    if (status === "REJECTED") {
      await assignment.destroy();
      return res.json({ message: "Assignment rejected and removed" });
    }

    assignment.status = "APPROVED";
    assignment.isApproved = true;
    await assignment.save();

    const course = await Course.findByPk(assignment.courseId);
    if (course) {
      const enrolledIds = course.enrolledStudentIds || [];
      if (enrolledIds.length > 0) {
        const notifications = enrolledIds.map(studentId => ({
          userId: studentId,
          title: "New Assignment Posted",
          message: `A new assignment "${assignment.title}" has been approved and posted for ${course.title}. Deadline: ${assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'N/A'}.`,
          type: "INFO",
          isRead: false
        }));
        await Notification.bulkCreate(notifications);
      }
    }

    return res.json({ message: "Assignment approved and published!", assignment });
  } catch (error) {
    return res.status(500).json({ message: "Error updating assignment status", error: error.message });
  }
};
