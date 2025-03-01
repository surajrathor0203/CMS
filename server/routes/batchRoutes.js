const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const auth = require('../middleware/auth');

// Get all batches for the logged-in teacher
router.get('/', auth, async (req, res) => {
  try {
    const batches = await Batch.find({ teacher: req.user._id })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: batches });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ success: false, message: 'Error fetching batches' });
  }
});

// Create a new batch
router.post('/create', auth, async (req, res) => {
  try {
    const { name, subject, startTime, endTime, openingDate } = req.body;

    // Check if batch with same name exists
    const existingBatch = await Batch.findOne({ name });
    if (existingBatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Batch with this name already exists' 
      });
    }

    const batch = new Batch({
      name,
      subject,
      teacher: req.user._id,
      startTime,
      endTime,
      openingDate
    });

    await batch.save();
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ success: false, message: 'Error creating batch' });
  }
});

// Get a single batch by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      teacher: req.user._id
    }).populate('students');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching batch'
    });
  }
});

// Update a batch
router.put('/:id', auth, async (req, res) => {
  try {
    const batch = await Batch.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!batch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found' 
      });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      batch[key] = updates[key];
    });

    await batch.save();
    res.json({ success: true, data: batch });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ success: false, message: 'Error updating batch' });
  }
});

// Delete a batch
router.delete('/:id', auth, async (req, res) => {
  try {
    const batch = await Batch.findOneAndDelete({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!batch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found' 
      });
    }

    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ success: false, message: 'Error deleting batch' });
  }
});

module.exports = router;
