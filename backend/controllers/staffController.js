const User = require('../models/User');


// Get all staff for a specific branch
const getStaffByBranchId = async (req, res) => {
    try {
        const { branchId } = req.params;
        // Find users where branch_id matches the request parameter
        const staffInBranch = await User.find({ branch_id: branchId }).select('-password'); // Exclude password
        res.status(200).json(staffInBranch);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch staff.', error: err.message });
    }
};

// Remove a staff member by their _id
const removeStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const result = await User.findByIdAndDelete(staffId);

        if (!result) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        res.status(200).json({ message: 'Staff member removed successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove staff member.', error: err.message });
    }
};

// Update a staff member's role
const updateStaffRole = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { role } = req.body;

        if (role !== 'Manager' && role !== 'Staff') {
            return res.status(400).json({ message: 'Invalid role provided.' });
        }

        // Use findOneAndUpdate to find and update the document in one go
        const updatedStaff = await User.findByIdAndUpdate(staffId, { role }, { new: true }).select('-password');

        if (!updatedStaff) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        res.status(200).json(updatedStaff);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update staff role.', error: err.message });
    }
};

module.exports = {
    getStaffByBranchId,
    removeStaff,
    updateStaffRole,
};