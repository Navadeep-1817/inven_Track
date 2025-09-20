const User = require("../models/User");
const Branch = require("../models/Branch"); // Import the Branch model

// Signup (Manager/Staff only)
exports.signup = async (req, res) => {
  try {
    const { name, email, employee_id, branch_id, role, password } = req.body;

    //  Check if the branch exists
    const branchExists = await Branch.findOne({ branch_id });
    if (!branchExists) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Check if user already exists by email or employee_id within the same branch
    const existingUser = await User.findOne({
      $or: [{ email }, { employee_id, branch_id }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({
          message:
            "User with this email or employee ID for this branch already exists",
        });
    }

    //  New check: Prevent multiple managers for the same branch_id
    if (role === "Manager") {
      const managerExists = await User.findOne({ role: "Manager", branch_id });
      if (managerExists) {
        return res
          .status(409)
          .json({ message: "A manager already exists for this branch" });
      }
    }

    // Create a new user and save to the database
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
    console.error(err);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// Login for Manager/Staff
exports.loginEmployee = async (req, res) => {
  try {
    const { branch_id, employee_id, role, password } = req.body;

    const user = await User.findOne({ branch_id, employee_id, role, password });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (role === "Manager") {
      return res.json({
        message: "Login successful",
        dashboard: "managerDashboard",
      });
    }
    if (role === "Staff") {
      return res.json({
        message: "Login successful",
        dashboard: "staffDashboard",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Superadmin login
exports.loginSuperAdmin = async (req, res) => {
  try {
    const { securityKey } = req.body;

    if (securityKey === process.env.SUPERADMIN_KEY) {
      return res.json({
        message: "Superadmin login successful",
        dashboard: "superAdminDashboard",
      });
    } else {
      return res.status(401).json({ message: "Invalid security key" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during superadmin login" });
  }
};