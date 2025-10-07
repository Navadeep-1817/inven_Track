// const User = require('../models/User');

// // Get all staff for a specific branch, sorted by name
// const getStaffByBranchId = async (req, res) => {
//     try {
//         const { branchId } = req.params;
//         if (!branchId) {
//             return res.status(400).json({ message: 'Branch ID is required.' });
//         }
//         // Find users, exclude password, and sort by name
//         const staffInBranch = await User.find({ branch_id: branchId })
//             .select('-password')
//             .sort({ name: 1 });
            
//         res.status(200).json(staffInBranch);
//     } catch (err) {
//         res.status(500).json({ message: 'Server Error: Could not fetch staff.', error: err.message });
//     }
// };

// // Remove a staff member by their _id
// const removeStaff = async (req, res) => {
//     try {
//         const { staffId } = req.params;
//         if (!staffId) {
//             return res.status(400).json({ message: 'Staff ID is required.' });
//         }
//         const result = await User.findByIdAndDelete(staffId);

//         if (!result) {
//             return res.status(404).json({ message: 'Staff member not found.' });
//         }

//         res.status(200).json({ message: `Staff member '${result.name}' removed successfully.` });
//     } catch (err) {
//         res.status(500).json({ message: 'Server Error: Could not remove staff member.', error: err.message });
//     }
// };

// // Update a staff member's role
// const updateStaffRole = async (req, res) => {
//     try {
//         const { staffId } = req.params;
//         const { role } = req.body;

//         if (!staffId || !role) {
//             return res.status(400).json({ message: 'Staff ID and role are required.' });
//         }

//         if (role !== 'Manager' && role !== 'Staff') {
//             return res.status(400).json({ message: 'Invalid role provided. Must be "Manager" or "Staff".' });
//         }

//         const updatedStaff = await User.findByIdAndUpdate(staffId, { role }, { new: true }).select('-password');

//         if (!updatedStaff) {
//             return res.status(404).json({ message: 'Staff member not found.' });
//         }

//         res.status(200).json(updatedStaff);
//     } catch (err) {
//         res.status(500).json({ message: 'Server Error: Could not update staff role.', error: err.message });
//     }
// };

// module.exports = {
//     getStaffByBranchId,
//     removeStaff,
//     updateStaffRole,
// };

const User = require('../models/User');
const Attendance = require('../models/Attendance'); // Import the new Attendance model

// Get all staff for a specific branch, sorted by name
const getStaffByBranchId = async (req, res) => {
    try {
        const {
            branchId
        } = req.params;
        if (!branchId) {
            return res.status(400).json({
                message: 'Branch ID is required.'
            });
        }
        // Find users, exclude password, and sort by name
        const staffInBranch = await User.find({
                branch_id: branchId
            })
            .select('-password')
            .sort({
                name: 1
            });

        res.status(200).json(staffInBranch);
    } catch (err) {
        res.status(500).json({
            message: 'Server Error: Could not fetch staff.',
            error: err.message
        });
    }
};

// Remove a staff member by their _id
const removeStaff = async (req, res) => {
    try {
        const {
            staffId
        } = req.params;
        if (!staffId) {
            return res.status(400).json({
                message: 'Staff ID is required.'
            });
        }
        const result = await User.findByIdAndDelete(staffId);

        if (!result) {
            return res.status(404).json({
                message: 'Staff member not found.'
            });
        }

        res.status(200).json({
            message: `Staff member '${result.name}' removed successfully.`
        });
    } catch (err) {
        res.status(500).json({
            message: 'Server Error: Could not remove staff member.',
            error: err.message
        });
    }
};

// Update a staff member's role
const updateStaffRole = async (req, res) => {
    try {
        const {
            staffId
        } = req.params;
        const {
            role
        } = req.body;

        if (!staffId || !role) {
            return res.status(400).json({
                message: 'Staff ID and role are required.'
            });
        }

        if (role !== 'Manager' && role !== 'Staff') {
            return res.status(400).json({
                message: 'Invalid role provided. Must be "Manager" or "Staff".'
            });
        }

        const updatedStaff = await User.findByIdAndUpdate(staffId, {
            role
        }, {
            new: true
        }).select('-password');

        if (!updatedStaff) {
            return res.status(404).json({
                message: 'Staff member not found.'
            });
        }

        res.status(200).json(updatedStaff);
    } catch (err) {
        res.status(500).json({
            message: 'Server Error: Could not update staff role.',
            error: err.message
        });
    }
};

// NEW: Mark attendance for a branch
const markAttendance = async (req, res) => {
    try {
        const {
            branch_id,
            date,
            staff
        } = req.body;

        if (!branch_id || !date || !staff) {
            return res.status(400).json({
                message: 'Branch ID, date, and staff attendance are required.'
            });
        }

        // To prevent duplicate entries for the same day, check for the date part only.
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
            branch_id,
            date: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });

        if (existingAttendance) {
            return res.status(409).json({
                message: 'Attendance for this date has already been marked.'
            });
        }

        const newAttendance = new Attendance({
            branch_id,
            date: startOfDay,
            staff,
        });

        await newAttendance.save();
        res.status(201).json({
            message: 'Attendance marked successfully.'
        });
    } catch (err) {
        res.status(500).json({
            message: 'Server Error: Could not mark attendance.',
            error: err.message
        });
    }
};


module.exports = {
    getStaffByBranchId,
    removeStaff,
    updateStaffRole,
    markAttendance, // Export the new function
};
