const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['teacher', 'student', 'admin'],
    default: 'teacher'
  },
  cochingName: String, // Changed from subject to cochingName
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  countryCode: {
    type: String,
    required: function() {
      // Only required during initial creation
      return this.isNew;
    },
    trim: true
  },
  address: String,
  profilePicture: {
    url: {
      type: String,
      default: ''
    },
    s3Key: {
      type: String,
      default: ''
    }
  },
  status: {
    type: String,
    enum: ['active', 'locked'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  subscription: {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 3); // Add 3 months
        return date;
      }
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'Free trial', 'pending', 'expired', 'rejected'],
      default: 'Free trial'
    },
    paymentDetails: {
      amount: Number,
      transactionId: String,
      paymentDate: Date,
      receipt: {
        url: String,
        key: String
      }
    },
    newPayment: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan'
      },
      receipt: {
        url: String,
        key: String
      },
      amount: Number,
      transactionId: String,
      paymentDate: Date
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
