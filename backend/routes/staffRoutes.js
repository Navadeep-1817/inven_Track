const express = require('express');
const router = express.Router();
const { getStaffByBranchId, removeStaff, updateStaffRole } = require('../controllers/staffController');

// Define API routes
router.get('/branches/:branchId/staff', getStaffByBranchId);
router.delete('/staff/:staffId', removeStaff);
router.patch('/staff/:staffId', updateStaffRole);

module.exports = router;