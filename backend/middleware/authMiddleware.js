// // // // middleware/authMiddleware.js
// // // const jwt = require("jsonwebtoken");
// // // const User = require("../models/User");

// // // exports.protect = async (req, res, next) => {
// // //   let token;
// // //   if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
// // //     token = req.headers.authorization.split(" ")[1];
// // //   }
// // //   if (!token) return res.status(401).json({ message: "Not authorized, no token" });

// // //   try {
// // //     console.log("🔹 Received token:", token);
// // //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// // //     console.log("🔹 Decoded user ID:", decoded.id);

// // //     const user = await User.findById(decoded.id).select("-password");
// // //     if (!user) {
// // //       return res.status(401).json({ message: "User not found" });
// // //     }

// // //     req.user = user;
// // //     next();
// // //   } catch (error) {
// // //     console.error("❌ JWT verification error:", error.message);
// // //     res.status(401).json({ message: "Token failed" });
// // //   }
// // //   console.log("✅ Authenticated user:", req.user);
// // // };


// // // exports.managerOnly = (req, res, next) => {
// // //   if (req.user && req.user.role && req.user.role.toLowerCase() === "manager") {
// // //     next();
// // //   } else {
// // //     console.log("❌ Access denied. Role found:", req.user?.role);
// // //     res.status(403).json({ message: "Access denied. Managers only." });
// // //   }
// // // };

// // // middleware/authMiddleware.js
// // const jwt = require("jsonwebtoken");
// // const User = require("../models/User");

// // /**
// //  * Middleware to protect routes: ensures the user is authenticated
// //  * Populates req.user with { id, role, branchId, ... } from the database
// //  */
// // exports.protect = async (req, res, next) => {
// //   let token;

// //   if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
// //     token = req.headers.authorization.split(" ")[1];
// //   }

// //   if (!token) {
// //     return res.status(401).json({ message: "Not authorized, no token" });
// //   }

// //   try {
// //     // Decode JWT
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);

// //     // Fetch user from DB
// //     const user = await User.findById(decoded.id).select("-password");
// //     if (!user) return res.status(401).json({ message: "User not found" });

// //     // Attach user info to request for later use in controllers
// //     req.user = {
// //       id: user._id,
// //       role: user.role.toLowerCase(), // 'manager' or 'superadmin'
// //       branchId: user.branchId || null, // managers have branchId, superadmin may not
// //     };

// //     next();
// //   } catch (error) {
// //     console.error("❌ JWT verification error:", error.message);
// //     res.status(401).json({ message: "Token failed" });
// //   }
// // };

// // /**
// //  * Middleware to allow only managers
// //  * Useful for routes where superadmin access is not permitted
// //  */
// // exports.managerOnly = (req, res, next) => {
// //   if (req.user && req.user.role === "manager") {
// //     return next();
// //   }
// //   return res.status(403).json({ message: "Access denied. Managers only." });
// // };

// // /**
// //  * Middleware to allow only superadmins
// //  * Useful for routes where manager access is not permitted
// //  */
// // exports.superadminOnly = (req, res, next) => {
// //   if (req.user && req.user.role === "superadmin") {
// //     return next();
// //   }
// //   return res.status(403).json({ message: "Access denied. Superadmins only." });
// // };

// // /**
// //  * Middleware to allow manager OR superadmin access
// //  * Useful for inventory CRUD routes
// //  */
// // exports.managerOrSuperadmin = (req, res, next) => {
// //   if (req.user && (req.user.role === "manager" || req.user.role === "superadmin")) {
// //     return next();
// //   }
// //   return res.status(403).json({ message: "Access denied." });
// // };

// // middleware/authMiddleware.js
// require("dotenv").config();
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// /**
//  * Middleware to protect routes: ensures the user is authenticated.
//  * Populates req.user with { id, role, branchId } from the database.
//  */
// exports.protect = async (req, res, next) => {
//   try {
//     let token;

//     // ✅ Extract Bearer token from Authorization header
//     if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
//       token = req.headers.authorization.split(" ")[1];
//     }

//     // ❌ No token provided
//     if (!token) {
//       return res.status(401).json({ message: "Not authorized, no token provided" });
//     }

//     // ✅ Verify token validity
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // ✅ Find user in database
//     console.log("Decoded JWT payload:", decoded);
//     const user = await User.findById(decoded.id).select("-password");
//     if (!user) {
//       return res.status(401).json({ message: "User not found. Invalid token." });
//     }

//     // ✅ Attach user info to request for controller-level access
//     req.user = {
//       id: user._id,
//       role: user.role?.toLowerCase() || "unknown",
//       branchId: user.branchId || null,
//     };

//     next();
//   } catch (error) {
//     console.error("❌ Auth Middleware Error:", error.message);

//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({ message: "Token expired. Please log in again." });
//     }
//     if (error.name === "JsonWebTokenError") {
//       return res.status(401).json({ message: "Invalid token. Authorization failed." });
//     }

//     res.status(500).json({ message: "Internal Server Error during authorization." });
//   }
// };

// /**
//  * Manager-only route access
//  */
// exports.managerOnly = (req, res, next) => {
//   if (req.user && req.user.role === "manager") return next();
//   return res.status(403).json({ message: "Access denied. Managers only." });
// };

// /**
//  * Superadmin-only route access
//  */
// exports.superadminOnly = (req, res, next) => {
//   if (req.user && req.user.role === "superadmin") return next();
//   return res.status(403).json({ message: "Access denied. Superadmins only." });
// };

// /**
//  * Allow access to both managers and superadmins
//  */
// exports.managerOrSuperadmin = (req, res, next) => {
//   if (req.user && ["manager", "superadmin"].includes(req.user.role)) return next();
//   return res.status(403).json({ message: "Access denied. Managers or Superadmins only." });
// };
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
        branchId: null,
      };
    } else {
      // Normal user lookup
      user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
    }

    req.user = {
      id: user._id,
      role: user.role.toLowerCase(),
      branchId: user.branchId || null,
    };

    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);
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