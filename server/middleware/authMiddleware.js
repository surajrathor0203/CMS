const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        // Get token from cookies
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Not authorized, token failed'
        });
    }
};

exports.protect = protect;

exports.teacherOnly = (req, res, next) => {
    if (req.user && req.user.role === 'teacher') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'This route is only accessible to teachers'
        });
    }
};
