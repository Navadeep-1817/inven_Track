const Attendance = require("../models/Attendance");
const User = require("../models/User");

// Get staff for the logged-in manager’s branch
exports.getStaffByBranch = async (req, res) => {
  try {
    const branchId = req.user.branch_id;

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is missing in user data." });
    }

    const staffInBranch = await User.find({ branch_id: branchId })
      .select("-password")
      .sort({ name: 1 });

    res.status(200).json({ staff: staffInBranch });
  } catch (err) {
    res.status(500).json({ message: "Server Error: Could not fetch staff.", error: err.message });
  }
};


// Mark attendance for today
exports.markAttendance = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    const { staff } = req.body; // array of { staff_id, name, status }

    if (!staff || !Array.isArray(staff)) {
      return res.status(400).json({ success: false, message: "Invalid staff data" });
    }

    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Check if attendance already exists
    let attendance = await Attendance.findOne({ branch_id: branchId, date: dateOnly });

    if (attendance) {
      return res.status(400).json({ success: false, message: "Attendance already marked for today" });
    }

    attendance = new Attendance({
      branch_id: branchId,
      date: dateOnly,
      staff,
    });

    await attendance.save();
    res.status(201).json({ success: true, message: "Attendance marked successfully", attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get attendance records for branch
exports.getAttendanceRecords = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    const records = await Attendance.find({ branch_id: branchId }).sort({ date: -1 });

    res.status(200).json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
