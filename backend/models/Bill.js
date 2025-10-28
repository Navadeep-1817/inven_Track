const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  pid: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  amount: {
    type: Number,
    required: true
  }
});

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  billDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Customer Information
  customer: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    }
  },
  
  // Items purchased
  items: [billItemSchema],
  
  // Bill Calculations
  totals: {
    subtotal: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    taxableAmount: {
      type: Number,
      required: true
    },
    gstAmount: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    }
  },
  
  // Settings
  gstRate: {
    type: Number,
    required: true,
    default: 18
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Net Banking'],
    default: 'Cash'
  },
  notes: {
    type: String,
    default: ""
  },
  
  // Branch & Staff Information
  branchId: {
    type: String,
    required: true
  },
  branchName: {
    type: String,
    required: true
  },
  branchLocation: {
    type: String
  },
  
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvenTrack',
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'refunded'],
    default: 'completed'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster queries
billSchema.index({ billNumber: 1 });
billSchema.index({ branchId: 1, billDate: -1 });
billSchema.index({ 'customer.phone': 1 });
billSchema.index({ staffId: 1 });

// Virtual for formatted bill date
billSchema.virtual('formattedBillDate').get(function() {
  return this.billDate.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
});

// Method to calculate bill summary
billSchema.methods.calculateSummary = function() {
  return {
    totalItems: this.items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: this.totals.total,
    itemCount: this.items.length
  };
};

// Static method to get bills by date range
billSchema.statics.getByDateRange = function(branchId, startDate, endDate) {
  return this.find({
    branchId,
    billDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ billDate: -1 });
};

// Static method to get revenue by date range
billSchema.statics.getRevenue = async function(branchId, startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        branchId,
        billDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totals.total' },
        totalBills: { $sum: 1 },
        totalItems: { $sum: { $size: '$items' } }
      }
    }
  ]);
  
  return result[0] || { totalRevenue: 0, totalBills: 0, totalItems: 0 };
};

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;