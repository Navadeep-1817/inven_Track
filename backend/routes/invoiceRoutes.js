const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStatistics,
  getRevenueByBranch,
  getRevenueByPaymentMethod,
  getDailyRevenue
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// =====================
// Statistics & Analytics Routes
// These must come BEFORE the /:billId route to avoid conflicts
// =====================

// GET /api/invoices/statistics - Get invoice statistics
// Query params: branchId, startDate, endDate
router.get('/statistics', getInvoiceStatistics);

// GET /api/invoices/revenue/branch - Get revenue grouped by branch
// Query params: startDate, endDate
router.get('/revenue/branch', getRevenueByBranch);

// GET /api/invoices/revenue/payment-method - Get revenue grouped by payment method
// Query params: startDate, endDate, branchId
router.get('/revenue/payment-method', getRevenueByPaymentMethod);

// GET /api/invoices/revenue/daily - Get daily revenue trend
// Query params: startDate, endDate, branchId
router.get('/revenue/daily', getDailyRevenue);

// =====================
// CRUD Routes
// =====================

// GET /api/invoices - Get all invoices with filters
// Query params: branch, status, paymentMethod, startDate, endDate, search, limit, page
// POST /api/invoices - Create new invoice (requires admin, manager, or staff role)
router.route('/')
  .get(getInvoices)


// GET /api/invoices/:billId - Get single invoice by billId
// PUT /api/invoices/:billId - Update invoice (requires admin or manager role)
// DELETE /api/invoices/:billId - Delete invoice (requires admin or manager role)
router.route('/:billId')
  .get(getInvoiceById)


module.exports = router;