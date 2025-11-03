// // src/routes/billRoutes.js
// const express = require('express');
// const router = express.Router();
// const {
//   protect,
//   managerOrSuperadmin,
//   managerStaffOrSuperadmin,
//   superadminOnly,
// } = require('../middleware/authMiddleware');
// const {
//   getBranchBills,
//   getAllBills,
//   getBillById,
//   getBillByNumber,
//   createBill,
//   updateBillStatus,
//   getBranchRevenue,
//   getAllRevenue,
//   sendBillEmail
// } = require('../controllers/billController');

// /**
//  * 🧾 BILL ROUTES
//  */

// // GET all bills across all branches (SuperAdmin only)
// router.get('/all', protect, superadminOnly, getAllBills);

// // GET overall revenue analytics (SuperAdmin only)
// router.get('/revenue/all', protect, superadminOnly, getAllRevenue);

// // GET revenue for a specific branch (Manager, Staff, SuperAdmin can view)
// router.get('/revenue/:branchId', protect, managerStaffOrSuperadmin, getBranchRevenue);

// // GET bill by bill number (Manager, Staff, SuperAdmin can view)
// router.get('/number/:billNumber', protect, managerStaffOrSuperadmin, getBillByNumber);

// // GET bill by ID (Manager, Staff, SuperAdmin can view)
// router.get('/:billId', protect, managerStaffOrSuperadmin, getBillById);

// // GET bills by branch ID (Manager, Staff, SuperAdmin can view)
// router.get('/branch/:branchId', protect, managerStaffOrSuperadmin, getBranchBills);

// // POST create new bill (Manager, Staff, SuperAdmin can create)
// router.post('/', protect, managerStaffOrSuperadmin, createBill);

// // PUT update bill status (Manager, SuperAdmin only - for cancellation/refund)
// router.put('/:billId/status', protect, managerOrSuperadmin, updateBillStatus);

// module.exports = router;

// src/routes/billRoutes.js
const express = require('express');
const router = express.Router();
const {
  protect,
  managerOrSuperadmin,
  managerStaffOrSuperadmin,
  superadminOnly,
} = require('../middleware/authMiddleware');
const {
  getBranchBills,
  getAllBills,
  getBillById,
  getBillByNumber,
  createBill,
  updateBillStatus,
  getBranchRevenue,
  getAllRevenue,
  sendBillEmail
} = require('../controllers/billController');

/**
 * 🧾 BILL ROUTES
 * ⚠️ IMPORTANT: More specific routes MUST come before generic routes
 */

// GET all bills across all branches (SuperAdmin only)
router.get('/all', protect, superadminOnly, getAllBills);

// GET overall revenue analytics (SuperAdmin only)
router.get('/revenue/all', protect, superadminOnly, getAllRevenue);

// 🔧 FIX: Move /branch/:branchId BEFORE /:billId to prevent route conflict
// GET bills by branch ID (Manager, Staff, SuperAdmin can view)
router.get('/branch/:branchId', protect, managerStaffOrSuperadmin, getBranchBills);

// GET revenue for a specific branch (Manager, Staff, SuperAdmin can view)
router.get('/revenue/:branchId', protect, managerStaffOrSuperadmin, getBranchRevenue);

// GET bill by bill number (Manager, Staff, SuperAdmin can view)
router.get('/number/:billNumber', protect, managerStaffOrSuperadmin, getBillByNumber);

// POST create new bill (Manager, Staff, SuperAdmin can create)
router.post('/', protect, managerStaffOrSuperadmin, createBill);

// POST send bill via email
router.post('/send-email', protect, managerStaffOrSuperadmin, sendBillEmail);

// PUT update bill status (Manager, SuperAdmin only - for cancellation/refund)
router.put('/:billId/status', protect, managerOrSuperadmin, updateBillStatus);

// 🔧 FIX: Move /:billId to the END to avoid catching other routes
// GET bill by ID (Manager, Staff, SuperAdmin can view)
router.get('/:billId', protect, managerStaffOrSuperadmin, getBillById);

module.exports = router;
