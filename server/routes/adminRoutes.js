const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { getAllTeachers, toggleTeacherStatus } = require('../controllers/adminController');

// Protect all routes with auth and adminAuth middleware
router.use(auth, adminAuth);

// Get all teachers
router.get('/teachers', getAllTeachers);

// Toggle teacher status
router.put('/teachers/:id/toggle-status', toggleTeacherStatus);

module.exports = router;
