const User = require('../models/User');
const Batch = require('../models/Batch');
const Note = require('../models/Note');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Message = require('../models/Message');
const Student = require('../models/Student'); // Add this import
const s3 = require('../config/s3Config');

exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: teachers
        });
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching teachers'
        });
    }
};

exports.toggleTeacherStatus = async (req, res) => {
    try {
        const teacher = await User.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        // Add status field if it doesn't exist
        teacher.status = teacher.status === 'locked' ? 'active' : 'locked';
        await teacher.save();

        res.json({
            success: true,
            data: teacher,
            message: `Teacher ${teacher.status === 'locked' ? 'locked' : 'unlocked'} successfully`
        });
    } catch (error) {
        console.error('Error toggling teacher status:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling teacher status'
        });
    }
};

exports.updateTeacher = async (req, res) => {
    try {
        const { status, subscriptionEndDate } = req.body;
        const teacherId = req.params.teacherId;

        const teacher = await User.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        // Update status if provided
        if (status) {
            teacher.status = status;
        }

        // Update subscription end date if provided
        if (subscriptionEndDate) {
            teacher.subscription.endDate = new Date(subscriptionEndDate);
        }

        await teacher.save();

        res.json({
            success: true,
            message: 'Teacher updated successfully',
            data: teacher
        });

    } catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating teacher'
        });
    }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    
    // Get teacher details
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Delete teacher's profile picture
    if (teacher.profilePicture?.s3Key) {
      try {
        await s3.deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: teacher.profilePicture.s3Key
        }).promise();
      } catch (error) {
        console.error('Error deleting profile picture:', error);
      }
    }

    // Delete ALL subscription payment receipts for the teacher
    // Main subscription payment receipt
    if (teacher.subscription?.paymentDetails?.receipt?.key) {
      try {
        await s3.deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: teacher.subscription.paymentDetails.receipt.key
        }).promise();
      } catch (error) {
        console.error('Error deleting subscription receipt:', error);
      }
    }

    // New/pending subscription payment receipt
    if (teacher.subscription?.newPayment?.receipt?.key) {
      try {
        await s3.deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: teacher.subscription.newPayment.receipt.key
        }).promise();
      } catch (error) {
        console.error('Error deleting pending subscription receipt:', error);
      }
    }

    // Get all batches
    const batches = await Batch.find({ teacher: teacherId });
    
    // Keep track of processed students to avoid duplicates
    const processedStudentIds = new Set();

    // Process each batch
    for (const batch of batches) {
      try {
        // Get all students in this batch
        const students = await Student.find({ 'teachersInfo.batchId': batch._id });
        
        // Process each student
        for (const student of students) {
          if (!processedStudentIds.has(student._id.toString())) {
            processedStudentIds.add(student._id.toString());

            // Delete student's profile picture
            if (student.profilePicture?.s3Key) {
              try {
                await s3.deleteObject({
                  Bucket: process.env.AWS_BUCKET_NAME,
                  Key: student.profilePicture.s3Key
                }).promise();
              } catch (error) {
                console.error(`Error deleting student profile picture:`, error);
              }
            }

            // Delete ALL fee payment receipts for each student
            const teacherInfo = student.teachersInfo.find(
              info => info.batchId.toString() === batch._id.toString()
            );

            if (teacherInfo?.payments) {
              for (const payment of teacherInfo.payments) {
                if (payment.receipt?.key) {
                  try {
                    await s3.deleteObject({
                      Bucket: process.env.AWS_BUCKET_NAME,
                      Key: payment.receipt.key
                    }).promise();
                  } catch (error) {
                    console.error('Error deleting payment receipt:', error);
                  }
                }
              }
            }

            // Delete student's assignment submissions
            const assignments = await Assignment.find({ batchId: batch._id });
            for (const assignment of assignments) {
              // Delete all submissions for this assignment
              for (const submission of (assignment.submissions || [])) {
                if (submission?.fileKey) {
                  try {
                    await s3.deleteObject({
                      Bucket: process.env.AWS_BUCKET_NAME,
                      Key: submission.fileKey
                    }).promise();
                  } catch (error) {
                    console.error('Error deleting submission file:', error);
                  }
                }
              }
            }

            // If student has no more batches, delete the student
            if (student.teachersInfo.length === 1) {
              await Student.deleteOne({ _id: student._id });
            } else {
              student.teachersInfo = student.teachersInfo.filter(
                info => info.batchId.toString() !== batch._id.toString()
              );
              await student.save();
            }
          }
        }

        // Delete batch QR code
        if (batch.qrCode?.s3Key) {
          try {
            await s3.deleteObject({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: batch.qrCode.s3Key
            }).promise();
          } catch (error) {
            console.error('Error deleting QR code:', error);
          }
        }

        // Delete all notes files
        const notes = await Note.find({ batchId: batch._id });
        for (const note of notes) {
          if (note.s3Key) {
            try {
              await s3.deleteObject({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: note.s3Key
              }).promise();
            } catch (error) {
              console.error('Error deleting note file:', error);
            }
          }
        }

        // Delete batch data from database
        await Promise.all([
          Note.deleteMany({ batchId: batch._id }),
          Assignment.deleteMany({ batchId: batch._id }),
          Quiz.deleteMany({ batchId: batch._id }),
          Message.deleteMany({ batchId: batch._id })
        ]);

        // Delete the batch itself
        await Batch.deleteOne({ _id: batch._id });
      } catch (error) {
        console.error(`Error processing batch ${batch._id}:`, error);
      }
    }

    // Finally delete the teacher
    await User.deleteOne({ _id: teacherId });

    res.json({
      success: true,
      message: 'Teacher and all related data deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting teacher'
    });
  }
};
