const mongoose = require("mongoose");

const staffAppraisalSchema = new mongoose.Schema(
  {
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    staff_name: {
      type: String,
      required: true
    },
    staff_employee_id: {
      type: String,
      required: true
    },
    branch_id: {
      type: String,  // Keep as String to match your User model
      required: true
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    manager_name: {
      type: String,
      required: true
    },
    review_period: {
      type: String,
      enum: ["H1", "H2"],
      required: true,
    },
    review_year: {
      type: Number,
      required: true
    },
    strengths: {
      type: String,
      required: true
    },
    areas_of_improvement: {
      type: String,
      required: true
    },
    achievements: String,
    goals_for_next_period: String,
    overall_rating: {
      type: String,
      enum: ["Outstanding", "Exceeds Expectations", "Meets Expectations", "Needs Improvement", "Unsatisfactory", ""]
    },
    additional_comments: String,
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    last_modified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
  },
  { 
    timestamps: true,
    collection: 'staffappraisals'  // Explicitly set collection name
  }
);

// Index for uniqueness and query performance
staffAppraisalSchema.index({ staff_id: 1, review_period: 1, review_year: 1 }, { unique: true });
staffAppraisalSchema.index({ branch_id: 1 });

module.exports = mongoose.model("StaffAppraisal", staffAppraisalSchema);