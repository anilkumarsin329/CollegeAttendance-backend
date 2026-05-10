/* eslint-disable no-console */
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");

dotenv.config();

const makeDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
};

const run = async () => {
  await connectDB();
  await Promise.all([
    Attendance.deleteMany({}),
    Subject.deleteMany({}),
    Student.deleteMany({}),
    Teacher.deleteMany({}),
    User.deleteMany({}),
  ]);

  const admin = await User.create({
    name: "System Admin",
    email: "admin@college.com",
    password: await bcrypt.hash("admin123", 10),
    role: "admin",
  });

  const teacherUsers = await Promise.all(
    [1, 2, 3].map((i) =>
      User.create({
        name: `Teacher ${i}`,
        email: `teacher${i}@college.com`,
        password: bcrypt.hashSync("teacher123", 10),
        role: "teacher",
      })
    )
  );

  const teachers = await Promise.all(
    teacherUsers.map((u, idx) =>
      Teacher.create({
        userId: u._id,
        employeeId: `EMP00${idx + 1}`,
        department: idx === 2 ? "Humanities" : "Science",
        phone: `90000000${idx + 1}`,
      })
    )
  );

  const studentUsers = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      User.create({
        name: `Student ${i + 1}`,
        email: `student${i + 1}@college.com`,
        password: bcrypt.hashSync("student123", 10),
        role: "student",
      })
    )
  );

  const students = await Promise.all(
    studentUsers.map((u, idx) =>
      Student.create({
        userId: u._id,
        rollNo: `ROLL${String(idx + 1).padStart(3, "0")}`,
        class: "BSc",
        department: "Science",
        semester: 2,
        phone: `8000000${String(idx + 1).padStart(3, "0")}`,
      })
    )
  );

  const subjectDefs = [
    { name: "Math", code: "MATH101" },
    { name: "Physics", code: "PHY101" },
    { name: "Chemistry", code: "CHEM101" },
    { name: "English", code: "ENG101" },
    { name: "Computer Science", code: "CS101" },
  ];

  const subjects = await Promise.all(
    subjectDefs.map((s, idx) =>
      Subject.create({
        ...s,
        class: "BSc",
        department: "Science",
        semester: 2,
        teacher: teachers[idx % teachers.length]._id,
      })
    )
  );

  await Promise.all(
    teachers.map((t) =>
      Teacher.findByIdAndUpdate(
        t._id,
        { $set: { subjects: subjects.filter((s) => String(s.teacher) === String(t._id)).map((s) => s._id) } },
        { returnDocument: 'after' }
      )
    )
  );

  const attendanceDocs = [];
  for (let d = 0; d < 30; d += 1) {
    students.forEach((student, sIdx) => {
      subjects.forEach((subject, subIdx) => {
        const states = ["present", "present", "late", "absent"];
        const status = states[(d + sIdx + subIdx) % states.length];
        attendanceDocs.push({
          student: student._id,
          subject: subject._id,
          teacher: subject.teacher,
          date: makeDate(d),
          status,
          remarks: status === "absent" ? "Auto-seeded absence" : "",
        });
      });
    });
  }
  await Attendance.insertMany(attendanceDocs);

  console.log("Seed complete");
  console.log({
    admin: admin.email,
    teacher: "teacher1@college.com / teacher123",
    student: "student1@college.com / student123",
  });
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
