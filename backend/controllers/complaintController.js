const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Branch = require('../models/Branch');

// =====================
// 🔹 CREATE COMPLAINT (Staff Only)
// =====================
const createComplaint = async (req, res) => {
  try {
    const { complaintText, category, priority, isAnonymous } = req.body;

    // Validate required fields
    if (!complaintText || complaintText.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Complaint text is required and must be at least 10 characters long.' 
      });
    }

    // Get staff details from authenticated user
    const staffId = req.user.id;
    const staff = await User.findById(staffId).select('-password');

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    // Get branch details
    const branch = await Branch.findOne({ branch_id: staff.branch_id });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found.' });
    }

    // Create complaint
    const newComplaint = new Complaint({
      staffId: staff._id,
      staffName: isAnonymous ? 'Anonymous' : staff.name,
      employeeId: staff.employee_id,
      branchId: staff.branch_id,
      branchName: branch.branch_name,
      complaintText: complaintText.trim(),
      category: category || 'Other',
      priority: priority || 'Medium',
      isAnonymous: isAnonymous || false,
      status: 'Pending'
    });

    await newComplaint.save();

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint: newComplaint
    });
  } catch (err) {
    console.error('❌ Create Complaint Error:', err);
    res.status(500).json({ 
      message: 'Failed to submit complaint.', 
      error: err.message 
    });
  }
};

// =====================
// 🔹 GET ALL COMPLAINTS (Manager/SuperAdmin)
// =====================
const getAllComplaints = async (req, res) => {
  try {
    const { 
      branchId, 
      status, 
      priority, 
      category,
      startDate, 
      endDate,
      limit = 100,
      page = 1 
    } = req.query;

    // Build query based on user role
    const query = {};

    // If manager, only show complaints from their branch
    if (req.user.role === 'manager') {
      query.branchId = req.user.branchId;
    }

    // If superadmin and branchId filter is provided
    if (req.user.role === 'superadmin' && branchId) {
      query.branchId = branchId;
    }

    // Apply other filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // Date range filter
    if (startDate || endDate) {
      query.complaintDate = {};
      if (startDate) query.complaintDate.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.complaintDate.$lte = endDateTime;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = await Complaint.find(query)
      .sort({ complaintDate: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('❌ Get Complaints Error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch complaints.', 
      error: err.message 
    });
  }
};

// =====================
// 🔹 GET STAFF'S OWN COMPLAINTS
// =====================
const getMyComplaints = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { status, limit = 50, page = 1 } = req.query;

    const query = { staffId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = await Complaint.find(query)
      .sort({ complaintDate: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('❌ Get My Complaints Error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch your complaints.', 
      error: err.message 
    });
  }
};

// =====================
// 🔹 GET SINGLE COMPLAINT BY ID
// =====================
const getComplaintById = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId).lean();

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Authorization check
    if (req.user.role === 'staff' && complaint.staffId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (req.user.role === 'manager' && complaint.branchId !== req.user.branchId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.status(200).json({
      success: true,
      complaint
    });
  } catch (err) {
    console.error('❌ Get Complaint By ID Error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch complaint.', 
      error: err.message 
    });
  }
};

// =====================
// 🔹 UPDATE COMPLAINT STATUS (Manager/SuperAdmin)
// =====================
const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, managerResponse } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const validStatuses = ['Pending', 'Under Review', 'Resolved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // If manager, ensure complaint is from their branch
    if (req.user.role === 'manager' && complaint.branchId !== req.user.branchId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Update complaint
    complaint.status = status;
    if (managerResponse) {
      complaint.managerResponse = managerResponse;
      complaint.respondedBy = req.user.id;
      complaint.respondedAt = new Date();
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully.',
      complaint
    });
  } catch (err) {
    console.error('❌ Update Complaint Status Error:', err);
    res.status(500).json({ 
      message: 'Failed to update complaint status.', 
      error: err.message 
    });
  }
};

// =====================
// 🔹 DELETE COMPLAINT (SuperAdmin Only)
// =====================
const deleteComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findByIdAndDelete(complaintId);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully.'
    });
  } catch (err) {
    console.error('❌ Delete Complaint Error:', err);
    res.status(500).json({ 
      message: 'Failed to delete complaint.', 
      error: err.message 
    });
  }
};

// =====================
// 🔹 GET COMPLAINT STATISTICS
// =====================
const getComplaintStatistics = async (req, res) => {
  try {
    const { branchId, startDate, endDate } = req.query;

    const filters = {};

    // If manager, only show stats for their branch
    if (req.user.role === 'manager') {
      filters.branchId = req.user.branchId;
    } else if (branchId) {
      filters.branchId = branchId;
    }

    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await Complaint.getStatistics(filters);

    res.status(200).json({
      success: true,
      statistics: stats
    });
  } catch (err) {
    console.error('❌ Get Complaint Statistics Error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch complaint statistics.', 
      error: err.message 
    });
  }
};

// =====================
// 🔹 GET COMPLAINTS BY CATEGORY (Manager/SuperAdmin)
// =====================
const getComplaintsByCategory = async (req, res) => {
  try {
    const { branchId, startDate, endDate } = req.query;

    const match = {};

    // If manager, only show stats for their branch
    if (req.user.role === 'manager') {
      match.branchId = req.user.branchId;
    } else if (branchId) {
      match.branchId = branchId;
    }

    // Date range filter
    if (startDate || endDate) {
      match.complaintDate = {};
      if (startDate) match.complaintDate.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        match.complaintDate.$lte = endDateTime;
      }
    }

    const categoryStats = await Complaint.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      categoryStats
    });
  } catch (err) {
    console.error('❌ Get Complaints By Category Error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch complaints by category.', 
      error: err.message 
    });
  }
};

module.exports = {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  getComplaintStatistics,
  getComplaintsByCategory
};