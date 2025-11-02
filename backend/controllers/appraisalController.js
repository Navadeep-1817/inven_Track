const Appraisal = require("../models/Appraisal");
const User = require("../models/User");
const Branch = require("../models/Branch");

// Create or update appraisal for a manager
exports.createOrUpdateAppraisal = async (req, res) => {
  try {
    const {
      branch_id,
      manager_id,
      review_period,
      review_year,
      strengths,
      areas_of_improvement,
      achievements,
      goals_for_next_period,
      overall_rating,
      additional_comments,
    } = req.body;

    // Validate required fields
    if (!branch_id || !manager_id || !review_period || !review_year || !strengths || !areas_of_improvement) {
      return res.status(400).json({
        success: false,
        message: "Branch ID, Manager ID, review period, review year, strengths, and areas of improvement are required.",
      });
    }

    // Verify branch exists
    const branchExists = await Branch.findOne({ branch_id });
    if (!branchExists) {
      return res.status(404).json({
        success: false,
        message: "Branch not found.",
      });
    }

    // Verify manager exists and is actually a manager
    const manager = await User.findById(manager_id);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found.",
      });
    }

    if (manager.role.toLowerCase() !== "manager") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a manager.",
      });
    }

    if (manager.branch_id !== branch_id) {
      return res.status(400).json({
        success: false,
        message: "Manager does not belong to the selected branch.",
      });
    }

    // Check if appraisal already exists for this period
    const existingAppraisal = await Appraisal.findOne({
      manager_id,
      review_period,
      review_year,
    });

    let appraisal;

    if (existingAppraisal) {
      // Update existing appraisal
      existingAppraisal.strengths = strengths;
      existingAppraisal.areas_of_improvement = areas_of_improvement;
      existingAppraisal.achievements = achievements || existingAppraisal.achievements;
      existingAppraisal.goals_for_next_period = goals_for_next_period || existingAppraisal.goals_for_next_period;
      existingAppraisal.overall_rating = overall_rating || existingAppraisal.overall_rating;
      existingAppraisal.additional_comments = additional_comments || existingAppraisal.additional_comments;
      existingAppraisal.last_modified_by = req.user?.id || "superadmin";

      appraisal = await existingAppraisal.save();

      res.status(200).json({
        success: true,
        message: "Appraisal updated successfully.",
        appraisal,
      });
    } else {
      // Create new appraisal
      appraisal = new Appraisal({
        branch_id,
        manager_id,
        manager_name: manager.name,
        manager_employee_id: manager.employee_id,
        review_period,
        review_year,
        strengths,
        areas_of_improvement,
        achievements,
        goals_for_next_period,
        overall_rating,
        additional_comments,
        created_by: req.user?.id || "superadmin",
      });

      await appraisal.save();

      res.status(201).json({
        success: true,
        message: "Appraisal created successfully.",
        appraisal,
      });
    }
  } catch (err) {
    console.error("Error in createOrUpdateAppraisal:", err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An appraisal for this manager in this period already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating/updating appraisal.",
      error: err.message,
    });
  }
};

// Get all appraisals for a specific branch
exports.getAppraisalsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required.",
      });
    }

    const appraisals = await Appraisal.find({ branch_id: branchId })
      .populate("manager_id", "name email employee_id")
      .sort({ review_year: -1, review_period: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appraisals.length,
      appraisals,
    });
  } catch (err) {
    console.error("Error in getAppraisalsByBranch:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching appraisals.",
      error: err.message,
    });
  }
};

// Get all appraisals for a specific manager
exports.getAppraisalsByManager = async (req, res) => {
  try {
    const { managerId } = req.params;

    if (!managerId) {
      return res.status(400).json({
        success: false,
        message: "Manager ID is required.",
      });
    }

    const appraisals = await Appraisal.find({ manager_id: managerId })
      .populate("manager_id", "name email employee_id branch_id")
      .sort({ review_year: -1, review_period: -1 });

    res.status(200).json({
      success: true,
      count: appraisals.length,
      appraisals,
    });
  } catch (err) {
    console.error("Error in getAppraisalsByManager:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching manager appraisals.",
      error: err.message,
    });
  }
};

// Get a specific appraisal by ID
exports.getAppraisalById = async (req, res) => {
  try {
    const { appraisalId } = req.params;

    const appraisal = await Appraisal.findById(appraisalId).populate(
      "manager_id",
      "name email employee_id branch_id"
    );

    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: "Appraisal not found.",
      });
    }

    res.status(200).json({
      success: true,
      appraisal,
    });
  } catch (err) {
    console.error("Error in getAppraisalById:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching appraisal.",
      error: err.message,
    });
  }
};

// Get all appraisals (for superadmin overview)
exports.getAllAppraisals = async (req, res) => {
  try {
    const { year, period } = req.query;

    let query = {};
    if (year) query.review_year = parseInt(year);
    if (period) query.review_period = period;

    const appraisals = await Appraisal.find(query)
      .populate("manager_id", "name email employee_id")
      .sort({ review_year: -1, review_period: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appraisals.length,
      appraisals,
    });
  } catch (err) {
    console.error("Error in getAllAppraisals:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching all appraisals.",
      error: err.message,
    });
  }
};

// Delete an appraisal
exports.deleteAppraisal = async (req, res) => {
  try {
    const { appraisalId } = req.params;

    const appraisal = await Appraisal.findByIdAndDelete(appraisalId);

    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: "Appraisal not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appraisal deleted successfully.",
    });
  } catch (err) {
    console.error("Error in deleteAppraisal:", err);
    res.status(500).json({
      success: false,
      message: "Server error while deleting appraisal.",
      error: err.message,
    });
  }
};

// Get managers by branch (helper endpoint)
exports.getManagersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required.",
      });
    }

    const managers = await User.find({
      branch_id: branchId,
      role: "Manager",
    }).select("_id name email employee_id");

    res.status(200).json({
      success: true,
      count: managers.length,
      managers,
    });
  } catch (err) {
    console.error("Error in getManagersByBranch:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching managers.",
      error: err.message,
    });
  }
};