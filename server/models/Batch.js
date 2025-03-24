const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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
  fees: {
    type: Number,
    required: true
  },
  numberOfInstallments: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  installmentDates: [{
    type: Date,
    required: true
  }],
  payment: {
    upiHolderName: {
      type: String,
      required: true
    },
    upiId: {
      type: String,
      required: true
    },
    upiNumber: {
      type: String,
      required: true
    },
    qrCodeUrl: {
      type: String,
      required: true
    },
    s3Key: {
      type: String,
      required: true
    }
  },
  studentPayments: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    payments: [{
      amount: {
        type: Number,
        required: true
      },
      installmentNumber: {  // Add this field
        type: Number,
        required: true
      },
      receiptUrl: {
        type: String,
        required: true
      },
      s3Key: {
        type: String,
        required: true
      },
      paymentDate: {
        type: Date,
        default: Date.now
      },
      feedback: {
        type: String
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    }],
    totalPaid: {
      type: Number,
      default: 0
    },
    lastPaymentDate: {
      type: Date
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
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
