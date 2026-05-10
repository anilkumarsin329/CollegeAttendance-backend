const { validationResult } = require("express-validator");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

const getTeacherProfile = async (userId) => Teacher.findOne({ userId });

exports.dashboard = async (req, res, next) => {
  try {
    const teacher = await getTeacherProfile(req.user._id);
    if (!teacher) return res.status(404).json({ message: "Teacher profile not found" });
    const [subjects, recent] = await Promise.all([
      Subject.find({ teacher: teacher._id }),
      Attendance.find({ teacher: teacher._id }).sort({ date: -1 }).limit(10),
    ]);
    res.status(200).json({ subjectCount: subjects.length, recentAttendance: recent, subjects });
  } catch (error) {
    next(error);
  }
};

exports.getSubjects = async (req, res, next) => {
  try {
    const teacher = await getTeacherProfile(req.user._id);
    const subjects = await Subject.find({ teacher: teacher?._id });
    res.status(200).json(subjects);
  } catch (error) {
    next(error);
  }
};

exports.getStudentsBySubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    const students = await Student.find({
      class: subject.class,
      department: subject.department,
      semester: subject.semester,
    }).populate("userId", "name email");
    res.status(200).json(students);
  } catch (error) {
    next(error);
  }
};

exports.markAttendance = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const teacher = await getTeacherProfile(req.user._id);
    if (!teacher) return res.status(404).json({ message: "Teacher profile not found" });
    const { subjectId, date, records } = req.body;
    const attendanceDate = new Date(date);

    const upserts = records.map((record) =>
      Attendance.findOneAndUpdate(
        { student: record.studentId, subject: subjectId, date: attendanceDate },
        {
          student: record.studentId,
          subject: subjectId,
          teacher: teacher._id,
          date: attendanceDate,
          status: record.status,
          remarks: record.remarks || "",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    );

    await Promise.all(upserts);
    res.status(201).json({ message: "Attendance submitted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.subjectAttendanceHistory = async (req, res, next) => {
  try {
    const rows = await Attendance.find({ subject: req.params.subjectId })
      .populate({ path: "student", populate: { path: "userId", select: "name" } })
      .sort({ date: -1 });
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
};

exports.subjectAttendanceReport = async (req, res, next) => {
  try {
    const rows = await Attendance.find({ subject: req.params.subjectId }).populate("student");
    const summary = rows.reduce((acc, row) => {
      const key = String(row.student._id);
      if (!acc[key]) {
        acc[key] = { studentId: row.student._id, present: 0, absent: 0, late: 0, total: 0 };
      }
      acc[key][row.status] += 1;
      acc[key].total += 1;
      return acc;
    }, {});

    const result = Object.values(summary).map((item) => ({
      ...item,
      percentage: item.total ? Math.round(((item.present + item.late) / item.total) * 100) : 0,
    }));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
