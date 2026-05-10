const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");

const validationFailed = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation failed", errors: errors.array() });
    return true;
  }
  return false;
};

const getPagination = (req) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  return { page, limit, skip: (page - 1) * limit };
};

exports.dashboard = async (req, res, next) => {
  try {
    const [students, teachers, subjects, attendance] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Subject.countDocuments(),
      Attendance.find({}, "status"),
    ]);

    const totalAttendance = attendance.length || 1;
    const presentLike = attendance.filter((a) => ["present", "late"].includes(a.status)).length;
    const overallAttendance = Math.round((presentLike / totalAttendance) * 100);

    res.status(200).json({ students, teachers, subjects, overallAttendance });
  } catch (error) {
    next(error);
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const search = req.query.search || "";
    const filter = search ? { $or: [{ rollNo: new RegExp(search, "i") }] } : {};
    const [items, total] = await Promise.all([
      Student.find(filter).populate("userId", "name email").skip(skip).limit(limit).sort({ createdAt: -1 }),
      Student.countDocuments(filter),
    ]);
    res.status(200).json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    if (validationFailed(req, res)) return;
    const { name, email, password, rollNo, class: className, department, semester, phone } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(409).json({ message: "Email already exists" });
    const existingRollNo = await Student.findOne({ rollNo });
    if (existingRollNo) return res.status(409).json({ message: "Roll number already exists" });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password || "student123", 10),
      role: "student",
    });

    const student = await Student.create({
      userId: user._id,
      rollNo,
      class: className,
      department,
      semester,
      phone,
    });

    res.status(201).json({ message: "Student created", student });
  } catch (error) {
    next(error);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ message: "Student updated", student });
  } catch (error) {
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    await User.findByIdAndDelete(student.userId);
    await Attendance.deleteMany({ student: student._id });
    await student.deleteOne();
    res.status(200).json({ message: "Student deleted" });
  } catch (error) {
    next(error);
  }
};

exports.getTeachers = async (req, res, next) => {
  try {
    const items = await Teacher.find().populate("userId", "name email").populate("subjects", "name code");
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

exports.createTeacher = async (req, res, next) => {
  try {
    if (validationFailed(req, res)) return;
    const { name, email, password, employeeId, department, phone, subjects = [] } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(409).json({ message: "Email already exists" });
    const existingEmployeeId = await Teacher.findOne({ employeeId });
    if (existingEmployeeId) return res.status(409).json({ message: "Employee ID already exists" });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password || "teacher123", 10),
      role: "teacher",
    });
    const teacher = await Teacher.create({ userId: user._id, employeeId, department, phone, subjects });
    res.status(201).json({ message: "Teacher created", teacher });
  } catch (error) {
    next(error);
  }
};

exports.updateTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json({ message: "Teacher updated", teacher });
  } catch (error) {
    next(error);
  }
};

exports.deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    await User.findByIdAndDelete(teacher.userId);
    await Subject.updateMany({ teacher: teacher._id }, { $set: { teacher: null } });
    await teacher.deleteOne();
    res.status(200).json({ message: "Teacher deleted" });
  } catch (error) {
    next(error);
  }
};

exports.getSubjects = async (req, res, next) => {
  try {
    const items = await Subject.find().populate({
      path: "teacher",
      populate: { path: "userId", select: "name email" },
    });
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

exports.createSubject = async (req, res, next) => {
  try {
    if (validationFailed(req, res)) return;
    const existing = await Subject.findOne({ code: req.body.code.toUpperCase() });
    if (existing) return res.status(409).json({ message: "Subject code already exists" });
    const subject = await Subject.create(req.body);
    if (req.body.teacher) {
      await Teacher.findByIdAndUpdate(req.body.teacher, { $addToSet: { subjects: subject._id } });
    }
    res.status(201).json({ message: "Subject created", subject });
  } catch (error) {
    next(error);
  }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json({ message: "Subject updated", subject });
  } catch (error) {
    next(error);
  }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    await Attendance.deleteMany({ subject: subject._id });
    await Teacher.updateMany({ subjects: subject._id }, { $pull: { subjects: subject._id } });
    res.status(200).json({ message: "Subject deleted" });
  } catch (error) {
    next(error);
  }
};

exports.attendanceReport = async (req, res, next) => {
  try {
    const { from, to, subject, department } = req.query;
    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    if (subject) filter.subject = subject;
    const rows = await Attendance.find(filter)
      .populate({ path: "student", populate: { path: "userId", select: "name email" } })
      .populate("subject", "name code department class semester")
      .populate({ path: "teacher", populate: { path: "userId", select: "name" } })
      .sort({ date: -1 });

    const filtered = department ? rows.filter((r) => r.subject?.department === department) : rows;
    res.status(200).json(filtered);
  } catch (error) {
    next(error);
  }
};
