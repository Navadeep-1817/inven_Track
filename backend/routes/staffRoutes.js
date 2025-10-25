const express = require('express');
const router = express.Router();
const { getStaffByBranchId, removeStaff, updateStaffRole } = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:branchId', protect, getStaffByBranchId);

router.delete('/:staffId', protect, removeStaff);

router.patch('/:staffId/role', protect, updateStaffRole);

module.exports = router;