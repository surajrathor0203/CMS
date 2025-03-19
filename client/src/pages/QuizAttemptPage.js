import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import StudentLayout from '../components/StudentLayout';
import { getQuizById, getQuizAttempt, submitQuiz } from '../services/api';
import { toast } from 'react-toastify';

const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9',
};

export default function QuizAttemptPage() {
  const { quizId, batchId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitQuiz = useCallback(async () => {
    try {
      setSubmitting(true);
      const answersArray = quiz.questions.map((_, index) => answers[index] || 0);
      const response = await submitQuiz(quizId, answersArray);
      
      toast.success('Quiz submitted successfully');
      // Show results
      navigate(`/student-dashboard/batch/${batchId}`, {
        state: {
          quizResult: response.data
        }
      });
    } catch (error) {
      toast.error(error.message || 'Failed to submit quiz');
      if (error.message === 'Quiz already completed') {
        navigate(`/student-dashboard/batch/${batchId}`);
      }
    } finally {
      setSubmitting(false);
    }
  }, [quizId, batchId, navigate, quiz, answers]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await getQuizAttempt(quizId);
        if (!response.success) {
          toast.error(response.message);
          navigate(`/student-dashboard/batch/${batchId}`);
          return;
        }
        setQuiz(response.data);
        setTimeLeft(response.data.duration * 60);
      } catch (error) {
        toast.error(error.message || 'Failed to load quiz');
        navigate(`/student-dashboard/batch/${batchId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, batchId, navigate]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmitQuiz]);

  const handleAnswerChange = (event) => {
    setAnswers({
      ...answers,
      [currentQuestion]: parseInt(event.target.value),
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (loading) {
    return (
      <StudentLayout title="Loading Quiz...">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </StudentLayout>
    );
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <StudentLayout title={quiz?.title || 'Quiz'}>
      <Box sx={{ p: 3 }}>
        <Card elevation={2}>
          <CardContent>
            {/* Timer and Progress */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" color="error" align="right">
                Time Remaining: {formatTime(timeLeft)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(currentQuestion + 1) * (100 / quiz.questions.length)} 
                sx={{ mt: 2 }}
              />
            </Box>

            {/* Question */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Question {currentQuestion + 1} of {quiz.questions.length}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {quiz.questions[currentQuestion].question}
              </Typography>

              <RadioGroup
                value={answers[currentQuestion] || ''}
                onChange={handleAnswerChange}
              >
                {quiz.questions[currentQuestion].options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={index}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>

              {currentQuestion === quiz.questions.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={() => setShowConfirmDialog(true)}
                  sx={{ bgcolor: theme.primary }}
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNextQuestion}
                  sx={{ bgcolor: theme.primary }}
                >
                  Next
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
          <DialogTitle>Submit Quiz?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to submit the quiz? You cannot change your answers after submission.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitQuiz} 
              variant="contained" 
              color="primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </StudentLayout>
  );
}
