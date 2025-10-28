
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Branch = require("../models/Branch");

/** 
 * Helper to create JWT with consistent payload
 * Includes id, role, and branchId for clarity
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role.toLowerCase(),
      branchId: user.branch_id || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

// =====================
// 🔹 SIGNUP (Manager / Staff)
// =====================
exports.signup = async (req, res) => {
  try {
    const { name, email, employee_id, branch_id, role, password } = req.body;

    // Validate branch existence
    const branchExists = await Branch.findOne({ branch_id });
    if (!branchExists) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Prevent duplicate users
    const existingUser = await User.findOne({
      $or: [{ email }, { employee_id, branch_id }],
    });
    if (existingUser) {
      return res.status(400).json({
        message:
          "User with this email or employee ID for this branch already exists",
      });
    }

    // Prevent multiple managers per branch
    if (role.toLowerCase() === "manager") {
      const managerExists = await User.findOne({ role: "Manager", branch_id });
      if (managerExists) {
        return res
          .status(409)
          .json({ message: "A manager already exists for this branch" });
      }
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      employee_id,
      branch_id,
      role,
      password,
    });

    await newUser.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// =====================
// 🔹 LOGIN (Manager / Staff)
// =====================
exports.loginEmployee = async (req, res) => {
  try {
    const { branch_id, employee_id, role, password } = req.body;

    const user = await User.findOne({ branch_id, employee_id, role });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Compare password (use bcrypt if passwords are hashed)
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Generate JWT with full payload
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      dashboard:
        user.role.toLowerCase() === "manager"
          ? "managerDashboard"
          : "staffDashboard",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id,
        employee_id: user.employee_id,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// =====================
// 🔹 SUPERADMIN LOGIN
// =====================
exports.loginSuperAdmin = async (req, res) => {
  try {
    const { securityKey } = req.body;

    if (securityKey !== process.env.SUPERADMIN_KEY) {
      return res.status(401).json({ message: "Invalid security key" });
    }

    // Hardcoded virtual superadmin user
    const superAdmin = {
      _id: "superadmin",
      role: "superadmin",
      name: "Root SuperAdmin",
    };

    const token = generateToken(superAdmin);

    res.json({
      success: true,
      message: "Superadmin login successful",
      token,
      dashboard: "superAdminDashboard",
      user: superAdmin,
    });
  } catch (err) {
    console.error("❌ SuperAdmin Login Error:", err);
    res.status(500).json({ message: "Server error during superadmin login" });
  }
};

// =====================
// 🔹 GET CURRENT USER (/auth/me)
// =====================
exports.getMe = async (req, res) => {
  try {
    console.log("✅ getMe called for user:", req.user);

    // req.user is already set by protect middleware
    const user = req.user;

    // If superadmin (no DB record)
    if (user.id === "superadmin" || user.role === "superadmin") {
      return res.json({
        id: "superadmin",
        role: "superadmin",
        name: "Root SuperAdmin",
      });
    }

    // Fetch full user details from DB
    const dbUser = await User.findById(user.id).select("-password");
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      branch_id: dbUser.branch_id,
      employee_id: dbUser.employee_id,
    });
  } catch (err) {
    console.error("❌ getMe Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};