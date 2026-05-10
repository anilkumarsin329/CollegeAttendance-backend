const express = require("express");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const controller = require("../controllers/studentController");

const router = express.Router();
router.use(auth, roleCheck("student"));

router.get("/dashboard", controller.dashboard);
router.get("/attendance", controller.myAttendance);
router.get("/attendance/:subjectId", controller.subjectAttendance);
router.get("/subjects", controller.mySubjects);

module.exports = router;
