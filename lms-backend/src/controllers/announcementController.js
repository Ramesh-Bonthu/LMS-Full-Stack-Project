const { Announcement } = require("../models");
const { Op } = require("sequelize");

function serializeAnnouncement(a) {
  let createdDate = a.createdAt ? new Date(a.createdAt) : new Date();
  if (typeof a.createdAt === "string" && !a.createdAt.endsWith("Z") && !a.createdAt.includes("+") && a.createdAt.includes("T")) {
    createdDate = new Date(a.createdAt + "Z");
  }
  const diffMs = Date.now() - createdDate.getTime();
  let formattedTime = "Just now";

  if (diffMs < 600000) {
    formattedTime = "Just now";
  } else {
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 60) {
      const tenMinChunk = Math.floor(diffMin / 10) * 10;
      formattedTime = `${tenMinChunk}m ago`;
    } else if (diffHours < 24) {
      formattedTime = `${diffHours}h ago`;
    } else {
      formattedTime = `${diffDays}d ago`;
    }
  }

  return {
    id: a.id,
    title: a.title,
    body: a.body,
    audience: a.audience,
    createdAt: a.createdAt,
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

    const anns = await Announcement.findAll({ where: whereClause, order: [["createdAt", "DESC"]] });
    return res.json(anns.map((a) => serializeAnnouncement(a.toJSON())));
  } catch (err) {
    console.error("Error fetching announcements:", err);
    return res.status(500).json({ message: "Error fetching announcements" });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const audienceValue = (req.body.audience || "ALL").toString().toUpperCase().trim();
    const announcement = await Announcement.create({
      title: req.body.title || "Untitled announcement",
      body: req.body.body || "",
      audience: audienceValue,
    });
    return res.status(201).json(serializeAnnouncement(announcement.toJSON()));
  } catch (err) {
    console.error("Error creating announcement:", err);
    return res.status(500).json({ message: "Error creating announcement" });
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
