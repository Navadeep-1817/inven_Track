// src/controllers/billController.js
const Bill = require("../models/Bill");
const Inventory = require("../models/Inventory");

// GET all bills for a branch
const getBranchBills = async (req, res) => {
  try {
    console.log("✅ getBranchBills - user:", req.user);
    console.log("✅ Incoming branchId param:", req.params.branchId);
    
    const user = req.user;
    let branchId = req.params.branchId;
    
    // Manager/Staff can only access their own branch
    if (user.role === "manager" || user.role === "staff") {
      branchId = user.branchId;
    }

    // Validate branchId exists
    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    // Get query parameters for filtering
    const { startDate, endDate, status, limit = 50, page = 1 } = req.query;

    let query = { branchId };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const bills = await Bill.find(query)
      .sort({ billDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('staffId', 'name email');

    const totalCount = await Bill.countDocuments(query);

    res.status(200).json({
      bills,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("❌ getBranchBills Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET all bills (superadmin only)
const getAllBills = async (req, res) => {
  try {
    console.log("✅ getAllBills called by:", req.user.role);
    
    const { startDate, endDate, status, limit = 50, page = 1 } = req.query;

    let query = {};

    // Add date range filter if provided
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const bills = await Bill.find(query)
      .sort({ billDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('staffId', 'name email');

    const totalCount = await Bill.countDocuments(query);

    res.status(200).json({
      bills,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("❌ getAllBills Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET single bill by ID
const getBillById = async (req, res) => {
  try {
    const user = req.user;
    const { billId } = req.params;

    const bill = await Bill.findById(billId).populate('staffId', 'name email');

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Manager/Staff can only view bills from their branch
    if ((user.role === "manager" || user.role === "staff") && 
        bill.branchId !== user.branchId) {
      return res.status(403).json({ message: "Access denied to this bill" });
    }

    res.status(200).json(bill);
  } catch (err) {
    console.error("❌ getBillById Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET bill by bill number
const getBillByNumber = async (req, res) => {
  try {
    const user = req.user;
    const { billNumber } = req.params;

    const bill = await Bill.findOne({ billNumber }).populate('staffId', 'name email');

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Manager/Staff can only view bills from their branch
    if ((user.role === "manager" || user.role === "staff") && 
        bill.branchId !== user.branchId) {
      return res.status(403).json({ message: "Access denied to this bill" });
    }

    res.status(200).json(bill);
  } catch (err) {
    console.error("❌ getBillByNumber Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST create a new bill
const createBill = async (req, res) => {
  try {
    const user = req.user;
    const billData = req.body;

    // Determine branchId based on role
    const branchId = user.role === "superadmin" ? billData.branchId : user.branchId;

    if (!branchId) {
      return res.status(400).json({ message: "branchId required" });
    }

    // Validate items exist in inventory and update quantities
    const branchInventory = await Inventory.findOne({ branchId });
    
    if (!branchInventory) {
      return res.status(404).json({ message: "Branch inventory not found" });
    }

    // Check stock availability and prepare inventory updates
    for (const item of billData.items) {
      const inventoryItem = branchInventory.inventoryItems.find(
        (inv) => inv.pid === item.pid
      );

      if (!inventoryItem) {
        return res.status(400).json({ 
          message: `Product ${item.pid} not found in inventory` 
        });
      }

      if (inventoryItem.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.name}. Available: ${inventoryItem.quantity}` 
        });
      }
    }

    // Generate unique bill number
    const billCount = await Bill.countDocuments({ branchId });
    const billNumber = `${branchId}-${Date.now()}-${billCount + 1}`;

    // Calculate totals
    const subtotal = billData.items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * (billData.discount || 0)) / 100;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = (taxableAmount * billData.gstRate) / 100;
    const total = taxableAmount + gstAmount;

    // Create bill
    const newBill = new Bill({
      billNumber,
      billDate: billData.billDate || Date.now(),
      customer: billData.customer,
      items: billData.items,
      totals: {
        subtotal,
        discountAmount,
        taxableAmount,
        gstAmount,
        total
      },
      gstRate: billData.gstRate || 18,
      discount: billData.discount || 0,
      paymentMethod: billData.paymentMethod || 'Cash',
      notes: billData.notes || '',
      branchId,
      branchName: billData.branchName,
      branchLocation: billData.branchLocation || '',
      staffId: user.id,
      staffName: user.name,
      status: 'completed'
    });

    await newBill.save();

    // Update inventory quantities
    for (const item of billData.items) {
      const inventoryItem = branchInventory.inventoryItems.find(
        (inv) => inv.pid === item.pid
      );
      inventoryItem.quantity -= item.quantity;
      inventoryItem.lastUpdated = Date.now();
    }

    await branchInventory.save();

    res.status(201).json(newBill);
  } catch (err) {
    console.error("❌ createBill Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// PUT update bill status (for cancellation/refund)
const updateBillStatus = async (req, res) => {
  try {
    const user = req.user;
    const { billId } = req.params;
    const { status } = req.body;

    if (!['completed', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Manager/Staff can only update bills from their branch
    const effectiveBranchId = user.role === "superadmin" ? bill.branchId : user.branchId;
    
    if (bill.branchId !== effectiveBranchId) {
      return res.status(403).json({ message: "Access denied to this bill" });
    }

    // If cancelling or refunding, restore inventory
    if ((status === 'cancelled' || status === 'refunded') && bill.status === 'completed') {
      const branchInventory = await Inventory.findOne({ branchId: bill.branchId });
      
      if (branchInventory) {
        for (const item of bill.items) {
          const inventoryItem = branchInventory.inventoryItems.find(
            (inv) => inv.pid === item.pid
          );
          if (inventoryItem) {
            inventoryItem.quantity += item.quantity;
            inventoryItem.lastUpdated = Date.now();
          }
        }
        await branchInventory.save();
      }
    }

    bill.status = status;
    await bill.save();

    res.status(200).json(bill);
  } catch (err) {
    console.error("❌ updateBillStatus Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET revenue analytics for a branch
const getBranchRevenue = async (req, res) => {
  try {
    const user = req.user;
    let branchId = req.params.branchId;
    
    // Manager/Staff can only access their own branch
    if (user.role === "manager" || user.role === "staff") {
      branchId = user.branchId;
    }

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: "startDate and endDate are required" 
      });
    }

    const revenue = await Bill.getRevenue(branchId, startDate, endDate);

    res.status(200).json(revenue);
  } catch (err) {
    console.error("❌ getBranchRevenue Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET overall revenue analytics (superadmin only)
const getAllRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: "startDate and endDate are required" 
      });
    }

    const result = await Bill.aggregate([
      {
        $match: {
          billDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$branchId',
          branchName: { $first: '$branchName' },
          totalRevenue: { $sum: '$totals.total' },
          totalBills: { $sum: 1 },
          totalItems: { $sum: { $size: '$items' } }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    const overall = result.reduce((acc, branch) => ({
      totalRevenue: acc.totalRevenue + branch.totalRevenue,
      totalBills: acc.totalBills + branch.totalBills,
      totalItems: acc.totalItems + branch.totalItems
    }), { totalRevenue: 0, totalBills: 0, totalItems: 0 });

    res.status(200).json({
      overall,
      byBranch: result
    });
  } catch (err) {
    console.error("❌ getAllRevenue Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Send bill via email
const sendBillEmail = async (req, res) => {
  try {
    const { billId, email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!billId) {
      return res.status(400).json({ message: "Bill ID is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const bill = await Bill.findById(billId).populate('staffId', 'name email');

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Check if user has access to this bill
    const user = req.user;
    if ((user.role === "manager" || user.role === "staff") && 
        bill.branchId !== user.branchId) {
      return res.status(403).json({ message: "Access denied to this bill" });
    }

    // Import email service
    const { sendBillEmail: emailService } = require('../services/emailService');
    
    // Send email
    const result = await emailService(bill, email);

    res.status(200).json({
      success: true,
      message: `Bill sent successfully to ${email}`,
      messageId: result.messageId
    });
  } catch (error) {
    console.error("❌ sendBillEmail Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to send email. Please check email configuration.",
      error: error.message 
    });
  }
};

module.exports = {
  getBranchBills,
  getAllBills,
  getBillById,
  getBillByNumber,
  createBill,
  updateBillStatus,
  getBranchRevenue,
  getAllRevenue,
  sendBillEmail
};