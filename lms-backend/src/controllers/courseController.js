const { Course, CourseContent, User, Notification } = require("../models");
const fs = require("fs");
const pdf = require("pdf-parse");

async function extractPdfText(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return "";
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const parse = typeof pdf === 'function' ? pdf : pdf.default;
    if (typeof parse === 'function') {
      const parsedData = await parse(dataBuffer);
      return parsedData?.text || "";
    }
  } catch (err) {
    console.error("Error parsing PDF file:", err.message);
  }
  return "";
}

function serializeCourse(course, viewerId) {
  const c = course.toJSON();
  const progressData = c.progressByStudent || {};
  const viewerProgress = progressData[viewerId] || [];
  
  // Handle both old (number) and new (array) structure
  const completedContentIds = Array.isArray(viewerProgress) ? viewerProgress : [];
  
  // Calculate percentage dynamically if totalContentCount is available
  let progress = 0;
  if (c.totalContentCount > 0) {
    progress = Math.round((completedContentIds.length / c.totalContentCount) * 100);
  } else if (!Array.isArray(viewerProgress)) {
    // Fallback to old simple number if it's not an array yet
    progress = viewerProgress;
  }

  return {
    ...c,
    progress,
    completedContentIds,
  };
}

exports.getAllCourses = async (req, res) => {
  const role = String(req.user.role).toUpperCase();
  let whereClause = {};
  
  if (role === "STUDENT") {
    whereClause = { status: "APPROVED" };
  }

  const courses = await Course.findAll({ 
    where: whereClause,
    include: [{ model: CourseContent, as: 'contents', attributes: ['id'] }]
  });

  const viewerId = req.user.userId;
  return res.json(courses.map((course) => {
    const totalContentCount = course.contents ? course.contents.length : 0;
    course.setDataValue('totalContentCount', totalContentCount);
    return serializeCourse(course, viewerId);
  }));
};

exports.getApprovedCourses = async (req, res) => {
  const courses = await Course.findAll({ 
    where: { status: "APPROVED" },
    include: [{ model: CourseContent, as: 'contents', attributes: ['id'] }]
  });
  return res.json(courses.map((course) => {
    const totalContentCount = course.contents ? course.contents.length : 0;
    course.setDataValue('totalContentCount', totalContentCount);
    return serializeCourse(course, req.user?.userId);
  }));
};

exports.getCourseById = async (req, res) => {
  const course = await Course.findByPk(req.params.id, {
    include: [{ model: CourseContent, as: 'contents', attributes: ['id'] }]
  });
  if (!course) return res.status(404).json({ message: "Course not found" });
  
  const totalContentCount = course.contents ? course.contents.length : 0;
  course.setDataValue('totalContentCount', totalContentCount);
  
  return res.json(serializeCourse(course, req.user?.userId));
};

exports.markContentComplete = async (req, res) => {
  try {
    const { id, contentId } = req.params;
    const course = await Course.findByPk(id, {
      include: [{ model: CourseContent, as: 'contents', attributes: ['id'] }]
    });
    if (!course) return res.status(404).json({ message: "Course not found" });

    const uId = String(req.user.userId);
    let progressData = { ...(course.progressByStudent || {}) };
    let completedIds = progressData[uId];

    // Transition from old number to new array if needed
    if (!Array.isArray(completedIds)) {
      completedIds = [];
    }

    const cId = Number(contentId);
    if (!completedIds.includes(cId)) {
      completedIds.push(cId);
      progressData[uId] = completedIds;
      course.progressByStudent = progressData;
      course.changed('progressByStudent', true);
      await course.save();
    }

    const totalContentCount = course.contents ? course.contents.length : 0;
    course.setDataValue('totalContentCount', totalContentCount);

    return res.json({
      message: "Content marked as complete",
      course: serializeCourse(course, req.user.userId)
    });
  } catch (error) {
    console.error("Error marking content complete:", error);
    return res.status(500).json({ message: "Error updating progress", error: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { title, code, description, content } = req.body;
    if (!title || !code) return res.status(400).json({ message: "Title and code are required" });

    let pdfContent = content || "";
    let pdfUrl = "";

    if (req.file) {
      const extractedText = await extractPdfText(req.file.path);
      if (extractedText) pdfContent = extractedText;
      pdfUrl = `/uploads/${req.file.filename}`;
    }

    const newCourse = await Course.create({
      title,
      code,
      description: description || "",
      content: pdfContent,
      pdfUrl: pdfUrl,
      facultyId: req.user.userId,
      facultyName: req.user.name,
      status: req.user.role === "ADMIN" ? "APPROVED" : "PENDING",
      studentCount: 0,
      enrolledStudentIds: [],
      progressByStudent: {},
    });

    // If faculty creates course, notify all admins for approval
    if (newCourse.status === "PENDING") {
      const admins = await User.findAll({ where: { role: "ADMIN" } });
      if (admins.length > 0) {
        const notifications = admins.map(admin => ({
          userId: admin.id,
          title: "New Course Approval Request 🛡️",
          message: `Faculty ${req.user.name} has submitted a new course "${title}" for approval.`,
          type: "WARNING",
          isRead: false
        }));
        await Notification.bulkCreate(notifications);
      }
    }

    return res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error creating course:", error.message);
    return res.status(500).json({ message: "Error creating course", error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.user.role !== "ADMIN" && course.facultyId !== req.user.userId) {
      return res.status(403).json({ message: "You can only edit your own courses" });
    }

    const updateData = { ...req.body };
    if (req.file) {
      const extractedText = await extractPdfText(req.file.path);
      if (extractedText) updateData.content = extractedText;
      updateData.pdfUrl = `/uploads/${req.file.filename}`;
    }

    await course.update(updateData);
    return res.json(course);
  } catch (error) {
    console.error("Error updating course:", error.message);
    return res.status(500).json({ message: "Error updating course", error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  if (req.user.role !== "ADMIN" && course.facultyId !== req.user.userId) {
    return res.status(403).json({ message: "You can only delete your own courses" });
  }

  await course.destroy();
  return res.json({ message: "Course deleted successfully" });
};

exports.enrollCourse = async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  
  if (course.status !== "APPROVED") {
    return res.status(400).json({ message: "This course is not yet approved for enrollment. Please try again later." });
  }

  let enrolled = [...(course.enrolledStudentIds || [])];
  const uId = String(req.user.userId);
  if (!enrolled.some(id => String(id) === uId)) {
    enrolled.push(req.user.userId);
    let progress = { ...(course.progressByStudent || {}) };
    progress[uId] = progress[uId] || 0;
    
    course.enrolledStudentIds = enrolled;
    course.progressByStudent = progress;
    course.studentCount = enrolled.length;
    
    course.changed('enrolledStudentIds', true);
    course.changed('progressByStudent', true);
    await course.save();
  }

  return res.json({
    message: "Enrolled successfully",
    course: serializeCourse(course, req.user.userId),
  });
};

exports.approveCourse = async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  await course.update({ status: "APPROVED", rejectionReason: null });

  // Notify the faculty
  await Notification.create({
    userId: course.facultyId,
    title: "Course Approved! ✅",
    message: `Your course "${course.title}" has been approved and is now live for enrollment.`,
    type: "SUCCESS",
    isRead: false
  });

  return res.json(course);
};

exports.rejectCourse = async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  await course.update({ status: "REJECTED", rejectionReason: req.body.reason || "Not provided" });

  // Notify the faculty
  await Notification.create({
    userId: course.facultyId,
    title: "Course Approval Update ❌",
    message: `Your course "${course.title}" was not approved. Reason: ${req.body.reason || "Not provided"}.`,
    type: "ERROR",
    isRead: false
  });

  return res.json(course);
};

exports.getCourseContent = async (req, res) => {
  const content = await CourseContent.findAll({ where: { courseId: req.params.id } });
  return res.json(content);
};

exports.addCourseContent = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    if (course.status !== "APPROVED") {
      return res.status(403).json({ message: "Content can only be added to approved courses" });
    }

    const { name, url, type, link } = req.body;
    const content = await CourseContent.create({
      courseId: req.params.id,
      name: name || "Untitled Resource",
      link: url || link, 
      type: type || "youtube",
    });

    // Notify enrolled students
    const enrolledIds = course.enrolledStudentIds || [];
    if (enrolledIds.length > 0) {
      const notifications = enrolledIds.map(studentId => ({
        userId: studentId,
        title: "New Course Content 📚",
        message: `New content "${content.name}" has been added to your course "${course.title}".`,
        type: "INFO",
        isRead: false
      }));
      await Notification.bulkCreate(notifications);
    }

    return res.status(201).json(content);
  } catch (error) {
    console.error("Error adding course content:", error);
    return res.status(500).json({ message: "Error adding course content", error: error.message });
  }
};

exports.uploadCourseContent = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    if (course.status !== "APPROVED") {
      return res.status(403).json({ message: "Content can only be added to approved courses" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { name, type } = req.body;
    // Store the relative path to the file
    const filePath = `/uploads/${req.file.filename}`;

    const content = await CourseContent.create({
      courseId: req.params.id,
      name: name || req.file.originalname,
      link: filePath,
      type: type || (req.file.mimetype.includes("video") ? "video" : "pdf"),
    });

    // Notify enrolled students
    const enrolledIds = course.enrolledStudentIds || [];
    if (enrolledIds.length > 0) {
      const notifications = enrolledIds.map(studentId => ({
        userId: studentId,
        title: "New Course Content 📚",
        message: `New content "${content.name}" has been added to your course "${course.title}".`,
        type: "INFO",
        isRead: false
      }));
      await Notification.bulkCreate(notifications);
    }

    return res.status(201).json(content);
  } catch (error) {
    console.error("Error uploading course content:", error);
    return res.status(500).json({ message: "Error uploading course content", error: error.message });
  }
};

exports.getCourseStudents = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    const enrolled = (course.enrolledStudentIds || []).map(id => Number(id));
    let students = [];
    if (enrolled.length > 0) {
      students = await User.findAll({
        where: { id: enrolled, role: "STUDENT" },
        attributes: ['id', 'name', 'email', 'role']
      });
    }
    if (students.length === 0) {
      students = await User.findAll({
        where: { role: "STUDENT" },
        attributes: ['id', 'name', 'email', 'role']
      });
    }
    return res.json(students);
  } catch (error) {
    console.error("Error fetching course students:", error);
    return res.status(500).json({ message: "Error fetching course students", error: error.message });
  }
};
