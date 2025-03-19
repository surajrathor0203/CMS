const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const { createQuiz, getQuizzesByBatch, deleteQuiz, getQuizById, updateQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createQuiz);
router.get('/batch/:batchId', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ batchId: req.params.batchId })
      .select('title duration startTime questions')
      .sort({ startTime: 1 });
    res.json({ data: quizzes });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
  }
});
router.get('/:quizId', protect, getQuizById);
router.put('/:quizId', protect, updateQuiz);
router.delete('/:quizId', protect, deleteQuiz);

module.exports = router;
