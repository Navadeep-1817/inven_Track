const mongoose = require("mongoose");

const appraisalSchema = new mongoose.Schema(
  {
    branch_id: {
      type: String,
      required: true,
      // ref: "Branch", // Remove if causing issues
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Remove ref temporarily or use correct model name
      // ref: "Employee", // Use your actual employee model name
    },
    manager_name: {
      type: String,
      required: true,
    },
    manager_employee_id: {
      type: String,
      required: true,
    },
    review_period: {
      type: String,
      required: true,
      enum: ["H1", "H2"],
    },
    review_year: {
      type: Number,
      required: true,
    },
    strengths: {
      type: String,
      required: true,
      trim: true,
    },
    areas_of_improvement: {
      type: String,
      required: true,
      trim: true,
    },
    achievements: {
      type: String,
      trim: true,
    },
    goals_for_next_period: {
      type: String,
      trim: true,
    },
    overall_rating: {
      type: String,
      enum: ["Outstanding", "Exceeds Expectations", "Meets Expectations", "Needs Improvement", "Unsatisfactory"],
    },
    additional_comments: {
      type: String,
      trim: true,
    },
    created_by: {
      type: String,
      default: "superadmin",
    },
    last_modified_by: {
      type: String,
      default: "superadmin",
    },
  },
  {
    timestamps: true,
  }
);

appraisalSchema.index({ manager_id: 1, review_period: 1, review_year: 1 }, { unique: true });
appraisalSchema.index({ branch_id: 1, review_year: -1 });

module.exports = mongoose.model("Appraisal", appraisalSchema);