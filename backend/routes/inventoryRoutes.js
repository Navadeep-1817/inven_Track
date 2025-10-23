const express = require("express");
const {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/inventoryController");

const router = express.Router();

// ✅ Define all routes
router.post("/", addProduct);
router.get("/", getAllProducts);
router.get("/:pid", getProductById);
router.put("/:pid", updateProduct);
router.delete("/:pid", deleteProduct);

// ✅ export router correctly (this fixes your error)
module.exports = router;
