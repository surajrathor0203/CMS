const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createAssignment, getAssignments, deleteAssignment, editAssignment, getAssignmentById, submitAssignment, getStudentSubmission } = require('../controllers/assignmentController');
const multer = require('multer');
const upload = multer();
const Assignment = require('../models/Assignment');
const s3 = require('../config/s3Config');  // Add this line

// Add protect middleware to all routes
router.post('/create', protect, upload.single('file'), createAssignment);
router.get('/batch/:batchId', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ batchId: req.params.batchId })
      .populate('createdBy', 'name');
    
    if (!assignment) {
      return res.json({ data: [] }); // Return empty array if no assignments found
    }

    // Add submission status for each assignment
    const assignmentsWithStatus = assignment.assignments.map(item => {
      const hasSubmission = item.submissions?.some(
        sub => sub.studentId.toString() === req.user.id
      );
      
      return {
        ...item.toObject(),
        submitted: hasSubmission
      };
    });

    res.json({ data: assignmentsWithStatus });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
});
router.delete('/:id', protect, deleteAssignment);
router.put('/:id', protect, upload.single('file'), editAssignment);

router.get('/:assignmentId', protect, getAssignmentById);
router.post('/:assignmentId/submit', protect, upload.single('file'), submitAssignment);
router.get('/:assignmentId/submission/:studentId', protect, getStudentSubmission);

router.post('/:assignmentId/grade/:studentId', protect, async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;
    const { grade, feedback } = req.body;

    const assignment = await Assignment.findOne({
      "assignments._id": assignmentId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const assignmentItem = assignment.assignments.id(assignmentId);
    const submission = assignmentItem.submissions.find(
      sub => sub.studentId.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    submission.grade = grade;
    submission.feedback = feedback;

    await assignment.save();

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error grading assignment',
      error: error.message
    });
  }
});

router.delete('/:assignmentId/submission', protect, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    const assignment = await Assignment.findOne({
      "assignments._id": assignmentId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const assignmentItem = assignment.assignments.id(assignmentId);
    
    // Check if assignment is overdue
    if (new Date(assignmentItem.endTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove submission after due date'
      });
    }

    // Find and remove the submission
    const submissionIndex = assignmentItem.submissions.findIndex(
      sub => sub.studentId.toString() === studentId
    );

    if (submissionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Get the submission to delete its file
    const submission = assignmentItem.submissions[submissionIndex];

    // Delete file from S3
    if (submission.fileName) {
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `submissions/${submission.fileName}`
      };
      await s3.deleteObject(deleteParams).promise();
    }

    // Remove the submission
    assignmentItem.submissions.splice(submissionIndex, 1);
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Submission removed successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing submission',
      error: error.message
    });
  }
});

module.exports = router;
