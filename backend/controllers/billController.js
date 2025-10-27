// ==========================================
// COMPLETE FIXED billController.js
// ==========================================

const Bill = require('../models/Bill');
const Inventory = require('../models/Inventory');

// Create a new bill
exports.createBill = async (req, res) => {
  try {
    console.log('📝 Creating bill - Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      billNumber,
      customer,
      items,
      totals,
      gstRate,
      discount,
      paymentMethod,
      notes,
      branch,
      staff
    } = req.body;

    // Validate required fields
    if (!customer || !customer.name || !customer.phone) {
      console.log('❌ Validation failed: Missing customer info');
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone are required'
      });
    }

    if (!items || items.length === 0) {
      console.log('❌ Validation failed: No items');
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    if (!branch || !branch.branch_id) {
      console.log('❌ Validation failed: Missing branch info');
      return res.status(400).json({
        success: false,
        message: 'Branch information is required'
      });
    }

    if (!staff || !staff._id) {
      console.log('❌ Validation failed: Missing staff info');
      return res.status(400).json({
        success: false,
        message: 'Staff information is required'
      });
    }

    // Get the authenticated user's branch for validation
    const userBranchId = req.user.branchId;
    console.log('👤 User branch:', userBranchId, 'Bill branch:', branch.branch_id);
    
    // Staff and Manager can only create bills for their own branch
    if (req.user.role !== 'superadmin' && userBranchId !== branch.branch_id) {
      console.log('❌ Access denied: Branch mismatch');
      return res.status(403).json({
        success: false,
        message: 'You can only create bills for your assigned branch'
      });
    }

    // ===== IMPROVED INVENTORY CHECK WITH MULTIPLE FALLBACKS =====
    console.log('📦 Checking inventory for', items.length, 'items...');
    
    for (const item of items) {
      console.log(`\n🔍 Checking: ${item.name} (PID: ${item.pid})`);
      
      let inventoryItem = null;
      
      // Strategy 1: Try exact pid match
      try {
        inventoryItem = await Inventory.findOne({ 
          pid: item.pid,
          branch_id: branch.branch_id
        });
        if (inventoryItem) {
          console.log('✓ Found by pid:', item.pid);
        }
      } catch (err) {
        console.log('⚠️ Error searching by pid:', err.message);
      }

      // Strategy 2: Try by _id if pid didn't work
      if (!inventoryItem && item.pid) {
        try {
          // Check if pid looks like a MongoDB ObjectId
          if (item.pid.match(/^[0-9a-fA-F]{24}$/)) {
            inventoryItem = await Inventory.findOne({
              _id: item.pid,
              branch_id: branch.branch_id
            });
            if (inventoryItem) {
              console.log('✓ Found by _id:', item.pid);
            }
          }
        } catch (err) {
          console.log('⚠️ Error searching by _id:', err.message);
        }
      }

      // Strategy 3: Try by name and brand (case-insensitive)
      if (!inventoryItem) {
        try {
          inventoryItem = await Inventory.findOne({
            branch_id: branch.branch_id,
            name: { $regex: new RegExp(`^${item.name}$`, 'i') },
            brand: { $regex: new RegExp(`^${item.brand}$`, 'i') }
          });
          if (inventoryItem) {
            console.log('✓ Found by name and brand');
          }
        } catch (err) {
          console.log('⚠️ Error searching by name/brand:', err.message);
        }
      }

      // Strategy 4: Last resort - just by name
      if (!inventoryItem) {
        try {
          inventoryItem = await Inventory.findOne({
            branch_id: branch.branch_id,
            name: { $regex: new RegExp(`^${item.name}$`, 'i') }
          });
          if (inventoryItem) {
            console.log('✓ Found by name only');
          }
        } catch (err) {
          console.log('⚠️ Error searching by name:', err.message);
        }
      }
      
      if (!inventoryItem) {
        console.log('❌ Product not found in inventory');
        console.log('Search criteria:', {
          pid: item.pid,
          name: item.name,
          brand: item.brand,
          branch_id: branch.branch_id
        });
        
        return res.status(404).json({
          success: false,
          message: `Product "${item.name}" not found in inventory. Please refresh the inventory list and try again.`
        });
      }

      console.log('Current stock:', inventoryItem.quantity, 'Requested:', item.quantity);

      // Check stock availability
      if (inventoryItem.quantity < item.quantity) {
        console.log('❌ Insufficient stock');
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`
        });
      }

      // Reduce inventory quantity
      inventoryItem.quantity -= item.quantity;
      await inventoryItem.save();
      console.log('✓ Inventory updated. New quantity:', inventoryItem.quantity);
    }

    console.log('✓ All inventory checks passed');

    // Create bill items with calculated amount
    const billItems = items.map(item => ({
      pid: item.pid,
      name: item.name,
      brand: item.brand,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity),
      amount: parseFloat(item.price) * parseInt(item.quantity)
    }));

    console.log('💰 Creating bill with totals:', totals);

    // Create new bill
    const newBill = new Bill({
      billNumber,
      billDate: new Date(),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email ? customer.email.trim() : "",
        address: customer.address ? customer.address.trim() : ""
      },
      items: billItems,
      totals: {
        subtotal: parseFloat(totals.subtotal),
        discountAmount: parseFloat(totals.discountAmount),
        taxableAmount: parseFloat(totals.taxableAmount),
        gstAmount: parseFloat(totals.gstAmount),
        total: parseFloat(totals.total)
      },
      gstRate: parseFloat(gstRate) || 18,
      discount: parseFloat(discount) || 0,
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || "",
      branchId: branch.branch_id,
      branchName: branch.branch_name,
      branchLocation: branch.branch_location || "",
      staffId: staff._id,
      staffName: staff.name,
      status: 'completed'
    });

    await newBill.save();

    console.log('✅ Bill created successfully:', newBill.billNumber);

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      bill: newBill
    });

  } catch (error) {
    console.error('❌ Error creating bill:', error);
    console.error('Error stack:', error.stack);
    
    // Handle duplicate bill number
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bill number already exists. Please try again.'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating bill: ' + error.message,
      error: error.message
    });
  }
};

// Get all bills for a branch
exports.getBillsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    // Access control: Staff and Manager can only view their own branch
    if (req.user.role !== 'superadmin' && req.user.branchId !== branchId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view bills for your assigned branch'
      });
    }

    const query = { branchId };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    const bills = await Bill.find(query)
      .sort({ billDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Bill.countDocuments(query);

    res.status(200).json({
      success: true,
      bills,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalBills: count
    });

  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bills',
      error: error.message
    });
  }
};

// Get a single bill by ID
exports.getBillById = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Access control: Staff and Manager can only view their branch bills
    if (req.user.role !== 'superadmin' && req.user.branchId !== bill.branchId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view bills for your assigned branch'
      });
    }

    res.status(200).json({
      success: true,
      bill
    });

  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bill',
      error: error.message
    });
  }
};

// Get bill by bill number
exports.getBillByNumber = async (req, res) => {
  try {
    const { billNumber } = req.params;

    const bill = await Bill.findOne({ billNumber });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Access control
    if (req.user.role !== 'superadmin' && req.user.branchId !== bill.branchId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view bills for your assigned branch'
      });
    }

    res.status(200).json({
      success: true,
      bill
    });

  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bill',
      error: error.message
    });
  }
};

// Get bills by customer phone
exports.getBillsByCustomer = async (req, res) => {
  try {
    const { phone } = req.params;

    const query = { 'customer.phone': phone };
    
    // If not superadmin, filter by branch
    if (req.user.role !== 'superadmin') {
      query.branchId = req.user.branchId;
    }

    const bills = await Bill.find(query)
      .sort({ billDate: -1 });

    res.status(200).json({
      success: true,
      bills,
      count: bills.length
    });

  } catch (error) {
    console.error('Error fetching customer bills:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer bills',
      error: error.message
    });
  }
};

// Get bills by staff
exports.getBillsByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { staffId };

    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    // If manager, ensure they can only view staff from their branch
    if (req.user.role === 'manager') {
      query.branchId = req.user.branchId;
    }

    const bills = await Bill.find(query)
      .sort({ billDate: -1 });

    res.status(200).json({
      success: true,
      bills,
      count: bills.length
    });

  } catch (error) {
    console.error('Error fetching staff bills:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff bills',
      error: error.message
    });
  }
};

// Get revenue report for a branch
exports.getRevenueReport = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;

    // Access control
    if (req.user.role === 'manager' && req.user.branchId !== branchId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view revenue for your assigned branch'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const revenue = await Bill.getRevenue(branchId, startDate, endDate);

    res.status(200).json({
      success: true,
      revenue
    });

  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue',
      error: error.message
    });
  }
};

// Update bill status (for cancellation/refund)
exports.updateBillStatus = async (req, res) => {
  try {
    const { billId } = req.params;
    const { status } = req.body;

    if (!['completed', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Access control
    if (req.user.role === 'manager' && req.user.branchId !== bill.branchId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update bills for your assigned branch'
      });
    }

    // If cancelling or refunding, restore inventory
    if ((status === 'cancelled' || status === 'refunded') && bill.status === 'completed') {
      for (const item of bill.items) {
        let inventoryItem = await Inventory.findOne({
          pid: item.pid,
          branch_id: bill.branchId
        });

        if (!inventoryItem) {
          inventoryItem = await Inventory.findOne({
            branch_id: bill.branchId,
            name: item.name,
            brand: item.brand
          });
        }

        if (inventoryItem) {
          inventoryItem.quantity += item.quantity;
          await inventoryItem.save();
        }
      }
    }

    bill.status = status;
    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Bill status updated successfully',
      bill
    });

  } catch (error) {
    console.error('Error updating bill status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bill status',
      error: error.message
    });
  }
};

// Delete a bill (soft delete by changing status)
exports.deleteBill = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Access control
    if (req.user.role === 'manager' && req.user.branchId !== bill.branchId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete bills for your assigned branch'
      });
    }

    // Change status to cancelled and restore inventory
    if (bill.status === 'completed') {
      for (const item of bill.items) {
        let inventoryItem = await Inventory.findOne({
          pid: item.pid,
          branch_id: bill.branchId
        });

        if (!inventoryItem) {
          inventoryItem = await Inventory.findOne({
            branch_id: bill.branchId,
            name: item.name,
            brand: item.brand
          });
        }

        if (inventoryItem) {
          inventoryItem.quantity += item.quantity;
          await inventoryItem.save();
        }
      }
    }

    bill.status = 'cancelled';
    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Bill cancelled successfully'
    });

  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bill',
      error: error.message
    });
  }
};

// Get today's sales summary
exports.getTodaySales = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    // Access control
    if (req.user.role !== 'superadmin' && req.user.branchId !== branchId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view sales for your assigned branch'
      });
    }
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const bills = await Bill.find({
      branchId,
      billDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed'
    });

    const summary = {
      totalSales: bills.reduce((sum, bill) => sum + bill.totals.total, 0),
      totalBills: bills.length,
      totalItems: bills.reduce((sum, bill) => 
        sum + bill.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      ),
      paymentMethods: {
        Cash: 0,
        Card: 0,
        UPI: 0,
        'Net Banking': 0
      }
    };

    bills.forEach(bill => {
      summary.paymentMethods[bill.paymentMethod] += bill.totals.total;
    });

    res.status(200).json({
      success: true,
      summary,
      bills
    });

  } catch (error) {
    console.error('Error fetching today\'s sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s sales',
      error: error.message
    });
  }
};

// Send bill via email
exports.sendBillEmail = async (req, res) => {
  try {
    const { billId, email } = req.body;

    if (!billId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Bill ID and email are required'
      });
    }

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Access control
    if (req.user.role !== 'superadmin' && req.user.branchId !== bill.branchId) {
      return res.status(403).json({
        success: false,
        message: 'You can only email bills for your assigned branch'
      });
    }

    // TODO: Implement actual email sending logic here
    console.log(`📧 Email would be sent to: ${email} for bill: ${bill.billNumber}`);

    // For now, return success
    res.status(200).json({
      success: true,
      message: `Bill sent successfully to ${email}`
    });

  } catch (error) {
    console.error('Error sending bill email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};