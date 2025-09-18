const mongoose = require('mongoose');

const BranchSchema = new mongoose.Schema({
    branch_id: {
        type: String,
        required: true,
        unique: true,
    },
    branch_name: {
        type: String,
        required: true,
    },
    branch_location: {
        type: String,
        required: true,
        unique: true,
    },
});

module.exports = mongoose.model('Branch', BranchSchema);