const { Notification } = require("../models");

const cleanTitle = (str) => (str || "").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "").trim();

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.userId },
      order: [["createdAt", "DESC"]],
    });
    const cleaned = notifications.map((n) => {
      const data = n.toJSON ? n.toJSON() : n;
      return { ...data, title: cleanTitle(data.title) };
    });
    return res.json(cleaned);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { id, userId: req.user.userId },
    });

    if (!notification) return res.status(404).json({ message: "Notification not found" });

    await notification.update({ isRead: true });
    return res.json({ message: "Marked as read" });
  } catch (error) {
    return res.status(500).json({ message: "Error updating notification", error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.userId, isRead: false } }
    );
    return res.json({ message: "All marked as read" });
  } catch (error) {
    return res.status(500).json({ message: "Error updating notifications", error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.userId, isRead: false },
    });
    return res.json({ count });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching unread count", error: error.message });
  }
};
