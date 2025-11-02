const mongoose = require("mongoose");

const staffAppraisalSchema = new mongoose.Schema(
  {
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    staff_name: String,
    staff_employee_id: String,
    branch_id: String,
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    manager_name: String,
    review_period: {
      type: String,
      enum: ["H1", "H2"],
      required: true,
    },
    review_year: Number,
    strengths: String,
    areas_of_improvement: String,
    achievements: String,
    goals_for_next_period: String,
    overall_rating: String,
    additional_comments: String,
    created_by: mongoose.Schema.Types.ObjectId,
    last_modified_by: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

staffAppraisalSchema.index({ staff_id: 1, review_period: 1, review_year: 1 }, { unique: true });

module.exports = mongoose.model("StaffAppraisal", staffAppraisalSchema);