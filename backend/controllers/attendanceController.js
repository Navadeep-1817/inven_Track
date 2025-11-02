const Attendance = require("../models/Attendance");
const User = require("../models/User");

// Get staff for the logged-in manager's branch
exports.getStaffByBranch = async (req, res) => {
  try {
    console.log("req.user:", req.user); // Debug log
    
    // ✅ Use branchId from authMiddleware mapping
    const branchId = req.user.branchId;

    if (!branchId) {
      console.error("Branch ID not found in req.user:", req.user);
      return res.status(400).json({ 
        message: "Branch ID is missing in user data.",
        userInfo: req.user 
      });
    }

    console.log("Fetching staff for branch:", branchId);

    const staffInBranch = await User.find({ branch_id: branchId })
      .select("-password")
      .sort({ name: 1 });

    console.log("Found staff:", staffInBranch.length);

    res.status(200).json({ staff: staffInBranch });
  } catch (err) {
    console.error("Error in getStaffByBranch:", err);
    res.status(500).json({ 
      message: "Server Error: Could not fetch staff.", 
      error: err.message 
    });
  }
};

// Mark attendance for today
exports.markAttendance = async (req, res) => {
  try {
    // ✅ Use branchId from authMiddleware mapping
    const branchId = req.user.branchId;
    const { staff } = req.body; // array of { staff_id, name, status }

    if (!branchId) {
      return res.status(400).json({ 
        success: false, 
        message: "Branch ID is missing in user data." 
      });
    }

    if (!staff || !Array.isArray(staff)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid staff data" 
      });
    }

    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Check if attendance already exists
    let attendance = await Attendance.findOne({ branch_id: branchId, date: dateOnly });

    if (attendance) {
      return res.status(400).json({ 
        success: false, 
        message: "Attendance already marked for today" 
      });
    }

    attendance = new Attendance({
      branch_id: branchId,
      date: dateOnly,
      staff,
    });

    await attendance.save();
    res.status(201).json({ 
      success: true, 
      message: "Attendance marked successfully", 
      attendance 
    });
  } catch (err) {
    console.error("Error in markAttendance:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Get attendance records for branch (manager's own branch)
exports.getAttendanceRecords = async (req, res) => {
  try {
    // ✅ Use branchId from authMiddleware mapping
    const branchId = req.user.branchId;
    
    if (!branchId) {
      return res.status(400).json({ 
        success: false, 
        message: "Branch ID is missing in user data." 
      });
    }

    console.log("Fetching attendance records for branch:", branchId);

    const records = await Attendance.find({ branch_id: branchId }).sort({ date: -1 });

    console.log(`Found ${records.length} attendance records`);

    res.status(200).json({ success: true, records });
  } catch (err) {
    console.error("Error in getAttendanceRecords:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Get attendance records for a specific branch (for admin/dashboard)
exports.getAttendanceByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    if (!branchId) {
      return res.status(400).json({ 
        success: false, 
        message: "Branch ID is required" 
      });
    }

    console.log("Fetching attendance for branch:", branchId);

    const records = await Attendance.find({ branch_id: branchId })
      .sort({ date: -1 })
      .limit(90); // Last 90 days

    console.log(`Found ${records.length} attendance records for branch ${branchId}`);

    res.status(200).json({ 
      success: true, 
      records 
    });
  } catch (err) {
    console.error("Error in getAttendanceByBranch:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};