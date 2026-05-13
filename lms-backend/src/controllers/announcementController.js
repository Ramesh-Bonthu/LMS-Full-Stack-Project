const { Announcement } = require("../models");
const { Op } = require("sequelize");

function serializeAnnouncement(a) {
  const diffMs = Date.now() - new Date(a.createdAt).getTime();
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    audience: a.audience,
    time: hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`,
    isNew: hours <= 24,
  };
}

exports.getAllAnnouncements = async (req, res) => {
  const role = String(req.user.role).toUpperCase();
  let whereClause = {};
  
  if (role === "STUDENT") {
    whereClause = {
      [Op.or]: [
        { audience: "ALL" },
        { audience: "STUDENTS" }
      ]
    };
  } else if (role === "FACULTY") {
    whereClause = {
      [Op.or]: [
        { audience: "ALL" },
        { audience: "FACULTY" },
        { audience: "STUDENTS" }
      ]
    };
  } else if (role === "ADMIN") {
    whereClause = {}; 
  } else {
    whereClause = { audience: "ALL" };
  }
  
  const anns = await Announcement.findAll({ where: whereClause, order: [['createdAt', 'DESC']] });
  return res.json(anns.map(serializeAnnouncement));
};

exports.createAnnouncement = async (req, res) => {
  const audienceValue = (req.body.audience || "ALL").toString().toUpperCase().trim();
  const announcement = await Announcement.create({
    title: req.body.title || "Untitled announcement",
    body: req.body.body || "",
    audience: audienceValue,
  });
  return res.status(201).json(serializeAnnouncement(announcement.toJSON()));
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
  
  const anns = await Announcement.findAll({ where: whereClause, order: [['createdAt', 'DESC']] });
  const allAnns = await Announcement.findAll();
  return res.json({
    role_requested: role,
    applied_where: whereClause,
    filtered_results: anns,
    all_results: allAnns
  });
};
