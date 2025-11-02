const express = require("express");
const router = express.Router();
const {
  createOrUpdateAppraisal,
  getAppraisalsByBranch,
  getAppraisalsByManager,
  getAppraisalById,
  getAllAppraisals,
  deleteAppraisal,
  getManagersByBranch,
} = require("../controllers/appraisalController");

// Import auth middleware (adjust path as needed)
const { protect, restrictTo, superadminOnly } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// ✅ Use superadminOnly OR restrictTo("superadmin") - both work now
// router.use(superadminOnly); // Option 1: Use this
router.use(restrictTo("superadmin")); // Option 2: Or use this (more flexible)

// Create or update appraisal
router.post("/", createOrUpdateAppraisal);

// Get all appraisals (with optional filters)
router.get("/", getAllAppraisals);

// Get appraisals by branch
router.get("/branch/:branchId", getAppraisalsByBranch);

// Get managers by branch (helper route)
router.get("/branch/:branchId/managers", getManagersByBranch);

// Get appraisals by manager
router.get("/manager/:managerId", getAppraisalsByManager);

// Get specific appraisal by ID
router.get("/:appraisalId", getAppraisalById);

// Delete appraisal
router.delete("/:appraisalId", deleteAppraisal);

module.exports = router;