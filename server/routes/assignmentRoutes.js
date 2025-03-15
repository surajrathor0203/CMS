const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createAssignment, getAssignments, deleteAssignment, editAssignment } = require('../controllers/assignmentController');
const multer = require('multer');
const upload = multer();

// Add protect middleware to all routes
router.post('/create', protect, upload.single('file'), createAssignment);
router.get('/batch/:batchId', protect, getAssignments);
router.delete('/:id', protect, deleteAssignment);
router.put('/:id', protect, upload.single('file'), editAssignment);

module.exports = router;
