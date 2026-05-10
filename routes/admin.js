const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const controller = require("../controllers/adminController");

const router = express.Router();
router.use(auth, roleCheck("admin"));

router.get("/dashboard", controller.dashboard);
router.get("/students", controller.getStudents);
router.post(
  "/students",
  [body("name").notEmpty(), body("email").isEmail(), body("rollNo").notEmpty(), body("class").notEmpty(), body("department").notEmpty()],
  controller.createStudent
);
router.put("/students/:id", controller.updateStudent);
router.delete("/students/:id", controller.deleteStudent);

router.get("/teachers", controller.getTeachers);
router.post(
  "/teachers",
  [body("name").notEmpty(), body("email").isEmail(), body("employeeId").notEmpty(), body("department").notEmpty()],
  controller.createTeacher
);
router.put("/teachers/:id", controller.updateTeacher);
router.delete("/teachers/:id", controller.deleteTeacher);

router.get("/subjects", controller.getSubjects);
router.post(
  "/subjects",
  [body("name").notEmpty(), body("code").notEmpty(), body("class").notEmpty(), body("department").notEmpty()],
  controller.createSubject
);
router.put("/subjects/:id", controller.updateSubject);
router.delete("/subjects/:id", controller.deleteSubject);

router.get("/attendance/report", controller.attendanceReport);

module.exports = router;
