const Assignment = require('../models/Assignment');
const s3 = require('../config/s3Config');
const { v4: uuidv4 } = require('uuid');

exports.createAssignment = async (req, res) => {
    try {
        const { title, question, endTime, batchId } = req.body;
        const file = req.file;

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        let fileUrl = null;
        let fileName = null;

        if (file) {
            const fileExtension = file.originalname.split('.').pop();
            fileName = `${uuidv4()}.${fileExtension}`;
            
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `assignments/${fileName}`,
                Body: file.buffer,
                ContentType: file.mimetype
            };

            const uploadResult = await s3.upload(params).promise();
            fileUrl = uploadResult.Location;
        }

        // Find existing assignment document or create new one
        let assignment = await Assignment.findOne({ batchId });
        
        if (!assignment) {
            assignment = new Assignment({
                assignments: [],
                batchId,
                createdBy: req.user.id
            });
        }

        // Add new assignment item
        assignment.assignments.push({
            title,
            question,
            fileUrl,
            fileName,
            endTime
        });

        await assignment.save();

        res.status(201).json({
            success: true,
            data: assignment.assignments[assignment.assignments.length - 1],
            message: 'Assignment created successfully'
        });

    } catch (error) {
        console.error('Assignment creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating assignment',
            error: error.message
        });
    }
};

exports.getAssignments = async (req, res) => {
    try {
        const { batchId } = req.params;
        const assignment = await Assignment.findOne({ batchId })
            .populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            data: assignment ? assignment.assignments : []
        });

    } catch (error) {
        console.error('Assignment fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching assignments',
            error: error.message
        });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        const { batchId } = req.query;
        const assignmentId = req.params.id;

        const assignment = await Assignment.findOne({ batchId });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Find the specific assignment item
        const assignmentItem = assignment.assignments.id(assignmentId);

        if (!assignmentItem) {
            return res.status(404).json({
                success: false,
                message: 'Assignment item not found'
            });
        }

        // Delete file from S3 if exists
        if (assignmentItem.fileName) {
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `assignments/${assignmentItem.fileName}`
            };

            await s3.deleteObject(params).promise();
        }

        // Remove the assignment item from the array
        assignment.assignments.pull(assignmentId);
        await assignment.save();

        res.status(200).json({
            success: true,
            message: 'Assignment deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting assignment',
            error: error.message
        });
    }
};
