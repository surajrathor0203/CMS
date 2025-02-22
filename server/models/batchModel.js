const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    batchName: {
        type: String,
        required: [true, 'Batch name is required'],
        trim: true
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Batch', batchSchema);
