const Quiz = require('../models/Quiz');
const Batch = require('../models/Batch');

exports.createQuiz = async (req, res) => {
  try {
    const { title, description, batchId, duration, startTime, questions } = req.body;

    // Validate batch exists and user has access
    const batch = await Batch.findOne({ 
      _id: batchId,
      teacherId: req.user._id 
    });

    if (!batch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found or unauthorized' 
      });
    }

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
};

exports.getQuizzesByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findOne({
      _id: batchId,
      teacherId: req.user._id
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found or unauthorized'
      });
    }

    const quizzes = await Quiz.find({ batchId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: quizzes
    });

  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quizzes'
    });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz'
    });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const updates = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user has access to the batch
    const batch = await Batch.findOne({
      _id: quiz.batchId,
      teacherId: req.user._id
    });

    if (!batch) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this quiz'
      });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      updates,
      { new: true }
    );

    res.json({
      success: true,
      data: updatedQuiz,
      message: 'Quiz updated successfully'
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating quiz'
    });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user has access to the batch
    const batch = await Batch.findOne({
      _id: quiz.batchId,
      teacherId: req.user._id
    });

    if (!batch) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this quiz'
      });
    }

    await Quiz.findByIdAndDelete(quizId);

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting quiz'
    });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user._id;
    const { answers } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if student has already submitted
    const existingSubmission = quiz.students.find(
      student => student.studentId.toString() === studentId.toString()
    );

    if (existingSubmission && existingSubmission.completed) {
      return res.status(400).json({
        success: false,
        message: 'Quiz already submitted'
      });
    }

    // Calculate score
    let score = 0;
    answers.forEach((answer, index) => {
      if (answer === quiz.questions[index].correctAnswer) {
        score++;
      }
    });

    const scorePercentage = (score / quiz.questions.length) * 100;

    // Update or add student submission
    if (existingSubmission) {
      existingSubmission.answers = answers;
      existingSubmission.score = scorePercentage;
      existingSubmission.submittedAt = new Date();
      existingSubmission.completed = true;
    } else {
      quiz.students.push({
        studentId,
        answers,
        score: scorePercentage,
        completed: true
      });
    }

    await quiz.save();

    res.json({
      success: true,
      data: {
        score: scorePercentage,
        totalQuestions: quiz.questions.length,
        correctAnswers: score
      },
      message: 'Quiz submitted successfully'
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting quiz'
    });
  }
};

exports.getQuizAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user._id;

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
    console.error('Get quiz attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz attempt'
    });
  }
};
