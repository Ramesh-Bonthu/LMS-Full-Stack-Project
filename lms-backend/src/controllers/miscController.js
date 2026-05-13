const { Course, Submission, Assignment } = require("../models");

exports.getPerformance = async (req, res) => {
  const courses = await Course.findAll();
  const submissions = await Submission.findAll();
  const assignments = await Assignment.findAll();

  if (req.user.role !== "STUDENT") {
    const aggregates = courses
      .filter((course) => course.status === "APPROVED")
      .map((course) => ({
        subject: course.code,
        marks:
          submissions
            .filter((entry) => assignments.find((a) => a.id === entry.assignmentId)?.courseId === course.id)
            .reduce((sum, entry) => sum + Math.max(entry.marks, 0), 0) || 0,
      }));
    return res.json(aggregates);
  }

  const studentSubmissions = submissions.filter((entry) => entry.studentId === req.user.userId);
  const performance = courses
    .filter((course) => (course.enrolledStudentIds || []).includes(req.user.userId))
    .map((course) => {
      const relatedSubmissions = studentSubmissions.filter(
        (entry) => assignments.find((a) => a.id === entry.assignmentId)?.courseId === course.id,
      );
      const graded = relatedSubmissions.filter((entry) => entry.marks >= 0);
      const average =
        graded.length > 0
          ? Math.round(graded.reduce((sum, entry) => sum + entry.marks, 0) / graded.length)
          : (course.progressByStudent || {})[req.user.userId] || 0;
      return { subject: course.code, marks: average };
    });

  return res.json(performance);
};

exports.healthCheck = async (req, res) => {
  return res.json({
    status: "Backend is running",
    timestamp: new Date().toISOString(),
    runtime: "node",
  });
};
