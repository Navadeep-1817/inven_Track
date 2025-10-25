// inventoryRoutes.js
const express = require("express");
const router = express.Router();
const {
  getBranchInventory,
  getAllInventory,
  addProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/inventoryController");

const { protect, managerOrSuperadmin, superadminOnly } = require("../middleware/authMiddleware");

// Apply protect to all routes
router.use(protect);

// Superadmin: get all inventory across branches (MUST be before /:branchId)
router.get("/all", superadminOnly, getAllInventory);

// All other routes need manager or superadmin
router.get("/:branchId", managerOrSuperadmin, getBranchInventory);
router.post("/", managerOrSuperadmin, addProduct);
router.put("/:branchId/:pid", managerOrSuperadmin, updateProduct);
router.delete("/:branchId/:pid", managerOrSuperadmin, deleteProduct);

module.exports = router;