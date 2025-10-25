// inventoryRoutes.js
const express = require("express");
const router = express.Router();
const {
  getBranchInventory,
  addProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/inventoryController");

const { protect, managerOrSuperadmin } = require("../middleware/authMiddleware");

router.use(protect);
router.use(managerOrSuperadmin);

// Remove optional `?` from path
router.get("/:branchId", getBranchInventory);
router.post("/", addProduct);
router.put("/:branchId/:pid", updateProduct);
router.delete("/:branchId/:pid", deleteProduct);

module.exports = router;
