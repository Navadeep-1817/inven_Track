const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  getComplaintStatistics,
  getComplaintsByCategory
} = require('../controllers/complaintController');
const { 
  protect, 
  managerOrSuperadmin, 
  superadminOnly,
  managerStaffOrSuperadmin 
} = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// =====================
// Statistics Routes (must come before :complaintId)
// =====================

// GET /api/complaints/statistics - Get complaint statistics
// Accessible by: Manager (own branch), SuperAdmin (all branches)
router.get('/statistics', managerOrSuperadmin, getComplaintStatistics);

// GET /api/complaints/by-category - Get complaints grouped by category
// Accessible by: Manager (own branch), SuperAdmin (all branches)
router.get('/by-category', managerOrSuperadmin, getComplaintsByCategory);

// GET /api/complaints/my-complaints - Get staff's own complaints
// Accessible by: Staff (own complaints only)
router.get('/my-complaints', getMyComplaints);

// =====================
// CRUD Routes
// =====================

// GET /api/complaints - Get all complaints (filtered by role)
// POST /api/complaints - Create new complaint (Staff only)
router.route('/')
  .get(managerOrSuperadmin, getAllComplaints)
  .post(createComplaint); // Any authenticated user (typically staff) can create

// GET /api/complaints/:complaintId - Get single complaint
// PUT /api/complaints/:complaintId - Update complaint status (Manager/SuperAdmin)
// DELETE /api/complaints/:complaintId - Delete complaint (SuperAdmin only)
router.route('/:complaintId')
  .get(managerStaffOrSuperadmin, getComplaintById)
  .put(managerOrSuperadmin, updateComplaintStatus)
  .delete(superadminOnly, deleteComplaint);

module.exports = router;