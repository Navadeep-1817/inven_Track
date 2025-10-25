// // inventoryRoutes.js
// const express = require("express");
// const router = express.Router();
// const {
//   getBranchInventory,
//   addProduct,
//   updateProduct,
//   deleteProduct,
// } = require("../controllers/inventoryController");

// const { protect, managerOrSuperadmin } = require("../middleware/authMiddleware");

// router.use(protect);
// router.use(managerOrSuperadmin);

// // Remove optional `?` from path
// router.get("/:branchId", getBranchInventory);
// router.post("/", addProduct);
// router.put("/:branchId/:pid", updateProduct);
// router.delete("/:branchId/:pid", deleteProduct);

// module.exports = router;
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

router.use(protect);
router.use(managerOrSuperadmin);

// Superadmin: get all inventory across branches
router.get("/all", superadminOnly, getAllInventory);

// Get specific branch inventory
router.get("/:branchId", getBranchInventory);

// Add product
router.post("/", addProduct);

// Update product
router.put("/:branchId/:pid", updateProduct);

// Delete product
router.delete("/:branchId/:pid", deleteProduct);

module.exports = router;