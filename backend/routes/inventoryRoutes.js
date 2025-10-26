// src/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  protect,
  managerOrSuperadmin,
  managerStaffOrSuperadmin,
  superadminOnly,
} = require('../middleware/authMiddleware');
const {
  getBranchInventory,
  getAllInventory,
  addProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/inventoryController');

/**
 * 📦 INVENTORY ROUTES
 */

// GET all inventory (SuperAdmin only)
router.get('/all', protect, superadminOnly, getAllInventory);

// GET inventory by branch ID (Manager, Staff, SuperAdmin can view)
router.get('/:branchId', protect, managerStaffOrSuperadmin, getBranchInventory);

// POST new product (Manager, SuperAdmin only)
router.post('/', protect, managerOrSuperadmin, addProduct);

// PUT update product (Manager, SuperAdmin only)
router.put('/:branchId/:pid', protect, managerOrSuperadmin, updateProduct);

// DELETE product (Manager, SuperAdmin only)
router.delete('/:branchId/:pid', protect, managerOrSuperadmin, deleteProduct);

module.exports = router;