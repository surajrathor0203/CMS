const express = require('express');
const router = express.Router();
const { createStudents, checkEmail, getStudentsByBatch } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-multiple', protect, createStudents);
router.get('/check-email/:email', protect, checkEmail);
router.get('/batch/:batchId', protect, getStudentsByBatch);

module.exports = router;
