const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Email should remain globally unique
  employee_id: { type: String, required: true },
  branch_id: { type: String, required: true },
  role: { type: String, enum: ["Manager", "Staff"], required: true },
  password: { type: String, required: true },
});

// ✅ Composite index to enforce unique employee_id *per branch*
userSchema.index({ branch_id: 1, employee_id: 1 }, { unique: true });

module.exports = mongoose.model("InvenTrack", userSchema, "InvenTrack");