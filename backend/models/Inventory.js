// src/models/Inventory.js
const mongoose = require("mongoose");

// Schema for individual products
const productSchema = new mongoose.Schema(
  {
    pid: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    pCategory: {
      type: String,
      required: true,
      enum: [
        "clothing",
        "utensil",
        "food",
        "drink",
        "icecream",
        "electronics",
        "stationery",
        "grocery",
        "cosmetics",
        "home_appliance",
        "toys",
        "other",
      ],
    },
    pSubCat: { type: String, trim: true, default: "general" },
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false } // prevent automatic _id for each product
);

// Schema for branch inventory
const inventorySchema = new mongoose.Schema(
  {
    branchId: { type: String, required: true, unique: true, trim: true },
    inventoryItems: { type: [productSchema], default: [] },
  },
  { timestamps: true }
);

// Pre-save hook to update lastUpdated for all items
inventorySchema.pre("save", function (next) {
  this.inventoryItems.forEach((item) => {
    item.lastUpdated = Date.now();
  });
  next();
});

const Inventory = mongoose.model("Inventory", inventorySchema);
module.exports = Inventory;
