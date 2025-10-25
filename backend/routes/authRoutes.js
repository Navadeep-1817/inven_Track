const express = require("express");
const router = express.Router();
const {
  signup,
  loginEmployee,
  loginSuperAdmin,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/signup", signup);
router.post("/login-employee", loginEmployee);        // ✅ Changed from "/login"
router.post("/login-superadmin", loginSuperAdmin);    // ✅ Changed from "/superadmin/login"

// Protected route
router.get("/me", protect, getMe);

module.exports = router;