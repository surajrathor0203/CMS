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

    // S3 upload parameters with ACL
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make file publicly readable
      ContentDisposition: 'inline' // Allow browser to display content
    };

    // Upload to S3
    const s3Upload = await s3.upload(params).promise();

    let note = await Note.findOne({ batchId });
    
    if (!note) {
      note = new Note({
        notes: [],
        batchId,
        uploadedBy: req.user._id
      });
    }

    // Add new note item to the notes array with s3Key
    note.notes.push({
      title: file.originalname,
      fileUrl: s3Upload.Location, // Use the S3 URL directly
      s3Key: fileName // Store the S3 key
    });

    await note.save();

    res.status(201).json({
      message: 'Note uploaded successfully',
      note
    });

  } catch (error) {
    console.error('Error uploading note:', error);
    res.status(500).json({ message: 'Error uploading note', error: error.message });
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

// Delete note
router.delete('/:noteId', auth, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { batchId } = req.query;

    const note = await Note.findOne({ batchId });
    
    if (!note) {
      return res.status(404).json({ message: 'Notes not found' });
    }

    // Find the note to be deleted
    const noteToDelete = note.notes.find(n => n._id.toString() === noteId);
    
    if (!noteToDelete) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (!noteToDelete.s3Key) {
      return res.status(400).json({ message: 'S3 key not found for this note' });
    }

    // Delete from S3
    try {
      await s3.deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: noteToDelete.s3Key
      }).promise();
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Remove from database
    note.notes = note.notes.filter(n => n._id.toString() !== noteId);
    await note.save();

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Error deleting note' });
  }
});

// Update note
router.put('/:noteId', auth, upload.single('file'), async (req, res) => {
  try {
    const { noteId } = req.params;
    const { batchId } = req.query;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const note = await Note.findOne({ batchId });
    
    if (!note) {
      return res.status(404).json({ message: 'Notes not found' });
    }

    // Find the note to be updated
    const noteToUpdate = note.notes.find(n => n._id.toString() === noteId);
    
    if (!noteToUpdate) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Delete old file from S3
    try {
      await s3.deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: noteToUpdate.s3Key
      }).promise();
    } catch (s3Error) {
      console.error('Error deleting old file from S3:', s3Error);
    }

    // Upload new file to S3
    const fileName = `notes/${Date.now()}-${file.originalname}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
      ContentDisposition: 'inline'
    };

    const s3Upload = await s3.upload(params).promise();

    // Update note in database
    noteToUpdate.title = file.originalname;
    noteToUpdate.fileUrl = s3Upload.Location;
    noteToUpdate.s3Key = fileName;

    await note.save();

    res.json({ 
      message: 'Note updated successfully',
      note: noteToUpdate
    });

  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Error updating note' });
  }
});

module.exports = router;
