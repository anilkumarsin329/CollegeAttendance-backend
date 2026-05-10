const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const { login, register, me } = require("../controllers/authController");

const router = express.Router();

router.post("/login", [body("email").isEmail(), body("password").notEmpty()], login);
router.post(
  "/register",
  auth,
  roleCheck("admin"),
  [body("name").notEmpty(), body("email").isEmail(), body("password").isLength({ min: 6 }), body("role").isIn(["admin", "teacher", "student"])],
  register
);
router.get("/me", auth, me);

module.exports = router;
