const mongoose = require('mongoose');

const noteItemSchema = new mongoose.Schema({
  title: {
    type: String
  },
  fileUrl: {
    type: String,
    required: true
  }
});

const noteSchema = new mongoose.Schema({
  notes: [noteItemSchema],
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
