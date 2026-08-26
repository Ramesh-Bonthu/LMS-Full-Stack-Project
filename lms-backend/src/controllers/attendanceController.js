const { AttendanceRecord, Course, User } = require("../models");

exports.getAttendance = async (req, res) => {
  try {
    const courses = await Course.findAll();
    let records;
    if (req.user.role === "STUDENT") {
      records = await AttendanceRecord.findAll({ where: { studentId: req.user.userId } });
    } else {
      records = await AttendanceRecord.findAll();
    }
    
    const response = records.map(r => {
      const c = courses.find(course => course.id === r.courseId);
      const json = r.toJSON();
      const pConducted = Number(json.periodsConducted || 1);
      const pAttended = typeof json.periodsAttended === "number"
        ? json.periodsAttended
        : (json.value > 0 ? pConducted : 0);

      return {
        ...json,
        periodsConducted: pConducted,
        periodsAttended: pAttended,
        courseName: c ? c.title : "Unknown Course"
      };
    });
    
    return res.json(response);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res.status(500).json({ message: "Error fetching attendance", error: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, date, status, periodsConducted, value } = req.body;
    
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
    
    const numPeriods = Math.max(1, Number(periodsConducted || 1));
    const attStatus = (status || (value === 0 ? "ABSENT" : "PRESENT")).toUpperCase();
    const periodsAttended = attStatus === "PRESENT" ? numPeriods : 0;
    const calcValue = Math.round((periodsAttended / numPeriods) * 100);
    
    const monthString = new Date(date).toLocaleString('default', { month: 'short' });
    
    // UPSERT LOGIC: Check if attendance for this student, course, and date already exists
    const existing = await AttendanceRecord.findOne({
      where: {
        studentId: Number(studentId),
        courseId: Number(courseId),
        date: String(date)
      }
    });

    let record;
    if (existing) {
      existing.month = monthString;
      existing.value = calcValue;
      existing.status = attStatus;
      existing.periodsConducted = numPeriods;
      existing.periodsAttended = periodsAttended;
      await existing.save();
      record = existing;
    } else {
      record = await AttendanceRecord.create({
        studentId: Number(studentId),
        courseId: Number(courseId),
        date: String(date),
        month: monthString,
        value: calcValue,
        status: attStatus,
        periodsConducted: numPeriods,
        periodsAttended: periodsAttended,
      });
    }

    return res.status(200).json(record);
  } catch (error) {
    console.error("Error marking attendance:", error);
    return res.status(500).json({ message: "Error saving attendance", error: error.message });
  }
};
