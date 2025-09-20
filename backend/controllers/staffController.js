const User = require('../models/User');

// Get all staff for a specific branch, sorted by name
const getStaffByBranchId = async (req, res) => {
    try {
        const { branchId } = req.params;
        if (!branchId) {
            return res.status(400).json({ message: 'Branch ID is required.' });
        }
        // Find users, exclude password, and sort by name
        const staffInBranch = await User.find({ branch_id: branchId })
            .select('-password')
            .sort({ name: 1 });
            
        res.status(200).json(staffInBranch);
    } catch (err) {
        res.status(500).json({ message: 'Server Error: Could not fetch staff.', error: err.message });
    }
};

// Remove a staff member by their _id
const removeStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        if (!staffId) {
            return res.status(400).json({ message: 'Staff ID is required.' });
        }
        const result = await User.findByIdAndDelete(staffId);

        if (!result) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        res.status(200).json({ message: `Staff member '${result.name}' removed successfully.` });
    } catch (err) {
        res.status(500).json({ message: 'Server Error: Could not remove staff member.', error: err.message });
    }
};

// Update a staff member's role
const updateStaffRole = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { role } = req.body;

        if (!staffId || !role) {
            return res.status(400).json({ message: 'Staff ID and role are required.' });
        }

        if (role !== 'Manager' && role !== 'Staff') {
            return res.status(400).json({ message: 'Invalid role provided. Must be "Manager" or "Staff".' });
        }

        const updatedStaff = await User.findByIdAndUpdate(staffId, { role }, { new: true }).select('-password');

        if (!updatedStaff) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        res.status(200).json(updatedStaff);
    } catch (err) {
        res.status(500).json({ message: 'Server Error: Could not update staff role.', error: err.message });
    }
};

module.exports = {
    getStaffByBranchId,
    removeStaff,
    updateStaffRole,
};