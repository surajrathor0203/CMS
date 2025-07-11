const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Add this import
const Batch = require('../models/Batch');
const auth = require('../middleware/auth');
const { protect } = require('../middleware/authMiddleware'); // Add this import
const s3 = require('../config/s3Config');
const multer = require('multer');
const upload = multer();
const Quiz = require('../models/Quiz');
const Assignment = require('../models/Assignment');
const Note = require('../models/Note');
const Student = require('../models/Student');

// Get all batches for a teacher
router.get('/', auth, async (req, res) => {
  try {
    const teacherId = req.query.teacherId; // Get teacherId from query params

    const batches = await Batch.find({ teacher: teacherId })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: batches });

  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ success: false, message: 'Error fetching batches' });
  }
});

// Create a new batch
router.post('/create', auth, upload.single('qrCode'), async (req, res) => {
  try {
    const { 
      name, 
      subject, 
      startTime, 
      endTime, 
      openingDate, 
      teacher,
      fees,
      numberOfInstallments,
      installmentDates,
      upiHolderName,
      upiId,
      upiNumber
    } = req.body;

    // Validate required file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'QR code image is required'
      });
    }

    // Upload QR code to S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `qr-codes/${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };

    const uploadResult = await s3.upload(params).promise();
    const qrCodeUrl = uploadResult.Location;
    const s3Key = uploadResult.Key;

    // Create new batch
    const batch = new Batch({
      name,
      subject,
      teacher,
      startTime,
      endTime,
      openingDate,
      fees: parseFloat(fees),
      numberOfInstallments: parseInt(numberOfInstallments),
      installmentDates: JSON.parse(installmentDates),
      payment: {
        upiHolderName,
        upiId,
        upiNumber,
        qrCodeUrl,
        s3Key
      }
    });

    await batch.save();
    res.status(201).json({ success: true, data: batch });

  } catch (error) {
    // Delete uploaded file if batch creation fails
    if (error.code === 11000) {
      // Remove this specific error handling for duplicate name
      console.error('Error creating batch:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Error creating batch'
      });
    } else {
      console.error('Error creating batch:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Error creating batch'
      });
    }
  }
});

// Get a single batch by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    const batch = await Batch.findOne({
      _id: req.params.id,
      teacher: teacherId
    })
    .populate('students')
    .populate('teacher', 'name email');  // Also populate teacher details if needed

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching batch'
    });
  }
});

// Get batch details for a student
router.get('/student/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId)
      .populate('teacher', 'name email')
      .select('name subject openingDate startTime endTime teacher fees numberOfInstallments installmentDates payment lockedStudents'); // Added lockedStudents
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a batch
router.put('/:id', upload.single('qrCode'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Parse installment dates if they come as string
    if (updateData.installmentDates) {
      updateData.installmentDates = typeof updateData.installmentDates === 'string' 
        ? JSON.parse(updateData.installmentDates) 
        : updateData.installmentDates;
    }

    // Handle payment info
    if (req.file) {
      // First, get the existing batch to delete old file if exists
      const existingBatch = await Batch.findById(id);
      if (existingBatch?.payment?.s3Key) {
        // Delete old file from S3
        try {
          await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: existingBatch.payment.s3Key
          }).promise();
        } catch (deleteError) {
          console.error('Error deleting old QR code:', deleteError);
        }
      }

      // Upload new file
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `qr-codes/${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read'
      };

      const uploadResult = await s3.upload(params).promise();
      updateData.payment = {
        upiHolderName: req.body.upiHolderName,
        upiId: req.body.upiId,
        upiNumber: req.body.upiNumber,
        qrCodeUrl: uploadResult.Location,
        s3Key: uploadResult.Key
      };
    } else if (req.body.upiHolderName || req.body.upiId || req.body.upiNumber) {
      // If no new QR code but payment details are updated
      const existingBatch = await Batch.findById(id);
      updateData.payment = {
        upiHolderName: req.body.upiHolderName,
        upiId: req.body.upiId,
        upiNumber: req.body.upiNumber,
        qrCodeUrl: existingBatch.payment.qrCodeUrl,
        s3Key: existingBatch.payment.s3Key
      };
    }
    
    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBatch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found' 
      });
    }

    res.json({
      success: true,
      data: updatedBatch,
      message: 'Batch updated successfully'
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Delete a batch
router.delete('/:id', auth, async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    const batch = await Batch.findOne({ 
      _id: req.params.id, 
      teacher: teacherId 
    });

    if (!batch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found' 
      });
    }

    // 1. Delete QR code and payment receipts from S3
    if (batch.payment?.s3Key) {
      try {
        await s3.deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: batch.payment.s3Key
        }).promise();
      } catch (deleteError) {
        console.error('Error deleting QR code from S3:', deleteError);
      }
    }

    for (const studentPayment of batch.studentPayments) {
      for (const payment of studentPayment.payments) {
        if (payment.s3Key) {
          try {
            await s3.deleteObject({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: payment.s3Key
            }).promise();
          } catch (error) {
            console.error('Error deleting payment receipt:', error);
          }
        }
      }
    }

    // 2. Delete all assignments and their files
    const assignments = await Assignment.find({ batchId: batch._id });
    for (const assignment of assignments) {
      for (const assignmentItem of assignment.assignments) {
        // Delete main assignment file if exists
        if (assignmentItem.fileName) {
          try {
            await s3.deleteObject({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: `assignments/${assignmentItem.fileName}`
            }).promise();
          } catch (error) {
            console.error('Error deleting assignment file:', error);
          }
        }

        // Delete submission files
        if (assignmentItem.submissions) {
          for (const submission of assignmentItem.submissions) {
            if (submission.fileName) {
              try {
                await s3.deleteObject({
                  Bucket: process.env.AWS_BUCKET_NAME,
                  Key: `submissions/${submission.fileName}`
                }).promise();
              } catch (error) {
                console.error('Error deleting submission file:', error);
              }
            }
          }
        }
      }
      await Assignment.findByIdAndDelete(assignment._id);
    }

    // 3. Delete all notes and their files
    const notes = await Note.find({ batchId: batch._id });
    for (const note of notes) {
      for (const noteItem of note.notes) {
        if (noteItem.s3Key) {
          try {
            await s3.deleteObject({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: noteItem.s3Key
            }).promise();
          } catch (error) {
            console.error('Error deleting note file:', error);
          }
        }
      }
      await Note.findByIdAndDelete(note._id);
    }

    // 4. Delete all quizzes
    await Quiz.deleteMany({ batchId: batch._id });

    // 5. Remove batch reference from all students
    const students = await Student.find({ 'teachersInfo.batchId': batch._id });
    for (const student of students) {
      if (student.teachersInfo.length <= 1) {
        // If this is the student's only batch, delete the student
        if (student.profilePicture?.s3Key) {
          try {
            await s3.deleteObject({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: student.profilePicture.s3Key
            }).promise();
          } catch (error) {
            console.error('Error deleting student profile picture:', error);
          }
        }
        await Student.findByIdAndDelete(student._id);
      } else {
        // Remove only this batch from student's teachersInfo
        student.teachersInfo = student.teachersInfo.filter(
          info => info.batchId.toString() !== batch._id.toString()
        );
        await student.save();
      }
    }

    // 6. Finally delete the batch
    await Batch.findByIdAndDelete(batch._id);

    res.json({ 
      success: true, 
      message: 'Batch and all associated data deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting batch and associated data' 
    });
  }
});

// Remove auth middleware from payment routes
router.post('/:batchId/payment', upload.single('receipt'), async (req, res) => {
  try {
    const { batchId } = req.params;
    const { amount, feedback, studentId, installmentNumber } = req.body;  // Add installmentNumber

    // Validate the file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment receipt is required'
      });
    }

    // Upload receipt to S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `payment-receipts/${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };

    const uploadResult = await s3.upload(params).promise();

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    let studentPaymentIndex = batch.studentPayments.findIndex(
      sp => sp.student.toString() === studentId
    );

    if (studentPaymentIndex === -1) {
      batch.studentPayments.push({
        student: studentId,
        payments: [],
        totalPaid: 0
      });
      studentPaymentIndex = batch.studentPayments.length - 1;
    }

    // Add new payment with installmentNumber
    const payment = {
      amount: parseFloat(amount),
      installmentNumber: parseInt(installmentNumber), // Add this line
      receiptUrl: uploadResult.Location,
      s3Key: uploadResult.Key,
      feedback,
      paymentDate: new Date(),
      status: 'pending' // Default status is pending
    };

    batch.studentPayments[studentPaymentIndex].payments.push(payment);
    
    // Calculate totalPaid only from approved payments
    batch.studentPayments[studentPaymentIndex].totalPaid = batch.studentPayments[studentPaymentIndex].payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);

    batch.studentPayments[studentPaymentIndex].lastPaymentDate = new Date();

    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Payment submitted successfully',
      data: payment
    });

  } catch (error) {
    console.error('Error submitting payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting payment'
    });
  }
});

// Remove auth middleware from get payments route
router.get('/:batchId/payments', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { studentId } = req.query;  // Get studentId from query params

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const studentPayment = batch.studentPayments.find(
      sp => sp.student.toString() === studentId
    );

    res.json({
      success: true,
      data: studentPayment || { payments: [], totalPaid: 0 }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching payments'
    });
  }
});

// Get pending payments for a batch
router.get('/:batchId/payments/pending', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId)
      .populate({
        path: 'studentPayments.student',
        select: 'name email',
        model: 'Student' // Add this line to specify the model
      });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Filter pending payments with null check for student
    const pendingPayments = batch.studentPayments.reduce((acc, sp) => {
      // Skip if student is null or payments array is empty
      if (!sp.student || !sp.payments) return acc;

      const pendingFromStudent = sp.payments
        .filter(p => p.status === 'pending')
        .map(p => ({
          _id: p._id,
          paymentId: p._id,
          studentId: sp.student._id,
          studentName: sp.student.name || 'Unknown Student',
          amount: p.amount,
          installmentNumber: p.installmentNumber,
          paymentDate: p.paymentDate,
          receiptUrl: p.receiptUrl
        }));
      return [...acc, ...pendingFromStudent];
    }, []);

    res.json({
      success: true,
      data: pendingPayments
    });
  } catch (error) {
    console.error('Error in pending payments route:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching pending payments'
    });
  }
});

// Verify payment
router.put('/:batchId/payments/:paymentId/verify', async (req, res) => {
  try {
    const { batchId, paymentId } = req.params;
    const { status, studentId } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Find the student payment record
    const studentPaymentIndex = batch.studentPayments.findIndex(
      sp => sp.student.toString() === studentId
    );

    if (studentPaymentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Student payment record not found'
      });
    }

    // Find the specific payment
    const payment = batch.studentPayments[studentPaymentIndex].payments.find(
      p => p._id.toString() === paymentId
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const oldStatus = payment.status;
    payment.status = status;

    // Recalculate totalPaid based on approved payments only
    batch.studentPayments[studentPaymentIndex].totalPaid = batch.studentPayments[studentPaymentIndex].payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);

    await batch.save();

    res.json({
      success: true,
      message: `Payment ${status} successfully`
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:batchId/students/:studentId/toggle-lock', auth, async (req, res) => {
  try {
    const { batchId, studentId } = req.params;
    const batch = await Batch.findById(batchId);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const studentLockIndex = batch.lockedStudents.findIndex(
      ls => ls.studentId.toString() === studentId
    );

    if (studentLockIndex === -1) {
      // Lock student
      batch.lockedStudents.push({ studentId });
    } else {
      // Unlock student
      batch.lockedStudents.splice(studentLockIndex, 1);
    }

    await batch.save();

    res.json({
      success: true,
      message: `Student ${studentLockIndex === -1 ? 'locked' : 'unlocked'} successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get batches with accounting details
router.get('/accounting/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const batches = await Batch.aggregate([
      { 
        $match: { teacher: new mongoose.Types.ObjectId(teacherId) }
      },
      {
        // First lookup to get all students from Student collection
        $lookup: {
          from: 'students',
          pipeline: [
            {
              $match: {
                'teachersInfo.teacherId': new mongoose.Types.ObjectId(teacherId)
              }
            },
            {
              $unwind: '$teachersInfo'
            },
            {
              $match: {
                'teachersInfo.teacherId': new mongoose.Types.ObjectId(teacherId)
              }
            }
          ],
          as: 'enrolledStudents'
        }
      },
      {
        // Filter enrolledStudents to only include those in current batch
        $addFields: {
          enrolledStudents: {
            $filter: {
              input: '$enrolledStudents',
              as: 'student',
              cond: {
                $eq: ['$$student.teachersInfo.batchId', '$$ROOT._id']
              }
            }
          },
          totalStudents: {
            $size: {
              $filter: {
                input: '$enrolledStudents',
                as: 'student',
                cond: {
                  $eq: ['$$student.teachersInfo.batchId', '$$ROOT._id']
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          totalFees: {
            $multiply: [
              '$fees',
              '$totalStudents'
            ]
          },
          totalPaid: {
            $reduce: {
              input: '$studentPayments',
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $reduce: {
                      input: '$$this.payments',
                      initialValue: 0,
                      in: {
                        $add: [
                          '$$value',
                          {
                            $cond: [
                              { $eq: ['$$this.status', 'approved'] },
                              '$$this.amount',
                              0
                            ]
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: batches
    });

  } catch (error) {
    console.error('Error getting batches accounting:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching batches accounting data'
    });
  }
});

module.exports = router;
