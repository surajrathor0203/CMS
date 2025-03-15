const mongoose = require('mongoose');

const assignmentItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String
    },
    fileName: {
        type: String
    },
    endTime: {
        type: Date,
        required: true
    }
});

const assignmentSchema = new mongoose.Schema({
    assignments: [assignmentItemSchema],
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
