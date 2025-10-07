const express = require('express');
const router = express.Router();

// Import handlers from the updated staff controller
const {
    getStaffByBranchId,
    markAttendance
} = require('../controllers/staffController');

// Route to get staff for attendance marking
// This will respond to GET /api/attendance/staff/:branchId
router.get('/staff/:branchId', getStaffByBranchId);

// Route to submit the attendance
// This will respond to POST /api/attendance/mark
router.post('/mark', markAttendance);

module.exports = router;
