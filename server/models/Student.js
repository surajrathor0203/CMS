const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
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
  phone: {
    type: String,
    required: true,
    trim: true
  },
  parentPhone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
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
  teachersInfo: [{
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cochingName: {
      type: String,
      required: [true, 'Coaching name is required'],
      trim: true
    },
    subject: {  // Add this new field
      type: String,
      required: true,
      trim: true
    }
  }],
  role: {
    type: String,
    required: true,
    default: 'student',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add password hashing middleware
studentSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Add indexes for better query performance
studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ 'teachersInfo.teacherId': 1 });
studentSchema.index({ 'teachersInfo.batchId': 1 });
studentSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
