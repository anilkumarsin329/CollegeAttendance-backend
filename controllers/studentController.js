const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");

const getStudentProfile = async (userId) => Student.findOne({ userId }).populate("userId", "name email");

exports.dashboard = async (req, res, next) => {
  try {
    const student = await getStudentProfile(req.user._id);
    if (!student) return res.status(404).json({ message: "Student profile not found" });
    const records = await Attendance.find({ student: student._id }).sort({ date: -1 });
    const presentLike = records.filter((r) => ["present", "late"].includes(r.status)).length;
    const percentage = records.length ? Math.round((presentLike / records.length) * 100) : 0;
    res.status(200).json({ student, percentage, recent: records.slice(0, 10) });
  } catch (error) {
    next(error);
  }
};

exports.myAttendance = async (req, res, next) => {
  try {
    const student = await getStudentProfile(req.user._id);
    const { from, to, subject } = req.query;
    const filter = { student: student._id };
    if (subject) filter.subject = subject;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const records = await Attendance.find(filter).populate("subject", "name code").sort({ date: -1 });
    res.status(200).json(records);
  } catch (error) {
    next(error);
  }
};

exports.subjectAttendance = async (req, res, next) => {
  try {
    const student = await getStudentProfile(req.user._id);
    const rows = await Attendance.find({ student: student._id, subject: req.params.subjectId })
      .populate("subject", "name code")
      .sort({ date: -1 });
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
};

exports.mySubjects = async (req, res, next) => {
  try {
    const student = await getStudentProfile(req.user._id);
    const subjects = await Subject.find({
      class: student.class,
      department: student.department,
      semester: student.semester,
    });
    res.status(200).json(subjects);
  } catch (error) {
    next(error);
  }
};
