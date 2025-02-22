const Batch = require('../models/Batch');

exports.createBatch = async (req, res) => {
    try {
        const { name, startTime, endTime, openingDate } = req.body;

        if (!name || !startTime || !endTime || !openingDate) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate times
        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({
                success: false,
                message: 'Start time must be before end time'
            });
        }

        const batch = await Batch.create({
            name,
            startTime,
            endTime,
            openingDate,
            teacher: req.user._id // Assuming you're using auth middleware
        });

        res.status(201).json({
            success: true,
            data: batch
        });
    } catch (error) {
        console.error('Batch creation error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Batch with this name already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
