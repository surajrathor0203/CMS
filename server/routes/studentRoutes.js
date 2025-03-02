const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const { checkEmail, getStudentsByBatch, deleteFromBatch } = require('../controllers/studentController');
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

router.post('/check-email', async (req, res) => {
    try {
        const { email, teacherId } = req.body;
        const student = await Student.findOne({ email });
        
        if (student) {
            // Check if student is already associated with this teacher
            const isAssociated = student.teachersInfo.some(info => 
                info.teacherId.toString() === teacherId
            );

            return res.json({
                exists: true,
                isAssociated,
                data: {
                    name: student.name,
                    phone: student.phone,
                    parentPhone: student.parentPhone,
                    address: student.address
                }
            });
        }
        
        return res.json({ exists: false });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/update-teacher-info/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { teacherInfo } = req.body;

    if (!teacherInfo || !teacherInfo.batchId || !teacherInfo.teacherId || !teacherInfo.subject) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher info provided'
      });
    }

    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if this teacher is already associated with this student in this batch
    const existingTeacherInfo = student.teachersInfo.find(
      info => info.teacherId.toString() === teacherInfo.teacherId &&
              info.batchId.toString() === teacherInfo.batchId
    );

    if (existingTeacherInfo) {
      return res.status(400).json({
        success: false,
        message: 'Student is already associated with this teacher in this batch'
      });
    }

    // Add new teacher info
    student.teachersInfo.push(teacherInfo);
    await student.save();

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/:studentId/batch/:batchId', deleteFromBatch);

router.get('/check-email/:email', protect, checkEmail);
router.get('/batch/:batchId', protect, getStudentsByBatch);

module.exports = router;
