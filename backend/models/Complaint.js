const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  // Staff Information
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  staffName: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },

  // Branch Information
  branchId: {
    type: String,
    required: true,
    index: true
  },
  branchName: {
    type: String,
    required: true
  },

  // Complaint Details
  complaintText: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['Workplace', 'Equipment', 'Management', 'Customer', 'Safety', 'Other'],
    default: 'Other'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },

  // Status Tracking
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Resolved', 'Rejected'],
    default: 'Pending',
    index: true
  },
  
  // Manager Response
  managerResponse: {
    type: String,
    default: null
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  respondedAt: {
    type: Date,
    default: null
  },

  // Additional Metadata
  isAnonymous: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    url: String
  }],
  
  // Timestamps
  complaintDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
complaintSchema.index({ branchId: 1, complaintDate: -1 });
complaintSchema.index({ staffId: 1, complaintDate: -1 });
complaintSchema.index({ status: 1, complaintDate: -1 });

// Virtual to calculate complaint age in days
complaintSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.complaintDate) / (1000 * 60 * 60 * 24));
});

// Method to check if complaint is overdue (pending for more than 7 days)
complaintSchema.methods.isOverdue = function() {
  const daysSinceComplaint = Math.floor((Date.now() - this.complaintDate) / (1000 * 60 * 60 * 24));
  return this.status === 'Pending' && daysSinceComplaint > 7;
};

// Static method to get complaint statistics
complaintSchema.statics.getStatistics = async function(filters = {}) {
  const match = {};
  
  if (filters.branchId) match.branchId = filters.branchId;
  if (filters.staffId) match.staffId = filters.staffId;
  if (filters.startDate || filters.endDate) {
    match.complaintDate = {};
    if (filters.startDate) match.complaintDate.$gte = new Date(filters.startDate);
    if (filters.endDate) match.complaintDate.$lte = new Date(filters.endDate);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalComplaints: { $sum: 1 },
        pendingComplaints: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        },
        underReviewComplaints: {
          $sum: { $cond: [{ $eq: ['$status', 'Under Review'] }, 1, 0] }
        },
        resolvedComplaints: {
          $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
        },
        rejectedComplaints: {
          $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalComplaints: 0,
    pendingComplaints: 0,
    underReviewComplaints: 0,
    resolvedComplaints: 0,
    rejectedComplaints: 0
  };
};

module.exports = mongoose.model('Complaint', complaintSchema);