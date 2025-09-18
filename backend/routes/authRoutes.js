const express = require("express");
const { signup, loginEmployee, loginSuperAdmin } = require("../controllers/AuthController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login-employee", loginEmployee);
router.post("/login-superadmin", loginSuperAdmin);

module.exports = router;
