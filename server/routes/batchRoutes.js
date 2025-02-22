const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const batchController = require('../controllers/batchController');
const Batch = require('../models/Batch');
const auth = require('../middleware/auth');
const { validateBatch } = require('../middleware/validateBatch');

// Get all batches
router.get('/', auth, async (req, res) => {
  try {
    const batches = await Batch.find({ teacher: req.user._id });
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create batch route
router.post('/create', protect, batchController.createBatch);

// Update batch route
router.put('/:id', protect, validateBatch, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, openingDate } = req.body;

    // Check if batch exists
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found' 
      });
    }

    // Check if another batch exists with the same name (excluding current batch)
    const existingBatch = await Batch.findOne({ 
      name, 
      _id: { $ne: id } 
    });
    
    if (existingBatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Batch name already exists' 
      });
    }

    // Update batch
    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      { name, startTime, endTime, openingDate },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: updatedBatch
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Delete batch route
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if batch exists
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found' 
      });
    }

    // Check if user owns the batch
    if (batch.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this batch'
      });
    }

    // Delete the batch
    await Batch.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Batch deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
