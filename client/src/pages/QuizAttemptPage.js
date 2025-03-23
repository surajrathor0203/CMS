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
  Paper,
  Chip,
  Divider,
  Grid,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  NavigateNext, 
  NavigateBefore, 
  Delete, 
  Check, 
  TimerOutlined,
  QuizOutlined
} from '@mui/icons-material';
import StudentLayout from '../components/StudentLayout';
import { getQuizAttempt, submitQuiz } from '../services/api';
import { toast } from 'react-toastify';
import { getUserFromCookie } from '../utils/cookies';

// Enhanced theme
const quizTheme = {
  primary: '#2e7d32',
  secondary: '#1976d2',
  light: '#e8f5e9',
  accent: '#ff9800',
  error: '#d32f2f',
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
    card: '#ffffff',
    option: '#f9f9f9',
    optionHover: '#f0f7ff',
    selectedOption: '#e3f2fd'
  },
  text: {
    primary: '#212121',
    secondary: '#757575',
    hint: '#9e9e9e'
  },
  border: {
    light: '#e0e0e0',
    main: '#bdbdbd'
  },
  shadow: '0 4px 20px 0 rgba(0,0,0,0.1)'
};

export default function QuizAttemptPage() {
  const { quizId, batchId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  // Calculate progress and stats
  const questionsAnswered = Object.keys(answers).length;
  const totalQuestions = quiz?.questions?.length || 0;
  const progressPercentage = (currentQuestion + 1) * (100 / totalQuestions);

  const handleSubmitQuiz = useCallback(async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setSubmitting(true);
      const answersArray = quiz.questions.map((_, index) => answers[index] || 0);
      
      const userData = getUserFromCookie();
      const studentName = userData?.user?.name || 'Unknown Student';

      const response = await submitQuiz(quizId, answersArray, studentName);
      
      toast.success('Quiz submitted successfully!', {
        position: "top-right",
        icon: "🎉",
        style: { 
          background: "#e8f5e9",
          color: "#2e7d32"
        }
      });
      
      navigate(`/student-dashboard/batch/${batchId}`, {
        state: {
          quizResult: {
            score: response.data.score,
            totalQuestions: response.data.totalQuestions,
            correctAnswers: response.data.correctAnswers
          }
        }
      });
    } catch (error) {
      toast.error(error.message || 'Failed to submit quiz', {
        position: "top-right",
        icon: "❌"
      });
      if (error.message === 'Quiz already submitted') {
        navigate(`/student-dashboard/batch/${batchId}`);
      }
    } finally {
      setSubmitting(false);
    }
  }, [quizId, batchId, navigate, quiz, answers, isSubmitting]);

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
          if (!isSubmitting) {
            handleSubmitQuiz();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [timeLeft, handleSubmitQuiz, isSubmitting]);

  const handleAnswerChange = (event) => {
    setAnswers({
      ...answers,
      [currentQuestion]: parseInt(event.target.value),
    });
  };

  const handleClearAnswer = () => {
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion];  // Remove the answer instead of setting to null
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setFadeIn(true);
      }, 300);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setFadeIn(true);
      }, 300);
    }
  };

  // Time formatting with warning colors
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getTimeColor = () => {
    const totalTime = quiz?.duration * 60 || 3600;
    const percentRemaining = (timeLeft / totalTime) * 100;
    
    if (percentRemaining < 10) return quizTheme.error;
    if (percentRemaining < 25) return quizTheme.accent;
    return quizTheme.primary;
  };

  if (loading) {
    return (
      <StudentLayout title="Loading Quiz...">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 6,
          minHeight: '60vh'
        }}>
          <QuizOutlined sx={{ fontSize: 64, color: quizTheme.primary, mb: 3, opacity: 0.7 }} />
          <Typography variant="h5" sx={{ mb: 3, color: quizTheme.text.secondary }}>
            Loading Your Quiz
          </Typography>
          <CircularProgress size={40} thickness={4} sx={{ color: quizTheme.primary }} />
        </Box>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title={quiz?.title || 'Quiz'}>
      <Box sx={{ 
        p: { xs: 2, md: 4 },
        background: quizTheme.background.default,
        minHeight: 'calc(100vh - 64px)'
      }}>
        {/* Quiz Info Header */}
        <Card 
          elevation={0} 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: quizTheme.shadow,
            backgroundColor: quizTheme.background.card,
            overflow: 'visible'
          }}
        >
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: quizTheme.text.primary
                  }}
                >
                  {quiz.title}
                </Typography>
                <Typography variant="body2" sx={{ color: quizTheme.text.secondary, mt: 0.5 }}>
                  Total Questions: {quiz.questions.length} • Duration: {quiz.duration} minutes
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: timeLeft < 300 ? 'rgba(211, 47, 47, 0.08)' : 'rgba(46, 125, 50, 0.08)',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: timeLeft < 300 ? 'rgba(211, 47, 47, 0.2)' : 'rgba(46, 125, 50, 0.2)'
                  }}
                >
                  <TimerOutlined sx={{ 
                    color: getTimeColor(),
                    mr: 1,
                    animation: timeLeft < 60 ? 'pulse 1s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 }
                    }
                  }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: getTimeColor(),
                      fontFamily: 'monospace'
                    }}
                  >
                    {formatTime(timeLeft)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Question Panel */}
          <Grid item xs={12} md={8}>
            <Card 
              elevation={0} 
              sx={{ 
                borderRadius: 2,
                boxShadow: quizTheme.shadow,
                height: '100%'
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                {/* Progress indicator */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: quizTheme.text.secondary }}>
                      Question {currentQuestion + 1} of {quiz.questions.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: quizTheme.text.secondary }}>
                      {Math.round(progressPercentage)}% Complete
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercentage} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'rgba(46, 125, 50, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: quizTheme.primary
                      }
                    }}
                  />
                </Box>

                {/* Question */}
                <Fade in={fadeIn} timeout={400}>
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        mb: 3,
                        color: quizTheme.text.primary,
                        borderLeft: `4px solid ${quizTheme.primary}`,
                        pl: 2,
                        py: 1
                      }}
                    >
                      {quiz.questions[currentQuestion].question}
                    </Typography>

                    {/* Options */}
                    <Box sx={{ ml: 1 }}>
                      <RadioGroup
                        value={answers[currentQuestion] !== undefined && answers[currentQuestion] !== null 
                          ? answers[currentQuestion].toString() 
                          : ''}
                        onChange={handleAnswerChange}
                      >
                        <Grid container spacing={2}>
                          {quiz.questions[currentQuestion].options.map((option, index) => (
                            <Grid item xs={12} key={index}>
                              <Paper
                                elevation={0}
                                sx={{
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: answers[currentQuestion] === index 
                                    ? quizTheme.primary 
                                    : quizTheme.border.light,
                                  backgroundColor: answers[currentQuestion] === index 
                                    ? quizTheme.background.selectedOption
                                    : quizTheme.background.option,
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: answers[currentQuestion] === index 
                                      ? quizTheme.background.selectedOption
                                      : quizTheme.background.optionHover,
                                    borderColor: answers[currentQuestion] === index 
                                      ? quizTheme.primary
                                      : quizTheme.border.main
                                  }
                                }}
                              >
                                <FormControlLabel
                                  value={index.toString()}
                                  control={
                                    <Radio 
                                      sx={{ 
                                        color: quizTheme.text.secondary,
                                        '&.Mui-checked': {
                                          color: quizTheme.primary
                                        }
                                      }} 
                                    />
                                  }
                                  label={
                                    <Typography sx={{ color: quizTheme.text.primary }}>
                                      {option}
                                    </Typography>
                                  }
                                  sx={{ 
                                    m: 0,
                                    p: 1.5,
                                    width: '100%'
                                  }}
                                />
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </RadioGroup>
                    </Box>

                    {/* Clear selection button */}
                    {answers[currentQuestion] !== undefined && (
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<Delete />}
                          onClick={handleClearAnswer}
                          sx={{ 
                            color: quizTheme.text.secondary,
                            '&:hover': {
                              color: quizTheme.error
                            }
                          }}
                        >
                          Clear Selection
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Fade>

                {/* Navigation Buttons */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    mt: 4,
                    pt: 3,
                    borderTop: `1px solid ${quizTheme.border.light}`
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<NavigateBefore />}
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestion === 0}
                    sx={{
                      borderRadius: 2,
                      color: quizTheme.text.primary,
                      borderColor: quizTheme.border.main,
                      '&:hover': {
                        borderColor: quizTheme.text.primary,
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    Previous
                  </Button>

                  {currentQuestion === quiz.questions.length - 1 ? (
                    <Button
                      variant="contained"
                      endIcon={<Check />}
                      onClick={() => setShowConfirmDialog(true)}
                      sx={{ 
                        bgcolor: quizTheme.primary,
                        borderRadius: 2,
                        px: 3,
                        '&:hover': {
                          bgcolor: '#1b5e20'
                        }
                      }}
                    >
                      Submit Quiz
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      endIcon={<NavigateNext />}
                      onClick={handleNextQuestion}
                      sx={{ 
                        bgcolor: quizTheme.primary,
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: '#1b5e20'
                        }
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Question Navigator Panel */}
          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Card 
              elevation={0} 
              sx={{ 
                borderRadius: 2,
                boxShadow: quizTheme.shadow
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Quiz Progress
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          bgcolor: 'rgba(46, 125, 50, 0.08)',
                          borderRadius: 2,
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="body2" color={quizTheme.text.secondary}>
                          Answered
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            color: quizTheme.primary, 
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {questionsAnswered}
                          <Typography variant="body2" color={quizTheme.text.secondary} component="span" sx={{ ml: 1 }}>
                            / {totalQuestions}
                          </Typography>
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          bgcolor: getTimeColor() === quizTheme.error 
                            ? 'rgba(211, 47, 47, 0.08)' 
                            : getTimeColor() === quizTheme.accent
                              ? 'rgba(255, 152, 0, 0.08)'
                              : 'rgba(25, 118, 210, 0.08)',
                          borderRadius: 2,
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="body2" color={quizTheme.text.secondary}>
                          Remaining
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            color: getTimeColor(), 
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {formatTime(timeLeft)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Typography variant="body2" sx={{ mb: 2, color: quizTheme.text.secondary }}>
                  Question Navigator
                </Typography>
                
                <Grid container spacing={1}>
                  {quiz.questions.map((_, index) => (
                    <Grid item key={index}>
                      <Chip
                        label={index + 1}
                        onClick={() => {
                          setFadeIn(false);
                          setTimeout(() => {
                            setCurrentQuestion(index);
                            setFadeIn(true);
                          }, 300);
                        }}
                        sx={{
                          borderRadius: '50%',
                          width: 36,
                          height: 36,
                          bgcolor: answers[index] !== undefined 
                            ? quizTheme.primary 
                            : currentQuestion === index
                              ? quizTheme.secondary
                              : undefined,
                          color: (answers[index] !== undefined || currentQuestion === index) 
                            ? 'white' 
                            : undefined,
                          border: '1px solid',
                          borderColor: answers[index] !== undefined 
                            ? quizTheme.primary 
                            : currentQuestion === index
                              ? quizTheme.secondary
                              : quizTheme.border.light,
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            opacity: 0.9
                          }
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Confirmation Dialog */}
        <Dialog 
          open={showConfirmDialog} 
          onClose={() => !submitting && setShowConfirmDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }
          }}
        >
          <DialogTitle sx={{ py: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Submit Quiz?
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Are you sure you want to submit the quiz? You cannot change your answers after submission.
            </Typography>
            <Box sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="body2" color={quizTheme.text.secondary}>
                • {questionsAnswered} of {totalQuestions} questions answered 
                {questionsAnswered < totalQuestions && " (some questions are unanswered)"}
              </Typography>
              <Typography variant="body2" color={quizTheme.text.secondary}>
                • {formatTime(timeLeft)} of time remaining
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitting}
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                borderColor: quizTheme.border.main
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitQuiz} 
              variant="contained" 
              disabled={submitting}
              sx={{ 
                bgcolor: quizTheme.primary,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#1b5e20'
                }
              }}
            >
              {submitting ? (
                <>
                  <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                  Submitting...
                </>
              ) : (
                'Submit Quiz'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </StudentLayout>
  );
}