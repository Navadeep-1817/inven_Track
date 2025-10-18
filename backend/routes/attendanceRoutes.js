const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { protect, managerOnly } = require("../middleware/authMiddleware");

router.get("/staff", protect, managerOnly, attendanceController.getStaffByBranch);
router.post("/mark", protect, managerOnly, attendanceController.markAttendance);
router.get("/records", protect, managerOnly, attendanceController.getAttendanceRecords);

module.exports = router;
