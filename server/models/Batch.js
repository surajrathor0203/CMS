const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  openingDate: {
    type: Date,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for formatted timing
batchSchema.virtual('timing').get(function() {
  return `${this.startTime.toLocaleTimeString()} - ${this.endTime.toLocaleTimeString()}`;
});

// Include virtuals when converting document to JSON
batchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Batch', batchSchema);
