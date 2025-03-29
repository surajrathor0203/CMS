const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // Duration in months
    required: true
  },
  maxBatches: {
    type: Number,
    required: true
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  accountHolderName: {
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
  qrCode: {
    url: String,
    key: String
  }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
