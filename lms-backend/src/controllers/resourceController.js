const { Resource, User, Course } = require("../models");

exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.findAll({
      include: [
        {
          model: User,
          as: "faculty",
          attributes: ["id", "name", "email"],
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
    const { title, description, type, url, courseId, category } = req.body;
    const currentUserId = req.user?.userId || req.user?.id;

    let resourceUrl = url;
    if (req.file) {
      resourceUrl = `/uploads/${req.file.filename}`;
    }

    if (!title || !resourceUrl) {
      return res.status(400).json({ message: "Title and file/URL are required" });
    }

    const resource = await Resource.create({
      title,
      description,
      type: type || "PDF",
      url: resourceUrl,
      courseId: courseId ? Number(courseId) : null,
      category: category || "General",
      facultyId: currentUserId,
    });

    const [user, course] = await Promise.all([
      currentUserId ? User.findByPk(currentUserId) : Promise.resolve(null),
      courseId ? Course.findByPk(courseId) : Promise.resolve(null),
    ]);

    const plain = resource.toJSON();
    return res.status(201).json({
      ...plain,
      facultyName: user ? user.name : "Faculty Member",
      courseName: course ? course.title : (category && category !== "General" ? category : "General"),
      faculty: user ? { id: user.id, name: user.name, email: user.email } : null,
      course: course ? { id: course.id, title: course.title, code: course.code } : null,
    });
  } catch (error) {
    console.error("Error creating resource:", error);
    return res.status(500).json({ message: "Error creating resource", error: error.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    // Only owner or admin can delete
    if (resource.facultyId !== req.user.userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await resource.destroy();
    return res.json({ message: "Resource deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting resource", error: error.message });
  }
};
