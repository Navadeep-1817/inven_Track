const Invoice = require('../models/Invoice');
const mongoose = require('mongoose');

// Get all invoices with filters
const getInvoices = async (req, res) => {
  try {
    const {
      branch,
      status,
      paymentMethod,
      startDate,
      endDate,
      search,
      limit = 1000,
      page = 1
    } = req.query;

    // Build query
    const query = {};

    if (branch) query.branchId = branch;
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // Date range filter
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) {
        query.billDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.billDate.$lte = endDateTime;
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { billId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Invoice.find(query)
      .sort({ billDate: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message
    });
  }
};

// Get single invoice by billId
const getInvoiceById = async (req, res) => {
  try {
    const { billId } = req.params;

    const invoice = await Invoice.findOne({ billId }).lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
};

// Create new invoice
const createInvoice = async (req, res) => {
  try {
    const {
      branchId,
      branchName,
      customerName,
      customerPhone,
      items,
      totals,
      paymentMethod,
      status,
      staffId,
      staffName,
      notes
    } = req.body;

    // Validate required fields
    if (!branchId || !branchName || !items || items.length === 0 || !totals) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate unique billId
    const lastInvoice = await Invoice.findOne({ branchId })
      .sort({ billDate: -1 })
      .select('billId')
      .lean();

    let billNumber = 1;
    if (lastInvoice && lastInvoice.billId) {
      const lastNumber = parseInt(lastInvoice.billId.split('-').pop());
      billNumber = lastNumber + 1;
    }

    const billId = `${branchId}-${Date.now()}-${billNumber.toString().padStart(4, '0')}`;

    // Create invoice
    const invoice = new Invoice({
      billId,
      branchId,
      branchName,
      customerName,
      customerPhone,
      items,
      totals,
      paymentMethod: paymentMethod || 'Cash',
      status: status || 'completed',
      staffId,
      staffName,
      notes,
      createdBy: req.user.id
    });

    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
};

// Update invoice
const updateInvoice = async (req, res) => {
  try {
    const { billId } = req.params;
    const updateData = req.body;

    // Prevent updating certain fields
    delete updateData.billId;
    delete updateData.createdBy;
    delete updateData.createdAt;

    const invoice = await Invoice.findOneAndUpdate(
      { billId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message
    });
  }
};

// Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const { billId } = req.params;

    const invoice = await Invoice.findOneAndDelete({ billId });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message
    });
  }
};

// Get invoice statistics
const getInvoiceStatistics = async (req, res) => {
  try {
    const { branchId, startDate, endDate } = req.query;

    const filters = {};
    if (branchId) filters.branchId = branchId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await Invoice.getStatistics(filters);

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Get revenue by branch
const getRevenueByBranch = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = { status: 'completed' };
    if (startDate || endDate) {
      match.billDate = {};
      if (startDate) match.billDate.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        match.billDate.$lte = endDateTime;
      }
    }

    const revenue = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$branchId',
          branchName: { $first: '$branchName' },
          totalRevenue: { $sum: '$totals.total' },
          invoiceCount: { $sum: 1 },
          avgInvoiceValue: { $avg: '$totals.total' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      success: true,
      revenue
    });
  } catch (error) {
    console.error('Error fetching revenue by branch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue by branch',
      error: error.message
    });
  }
};

// Get revenue by payment method
const getRevenueByPaymentMethod = async (req, res) => {
  try {
    const { startDate, endDate, branchId } = req.query;

    const match = { status: 'completed' };
    if (branchId) match.branchId = branchId;
    if (startDate || endDate) {
      match.billDate = {};
      if (startDate) match.billDate.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        match.billDate.$lte = endDateTime;
      }
    }

    const revenue = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$paymentMethod',
          totalRevenue: { $sum: '$totals.total' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      success: true,
      revenue
    });
  } catch (error) {
    console.error('Error fetching revenue by payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue by payment method',
      error: error.message
    });
  }
};

// Get daily revenue trend
const getDailyRevenue = async (req, res) => {
  try {
    const { startDate, endDate, branchId } = req.query;

    const match = { status: 'completed' };
    if (branchId) match.branchId = branchId;
    if (startDate || endDate) {
      match.billDate = {};
      if (startDate) match.billDate.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        match.billDate.$lte = endDateTime;
      }
    }

    const dailyRevenue = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$billDate' },
            month: { $month: '$billDate' },
            day: { $dayOfMonth: '$billDate' }
          },
          date: { $first: '$billDate' },
          totalRevenue: { $sum: '$totals.total' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { date: 1 } },
      {
        $project: {
          date: 1,
          totalRevenue: 1,
          invoiceCount: 1
        }
      }
    ]);

    res.json({
      success: true,
      dailyRevenue
    });
  } catch (error) {
    console.error('Error fetching daily revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily revenue',
      error: error.message
    });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStatistics,
  getRevenueByBranch,
  getRevenueByPaymentMethod,
  getDailyRevenue
};