const User = require("../models/User");
const StaffAppraisal = require("../models/StaffAppraisal");

// Get staff members in manager's branch
exports.getStaffByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    console.log("🔍 Fetching staff for branch:", branchId);
    console.log("🔍 Manager branchId:", req.user.branchId);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required.",
      });
    }

    // Verify manager can only access their own branch
    if (req.user.branchId !== branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only view staff from your branch.",
      });
    }

    // Find all staff in this branch (exclude passwords)
    const staff = await User.find({
      branch_id: branchId,
      role: { $in: ["Staff", "Manager"] },
    }).select("-password").sort({ name: 1 });

    console.log(`✅ Found ${staff.length} staff members`);

    res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (err) {
    console.error("❌ Error in getStaffByBranch:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching staff.",
      error: err.message,
    });
  }
};

// Create staff appraisal
exports.createStaffAppraisal = async (req, res) => {
  try {
    const {
      staff_id,
      review_period,
      review_year,
      strengths,
      areas_of_improvement,
      achievements,
      goals_for_next_period,
      overall_rating,
      additional_comments,
    } = req.body;

    console.log("🔍 Creating appraisal for staff:", staff_id);

    // Validate required fields
    if (!staff_id || !review_period || !review_year || !strengths || !areas_of_improvement) {
      return res.status(400).json({
        success: false,
        message: "Staff ID, review period, review year, strengths, and areas of improvement are required.",
      });
    }

    // Get staff member details
    const staffMember = await User.findById(staff_id);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    // Verify staff belongs to manager's branch
    if (staffMember.branch_id !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only appraise staff from your branch.",
      });
    }

    // Check if appraisal already exists for this period
    const existingAppraisal = await StaffAppraisal.findOne({
      staff_id,
      review_period,
      review_year,
    });

    if (existingAppraisal) {
      return res.status(400).json({
        success: false,
        message: "An appraisal for this staff member in this period already exists.",
      });
    }

    // Create new appraisal
    const appraisal = new StaffAppraisal({
      staff_id,
      staff_name: staffMember.name,
      staff_employee_id: staffMember.employee_id,
      branch_id: staffMember.branch_id,
      manager_id: req.user.id,
      manager_name: req.user.name,
      review_period,
      review_year,
      strengths,
      areas_of_improvement,
      achievements,
      goals_for_next_period,
      overall_rating,
      additional_comments,
      created_by: req.user.id,
    });

    await appraisal.save();

    console.log("✅ Appraisal created successfully");

    res.status(201).json({
      success: true,
      message: "Appraisal created successfully.",
      appraisal,
    });
  } catch (err) {
    console.error("❌ Error in createStaffAppraisal:", err);
    res.status(500).json({
      success: false,
      message: "Server error while creating appraisal.",
      error: err.message,
    });
  }
};

// Get all appraisals for a specific branch
exports.getAppraisalsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    console.log("🔍 Fetching appraisals for branch:", branchId);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required.",
      });
    }

    // Verify manager can only access their own branch
    if (req.user.branchId !== branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only view appraisals from your branch.",
      });
    }

    const appraisals = await StaffAppraisal.find({ branch_id: branchId })
      .populate("staff_id", "name email employee_id")
      .sort({ review_year: -1, review_period: -1, createdAt: -1 });

    console.log(`✅ Found ${appraisals.length} appraisals`);

    res.status(200).json({
      success: true,
      count: appraisals.length,
      appraisals,
    });
  } catch (err) {
    console.error("❌ Error in getAppraisalsByBranch:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching appraisals.",
      error: err.message,
    });
  }
};

// Get a specific appraisal by ID
exports.getAppraisalById = async (req, res) => {
  try {
    const { appraisalId } = req.params;

    const appraisal = await StaffAppraisal.findById(appraisalId).populate(
      "staff_id",
      "name email employee_id branch_id"
    );

    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: "Appraisal not found.",
      });
    }

    // Verify manager can only access appraisals from their branch
    if (appraisal.branch_id !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only view appraisals from your branch.",
      });
    }

    res.status(200).json({
      success: true,
      appraisal,
    });
  } catch (err) {
    console.error("❌ Error in getAppraisalById:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching appraisal.",
      error: err.message,
    });
  }
};

// Update staff appraisal
exports.updateStaffAppraisal = async (req, res) => {
  try {
    const { appraisalId } = req.params;
    const {
      review_period,
      review_year,
      strengths,
      areas_of_improvement,
      achievements,
      goals_for_next_period,
      overall_rating,
      additional_comments,
    } = req.body;

    console.log("🔍 Updating appraisal:", appraisalId);

    const appraisal = await StaffAppraisal.findById(appraisalId);

    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: "Appraisal not found.",
      });
    }

    // Verify manager can only update appraisals from their branch
    if (appraisal.branch_id !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only update appraisals from your branch.",
      });
    }

    // Update fields
    appraisal.review_period = review_period || appraisal.review_period;
    appraisal.review_year = review_year || appraisal.review_year;
    appraisal.strengths = strengths || appraisal.strengths;
    appraisal.areas_of_improvement = areas_of_improvement || appraisal.areas_of_improvement;
    appraisal.achievements = achievements !== undefined ? achievements : appraisal.achievements;
    appraisal.goals_for_next_period = goals_for_next_period !== undefined ? goals_for_next_period : appraisal.goals_for_next_period;
    appraisal.overall_rating = overall_rating !== undefined ? overall_rating : appraisal.overall_rating;
    appraisal.additional_comments = additional_comments !== undefined ? additional_comments : appraisal.additional_comments;
    appraisal.last_modified_by = req.user.id;

    await appraisal.save();

    console.log("✅ Appraisal updated successfully");

    res.status(200).json({
      success: true,
      message: "Appraisal updated successfully.",
      appraisal,
    });
  } catch (err) {
    console.error("❌ Error in updateStaffAppraisal:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating appraisal.",
      error: err.message,
    });
  }
};

// Delete an appraisal
exports.deleteAppraisal = async (req, res) => {
  try {
    const { appraisalId } = req.params;

    console.log("🔍 Deleting appraisal:", appraisalId);

    const appraisal = await StaffAppraisal.findById(appraisalId);

    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: "Appraisal not found.",
      });
    }

    // Verify manager can only delete appraisals from their branch
    if (appraisal.branch_id !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete appraisals from your branch.",
      });
    }

    await StaffAppraisal.findByIdAndDelete(appraisalId);

    console.log("✅ Appraisal deleted successfully");

    res.status(200).json({
      success: true,
      message: "Appraisal deleted successfully.",
    });
  } catch (err) {
    console.error("❌ Error in deleteAppraisal:", err);
    res.status(500).json({
      success: false,
      message: "Server error while deleting appraisal.",
      error: err.message,
    });
  }
};