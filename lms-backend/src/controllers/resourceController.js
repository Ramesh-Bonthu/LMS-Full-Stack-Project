const { Resource, User } = require("../models");

exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.json(resources);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching resources", error: error.message });
  }
};

exports.createResource = async (req, res) => {
  try {
    const { title, description, type, url, courseId, category } = req.body;
    if (!title || !url) return res.status(400).json({ message: "Title and URL are required" });

    const resource = await Resource.create({
      title,
      description,
      type: type || "PDF",
      url,
      courseId,
      category: category || "General",
      facultyId: req.user.userId,
    });

    return res.status(201).json(resource);
  } catch (error) {
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
