const Student = require('../models/Student');
const Batch = require('../models/Batch');
const { generatePassword } = require('../utils/passwordGenerator');
const { sendStudentWelcomeEmail } = require('../utils/emailService');
const { generateUsername } = require('../utils/usernameGenerator');

const createStudents = async (students, batchDetails) => {
  const results = [];
  const errors = [];

  for (let student of students) {
    try {
      if (student.exists) {
        // Handle existing student
        const existingStudent = await Student.findOne({ email: student.email });
        
        if (!existingStudent.teachersInfo.some(
          info => info.batchId.toString() === student.teachersInfo[0].batchId &&
                 info.teacherId.toString() === student.teachersInfo[0].teacherId
        )) {
          existingStudent.teachersInfo.push({
            ...student.teachersInfo[0],
            batchName: batchDetails.name
          });
          await existingStudent.save();
          
          // Send email reminder
          await sendStudentWelcomeEmail(existingStudent, null, batchDetails);
          results.push(existingStudent);
        } else {
          errors.push(`Student ${student.email} is already in this batch`);
        }
      } else {
        // Generate username from name for new students
        const username = await generateUsername(student.name);
        
        // Create new student with generated username
        const plainPassword = generatePassword();
        const newStudent = await Student.create({
          ...student,
          username,
          password: plainPassword,
          teachersInfo: [{
            ...student.teachersInfo[0],
            batchName: batchDetails.name
          }]
        });

        // Send welcome email with credentials
        await sendStudentWelcomeEmail(newStudent, plainPassword, batchDetails);
        results.push(newStudent);
      }
    } catch (error) {
      errors.push(`Error processing student ${student.email}: ${error.message}`);
    }
  }

  return {
    success: true,
    data: results,
    errors: errors.length > 0 ? errors : undefined,
    message: errors.length > 0 ? 'Some students were not processed' : 'All students processed successfully'
  };
};

const checkEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const { teacherId } = req.query;
    
    const existingStudent = await Student.findOne({ 
      email,
      ...(teacherId && { teacherId }) // Include teacherId in query if provided
    });
    
    res.json({
      success: true,
      exists: !!existingStudent,
      message: existingStudent ? 'Email already exists' : 'Email is available'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking email'
    });
  }
};

const getStudentsByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const students = await Student.find({
      'teachersInfo.batchId': batchId
    });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
};

const deleteFromBatch = async (req, res) => {
    try {
        const { studentId, batchId } = req.params;
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check how many teachersInfo objects exist
        if (student.teachersInfo.length <= 1) {
            // If only one batch or less, delete the entire student
            await Student.findByIdAndDelete(studentId);
            // Also remove from the batch
            await Batch.findByIdAndUpdate(batchId, {
                $pull: { students: studentId }
            });
            return res.json({ 
                message: 'Student deleted completely',
                type: 'full_delete'
            });
        } else {
            // Remove only the specific batch info
            student.teachersInfo = student.teachersInfo.filter(
                info => info.batchId.toString() !== batchId
            );
            await student.save();
            
            // Also remove from the batch
            await Batch.findByIdAndUpdate(batchId, {
                $pull: { students: studentId }
            });
            
            return res.json({ 
                message: 'Student removed from batch only',
                type: 'batch_remove'
            });
        }
    } catch (error) {
        console.error('Error in deleteFromBatch:', error);
        res.status(500).json({ message: 'Error removing student from batch' });
    }
};

const getStudentBatches = async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const batchIds = student.teachersInfo.map(info => info.batchId);
        // Use populate to get teacher information
        const batches = await Batch.find({ '_id': { $in: batchIds } })
            .populate('teacher', 'name'); // Add this line to populate teacher info

        // Map the batches to include teacher name
        const batchesWithTeacher = batches.map(batch => ({
            ...batch.toObject(),
            teacherName: batch.teacher?.name || 'N/A'
        }));

        res.json({
            success: true,
            data: batchesWithTeacher
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Export all functions together
module.exports = {
    createStudents,
    checkEmail,
    getStudentsByBatch,
    deleteFromBatch,
    getStudentBatches
};
