const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const User = require('../models/User');
const Student = require('../models/Student'); // Add this
const { protect, teacherOnly } = require('../middleware/authMiddleware');
const { sendMessageNotificationEmail } = require('../utils/emailService');

// Send message
router.post('/:batchId', [protect, teacherOnly], async (req, res) => {
    try {
        const { content } = req.body;
        const { batchId } = req.params;

        const teacher = await User.findById(req.user.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Get batch first
        const batch = await Batch.findById(batchId);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        // Create new message
        const newMessage = {
            content,
            sender: req.user.id,
            senderName: teacher.name,
            timestamp: new Date()
        };

        // Add message to batch
        batch.messages.push(newMessage);
        await batch.save();

        // Send response immediately
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: newMessage
        });

        // Process emails asynchronously after response
        const activeStudents = await Student.find({
            _id: { $in: batch.students },
            'teachersInfo.batchId': batchId,
            _id: { $nin: batch.lockedStudents?.map(ls => ls.studentId) || [] }
        }).select('name email');

        // Send emails in batches of 10
        const batchSize = 10;
        for (let i = 0; i < activeStudents.length; i += batchSize) {
            const studentBatch = activeStudents.slice(i, i + batchSize);
            await Promise.all(
                studentBatch.map(student => 
                    sendMessageNotificationEmail(
                        student.email,
                        student.name,
                        teacher.name,
                        batch.name,
                        content
                    ).catch(err => console.error(`Failed to send email to ${student.email}:`, err))
                )
            );
            // Small delay between batches to prevent rate limiting
            if (i + batchSize < activeStudents.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

    } catch (error) {
        console.error('Error in message route:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to send message' });
        }
    }
});

// Get all messages
router.get('/:batchId', protect, async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.batchId)
            .select('messages')
            .populate('messages.sender', 'name');

        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        res.status(200).json({ messages: batch.messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

module.exports = router;
