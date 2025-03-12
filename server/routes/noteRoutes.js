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

    // Find existing note document for this batch or create new one
    let note = await Note.findOne({ batchId });
    
    if (!note) {
      note = new Note({
        notes: [],
        batchId,
        uploadedBy: req.user._id
      });
    }

    // Add new note item to the notes array
    note.notes.push({
      title: file.originalname,
      fileUrl: s3Upload.Location
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
    const note = await Note.findOne({ batchId: req.params.batchId })
      .populate('uploadedBy', 'name');
    
    res.json({ data: note ? note.notes : [] });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Error fetching notes' });
  }
});

module.exports = router;
