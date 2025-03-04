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

    const results = [];
    const errors = [];

    // Process each student
    for (let student of students) {
      try {
        if (student.exists) {
          // If student exists, just update their teachersInfo
          const existingStudent = await Student.findOne({ email: student.email });
          
          // Check if teacher is already associated with this student in this batch
          const alreadyAssociated = existingStudent.teachersInfo.some(
            info => info.batchId.toString() === student.teachersInfo[0].batchId &&
                   info.teacherId.toString() === student.teachersInfo[0].teacherId
          );

          if (!alreadyAssociated) {
            existingStudent.teachersInfo.push(student.teachersInfo[0]);
            await existingStudent.save();
            results.push(existingStudent);
          } else {
            errors.push(`Student ${student.email} is already in this batch`);
          }
        } else {
          // Create new student
          const newStudent = await Student.create(student);
          results.push(newStudent);
        }
      } catch (error) {
        errors.push(`Error processing student ${student.email}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0 ? 'Some students were not processed' : 'All students processed successfully'
    });
  } catch (error) {
    console.error('Error in create-multiple students:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating students'
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
