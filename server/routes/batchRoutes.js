const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const auth = require('../middleware/auth');

// Get all batches for a teacher
router.get('/', auth, async (req, res) => {
  try {
    const teacherId = req.query.teacherId; // Get teacherId from query params

    const batches = await Batch.find({ teacher: teacherId })
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
    const { name, subject, startTime, endTime, openingDate, teacher } = req.body;

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
      teacher, // Use the teacher ID from request body
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
    const teacherId = req.query.teacherId;
    const batch = await Batch.findOne({
      _id: req.params.id,
      teacher: teacherId
    })
    .populate('students')
    .populate('teacher', 'name email');  // Also populate teacher details if needed

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

// Get batch details for a student
router.get('/student/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId)
      .populate('teacher', 'name email')
      .select('name subject openingDate startTime endTime teacher');
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a batch
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBatch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found' 
      });
    }

    res.json({
      success: true,
      data: updatedBatch,
      message: 'Batch updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Delete a batch
router.delete('/:id', auth, async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    const batch = await Batch.findOneAndDelete({ 
      _id: req.params.id, 
      teacher: teacherId 
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
