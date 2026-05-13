const { AttendanceRecord, Course, User } = require("../models");

exports.getAttendance = async (req, res) => {
  const courses = await Course.findAll();
  let records;
  if (req.user.role === "STUDENT") {
    records = await AttendanceRecord.findAll({ where: { studentId: req.user.userId } });
  } else {
    records = await AttendanceRecord.findAll();
  }
  
  const response = records.map(r => {
    const c = courses.find(course => course.id === r.courseId);
    return {
      ...r.toJSON(),
      courseName: c ? c.title : "Unknown Course"
    };
  });
  
  return res.json(response);
};

exports.markAttendance = async (req, res) => {
  const { studentId, courseId, date, value } = req.body;
  
  if (!studentId || !courseId || !date) {
    return res.status(400).json({ message: "studentId, courseId, and date are required" });
  }

  const course = await Course.findByPk(courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });

  if (course.status !== "APPROVED") {
    return res.status(403).json({ message: "Attendance can only be marked for approved courses" });
  }
  
  const student = await User.findByPk(studentId);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  
  const attendanceValue = value !== undefined ? Number(value) : 100;
  if (attendanceValue < 0 || attendanceValue > 100) {
    return res.status(400).json({ message: "Attendance value must be between 0 and 100" });
  }
  
  const monthString = new Date(date).toLocaleString('default', { month: 'short' });
  
  const record = await AttendanceRecord.create({
    studentId: Number(studentId),
    courseId: Number(courseId),
    date: date,
    month: monthString,
    value: attendanceValue,
  });
  return res.status(201).json(record);
};
