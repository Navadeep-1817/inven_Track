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
    if (user.role === "Manager" || user.role === "Staff") {
      branchId = user.branch_id;
    }

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    const { startDate, endDate, status, limit = 50, page = 1 } = req.query;

    let query = { branchId };

    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

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

    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

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
    if ((user.role === "Manager" || user.role === "Staff") && 
        bill.branchId !== user.branch_id) {
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
    if ((user.role === "Manager" || user.role === "Staff") && 
        bill.branchId !== user.branch_id) {
      return res.status(403).json({ message: "Access denied to this bill" });
    }

    res.status(200).json(bill);
  } catch (err) {
    console.error("❌ getBillByNumber Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST create a new bill
// POST create a new bill
const createBill = async (req, res) => {
  try {
    console.log("📥 Creating Bill - Request User:", req.user);
    console.log("📥 Creating Bill - Request Body:", JSON.stringify(req.body, null, 2));

    const user = req.user || {};
    const billData = req.body || {};

    // --- Robust branchId resolution ---
    // allow these sources (priority order):
    // 1) superadmin can supply billData.branchId OR req.params.branchId or req.query.branchId
    // 2) non-superadmin uses user's branch (accept different possible field names)
    const userBranchCandidates = [
      user.branch_id,
      user.branchId,
      user.branch,        // in case middleware used different name
      user.branchid
    ].filter(Boolean);

    const requestBranchCandidates = [
      billData.branchId,
      req.params?.branchId,
      req.query?.branchId
    ].filter(Boolean);

    let branchId;
    if (user.role === "superadmin") {
      // superadmin must supply branchId somewhere
      branchId = requestBranchCandidates[0] || userBranchCandidates[0];
    } else {
      // manager/staff must use their own branch from user token
      branchId = userBranchCandidates[0] || requestBranchCandidates[0];
    }

    // Normalize to string if it's an ObjectId
    if (branchId && typeof branchId !== "string") {
      branchId = branchId.toString();
    }

    console.log("✅ Resolved branchId:", branchId);
    console.log("✅ User branch candidates:", userBranchCandidates);
    console.log("✅ Request branch candidates:", requestBranchCandidates);
    console.log("✅ User role:", user.role);

    if (!branchId) {
      console.error("❌ No branchId found! user and request missing branch information.");
      return res.status(400).json({
        message: "branchId required",
        debug: {
          user: {
            id: user.id || user._id,
            role: user.role,
            branch_id: user.branch_id,
            branchId: user.branchId,
            branch: user.branch
          },
          request: {
            bodyBranchId: billData.branchId,
            paramsBranchId: req.params?.branchId,
            queryBranchId: req.query?.branchId
          }
        }
      });
    }

    // Validate items exist
    if (!Array.isArray(billData.items) || billData.items.length === 0) {
      return res.status(400).json({ message: "Bill must contain at least one item" });
    }

    // Validate customer info
    if (!billData.customer || !billData.customer.name || !billData.customer.phone) {
      return res.status(400).json({ message: "Customer name and phone are required" });
    }

    // Validate branch inventory exists
    const branchInventory = await Inventory.findOne({ branchId });
    if (!branchInventory) {
      console.error("❌ Branch inventory not found for branchId:", branchId);
      return res.status(404).json({ message: "Branch inventory not found" });
    }

    // Check stock availability
    for (const item of billData.items) {
      const inventoryItem = branchInventory.inventoryItems.find(inv => inv.pid === item.pid);
      if (!inventoryItem) {
        return res.status(400).json({ message: `Product ${item.pid} not found in inventory` });
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

    // Calculate totals safely
    const subtotal = billData.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount);
      if (isNaN(amount)) {
        throw new Error(`Invalid amount for item ${item.pid}`);
      }
      return sum + amount;
    }, 0);

    const discountPct = parseFloat(billData.discount) || 0;
    const gstRate = parseFloat(billData.gstRate) || 18;
    const discountAmount = (subtotal * discountPct) / 100;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const total = taxableAmount + gstAmount;

    // Branch and staff info
    const branchName = billData.branchName || "Unknown Branch";
    const branchLocation = billData.branchLocation || "";

    // Resolve staff id (use user._id or user.id)
    const staffId = user.id || user._id;
    if (!staffId) {
      console.warn("⚠️ staffId missing on user object. Bill will fail if staffId is required by schema.");
    }

    const newBill = new Bill({
      billNumber,
      billDate: billData.billDate || Date.now(),
      customer: billData.customer,
      items: billData.items,
      totals: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        taxableAmount: parseFloat(taxableAmount.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      },
      gstRate,
      discount: discountPct,
      paymentMethod: billData.paymentMethod || 'Cash',
      notes: billData.notes || '',
      branchId,
      branchName,
      branchLocation,
      staffId,                 // should reference InvenTrack
      staffName: user.name || billData.staffName || '',
      status: 'completed'
    });

    console.log("✅ Saving bill...");
    await newBill.save();
    console.log("✅ Bill saved successfully:", newBill._id);

    // Update inventory quantities
    for (const item of billData.items) {
      const inventoryItem = branchInventory.inventoryItems.find(inv => inv.pid === item.pid);
      inventoryItem.quantity -= item.quantity;
      inventoryItem.lastUpdated = Date.now();
    }
    await branchInventory.save();
    console.log("✅ Inventory updated successfully");

    res.status(201).json(newBill);

  } catch (err) {
    console.error("❌ createBill Error:", err);
    res.status(500).json({
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};


// PUT update bill status
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
    const effectiveBranchId = user.role === "superadmin" ? bill.branchId : user.branch_id;
    
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
    if (user.role === "Manager" || user.role === "Staff") {
      branchId = user.branch_id;
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
    if ((user.role === "Manager" || user.role === "Staff") && 
        bill.branchId !== user.branch_id) {
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