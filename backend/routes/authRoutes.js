const express = require("express");
const router = express.Router();
const {
  signup,
  loginEmployee,
  loginSuperAdmin,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login-employee", loginEmployee);
router.post("/login-superadmin", loginSuperAdmin);

router.get("/me", protect, getMe);
router.get("/profile", protect, getMe);

module.exports = router;