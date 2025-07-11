const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Batch = require('../models/Batch');
const Student = require('../models/Student'); // Add this import
const { protect } = require('../middleware/authMiddleware');

// Get quizzes by batch
router.get('/batch/:batchId', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ batchId: req.params.batchId })
      .select('title duration startTime questions students')
      .sort({ startTime: 1 });
    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching quizzes', 
      error: error.message 
    });
  }
});

// Create quiz
router.post('/create', protect, async (req, res) => {
  try {
    const { title, description, batchId, duration, startTime, questions } = req.body;
    const quiz = new Quiz({
      title,
      description,
      batchId,
      duration,
      startTime,
      questions
    });
    await quiz.save();
    res.status(201).json({
      success: true,
      data: quiz,
      message: 'Quiz created successfully'
    });
  } catch (error) {
    console.error('Quiz creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating quiz'
    });
  }
});

// Get quiz by ID
router.get('/:quizId', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Get all students from the batch
    const students = await Student.find({
      'teachersInfo.batchId': quiz.batchId
    }).select('name email _id');

    // Create a map of submitted students
    const submittedStudentsMap = new Map(
      quiz.students.map(s => [s.studentId.toString(), s])
    );

    // Separate students into submitted and not submitted
    const submittedStudents = [];
    const nonSubmittedStudents = [];

    students.forEach(student => {
      const submission = submittedStudentsMap.get(student._id.toString());
      if (submission) {
        submittedStudents.push({
          ...submission.toObject(),
          name: student.name,
          email: student.email
        });
      } else {
        nonSubmittedStudents.push(student);
      }
    });

    res.json({
      success: true,
      data: {
        ...quiz.toObject(),
        submittedStudents,
        nonSubmittedStudents,
        totalStudents: students.length
      }
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz'
    });
  }
});

// Update quiz
router.put('/:quizId', protect, async (req, res) => {
  try {
    const { quizId } = req.params;
    const updates = req.body;

    const quiz = await Quiz.findByIdAndUpdate(
      quizId,
      updates,
      { new: true, runValidators: true }
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      data: quiz,
      message: 'Quiz updated successfully'
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating quiz'
    });
  }
});

// Submit quiz attempt
router.post('/:quizId/submit', protect, async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id;
    const { answers, studentName } = req.body;  // Add studentName here

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if student has already submitted using findOne instead of find
    const existingSubmission = quiz.students.find(
      student => student.studentId.toString() === studentId.toString()
    );

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Quiz already submitted',
        data: {
          score: existingSubmission.score,
          totalQuestions: existingSubmission.totalQuestions,
          correctAnswers: existingSubmission.correctAnswers
        }
      });
    }

    // Calculate score
    let correctAnswers = 0;
    answers.forEach((answer, index) => {
      if (answer === quiz.questions[index].correctAnswer) {
        correctAnswers++;
      }
    });

    // Use findOneAndUpdate to atomically update the quiz
    const result = await Quiz.findOneAndUpdate(
      {
        _id: quizId,
        'students.studentId': { $ne: studentId }
      },
      {
        $push: {
          students: {
            studentId: studentId,
            studentName: studentName, // Add student name here
            score: correctAnswers,
            totalQuestions: quiz.questions.length,
            correctAnswers,
            submittedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!result) {
      return res.status(400).json({
        success: false,
        message: 'Quiz already submitted or not found'
      });
    }

    res.json({
      success: true,
      data: {
        score: correctAnswers,
        totalQuestions: quiz.questions.length,
        correctAnswers
      },
      message: 'Quiz submitted successfully'
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting quiz'
    });
  }
});

// Get quiz attempt
router.get('/:quizId/attempt', protect, async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id; // Changed from req.user._id to req.user.id

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const studentAttempt = quiz.students.find(
      student => student.studentId.toString() === studentId.toString()
    );

    if (studentAttempt && studentAttempt.completed) {
      return res.status(400).json({
        success: false,
        message: 'Quiz already completed',
        data: studentAttempt
      });
    }

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz attempt'
    });
  }
});

// Delete quiz
router.delete('/:quizId', protect, async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findByIdAndDelete(quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting quiz'
    });
  }
});

// Delete multiple students from quiz
router.post('/:quizId/delete-students', protect, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { studentIds } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Filter out the selected students
    quiz.students = quiz.students.filter(
      student => !studentIds.includes(student.studentId.toString())
    );

    await quiz.save();

    res.json({
      success: true,
      message: 'Selected students deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting students:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting students'
    });
  }
});

module.exports = router;
