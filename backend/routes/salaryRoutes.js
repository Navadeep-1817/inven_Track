const express = require("express");
const router = express.Router();
const {
  getSalariesByBranch,
  getSalaryByEmployee,
  createSalary,
  updateSalary,
  deleteSalary,
  getEmployeesWithoutSalary,
  getSalaryStatsByBranch,
} = require("../controllers/salaryController");

// Import auth middleware
const { protect, restrictTo } = require("../middleware/authMiddleware");

// All routes require authentication and superadmin access
router.use(protect);
router.use(restrictTo("superadmin"));

// IMPORTANT: More specific routes MUST come before generic ones
// Get salary statistics for a branch (MUST BE BEFORE /branch/:branchId)
router.get("/branch/:branchId/stats", getSalaryStatsByBranch);

// Get employees without salary records for a branch (MUST BE BEFORE /branch/:branchId)
router.get("/branch/:branchId/without-salary", getEmployeesWithoutSalary);

// Get all salaries for a branch
router.get("/branch/:branchId", getSalariesByBranch);

// Get salary for a specific employee
router.get("/employee/:employeeId", getSalaryByEmployee);

// Create new salary record
router.post("/", createSalary);

// Update salary record (for increments and modifications)
router.put("/:salaryId", updateSalary);

// Delete salary record
router.delete("/:salaryId", deleteSalary);

module.exports = router;