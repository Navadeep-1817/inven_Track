const User = require('../models/User');
const Branch = require('../models/Branch');

// Get all branches
const getAllBranches = async (req, res) => {
    try {
        const branches = await Branch.find({});
        res.status(200).json(branches);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch branches.', error: err.message });
    }
};

// Create a new branch
const createBranch = async (req, res) => {
    try {
        const { branch_name, branch_id, branch_location } = req.body;
        if (!branch_name || !branch_id || !branch_location) {
            return res.status(400).json({ message: 'Branch name, ID, and location are required.' });
        }
        
        const newBranch = new Branch({ branch_name, branch_id, branch_location });
        await newBranch.save();
        res.status(201).json(newBranch);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create branch.', error: err.message });
    }
};

// Delete a branch and all its associated staff
const deleteBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        
        // Find and delete the branch document
        const branchToDelete = await Branch.findOneAndDelete({ branch_id: branchId });
        if (!branchToDelete) {
            return res.status(404).json({ message: 'Branch not found.' });
        }

        // Delete all users/staff associated with this branch
        await User.deleteMany({ branch_id: branchId });

        res.status(200).json({ message: 'Branch and all associated staff removed successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete branch.', error: err.message });
    }
};

module.exports = {
    getAllBranches,
    createBranch,
    deleteBranch,
};
