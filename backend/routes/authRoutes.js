// const express = require("express");
// const { signup, loginEmployee, loginSuperAdmin ,getMe} = require("../controllers/AuthController");

// const router = express.Router();

// router.post("/signup", signup);
// router.post("/login-employee", loginEmployee);
// router.post("/login-superadmin", loginSuperAdmin);
// router.post("/me", getMe);

// module.exports = router;
// src/routes/authRoutes.js
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
router.post("/login", loginEmployee);
router.post("/superadmin/login", loginSuperAdmin);

// Protected route - Get current user
router.get("/me", protect, getMe);

module.exports = router;