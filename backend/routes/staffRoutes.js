// const express = require('express');
// const router = express.Router();
// const { getStaffByBranchId, removeStaff, updateStaffRole } = require('../controllers/staffController');
// const { protect } = require('../middleware/authMiddleware');

// router.get('/:branchId', protect, getStaffByBranchId);
// router.delete('/:staffId', protect, removeStaff);
// router.patch('/:staffId/role', protect, updateStaffRole);

// module.exports = router;const express = require('express');
const express=require('express')
const router = express.Router();
const { getStaffByBranchId, removeStaff, updateStaffRole } = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

// Get all staff in a branch
router.get('/branches/:branchId/staff', protect, getStaffByBranchId);

// Remove a staff member by ID
router.delete('/staff/:staffId', protect, removeStaff);

// Update a staff member's role
router.patch('/staff/:staffId', protect, updateStaffRole);

module.exports = router;

