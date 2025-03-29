const User = require('../models/User');

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
