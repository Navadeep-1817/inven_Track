const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * 🔒 Middleware: Verifies token and attaches user to request
 * Supports both DB users and hardcoded superadmin
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // Decode and verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🧩 Decoded JWT payload:", decoded);

    let user;

    // ✅ Handle virtual superadmin (no DB entry)
    if (decoded.id === "superadmin") {
      user = {
        _id: "superadmin",
        role: "superadmin",
        name: "Root SuperAdmin",
        branch_id: null, // Changed from branchId
      };
    } else {
      // Normal user lookup
      user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
    }

    // ✅ Attach user to request with consistent naming
    req.user = {
      id: user._id,
      role: user.role.toLowerCase(),
      branchId: user.branch_id || null, // ✅ Map branch_id to branchId for consistency
    };

    console.log("✅ req.user set to:", req.user); // Debug log

    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }
    
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * 🔸 Manager-only access
 */
exports.managerOnly = (req, res, next) => {
  if (req.user && req.user.role === "manager") {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Managers only." });
};

/**
 * 🔸 Superadmin-only access
 */
exports.superadminOnly = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Superadmins only." });
};

/**
 * 🔸 Manager OR Superadmin access
 */
exports.managerOrSuperadmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "manager" || req.user.role === "superadmin")
  ) {
    return next();
  }
  return res.status(403).json({ message: "Access denied." });
};

/**
 * 🔸 NEW: Manager, Staff, OR Superadmin access (for viewing inventory)
 */
exports.managerStaffOrSuperadmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "manager" || 
     req.user.role === "staff" || 
     req.user.role === "superadmin")
  ) {
    return next();
  }
  return res.status(403).json({ message: "Access denied." });
};