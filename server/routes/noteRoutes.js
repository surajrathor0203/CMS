const express = require('express');
const router = express.Router();
const multer = require('multer');
const s3 = require('../config/s3Config');
const Note = require('../models/Note');
const auth = require('../middleware/auth');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // limit file size to 5MB
  }
});

// Upload note
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { batchId } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create unique file name
    const fileName = `notes/${Date.now()}-${file.originalname}`;

    // S3 upload parameters
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    // Upload to S3
    const s3Upload = await s3.upload(params).promise();

    // Create note in database
    const note = new Note({
      title: file.originalname,
      fileUrl: s3Upload.Location,
      batchId: batchId,
      uploadedBy: req.user._id
    });

    await note.save();

    res.status(201).json({
      message: 'Note uploaded successfully',
      note
    });

  } catch (error) {
    console.error('Error uploading note:', error);
    res.status(500).json({ message: 'Error uploading note' });
  }
});

// Get notes by batch
router.get('/batch/:batchId', auth, async (req, res) => {
  try {
    const notes = await Note.find({ batchId: req.params.batchId })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name');
    
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Error fetching notes' });
  }
});

module.exports = router;
