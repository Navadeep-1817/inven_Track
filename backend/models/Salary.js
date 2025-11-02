const mongoose = require("mongoose");

const salaryHistorySchema = new mongoose.Schema({
  previous_salary: {
    type: Number,
    required: true,
  },
  new_salary: {
    type: Number,
    required: true,
  },
  increment_percentage: {
    type: Number,
    required: true,
  },
  increment_amount: {
    type: Number,
    required: true,
  },
  effective_date: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  },
  updated_by: {
    type: String,
    default: "superadmin",
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const salarySchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Remove ref temporarily or use correct model name
      // ref: "Employee", // Use your actual employee model name
      unique: true,
    },
    employee_name: {
      type: String,
      required: true,
    },
    employee_staff_id: {
      type: String,
      required: true,
    },
    branch_id: {
      type: String,
      required: true,
      // ref: "Branch", // Remove if causing issues
    },
    role: {
      type: String,
      required: true,
      enum: ["Manager", "Staff"],
    },
    current_salary: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    last_increment_date: {
      type: Date,
    },
    last_increment_percentage: {
      type: Number,
      default: 0,
    },
    last_increment_amount: {
      type: Number,
      default: 0,
    },
    initial_salary: {
      type: Number,
      required: true,
    },
    joining_date: {
      type: Date,
      required: true,
    },
    salary_history: [salaryHistorySchema],
    salary_frequency: {
      type: String,
      enum: ["Monthly", "Bi-Weekly", "Weekly"],
      default: "Monthly",
    },
    payment_method: {
      type: String,
      enum: ["Bank Transfer", "Cash", "Cheque"],
      default: "Bank Transfer",
    },
    bank_details: {
      account_number: String,
      ifsc_code: String,
      bank_name: String,
      account_holder_name: String,
    },
    tax_deduction: {
      type: Number,
      default: 0,
    },
    other_deductions: {
      type: Number,
      default: 0,
    },
    allowances: {
      hra: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    gross_salary: {
      type: Number,
    },
    net_salary: {
      type: Number,
    },
    notes: {
      type: String,
      trim: true,
    },
    created_by: {
      type: String,
      default: "superadmin",
    },
    last_updated_by: {
      type: String,
      default: "superadmin",
    },
  },
  {
    timestamps: true,
  }
);

salarySchema.pre("save", function (next) {
  const totalAllowances =
    (this.allowances.hra || 0) +
    (this.allowances.da || 0) +
    (this.allowances.transport || 0) +
    (this.allowances.medical || 0) +
    (this.allowances.other || 0);

  this.gross_salary = this.current_salary + totalAllowances;

  const totalDeductions = (this.tax_deduction || 0) + (this.other_deductions || 0);
  this.net_salary = this.gross_salary - totalDeductions;

  next();
});

salarySchema.index({ branch_id: 1, role: 1 });
salarySchema.index({ employee_id: 1 });

module.exports = mongoose.model("Salary", salarySchema);