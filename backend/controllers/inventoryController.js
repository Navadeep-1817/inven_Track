// src/controllers/inventoryController.js
const Inventory = require("../models/Inventory");

const getBranchInventory = async (req, res) => {
  try {
    const user = req.user;
    let branchId = req.params.branchId;
q
    if (user.role === "manager") {
      branchId = user.branchId;
    }

    // 🟢 Superadmin: get all branches if no param
    if (user.role === "superadmin" && !branchId) {
      const allInventory = await Inventory.find();
      const flattened = allInventory.flatMap(inv => inv.inventoryItems);
      return res.status(200).json(flattened);
    }

    // Normal case: branch-level inventory
    const branchInventory = await Inventory.findOne({ branchId });
    if (!branchInventory)
      return res.status(404).json({ message: "Branch not found" });

    res.status(200).json(branchInventory.inventoryItems);
  } catch (err) {
    console.error("❌ getBranchInventory Error:", err);
    res.status(500).json({ message: err.message });
  }
  console.log("✅ InventoryController user:", req.user);
console.log("✅ Incoming branchId param:", req.params.branchId);

};

// POST add a product
const addProduct = async (req, res) => {
  try {
    const user = req.user;
    const branchId = user.role === "superadmin" ? req.body.branchId : user.branchId;

    if (!branchId) return res.status(400).json({ message: "branchId required" });

    const productData = req.body;
    delete productData.branchId; // prevent conflict

    const branchInventory = await Inventory.findOne({ branchId });

    if (branchInventory) {
      // Check for duplicate pid
      const exists = branchInventory.inventoryItems.some(
        (item) => item.pid === productData.pid
      );
      if (exists) return res.status(400).json({ message: "Product already exists" });

      branchInventory.inventoryItems.push(productData);
      await branchInventory.save();
      return res.status(201).json(branchInventory);
    } else {
      // Create new branch inventory
      const newInventory = new Inventory({
        branchId,
        inventoryItems: [productData],
      });
      await newInventory.save();
      return res.status(201).json(newInventory);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT update a product
const updateProduct = async (req, res) => {
  try {
    const user = req.user;
    const { branchId, pid } = req.params;
    const updateData = req.body;

    const effectiveBranchId = user.role === "superadmin" ? branchId : user.branchId;

    const branchInventory = await Inventory.findOne({ branchId: effectiveBranchId });
    if (!branchInventory) return res.status(404).json({ message: "Branch not found" });

    const product = branchInventory.inventoryItems.find((p) => p.pid === pid);
    if (!product) return res.status(404).json({ message: "Product not found" });

    Object.assign(product, updateData);
    product.lastUpdated = Date.now();

    await branchInventory.save();
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE a product
const deleteProduct = async (req, res) => {
  try {
    const user = req.user;
    const { branchId, pid } = req.params;

    const effectiveBranchId = user.role === "superadmin" ? branchId : user.branchId;

    const branchInventory = await Inventory.findOne({ branchId: effectiveBranchId });
    if (!branchInventory) return res.status(404).json({ message: "Branch not found" });

    const originalLength = branchInventory.inventoryItems.length;
    branchInventory.inventoryItems = branchInventory.inventoryItems.filter(
      (p) => p.pid !== pid
    );

    if (branchInventory.inventoryItems.length === originalLength)
      return res.status(404).json({ message: "Product not found" });

    await branchInventory.save();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getBranchInventory,
  addProduct,
  updateProduct,
  deleteProduct,
};
