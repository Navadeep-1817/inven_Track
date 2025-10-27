// ==========================================
// FIXED billRoutes.js
// ==========================================

const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { protect, managerStaffOrSuperadmin, managerOrSuperadmin } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/bills
 * @desc    Create a new bill
 * @access  Staff, Manager, Superadmin
 */
router.post('/', 
  managerStaffOrSuperadmin,
  billController.createBill
);

/**
 * @route   POST /api/bills/send-email
 * @desc    Send bill via email
 * @access  Staff, Manager, Superadmin
 * NOTE: This must come BEFORE /:billId to avoid route conflict
 */
router.post('/send-email',
  managerStaffOrSuperadmin,
  billController.sendBillEmail
);

/**
 * @route   GET /api/bills/branch/:branchId/today
 * @desc    Get today's sales summary for a branch
 * @access  Staff, Manager, Superadmin
 * NOTE: This must come BEFORE /branch/:branchId to avoid route conflict
 */
router.get('/branch/:branchId/today',
  managerStaffOrSuperadmin,
  billController.getTodaySales
);

/**
 * @route   GET /api/bills/branch/:branchId/revenue
 * @desc    Get revenue report for a branch
 * @access  Manager, Superadmin
 * @query   startDate, endDate
 * NOTE: This must come BEFORE /branch/:branchId to avoid route conflict
 */
router.get('/branch/:branchId/revenue',
  managerOrSuperadmin,
  billController.getRevenueReport
);

/**
 * @route   GET /api/bills/branch/:branchId
 * @desc    Get all bills for a specific branch
 * @access  Staff, Manager, Superadmin
 * @query   page, limit, status, startDate, endDate
 */
router.get('/branch/:branchId',
  managerStaffOrSuperadmin,
  billController.getBillsByBranch
);

/**
 * @route   GET /api/bills/customer/:phone
 * @desc    Get all bills for a customer by phone number
 * @access  Staff, Manager, Superadmin
 */
router.get('/customer/:phone',
  managerStaffOrSuperadmin,
  billController.getBillsByCustomer
);

/**
 * @route   GET /api/bills/staff/:staffId
 * @desc    Get all bills created by a specific staff member
 * @access  Manager, Superadmin
 * @query   startDate, endDate
 */
router.get('/staff/:staffId',
  managerOrSuperadmin,
  billController.getBillsByStaff
);

/**
 * @route   GET /api/bills/number/:billNumber
 * @desc    Get a bill by bill number
 * @access  Staff, Manager, Superadmin
 */
router.get('/number/:billNumber',
  managerStaffOrSuperadmin,
  billController.getBillByNumber
);

/**
 * @route   GET /api/bills/:billId
 * @desc    Get a single bill by ID
 * @access  Staff, Manager, Superadmin
 */
router.get('/:billId',
  managerStaffOrSuperadmin,
  billController.getBillById
);

/**
 * @route   PATCH /api/bills/:billId/status
 * @desc    Update bill status (cancel/refund)
 * @access  Manager, Superadmin
 */
router.patch('/:billId/status',
  managerOrSuperadmin,
  billController.updateBillStatus
);

/**
 * @route   DELETE /api/bills/:billId
 * @desc    Delete (cancel) a bill
 * @access  Manager, Superadmin
 */
router.delete('/:billId',
  managerOrSuperadmin,
  billController.deleteBill
);

module.exports = router;