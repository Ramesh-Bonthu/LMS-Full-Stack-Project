const path = require("path");
const { Op } = require("sequelize");
const { Resource, User, Course } = require("../models");

exports.getAllResources = async (req, res) => {
  try {
    const { branch, regulation, status } = req.query;
    const userRole = (req.user?.role || "").toUpperCase();
    const currentUserId = req.user?.userId || req.user?.id;

    const andConditions = [];

    // 1. Branch filter condition: exact match when specific branch selected
    if (branch && branch.trim().toUpperCase() !== "ALL") {
      const b = branch.trim().toUpperCase();
      andConditions.push({ branch: b });
    }

    // 2. Regulation filter condition: exact match when specific regulation selected
    if (regulation && regulation.trim().toUpperCase() !== "ALL") {
      const r = regulation.trim().toUpperCase();
      andConditions.push({ regulation: r });
    }


    // 3. Status & Visibility condition
    if (userRole === "ADMIN") {
      if (status && status.trim().toUpperCase() !== "ALL") {
        andConditions.push({ status: status.trim().toUpperCase() });
      }
    } else if (userRole === "FACULTY") {
      andConditions.push({
        [Op.or]: [
          { status: "APPROVED" },
          { isApproved: true },
          { [Op.and]: [{ facultyId: currentUserId }, { status: "PENDING_APPROVAL" }] }
        ]
      });
    } else {
      // Students and others see only approved
      andConditions.push({
        [Op.or]: [{ status: "APPROVED" }, { isApproved: true }]
      });
    }

    const whereClause = andConditions.length > 0 ? { [Op.and]: andConditions } : {};


    const resources = await Resource.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "faculty",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: Course,
          as: "course",
          attributes: ["id", "title", "code"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const serialized = resources.map((r) => {
      const plain = r.toJSON();
      const facName = plain.faculty ? plain.faculty.name : "Faculty Member";
      return {
        ...plain,
        branch: plain.branch || "ALL",
        regulation: plain.regulation || "ALL",
        status: plain.status || (plain.isApproved === false ? "PENDING_APPROVAL" : "APPROVED"),
        isApproved: plain.isApproved !== undefined ? plain.isApproved : plain.status !== "PENDING_APPROVAL",
        facultyName: facName,
        courseName: plain.course ? plain.course.title : (plain.category && plain.category !== "General" ? plain.category : "General"),
      };
    });
    return res.json(serialized);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching resources", error: error.message });
  }
};

exports.createResource = async (req, res) => {
  try {
    const { title, description, type, url, courseId, category, branch, regulation } = req.body;
    const currentUserId = req.user?.userId || req.user?.id;
    const userRole = (req.user?.role || "").toUpperCase();

    let resourceUrl = url;
    let fileSizeInBytes = 0;
    let coverImageUrl = req.body.coverUrl || null;

    // Handle document file & optional cover image upload (supports upload.any() and upload.fields())
    let uploadedDocFile = null;
    let uploadedCoverFile = null;

    if (Array.isArray(req.files)) {
      uploadedDocFile = req.files.find((f) => f.fieldname === "file") || req.files.find((f) => !f.fieldname.toLowerCase().includes("cover"));
      uploadedCoverFile = req.files.find((f) => f.fieldname === "coverImage") || req.files.find((f) => f.fieldname.toLowerCase().includes("cover"));
    } else if (req.files) {
      uploadedDocFile = req.files.file?.[0] || req.file;
      uploadedCoverFile = req.files.coverImage?.[0];
    } else {
      uploadedDocFile = req.file;
    }

    if (uploadedDocFile) {
      const ext = path.extname(uploadedDocFile.originalname).toLowerCase();
      const resType = (type || "PDF").toUpperCase();

      if (resType === "PDF" && ext !== ".pdf") {
        return res.status(400).json({ message: "Only PDF (.pdf) files are allowed for PDF Resource Type" });
      }
      if (resType === "DOC" && ext !== ".doc" && ext !== ".docx") {
        return res.status(400).json({ message: "Only Microsoft Word (.doc, .docx) files are allowed for MS Word Resource Type" });
      }
      if (![".pdf", ".doc", ".docx"].includes(ext)) {
        return res.status(400).json({ message: "Only PDF (.pdf) and MS Word (.doc, .docx) files are allowed for upload" });
      }

      resourceUrl = `/uploads/${uploadedDocFile.filename}`;
      fileSizeInBytes = uploadedDocFile.size;
    }

    if (uploadedCoverFile) {
      coverImageUrl = `/uploads/${uploadedCoverFile.filename}`;
    }

    if (!title || !resourceUrl) {
      return res.status(400).json({ message: "Title and file/URL are required" });
    }

    // 50MB threshold for Admin approval
    const FIFTY_MB = 50 * 1024 * 1024;
    let resourceStatus = "APPROVED";
    let isApproved = true;

    if (fileSizeInBytes > FIFTY_MB && userRole !== "ADMIN") {
      resourceStatus = "PENDING_APPROVAL";
      isApproved = false;
    }

    const resource = await Resource.create({
      title,
      description,
      type: type || "PDF",
      url: resourceUrl,
      courseId: courseId ? Number(courseId) : null,
      category: category || "General",
      branch: branch ? branch.toString().trim().toUpperCase() : "ALL",
      regulation: regulation ? regulation.toString().trim().toUpperCase() : "ALL",
      fileSize: fileSizeInBytes,
      coverUrl: coverImageUrl,
      status: resourceStatus,
      isApproved: isApproved,
      facultyId: currentUserId,
    });

    const [user, course] = await Promise.all([
      currentUserId ? User.findByPk(currentUserId) : Promise.resolve(null),
      courseId ? Course.findByPk(courseId) : Promise.resolve(null),
    ]);


    const plain = resource.toJSON();
    const noticeMessage = !isApproved
      ? "Resource uploaded successfully. Because file size exceeds 50MB, it requires Admin approval before being published to students."
      : "Resource uploaded & published successfully.";

    return res.status(201).json({
      ...plain,
      branch: plain.branch || "ALL",
      regulation: plain.regulation || "ALL",
      status: resourceStatus,
      isApproved: isApproved,
      facultyName: user ? user.name : "Faculty Member",
      courseName: course ? course.title : (category && category !== "General" ? category : "General"),
      faculty: user ? { id: user.id, name: user.name, email: user.email } : null,
      course: course ? { id: course.id, title: course.title, code: course.code } : null,
      message: noticeMessage,
    });
  } catch (error) {
    console.error("Error creating resource:", error);
    return res.status(500).json({ message: "Error creating resource", error: error.message });
  }
};

exports.updateResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "APPROVED" or "REJECTED"

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be APPROVED or REJECTED" });
    }

    const resource = await Resource.findByPk(id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    if (status === "REJECTED") {
      await resource.destroy();
      return res.json({ message: "Resource rejected and removed from library" });
    }

    resource.status = "APPROVED";
    resource.isApproved = true;
    await resource.save();

    return res.json({ message: "Resource approved successfully!", resource });
  } catch (error) {
    return res.status(500).json({ message: "Error updating resource status", error: error.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    const userRole = (req.user?.role || "").toUpperCase();
    const currentUserId = req.user?.userId || req.user?.id;

    // Only owner or admin can delete
    if (resource.facultyId !== currentUserId && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await resource.destroy();
    return res.json({ message: "Resource deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting resource", error: error.message });
  }
};

