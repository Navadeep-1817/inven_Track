const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    branch_id: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    staff: [{
        staff_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InvenTrack',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['Present', 'Absent'],
            required: true,
        },
    }, ],
});

// Ensure that attendance can only be marked once per day for each branch
attendanceSchema.index({
    branch_id: 1,
    date: 1
}, {
    unique: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);
