const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createAssignment, getAssignments, deleteAssignment, editAssignment } = require('../controllers/assignmentController');
const multer = require('multer');
const upload = multer();
const Assignment = require('../models/Assignment'); // Add this line

// Add protect middleware to all routes
router.post('/create', protect, upload.single('file'), createAssignment);
router.get('/batch/:batchId', async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ batchId: req.params.batchId })
      .populate('createdBy', 'name');
    
    if (!assignment) {
      return res.json({ data: [] }); // Return empty array if no assignments found
    }

    res.json({ data: assignment.assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
});
router.delete('/:id', protect, deleteAssignment);
router.put('/:id', protect, upload.single('file'), editAssignment);

module.exports = router;
