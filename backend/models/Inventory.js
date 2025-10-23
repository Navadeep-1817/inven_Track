// src/models/Inventory.js
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    pid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

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

    pSubCat: {
      type: String,
      trim: true,
      default: "general",
    },
    
    attributes: {
      type: Map,
      of: String,
      default: {},
      example: {
        size: "M",
        color: "Red",
        capacity: "2L",
        material: "Stainless Steel",
      },
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

inventorySchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

const Inventory = mongoose.model("Inventory", inventorySchema);
module.exports = Inventory;
