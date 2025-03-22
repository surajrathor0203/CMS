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
                ContentType: file.mimetype,
                ACL: 'public-read', // Add public-read ACL
                ContentDisposition: 'inline' // Allow browser to display content
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

exports.editAssignment = async (req, res) => {
    try {
        const { title, question, endTime, batchId } = req.body;
        const assignmentId = req.params.id;
        const file = req.file;

        if (!batchId) {
            return res.status(400).json({
                success: false,
                message: 'Batch ID is required'
            });
        }

        const assignment = await Assignment.findOne({ batchId: batchId });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        const assignmentItem = assignment.assignments.id(assignmentId);
        if (!assignmentItem) {
            return res.status(404).json({
                success: false,
                message: 'Assignment item not found'
            });
        }

        // Handle file update if new file is provided
        let fileUrl = assignmentItem.fileUrl;
        let fileName = assignmentItem.fileName;

        if (file) {
            // Delete old file if exists
            if (assignmentItem.fileName) {
                const deleteParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: `assignments/${assignmentItem.fileName}`
                };
                await s3.deleteObject(deleteParams).promise();
            }

            // Upload new file
            const fileExtension = file.originalname.split('.').pop();
            fileName = `${uuidv4()}.${fileExtension}`;
            
            const uploadParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `assignments/${fileName}`,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
                ContentDisposition: 'inline'
            };

            const uploadResult = await s3.upload(uploadParams).promise();
            fileUrl = uploadResult.Location;
        }

        // Update assignment
        assignmentItem.title = title;
        assignmentItem.question = question;
        assignmentItem.endTime = endTime;
        if (file) {
            assignmentItem.fileUrl = fileUrl;
            assignmentItem.fileName = fileName;
        }

        await assignment.save();

        res.status(200).json({
            success: true,
            data: assignmentItem,
            message: 'Assignment updated successfully'
        });

    } catch (error) {
        console.error('Assignment update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating assignment',
            error: error.message
        });
    }
};

exports.getAssignmentById = async (req, res) => {
    try {
        const assignment = await Assignment.findOne({
            "assignments._id": req.params.assignmentId
        }).populate('createdBy', 'name');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        const assignmentItem = assignment.assignments.id(req.params.assignmentId);

        res.status(200).json({
            success: true,
            data: {
                ...assignmentItem.toObject(),
                batchId: assignment.batchId,
                createdBy: assignment.createdBy
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching assignment',
            error: error.message
        });
    }
};

exports.submitAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const studentId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

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
                message: 'Assignment is past due date. Submissions are no longer accepted.'
            });
        }

        // Check if student has already submitted
        const existingSubmission = assignmentItem.submissions?.find(
            sub => sub.studentId.toString() === studentId
        );

        if (existingSubmission) {
            // Delete old file from S3
            const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `submissions/${existingSubmission.fileName}`
            };
            await s3.deleteObject(deleteParams).promise();
        }

        // Upload new file
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `submissions/${fileName}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };

        const uploadResult = await s3.upload(uploadParams).promise();

        const submission = {
            studentId,
            fileUrl: uploadResult.Location,
            fileName,
            submittedAt: new Date()
        };

        if (existingSubmission) {
            // Update existing submission
            Object.assign(existingSubmission, submission);
        } else {
            // Add new submission
            if (!assignmentItem.submissions) {
                assignmentItem.submissions = [];
            }
            assignmentItem.submissions.push(submission);
        }

        await assignment.save();

        res.status(200).json({
            success: true,
            data: submission,
            message: 'Assignment submitted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting assignment',
            error: error.message
        });
    }
};

exports.getStudentSubmission = async (req, res) => {
    try {
        const { assignmentId, studentId } = req.params;

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
        const submission = assignmentItem.submissions?.find(
            sub => sub.studentId.toString() === studentId
        );

        res.status(200).json({
            success: true,
            data: submission || null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching submission',
            error: error.message
        });
    }
};
