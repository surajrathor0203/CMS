const Student = require('../models/Student');
const Batch = require('../models/Batch');
const User = require('../models/User'); // Add this import
const bcrypt = require('bcryptjs');  // Add this import
const { generatePassword } = require('../utils/passwordGenerator');
const { sendStudentWelcomeEmail, sendTeacherPaymentNotificationEmail } = require('../utils/emailService');
const { generateUsername } = require('../utils/usernameGenerator');
const s3 = require('../config/s3Config');
const Quiz = require('../models/Quiz');
const Assignment = require('../models/Assignment');

const createStudents = async (students, batchDetails) => {
  const results = [];
  const errors = [];
  const batchSize = 5;

  try {
    // console.log('Received batchDetails:', batchDetails); // Debug log

    if (!batchDetails.batchId || !batchDetails.teacherId) {
      throw new Error('Missing required batchId or teacherId');
    }

    // First, get the batch details and teacher details
    const batch = await Batch.findById(batchDetails.batchId);
    if (!batch) {
      throw new Error(`Batch not found with ID: ${batchDetails.batchId}`);
    }

    const teacher = await User.findById(batchDetails.teacherId);
    if (!teacher) {
      throw new Error(`Teacher not found with ID: ${batchDetails.teacherId}`);
    }

    // Get subject from batch and coaching name from teacher
    const batchSubject = batch.subject;
    const teacherCochingName = teacher.cochingName;

    if (!batchSubject) {
      throw new Error('Batch subject is missing');
    }

    if (!teacherCochingName) {
      throw new Error('Teacher coaching name is missing');
    }

    // Process students in batches
    for (let i = 0; i < students.length; i += batchSize) {
      const currentBatch = students.slice(i, i + batchSize);
      
      const batchPromises = currentBatch.map(async (student) => {
        try {
          if (student.exists) {
            const existingStudent = await Student.findOne({ email: student.email });
            
            if (!existingStudent.teachersInfo.some(
              info => info.batchId.toString() === batch._id.toString() &&
                     info.teacherId.toString() === teacher._id.toString()
            )) {
              existingStudent.teachersInfo.push({
                batchId: batch._id,
                teacherId: teacher._id,
                cochingName: teacherCochingName,
                subject: batchSubject
              });
              
              await existingStudent.save();
              
              sendStudentWelcomeEmail(existingStudent, null, {
                ...batchDetails,
                subject: batchSubject,
                cochingName: teacherCochingName
              }, false).catch(console.error);
              
              return { success: true, student: existingStudent };
            }
            return { success: false, error: `Student ${student.email} is already in this batch` };
          } else {
            const username = await generateUsername(student.name);
            const plainPassword = generatePassword();
            const newStudent = await Student.create({
              ...student,
              username,
              password: plainPassword,
              teachersInfo: [{
                batchId: batch._id,
                teacherId: teacher._id,
                cochingName: teacherCochingName,
                subject: batchSubject
              }]
            });

            sendStudentWelcomeEmail(newStudent, plainPassword, {
              ...batchDetails,
              subject: batchSubject,
              cochingName: teacherCochingName
            }).catch(console.error);
            
            return { success: true, student: newStudent };
          }
        } catch (error) {
          return { 
            success: false, 
            error: `Error processing student ${student.email}: ${error.message}` 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result.student);
        } else {
          errors.push(result.error);
        }
      });
    }

    return {
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0 ? 'Some students were not processed' : 'All students processed successfully'
    };
  } catch (error) {
    console.error('Error in createStudents:', error); // Better error logging
    throw new Error(`Failed to process students: ${error.message}`);
  }
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
        const batch = await Batch.findById(batchId);

        if (!student || !batch) {
            return res.status(404).json({ message: 'Student or batch not found' });
        }

        // Delete from lockedStudents
        batch.lockedStudents = batch.lockedStudents.filter(
            locked => locked.studentId.toString() !== studentId
        );

        // Remove student payments completely
        batch.studentPayments = batch.studentPayments.filter(payment => {
            if (payment.student.toString() === studentId) {
                // Delete payment receipts from S3 before filtering out
                payment.payments.forEach(async (p) => {
                    if (p.s3Key) {
                        try {
                            await s3.deleteObject({
                                Bucket: process.env.AWS_BUCKET_NAME,
                                Key: p.s3Key
                            }).promise();
                        } catch (s3Error) {
                            console.error('Error deleting payment receipt:', s3Error);
                        }
                    }
                });
                return false; // Filter out this payment
            }
            return true; // Keep other payments
        });

        // Delete quiz attempts
        const batchQuizzes = await Quiz.find({ batchId });
        for (const quiz of batchQuizzes) {
            quiz.students = quiz.students.filter(
                attempt => attempt.studentId.toString() !== studentId
            );
            await quiz.save();
        }

        // Delete assignment submissions
        const batchAssignments = await Assignment.find({ batchId });
        for (const assignment of batchAssignments) {
            for (const assignmentItem of assignment.assignments) {
                // Find submissions to delete from S3
                const studentSubmissions = assignmentItem.submissions.filter(
                    sub => sub.studentId.toString() === studentId
                );

                // Delete files from S3
                for (const submission of studentSubmissions) {
                    if (submission.fileName) {
                        try {
                            await s3.deleteObject({
                                Bucket: process.env.AWS_BUCKET_NAME,
                                Key: `submissions/${submission.fileName}`
                            }).promise();
                        } catch (s3Error) {
                            console.error('Error deleting submission file:', s3Error);
                        }
                    }
                }

                // Remove submissions from assignment
                assignmentItem.submissions = assignmentItem.submissions.filter(
                    sub => sub.studentId.toString() !== studentId
                );
            }
            await assignment.save();
        }

        // Save batch changes
        await batch.save();

        // Existing deletion logic with added S3 cleanup
        if (student.teachersInfo.length <= 1) {
            // Delete student's profile picture from S3 if exists
            if (student.profilePicture?.s3Key) {
                try {
                    await s3.deleteObject({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: student.profilePicture.s3Key
                    }).promise();
                } catch (s3Error) {
                    console.error('Error deleting profile picture:', s3Error);
                }
            }

            await Student.findByIdAndDelete(studentId);
            await Batch.findByIdAndUpdate(batchId, {
                $pull: { students: studentId }
            });
            return res.json({ 
                message: 'Student and all associated data deleted successfully',
                type: 'full_delete'
            });
        } else {
            student.teachersInfo = student.teachersInfo.filter(
                info => info.batchId.toString() !== batchId
            );
            await student.save();
            
            await Batch.findByIdAndUpdate(batchId, {
                $pull: { students: studentId }
            });
            
            return res.json({ 
                message: 'Student removed from batch and associated data cleaned up',
                type: 'batch_remove'
            });
        }
    } catch (error) {
        console.error('Error in deleteFromBatch:', error);
        res.status(500).json({ message: 'Error removing student from batch' });
    }
};

// Modify deleteMultipleStudents to include cleanup
const deleteMultipleStudents = async (studentIds, batchId) => {
    try {
        const batch = await Batch.findById(batchId);
        if (!batch) {
            throw new Error('Batch not found');
        }

        // Remove from lockedStudents
        batch.lockedStudents = batch.lockedStudents.filter(
            locked => !studentIds.includes(locked.studentId.toString())
        );

        // Remove student payments completely for all selected students
        batch.studentPayments = batch.studentPayments.filter(payment => {
            if (studentIds.includes(payment.student.toString())) {
                // Delete payment receipts from S3 before filtering out
                payment.payments.forEach(async (p) => {
                    if (p.s3Key) {
                        try {
                            await s3.deleteObject({
                                Bucket: process.env.AWS_BUCKET_NAME,
                                Key: p.s3Key
                            }).promise();
                        } catch (s3Error) {
                            console.error('Error deleting payment receipt:', s3Error);
                        }
                    }
                });
                return false; // Filter out this payment
            }
            return true; // Keep other payments
        });

        // Delete quiz attempts
        const batchQuizzes = await Quiz.find({ batchId });
        for (const quiz of batchQuizzes) {
            quiz.students = quiz.students.filter(
                attempt => !studentIds.includes(attempt.studentId.toString())
            );
            await quiz.save();
        }

        // Delete assignment submissions
        const batchAssignments = await Assignment.find({ batchId });
        for (const assignment of batchAssignments) {
            for (const assignmentItem of assignment.assignments) {
                // Find submissions to delete from S3
                const studentsSubmissions = assignmentItem.submissions.filter(
                    sub => studentIds.includes(sub.studentId.toString())
                );

                // Delete files from S3
                for (const submission of studentsSubmissions) {
                    if (submission.fileName) {
                        try {
                            await s3.deleteObject({
                                Bucket: process.env.AWS_BUCKET_NAME,
                                Key: `submissions/${submission.fileName}`
                            }).promise();
                        } catch (s3Error) {
                            console.error('Error deleting submission file:', s3Error);
                        }
                    }
                }

                // Remove submissions from assignment
                assignmentItem.submissions = assignmentItem.submissions.filter(
                    sub => !studentIds.includes(sub.studentId.toString())
                );
            }
            await assignment.save();
        }

        // Save batch changes
        await batch.save();

        // Delete students or remove batch info with added S3 cleanup
        for (const studentId of studentIds) {
            const student = await Student.findById(studentId);
            if (student) {
                if (student.teachersInfo.length <= 1) {
                    // Delete student's profile picture from S3 if exists
                    if (student.profilePicture?.s3Key) {
                        try {
                            await s3.deleteObject({
                                Bucket: process.env.AWS_BUCKET_NAME,
                                Key: student.profilePicture.s3Key
                            }).promise();
                        } catch (s3Error) {
                            console.error('Error deleting profile picture:', s3Error);
                        }
                    }
                    await Student.findByIdAndDelete(studentId);
                } else {
                    student.teachersInfo = student.teachersInfo.filter(
                        info => info.batchId.toString() !== batchId
                    );
                    await student.save();
                }
            }
        }

        // Remove students from batch
        await Batch.findByIdAndUpdate(batchId, {
            $pull: { students: { $in: studentIds } }
        });

        return true;
    } catch (error) {
        console.error('Error in deleteMultipleStudents:', error);
        throw error;
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

const getStudentProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateStudentProfile = async (req, res) => {
    try {
        const { name, phone, parentPhone, address, removeProfilePicture } = req.body;
        const profilePicture = req.file;
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Update basic info
        student.name = name || student.name;
        student.phone = phone || student.phone;
        student.parentPhone = parentPhone || student.parentPhone;
        student.address = address || student.address;

        // Handle profile picture removal
        if (removeProfilePicture === 'true') {
            if (student.profilePicture?.s3Key) {
                try {
                    await s3.deleteObject({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: student.profilePicture.s3Key
                    }).promise();
                } catch (error) {
                    console.error('Error deleting profile picture:', error);
                }
            }
            student.profilePicture = { url: '', s3Key: '' };
        }
        // Handle profile picture upload
        else if (profilePicture) {
            // Delete old profile picture from S3 if exists
            if (student.profilePicture?.s3Key) {
                try {
                    await s3.deleteObject({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: student.profilePicture.s3Key
                    }).promise();
                } catch (error) {
                    console.error('Error deleting old profile picture:', error);
                }
            }

            // Upload new profile picture to S3
            const fileName = `profiles/${student._id}-${Date.now()}-${profilePicture.originalname}`;
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: fileName,
                Body: profilePicture.buffer,
                ContentType: profilePicture.mimetype,
                ACL: 'public-read'
            };

            try {
                const s3Upload = await s3.upload(params).promise();
                student.profilePicture = {
                    url: s3Upload.Location,
                    s3Key: fileName
                };
            } catch (error) {
                console.error('Error uploading to S3:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading profile picture'
                });
            }
        }

        const updatedStudent = await student.save();

        res.json({
            success: true,
            data: updatedStudent,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateStudentPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, student.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        student.password = newPassword;
        await student.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Example: Add this logic to your payment submission controller after payment is saved
const submitPayment = async (req, res) => {
  try {
    // ...existing payment logic...
    // After payment is saved:
    const batch = await Batch.findById(req.params.batchId).populate('teacher');
    const student = await Student.findById(req.body.studentId);

    if (batch && batch.teacher && student) {
      await sendTeacherPaymentNotificationEmail({
        teacherEmail: batch.teacher.email,
        teacherName: batch.teacher.name,
        studentName: student.name,
        studentEmail: student.email,
        batchName: batch.name,
        amount: req.body.amount,
        installmentNumber: req.body.installmentNumber,
        paymentDate: new Date(),
      });
    }

    // ...existing response...
  } catch (error) {
    // ...existing error handling...
  }
};

// Export all functions together
module.exports = {
    createStudents,
    checkEmail,
    getStudentsByBatch,
    deleteFromBatch,
    deleteMultipleStudents,
    getStudentBatches,
    getStudentProfile,
    updateStudentProfile,
    updateStudentPassword,
    submitPayment
};
