const { User, Course, Assignment, Submission } = require("../models");

exports.getAllUsers = async (req, res) => {
  const users = await User.findAll();
  return res.json(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      status: user.active ? "Active" : "Pending",
    }))
  );
};

exports.approveUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await user.update({ active: true });
  return res.json({ message: "User approved", user });
};

exports.rejectUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await user.update({ active: false });
  return res.json({ message: "User rejected", user });
};

exports.getStats = async (req, res) => {
  const [totalUsers, activeUsers, totalCourses, approvedCourses, pendingApprovals, totalAssignments, totalSubmissions] = await Promise.all([
    User.count(),
    User.count({ where: { active: true } }),
    Course.count(),
    Course.count({ where: { status: "APPROVED" } }),
    Course.count({ where: { status: "PENDING" } }),
    Assignment.count(),
    Submission.count()
  ]);

  return res.json({
    totalUsers,
    activeUsers,
    totalCourses,
    approvedCourses,
    pendingApprovals,
    totalAssignments,
    totalSubmissions,
  });
};

exports.getEnrollmentTrend = async (req, res) => {
  const count = await User.count({ where: { role: 'STUDENT' } });
  return res.json([
    { week: "W1", students: Math.floor(count * 0.2) },
    { week: "W2", students: Math.floor(count * 0.4) },
    { week: "W3", students: Math.floor(count * 0.6) },
    { week: "W4", students: Math.floor(count * 0.8) },
    { week: "W5", students: Math.floor(count * 0.9) },
    { week: "W6", students: count },
  ]);
};
