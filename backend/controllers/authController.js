// // const User = require("../models/User");
// // const Branch = require("../models/Branch"); // Import the Branch model

// // // Signup (Manager/Staff only)
// // exports.signup = async (req, res) => {
// //   try {
// //     const { name, email, employee_id, branch_id, role, password } = req.body;

// //     //  Check if the branch exists
// //     const branchExists = await Branch.findOne({ branch_id });
// //     if (!branchExists) {
// //       return res.status(404).json({ message: "Branch not found" });
// //     }

// //     // Check if user already exists by email or employee_id within the same branch
// //     const existingUser = await User.findOne({
// //       $or: [{ email }, { employee_id, branch_id }],
// //     });
// //     if (existingUser) {
// //       return res
// //         .status(400)
// //         .json({
// //           message:
// //             "User with this email or employee ID for this branch already exists",
// //         });
// //     }

// //     //  New check: Prevent multiple managers for the same branch_id
// //     if (role === "Manager") {
// //       const managerExists = await User.findOne({ role: "Manager", branch_id });
// //       if (managerExists) {
// //         return res
// //           .status(409)
// //           .json({ message: "A manager already exists for this branch" });
// //       }
// //     }

// //     // Create a new user and save to the database
// //     const newUser = new User({
// //       name,
// //       email,
// //       employee_id,
// //       branch_id,
// //       role,
// //       password,
// //     });
// //     await newUser.save();
// //     res.status(201).json({ message: "Signup successful" });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: "Server error during signup" });
// //   }
// // };

// // // Login for Manager/Staff
// // exports.loginEmployee = async (req, res) => {
// //   try {
// //     const { branch_id, employee_id, role, password } = req.body;

// //     const user = await User.findOne({ branch_id, employee_id, role, password });
// //     if (!user) {
// //       return res.status(401).json({ message: "Invalid credentials" });
// //     }

// //     if (role === "Manager") {
// //       return res.json({
// //         message: "Login successful",
// //         dashboard: "managerDashboard",
// //       });
// //     }
// //     if (role === "Staff") {
// //       return res.json({
// //         message: "Login successful",
// //         dashboard: "staffDashboard",
// //       });
// //     }
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: "Server error during login" });
// //   }
// // };

// // // Superadmin login
// // exports.loginSuperAdmin = async (req, res) => {
// //   try {
// //     const { securityKey } = req.body;

// //     if (securityKey === process.env.SUPERADMIN_KEY) {
// //       return res.json({
// //         message: "Superadmin login successful",
// //         dashboard: "superAdminDashboard",
// //       });
// //     } else {
// //       return res.status(401).json({ message: "Invalid security key" });
// //     }
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: "Server error during superadmin login" });
// //   }
// // };
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const Branch = require("../models/Branch");

// // Helper to create JWT
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
// };

// // =====================
// // 🔹 SIGNUP (Manager / Staff)
// // =====================
// exports.signup = async (req, res) => {
//   try {
//     const { name, email, employee_id, branch_id, role, password } = req.body;

//     // Check if branch exists
//     const branchExists = await Branch.findOne({ branch_id });
//     if (!branchExists) {
//       return res.status(404).json({ message: "Branch not found" });
//     }

//     // Check if user already exists by email or employee_id within same branch
//     const existingUser = await User.findOne({
//       $or: [{ email }, { employee_id, branch_id }],
//     });
//     if (existingUser) {
//       return res.status(400).json({
//         message:
//           "User with this email or employee ID for this branch already exists",
//       });
//     }

//     // Prevent multiple managers for same branch
//     if (role === "Manager") {
//       const managerExists = await User.findOne({ role: "Manager", branch_id });
//       if (managerExists) {
//         return res
//           .status(409)
//           .json({ message: "A manager already exists for this branch" });
//       }
//     }

//     // Create new user
//     const newUser = new User({
//       name,
//       email,
//       employee_id,
//       branch_id,
//       role,
//       password,
//     });

//     await newUser.save();

//     res.status(201).json({ message: "Signup successful" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error during signup" });
//   }
// };

// // =====================
// // 🔹 LOGIN (Manager / Staff)
// // =====================
// exports.loginEmployee = async (req, res) => {
//   try {
//     const { branch_id, employee_id, role, password } = req.body;

//     // You should ideally hash and compare passwords using bcrypt
//     const user = await User.findOne({ branch_id, employee_id, role, password });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     // ✅ Generate JWT token
//     const token = generateToken(user._id);

//     res.json({
//       success: true,
//       message: "Login successful",
//       token,
//       dashboard: user.role === "Manager" ? "managerDashboard" : "staffDashboard",
//       user,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error during login" });
//   }
// };

// // =====================
// // 🔹 SUPERADMIN LOGIN
// // =====================
// exports.loginSuperAdmin = async (req, res) => {
//   try {
//     const { securityKey } = req.body;

//     if (securityKey !== process.env.SUPERADMIN_KEY) {
//       return res.status(401).json({ message: "Invalid security key" });
//     }

//     // Fake user object for superadmin (since it's not in DB)
//     const superAdmin = { _id: "superadmin", role: "SuperAdmin" };

//     // ✅ Generate JWT token
//     const token = generateToken(superAdmin._id);

//     res.json({
//       success: true,
//       message: "Superadmin login successful",
//       token,
//       dashboard: "superAdminDashboard",
//       user: superAdmin,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error during superadmin login" });
//   }
// };


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
      branchId: user.branchId || null,
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

    const user = await User.findOne({ branch_id, employee_id, role, password });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Generate JWT with full payload
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      dashboard: user.role.toLowerCase() === "manager" ? "managerDashboard" : "staffDashboard",
      user,
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
