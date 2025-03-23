const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  authorName: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  authorTags: [String],
  coverImageUrl: String,
  fileUrl: String,
  teacherName: {
    type: String,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  s3Keys: {
    coverImage: String,
    pdf: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Library', librarySchema);
