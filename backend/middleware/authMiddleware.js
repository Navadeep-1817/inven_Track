// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });

  try {
    console.log("🔹 Received token:", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔹 Decoded user ID:", decoded.id);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ JWT verification error:", error.message);
    res.status(401).json({ message: "Token failed" });
  }
  console.log("✅ Authenticated user:", req.user);
};


exports.managerOnly = (req, res, next) => {
  if (req.user && req.user.role && req.user.role.toLowerCase() === "manager") {
    next();
  } else {
    console.log("❌ Access denied. Role found:", req.user?.role);
    res.status(403).json({ message: "Access denied. Managers only." });
  }
};


