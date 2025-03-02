const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { checkEmail, getStudentsByBatch } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-multiple', async (req, res) => {
  try {
    const { students } = req.body;
    
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request format: students array is required'
      });
    }

    // Validate each student object
    for (let student of students) {
      if (!student.teachersInfo || !Array.isArray(student.teachersInfo) || student.teachersInfo.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Each student must have teachersInfo array'
        });
      }

      // Validate required fields
      const requiredFields = ['name', 'email', 'phone', 'parentPhone', 'address'];
      const missingFields = requiredFields.filter(field => !student[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Validate teachersInfo fields
      for (let teacherInfo of student.teachersInfo) {
        if (!teacherInfo.batchId || !teacherInfo.teacherId || !teacherInfo.subject) {
          return res.status(400).json({
            success: false,
            message: 'Each teacherInfo must have batchId, teacherId, and subject'
          });
        }
      }
    }

    const result = await Student.create(students);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Students created successfully'
    });
  } catch (error) {
    console.error('Error in create-multiple students:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating students',
      error: error.message
    });
  }
});

router.get('/check-email/:email', protect, checkEmail);
router.get('/batch/:batchId', protect, getStudentsByBatch);

module.exports = router;
