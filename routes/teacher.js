const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const controller = require("../controllers/teacherController");

const router = express.Router();
router.use(auth, roleCheck("teacher"));

router.get("/dashboard", controller.dashboard);
router.get("/subjects", controller.getSubjects);
router.get("/students/:subjectId", controller.getStudentsBySubject);
router.post(
  "/attendance",
  [body("subjectId").notEmpty(), body("date").notEmpty(), body("records").isArray({ min: 1 })],
  controller.markAttendance
);
router.get("/attendance/:subjectId", controller.subjectAttendanceHistory);
router.get("/attendance/report/:subjectId", controller.subjectAttendanceReport);

module.exports = router;
