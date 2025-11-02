const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  billId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  branchId: {
    type: String,
    required: true,
    index: true
  },
  branchName: {
    type: String,
    required: true
  },
  billDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  customerName: {
    type: String,
    default: null
  },
  customerPhone: {
    type: String,
    default: null
  },
  items: [{
    pid: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: 'Uncategorized'
    },
    brand: {
      type: String,
      default: 'Unknown'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totals: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Other'],
    default: 'Cash'
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed',
    index: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  staffName: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
invoiceSchema.index({ branchId: 1, billDate: -1 });
invoiceSchema.index({ status: 1, billDate: -1 });
invoiceSchema.index({ paymentMethod: 1, billDate: -1 });
invoiceSchema.index({ customerPhone: 1 });

// Text search index
invoiceSchema.index({ 
  billId: 'text', 
  customerName: 'text', 
  customerPhone: 'text' 
});

// Virtual for invoice age in days
invoiceSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.billDate) / (1000 * 60 * 60 * 24));
});

// Method to calculate total revenue for an invoice
invoiceSchema.methods.calculateRevenue = function() {
  return this.totals.total;
};

// Static method to get invoice statistics
invoiceSchema.statics.getStatistics = async function(filters = {}) {
  const match = {};
  
  if (filters.branchId) match.branchId = filters.branchId;
  if (filters.startDate || filters.endDate) {
    match.billDate = {};
    if (filters.startDate) match.billDate.$gte = new Date(filters.startDate);
    if (filters.endDate) match.billDate.$lte = new Date(filters.endDate);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalRevenue: { $sum: '$totals.total' },
        avgInvoiceValue: { $avg: '$totals.total' },
        completedInvoices: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingInvoices: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalInvoices: 0,
    totalRevenue: 0,
    avgInvoiceValue: 0,
    completedInvoices: 0,
    pendingInvoices: 0
  };
};

module.exports = mongoose.model('Invoice', invoiceSchema);