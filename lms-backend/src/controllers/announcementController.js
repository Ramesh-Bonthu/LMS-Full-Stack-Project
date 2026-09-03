const { Announcement } = require("../models");
const { Op } = require("sequelize");

function parseDate(val) {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  let s = String(val);
  if (!s.endsWith("Z") && !s.includes("+") && s.includes("T")) {
    s = s + "Z";
  } else if (!s.endsWith("Z") && !s.includes("+") && s.includes(" ")) {
    s = s.replace(" ", "T") + "Z";
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}

function serializeAnnouncement(a) {
  const effectiveTimestamp = a.updatedAt || a.createdAt;
  const createdDate = parseDate(effectiveTimestamp);
  const diffMs = Math.max(0, Date.now() - createdDate.getTime());
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  let formattedTime = "Just now";

  if (diffMs < 600000) {
    formattedTime = "Just now";
  } else if (diffMin < 60) {
    const tenMinChunk = Math.floor(diffMin / 10) * 10;
    formattedTime = `${tenMinChunk}m ago`;
  } else if (diffHours < 24) {
    formattedTime = `${diffHours}h ago`;
  } else if (diffDays < 30) {
    formattedTime = `${diffDays}d ago`;
  } else if (diffDays < 365) {
    const diffMonths = Math.floor(diffDays / 30);
    formattedTime = `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  } else {
    const diffYears = Math.floor(diffDays / 365);
    formattedTime = `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  }

  return {
    id: a.id,
    title: a.title,
    body: a.body,
    audience: a.audience,
    courseId: a.courseId || null,
    createdAt: createdDate.toISOString(),
    time: formattedTime,
    isNew: diffHours <= 24,
  };
}

exports.getAllAnnouncements = async (req, res) => {
  try {
    const role = String(req.user.role).toUpperCase();
    let whereClause = {};

    if (role === "STUDENT") {
      whereClause = {
        [Op.or]: [{ audience: "ALL" }, { audience: "STUDENTS" }],
      };
    } else if (role === "FACULTY") {
      whereClause = {
        [Op.or]: [{ audience: "ALL" }, { audience: "FACULTY" }, { audience: "STUDENTS" }],
      };
    } else if (role === "ADMIN") {
      whereClause = {};
    } else {
      whereClause = { audience: "ALL" };
    }

    const anns = await Announcement.findAll({
      where: whereClause,
      order: [["updatedAt", "DESC"], ["createdAt", "DESC"]],
    });

    return res.json(
      anns.map((a) => {
        const plain = a.toJSON();
        return serializeAnnouncement({
          ...plain,
          createdAt: plain.updatedAt || plain.createdAt,
        });
      })
    );
  } catch (err) {
    console.error("Error fetching announcements:", err);
    return res.status(500).json({ message: "Error fetching announcements" });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { _action, id, title, body, audience, courseId } = req.body;

    // 1. Handle DELETE action explicitly first
    if (_action === "DELETE") {
      const targetId = id || req.body.announcementId;
      if (!targetId) return res.status(400).json({ message: "Announcement ID required" });

      const ann = await Announcement.findByPk(targetId);
      if (!ann) return res.status(404).json({ message: "Announcement not found" });

      await ann.destroy();
      return res.json({ message: "Announcement deleted successfully" });
    }

    // 2. Handle UPDATE action explicitly
    if (_action === "UPDATE" || (id && _action === "EDIT")) {
      const ann = await Announcement.findByPk(id);
      if (!ann) return res.status(404).json({ message: "Announcement not found" });

      const now = new Date();
      await ann.update({
        title: title !== undefined ? title : ann.title,
        body: body !== undefined ? body : ann.body,
        audience: audience ? audience.toString().toUpperCase().trim() : ann.audience,
        updatedAt: now,
      });

      const updatedAnn = await Announcement.findByPk(id);
      const plain = (updatedAnn || ann).toJSON();
      return res.json(serializeAnnouncement({ ...plain, createdAt: now, updatedAt: now }));
    }

    // 3. Create New Announcement
    const audienceValue = (audience || "ALL").toString().toUpperCase().trim();
    const announcement = await Announcement.create({
      title: title || "Untitled announcement",
      body: body || "",
      audience: audienceValue,
      courseId: courseId ? Number(courseId) : null,
    });
    return res.status(201).json(serializeAnnouncement(announcement.toJSON()));
  } catch (err) {
    console.error("Error in createAnnouncement handler:", err);
    return res.status(500).json({ message: "Error processing announcement" });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findByPk(req.params.id);
    if (!ann) return res.status(404).json({ message: "Announcement not found" });

    const { title, body, audience } = req.body;
    const now = new Date();
    await ann.update({
      title: title !== undefined ? title : ann.title,
      body: body !== undefined ? body : ann.body,
      audience: audience !== undefined ? audience.toString().toUpperCase().trim() : ann.audience,
      updatedAt: now,
    });

    const updatedAnn = await Announcement.findByPk(req.params.id);
    const plain = (updatedAnn || ann).toJSON();
    return res.json(serializeAnnouncement({ ...plain, createdAt: now, updatedAt: now }));
  } catch (err) {
    console.error("Error updating announcement:", err);
    return res.status(500).json({ message: "Error updating announcement" });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findByPk(req.params.id);
    if (!ann) return res.status(404).json({ message: "Announcement not found" });

    await ann.destroy();
    return res.json({ message: "Announcement deleted successfully" });
  } catch (err) {
    console.error("Error deleting announcement:", err);
    return res.status(500).json({ message: "Error deleting announcement" });
  }
};

exports.debugAnnouncements = async (req, res) => {
  const role = req.params.role.toUpperCase();
  let whereClause = {};

  if (role === "STUDENT") {
    whereClause = { audience: { [Op.in]: ["ALL", "STUDENTS"] } };
  } else if (role === "FACULTY") {
    whereClause = { audience: { [Op.in]: ["ALL", "FACULTY", "STUDENTS"] } };
  } else if (role === "ADMIN") {
    whereClause = {};
  }

  const anns = await Announcement.findAll({ where: whereClause, order: [["createdAt", "DESC"]] });
  const allAnns = await Announcement.findAll();
  return res.json({
    role_requested: role,
    applied_where: whereClause,
    filtered_results: anns,
    all_results: allAnns,
  });
};
