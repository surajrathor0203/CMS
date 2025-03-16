const express = require('express');
const router = express.Router();
const { createQuiz, getQuizzesByBatch, deleteQuiz, getQuizById, updateQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createQuiz);
router.get('/batch/:batchId', protect, getQuizzesByBatch);
router.get('/:quizId', protect, getQuizById);
router.put('/:quizId', protect, updateQuiz);
router.delete('/:quizId', protect, deleteQuiz);

module.exports = router;
