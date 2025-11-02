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
      console.log("❌ No token provided");
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // Decode and verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🧩 Decoded JWT payload:", decoded);

    let user;

    // ✅ Handle virtual superadmin (no DB entry)
    if (decoded.id === "superadmin") {
      console.log("👑 Superadmin login detected");
      user = {
        _id: "superadmin",
        role: "superadmin",
        name: "Root SuperAdmin",
        branch_id: null,
      };
    } else {
      // Normal user lookup
      user = await User.findById(decoded.id).select("-password");
      if (!user) {
        console.log("❌ User not found in database:", decoded.id);
        return res.status(401).json({ message: "User not found" });
      }
      console.log("✅ User found:", {
        id: user._id,
        name: user.name,
        role: user.role,
        branch_id: user.branch_id
      });
    }

    // ✅ Attach user to request with consistent naming
    req.user = {
      id: user._id,
      role: user.role.toLowerCase(),
      branchId: user.branch_id || null, // ✅ Map branch_id to branchId for consistency
      name: user.name || "Unknown"
    };

    console.log("✅ req.user set to:", req.user);

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
  console.log("🔍 Checking manager-only access for:", req.user);
  if (req.user && req.user.role === "manager") {
    return next();
  }
  console.log("❌ Access denied - not a manager");
  return res.status(403).json({ message: "Access denied. Managers only." });
};

/**
 * 🔸 Superadmin-only access
 */
exports.superadminOnly = (req, res, next) => {
  console.log("🔍 Checking superadmin-only access for:", req.user);
  if (req.user && req.user.role === "superadmin") {
    return next();
  }
  console.log("❌ Access denied - not a superadmin");
  return res.status(403).json({ message: "Access denied. Superadmins only." });
};

/**
 * 🔸 NEW: restrictTo - Flexible role-based access control
 * Usage: restrictTo("superadmin") or restrictTo("manager", "superadmin")
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log("🔍 Checking restrictTo access for roles:", roles);
    console.log("🔍 User role:", req.user?.role);
    
    if (!req.user || !roles.includes(req.user.role)) {
      console.log("❌ Access denied - user role not in allowed roles");
      return res.status(403).json({ 
        message: "You do not have permission to perform this action" 
      });
    }
    
    console.log("✅ Access granted");
    next();
  };
};

/**
 * 🔸 Manager OR Superadmin access
 */
exports.managerOrSuperadmin = (req, res, next) => {
  console.log("🔍 Checking manager/superadmin access for:", req.user);
  if (
    req.user &&
    (req.user.role === "manager" || req.user.role === "superadmin")
  ) {
    return next();
  }
  console.log("❌ Access denied - not manager or superadmin");
  return res.status(403).json({ message: "Access denied." });
};

/**
 * 🔸 Manager, Staff, OR Superadmin access (for viewing inventory)
 */
exports.managerStaffOrSuperadmin = (req, res, next) => {
  console.log("🔍 Checking manager/staff/superadmin access for:", req.user);
  if (
    req.user &&
    (req.user.role === "manager" || 
     req.user.role === "staff" || 
     req.user.role === "superadmin")
  ) {
    return next();
  }
  console.log("❌ Access denied - not manager, staff, or superadmin");
  return res.status(403).json({ message: "Access denied." });
};