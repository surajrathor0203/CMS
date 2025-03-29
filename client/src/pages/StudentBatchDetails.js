import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getStudentBatchDetails, 
  getNotesByBatch, 
  getQuizzesByBatch, 
  getAssignmentsByBatch, 
  getPayments, 
  submitPayment 
} from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Paper,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Subject as SubjectIcon,
  Download as DownloadIcon,
  CloudUpload as UploadIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { getUserFromCookie } from '../utils/cookies';

// Enhanced Theme
const theme = {
  primary: '#2e7d32',
  secondary: '#1976d2',
  background: '#f4f6f8',
  text: {
    primary: '#333',
    secondary: '#666'
  },
  success: '#4caf50', // Add success color
  error: '#f44336',   // Add error color
  borderRadius: 12,
  shadow: '0 4px 6px rgba(0,0,0,0.1)'
};

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[4]
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `2px solid ${theme.palette.divider}`,
  '& .MuiTab-root': {
    fontWeight: 600,
    textTransform: 'capitalize',
    fontSize: '1rem',
    color: theme.palette.text.secondary,
    '&.Mui-selected': {
      color: theme.palette.primary.main,
      fontWeight: 700
    }
  },
  '& .MuiTabs-indicator': {
    height: 3,
    backgroundColor: theme.palette.primary.main
  }
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 8px rgba(0,0,0,0.15)'
  }
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  '&:hover': {
    backgroundColor: theme.palette.grey[200]
  }
}));

const AnimatedChip = styled(Chip)(({ theme }) => ({
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)'
  }
}));

const StyledUploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  backgroundColor: theme.palette.background.default,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.dark,
    backgroundColor: theme.palette.action.hover,
    transform: 'translateY(-2px)'
  }
}));

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ProgressCard = styled(StyledCard)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    background: 'linear-gradient(90deg, #2196f3, #00bcd4)',
  }
}));

const CircularProgressBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const ProgressValue = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: theme.palette.primary.main,
}));

const ActivityTimeline = styled(List)(({ theme }) => ({
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '16px',
    top: 0,
    bottom: 0,
    width: '2px',
    background: theme.palette.divider,
    zIndex: 1,
  }
}));

const TimelineItem = styled(ListItem)(({ theme }) => ({
  position: 'relative',
  paddingLeft: theme.spacing(5),
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '12px',
    top: '50%',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: theme.palette.primary.main,
    transform: 'translateY(-50%)',
    zIndex: 2,
  }
}));

export default function StudentBatchDetails() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('activity');
  const [batchDetails, setBatchDetails] = useState(null);
  const [batchLoading, setBatchLoading] = useState(true);
  const [batchError, setBatchError] = useState(null);
  
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState(null);
  
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState(null);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState(null);

  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [selectedQuizResult, setSelectedQuizResult] = useState(null);
  const [studentId, setStudentId] = useState(null);

  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [expiredQuiz, setExpiredQuiz] = useState(null);

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Get student ID from cookies when component mounts
    const userData = getUserFromCookie();
    if (userData?.user?.id) {
      setStudentId(userData.user.id);
    }
  }, []);

  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        setBatchLoading(true);
        const response = await getStudentBatchDetails(batchId);
        setBatchDetails(response);
        
        // Check if current student's ID exists in lockedStudents array
        const isStudentLocked = response.lockedStudents?.some(
          lockInfo => lockInfo.studentId === studentId
        );
        
        setIsLocked(isStudentLocked);
        
        // Force payment tab if locked
        if (isStudentLocked) {
          setActiveTab('payment');
          toast.error('Your account is locked due to pending payments.');
        }

      } catch (err) {
        console.error('Error fetching batch details:', err);
        setBatchError(err.message || 'Failed to fetch batch details');
      } finally {
        setBatchLoading(false);
      }
    };

    if (studentId) {
      fetchBatchDetails();
    }
  }, [batchId, studentId]); // Added studentId as dependency

  const formatDate = (dateString) => {
    if (!dateString) return 'No date specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'No time specified';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const handleTabChange = (event, newValue) => {
    // Prevent switching to other tabs if account is locked
    if (isLocked && newValue !== 'payment') {
      toast.error('Your account is locked. Please complete pending payments.');
      return;
    }
    setActiveTab(newValue);
  };

  const NotesSection = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" color={theme.primary} gutterBottom>
        Notes
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {notesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notesError ? (
        <Typography color="error" textAlign="center">
          {notesError}
        </Typography>
      ) : notes.length > 0 ? (
        <Paper>
          <List>
            {notes.map((note) => (
              <ListItem
                key={note._id}
                onClick={() => window.open(note.fileUrl, '_blank')}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the ListItem click
                      window.open(note.fileUrl, '_blank');
                    }}
                    title="Download Note"
                  >
                    <DownloadIcon />
                  </IconButton>
                }
              >
                <ListItemText 
                  primary={note.title}
                  // secondary={new Date(note.uploadedAt).toLocaleDateString()}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography variant="body1" color="text.secondary" textAlign="center">
          No notes available
        </Typography>
      )}
    </Box>
  );

  // Fetch quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setQuizzesLoading(true);
        const response = await getQuizzesByBatch(batchId);
        setQuizzes(response.data || []);
      } catch (err) {
        setQuizzesError(err.message || 'Failed to fetch quizzes');
      } finally {
        setQuizzesLoading(false);
      }
    };

    fetchQuizzes();
  }, [batchId]);

  // Fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setAssignmentsLoading(true);
        const response = await getAssignmentsByBatch(batchId);
        setAssignments(response.data || []);
      } catch (err) {
        setAssignmentsError(err.message || 'Failed to fetch assignments');
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();
  }, [batchId]);

  // Fetch notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setNotesLoading(true);
        const response = await getNotesByBatch(batchId);
        setNotes(response.data || []);
      } catch (err) {
        setNotesError(err.message || 'Failed to fetch notes');
      } finally {
        setNotesLoading(false);
      }
    };

    fetchNotes();
  }, [batchId]);

  const isQuizExpired = (quiz) => {
    const startTime = new Date(quiz.startTime);
    const endTime = new Date(startTime.getTime() + quiz.duration * 60000); // Convert duration from minutes to milliseconds
    return new Date() > endTime;
  };

  const handleQuizClick = (quiz) => {
    if (!studentId) {
      toast.error('User ID not found. Please try logging in again.');
      return;
    }

    // Check if student has already attempted the quiz
    const studentAttempt = quiz.students?.find(
      student => student.studentId === studentId
    );

    if (studentAttempt) {
      setSelectedQuizResult({
        title: quiz.title,
        score: studentAttempt.score,
        totalQuestions: studentAttempt.totalQuestions,
        correctAnswers: studentAttempt.correctAnswers,
        submittedAt: studentAttempt.submittedAt,
        questions: quiz.questions,  // Add questions
        answers: studentAttempt.answers || []  // Add student's answers
      });
      setShowScoreDialog(true);
      return;
    }

    const now = new Date();
    const quizStart = new Date(quiz.startTime);
    
    if (now < quizStart) {
      toast.info("This quiz hasn't started yet");
      return;
    }

    // Check if quiz has expired
    if (isQuizExpired(quiz)) {
      setExpiredQuiz(quiz);
      setShowExpiredDialog(true);
      return;
    }
    
    navigate(`/student-dashboard/batch/${batchId}/quiz/${quiz._id}`);
  };

const formatQuizTime = (dateString) => {
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true, // This ensures AM/PM format
    });
  } catch (error) {
    return 'Invalid date';
  }
};

const getQuizStatus = (quiz) => {
  const now = new Date();
  const startTime = new Date(quiz.startTime);
  const endTime = new Date(startTime.getTime() + quiz.duration * 60000);

  if (now < startTime) {
    return { status: 'upcoming', color: 'default', label: 'Not Started' };
  } else if (now >= startTime && now <= endTime) {
    return { status: 'open', color: 'success', label: 'Open' };
  } else {
    return { status: 'expired', color: 'error', label: 'Expired' };
  }
};

const QuizCard = ({ quiz }) => {
  const studentAttempt = quiz.students?.find(
    student => student.studentId === studentId
  );
  const quizStatus = getQuizStatus(quiz);

  return (
    <StyledCard onClick={() => handleQuizClick(quiz)}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3">
            {quiz.title}
          </Typography>
          <AnimatedChip 
            label={quizStatus.label}
            color={quizStatus.color}
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Duration: {quiz.duration} minutes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Start Time: {formatQuizTime(quiz.startTime)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Questions: {quiz.questions.length}
        </Typography>
        {studentAttempt && (
          <Box sx={{ mt: 2 }}>
            <AnimatedChip 
              label={`Score: ${studentAttempt.correctAnswers}/${studentAttempt.totalQuestions}`}
              color="success"
              size="small"
            />
          </Box>
        )}
        {quizStatus.status === 'open' && !studentAttempt && (
          <Box sx={{ mt: 2 }}>
            <Typography 
              variant="body2" 
              color="success.main" 
              sx={{ 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              Quiz is currently open! Click to attempt
            </Typography>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

const QuizResultDialog = () => {
  const [showReview, setShowReview] = useState(false);

  return (
    <Dialog 
      open={showScoreDialog} 
      onClose={() => setShowScoreDialog(false)}
      maxWidth={showReview ? "md" : "xs"}
      fullWidth
    >
      {!showReview ? (
        <>
          <DialogTitle>{selectedQuizResult?.title} - Results</DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Score: {selectedQuizResult?.correctAnswers} out of {selectedQuizResult?.totalQuestions}
              </Typography>
              <Typography variant="body1">
                Percentage: {((selectedQuizResult?.correctAnswers / selectedQuizResult?.totalQuestions) * 100).toFixed(2)}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Submitted: {new Date(selectedQuizResult?.submittedAt).toLocaleString()}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowReview(true)}
              color="primary"
            >
              Review Quiz
            </Button>
            <Button onClick={() => setShowScoreDialog(false)}>Close</Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">{selectedQuizResult?.title} - Review</Typography>
              <IconButton onClick={() => setShowReview(false)} size="small">
                <ArrowBackIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              {selectedQuizResult?.questions?.map((question, index) => (
                <Box key={index} sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    {index + 1}. {question.question}
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {question.options.map((option, optIndex) => (
                      <Box
                        key={optIndex}
                        sx={{
                          p: 1,
                          mb: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 
                            selectedQuizResult.answers[index] === optIndex
                              ? question.correctAnswer === optIndex
                                ? 'success.main'
                                : 'error.main'
                              : question.correctAnswer === optIndex
                                ? 'success.main'
                                : 'divider',
                          bgcolor: 
                            selectedQuizResult.answers[index] === optIndex
                              ? question.correctAnswer === optIndex
                                ? 'success.lighter'
                                : 'error.lighter'
                              : question.correctAnswer === optIndex
                                ? 'success.lighter'
                                : 'transparent',
                        }}
                      >
                        <Typography variant="body2">
                          {option}
                          {selectedQuizResult.answers[index] === optIndex && (
                            <Chip 
                              label="Your Answer" 
                              size="small" 
                              color={question.correctAnswer === optIndex ? "success" : "error"}
                              sx={{ ml: 1 }}
                            />
                          )}
                          {question.correctAnswer === optIndex && (
                            <Chip 
                              label="Correct Answer" 
                              size="small" 
                              color="success"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowReview(false)} color="primary">
              Back to Results
            </Button>
            <Button onClick={() => setShowScoreDialog(false)}>Close</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

const ExpiredQuizDialog = () => (
  <Dialog open={showExpiredDialog} onClose={() => setShowExpiredDialog(false)}>
    <DialogTitle>Quiz Expired</DialogTitle>
    <DialogContent>
      <Box sx={{ py: 2 }}>
        <Typography variant="h6" gutterBottom>
          {expiredQuiz?.title}
        </Typography>
        <Typography variant="body1" color="error">
          This quiz has ended and is no longer available for submission.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Quiz Duration: {expiredQuiz?.duration} minutes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start Time: {formatQuizTime(expiredQuiz?.startTime)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          End Time: {formatQuizTime(new Date(new Date(expiredQuiz?.startTime).getTime() + (expiredQuiz?.duration * 60000)))}
        </Typography>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setShowExpiredDialog(false)}>Close</Button>
    </DialogActions>
  </Dialog>
);

const handleAssignmentClick = (assignment) => {
  navigate(`/student-dashboard/batch/${batchId}/assignment/${assignment._id}`);
};

const isAssignmentOverdue = (endTime) => {
  if (!endTime) return false;
  return new Date(endTime) < new Date();
};

const getTimeRemaining = (endTime) => {
  if (!endTime) return 'No due date';
  
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;
  
  if (diff < 0) return 'Overdue';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} days left`;
  if (hours > 0) return `${hours} hours left`;
  return 'Due soon';
};

const PaymentDetailsCard = ({ batchDetails, paymentHistory }) => (
  <StyledCard>
    <CardContent>
      <Typography variant="h6" color={theme.primary} gutterBottom>
        Fee Payment Details
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {batchDetails?.payment ? (
        <Grid container spacing={3}>
          {/* Column 1: Basic Payment Details */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Payment Contact
              </Typography>
              <Typography variant="body1">
                {batchDetails.payment.upiHolderName}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                UPI ID
              </Typography>
              <Typography variant="body1">
                {batchDetails.payment.upiId}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                UPI Number
              </Typography>
              <Typography variant="body1">
                {batchDetails.payment.upiNumber}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Fee Amount
              </Typography>
              <Typography variant="body1">
                ₹{batchDetails.fees}
              </Typography>
            </Box>
          </Grid>

          {/* Column 2: Installment Dates */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Installment Due Dates
              </Typography>
              {console.log('Installment Dates:', batchDetails.installmentDates)} {/* Debug log */}
              {Array.isArray(batchDetails.installmentDates) && batchDetails.installmentDates.map((date, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Installment {index + 1}
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(date)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
          
          {/* Column 3: QR Code */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Payment QR Code
              </Typography>
              {batchDetails.payment.qrCodeUrl ? (
                <Box
                  component="img"
                  src={batchDetails.payment.qrCodeUrl}
                  alt="Payment QR Code"
                  sx={{
                    maxWidth: '250px',
                    width: '100%',
                    height: 'auto',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    p: 1
                  }}
                />
              ) : (
                <Typography variant="body2" color="error">
                  QR Code not available
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Payment details not available
        </Typography>
      )}
    </CardContent>
  </StyledCard>
);

const PaymentSection = () => {
  const [loading, setLoading] = useState(false); // Add loading state
  const [formData, setFormData] = useState({
    amount: '',
    receipt: null,
    feedback: '',
    installmentNumber: ''
  });

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (!formData.receipt || !formData.amount || !formData.installmentNumber) {
        toast.error('Please fill all required fields');
        return;
      }

      const paymentData = {
        amount: formData.amount,
        receipt: formData.receipt,
        feedback: formData.feedback || '',
        studentId: studentId,
        installmentNumber: formData.installmentNumber
      };

      await submitPayment(batchId, paymentData);
      toast.success('Payment submitted successfully');
      fetchPaymentHistory();
      setFormData({ amount: '', receipt: null, feedback: '', installmentNumber: '' });
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-fill amount when installment is selected
      ...(name === 'installmentNumber' ? {
        amount: (batchDetails.fees / batchDetails.numberOfInstallments).toFixed(2)
      } : {})
    }));
  };

  const calculateTotalPaid = () => {
    return paymentHistory
      .filter(payment => payment.status === 'approved')
      .reduce((sum, payment) => sum + payment.amount, 0);
  };

  return (
    <Grid container spacing={3}>
      {/* Payment Details Section */}
      <Grid item xs={12}>
        <PaymentDetailsCard 
          batchDetails={batchDetails}
          paymentHistory={paymentHistory}
        />
      </Grid>

      {/* Payment Form Section */}
      <Grid item xs={12}>
        <StyledCard>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
              Submit Payment
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handlePaymentSubmit}>
              {/* Installment Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="installment-select-label">Select Installment</InputLabel>
                <Select
                  labelId="installment-select-label"
                  id="installment-select"
                  name="installmentNumber"
                  value={formData.installmentNumber}
                  onChange={handleInputChange}
                  label="Select Installment"
                  required
                >
                  {batchDetails?.installmentDates?.map((date, index) => (
                    <MenuItem key={index} value={index + 1}>
                      Installment {index + 1} - Due: {formatDate(date)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Amount Input */}
              <TextField
                label="Amount"
                type="number"
                name="amount"
                fullWidth
                required
                value={formData.amount}
                onChange={handleInputChange}
                sx={{ mb: 3 }}
                inputProps={{
                  min: 0,
                  max: batchDetails?.fees || 0,
                  step: "0.01"
                }}
                variant="outlined"
              />
              
              {/* Feedback Input */}
              <TextField
                label="Feedback (Optional)"
                multiline
                rows={3}
                fullWidth
                name="feedback"
                value={formData.feedback}
                onChange={handleInputChange}
                sx={{ mb: 3 }}
                variant="outlined"
              />

              {/* File Upload */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Upload Payment Receipt*
              </Typography>
              <StyledUploadBox>
                <UploadIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Drag and drop a file here or
                </Typography>
                <Button
                  component="label"
                  variant="contained"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Browse Files
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData(prev => ({ ...prev, receipt: file }));
                      }
                    }}
                    required
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  PNG, JPG, PDF up to 10MB
                </Typography>
              </StyledUploadBox>
              
              {formData.receipt && (
                <Paper variant="outlined" sx={{ p: 1, mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {formData.receipt.name}
                  </Typography>
                  <StyledIconButton 
                    size="small" 
                    color="error"
                    onClick={() => setFormData(prev => ({ ...prev, receipt: null }))}
                  >
                    ×
                  </StyledIconButton>
                </Paper>
              )}

              {/* Submit Button */}
              <GradientButton 
                type="submit" 
                variant="contained" 
                fullWidth
                disabled={loading || !formData.receipt || !formData.amount}
                sx={{ 
                  py: 1.5,
                  borderRadius: 2
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    Submitting...
                  </>
                ) : 'Submit Payment'}
              </GradientButton>
            </form>
          </CardContent>
        </StyledCard>
      </Grid>

      {/* Payment History Section */}
      <Grid item xs={12}>
        <StyledCard>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" color="primary" fontWeight="bold">
                Payment History
              </Typography>
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Total Paid: ₹{calculateTotalPaid()} / ₹{batchDetails?.fees}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="right">
                  {((calculateTotalPaid() / batchDetails?.fees) * 100).toFixed(1)}% paid
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {paymentHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No payment history available
              </Typography>
            ) : (
              <List sx={{ width: '100%' }}>
                {paymentHistory.map((payment, index) => (
                  <ListItem
                    key={index}
                    divider={index < paymentHistory.length - 1}
                    secondaryAction={
                      <StyledIconButton 
                        edge="end" 
                        color="primary"
                        onClick={() => window.open(payment.receiptUrl, '_blank')}
                      >
                        <DownloadIcon />
                      </StyledIconButton>
                    }
                    sx={{ py: 2 }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="h6">
                          ₹{payment.amount}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" component="span" display="block">
                            Date: {new Date(payment.paymentDate).toLocaleDateString()}
                          </Typography>
                          <Box sx={{ mt: 1, mb: 1 }}>
                            <AnimatedChip 
                              size="small" 
                              label={payment.status} 
                              color={
                                payment.status === 'approved' ? 'success' :
                                payment.status === 'rejected' ? 'error' : 'default'
                              } 
                            />
                          </Box>
                          {payment.feedback && (
                            <Typography variant="body2" component="span">
                              <b>Feedback:</b> {payment.feedback}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  );
}

const fetchPaymentHistory = useCallback(async () => {
  try {
    const response = await getPayments(batchId, studentId);
    setPaymentHistory(response.data.payments || []);
  } catch (error) {
    toast.error('Failed to fetch payment history');
  }
}, [batchId, studentId]); // Add dependencies

useEffect(() => {
  if (studentId) {
    fetchPaymentHistory();
  }
}, [studentId, fetchPaymentHistory]);

const QuizProgressSection = ({ quizzes }) => {
  const totalQuizzes = quizzes.length;
  const attemptedQuizzes = quizzes.filter(quiz => 
    quiz.students?.some(student => student.studentId === studentId)
  ).length;

  const quizProgress = totalQuizzes > 0 
    ? ((attemptedQuizzes / totalQuizzes) * 100).toFixed(1) 
    : 0;

  const getAverageScore = () => {
    const attemptedQuizzesData = quizzes.filter(quiz => 
      quiz.students?.some(student => student.studentId === studentId)
    );

    if (attemptedQuizzesData.length === 0) return 0;

    const totalScore = attemptedQuizzesData.reduce((acc, quiz) => {
      const studentAttempt = quiz.students.find(
        student => student.studentId === studentId
      );
      return acc + ((studentAttempt.correctAnswers / studentAttempt.totalQuestions) * 100);
    }, 0);

    return (totalScore / attemptedQuizzesData.length).toFixed(1);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
        Quiz Performance Overview
      </Typography>
      <Grid container spacing={3}>
        {/* New Total Quizzes Card */}
        <Grid item xs={12} md={4}>
          <ProgressCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Typography 
                  variant="h2" 
                  color="primary" 
                  sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {totalQuizzes}
                </Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                Total Quizzes
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {attemptedQuizzes} attempted, {totalQuizzes - attemptedQuizzes} remaining
              </Typography>
            </CardContent>
          </ProgressCard>
        </Grid>

        {/* Existing Completion Rate Card */}
        <Grid item xs={12} md={4}>
          <ProgressCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <CircularProgressBox>
                <CircularProgress
                  variant="determinate"
                  value={parseFloat(quizProgress)}
                  size={120}
                  thickness={4}
                  sx={{ color: theme.primary }}
                />
                <ProgressValue sx={{ color: theme.primary }}>
                  {quizProgress}%
                </ProgressValue>
              </CircularProgressBox>
              <Typography variant="h6" gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {attemptedQuizzes} of {totalQuizzes} quizzes completed
              </Typography>
            </CardContent>
          </ProgressCard>
        </Grid>
        
        {/* Existing Average Score Card */}
        <Grid item xs={12} md={4}>
          <ProgressCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <CircularProgressBox>
                <CircularProgress
                  variant="determinate"
                  value={parseFloat(getAverageScore())}
                  size={120}
                  thickness={4}
                  sx={{ color: theme.success }}
                />
                <ProgressValue sx={{ color: theme.success }}>
                  {getAverageScore()}%
                </ProgressValue>
              </CircularProgressBox>
              <Typography variant="h6" gutterBottom>
                Average Score
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Across all attempted quizzes
              </Typography>
            </CardContent>
          </ProgressCard>
        </Grid>
      </Grid>

      {/* Recent Quiz Activity */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Recent Quiz Activity
        </Typography>
        <ActivityTimeline>
          {quizzes
            .filter(quiz => quiz.students?.some(student => student.studentId === studentId))
            .map(quiz => {
              const studentAttempt = quiz.students.find(
                student => student.studentId === studentId
              );
              
              return (
                <TimelineItem key={quiz._id}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {quiz.title}
                        </Typography>
                        <Chip
                          label={`${studentAttempt.correctAnswers}/${studentAttempt.totalQuestions}`}
                          color={studentAttempt.correctAnswers >= (studentAttempt.totalQuestions * 0.6) ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="textSecondary">
                        Completed on {new Date(studentAttempt.submittedAt).toLocaleDateString()}
                      </Typography>
                    }
                  />
                </TimelineItem>
              );
            })}
        </ActivityTimeline>
      </Box>
    </Box>
  );
};

const AssignmentProgressSection = ({ assignments }) => {
  const totalAssignments = assignments.length;
  const submittedAssignments = assignments.filter(assignment => 
    assignment.submissions?.some(sub => sub.studentId === studentId)
  ).length;

  const assignmentProgress = totalAssignments > 0 
    ? ((submittedAssignments / totalAssignments) * 100).toFixed(1) 
    : 0;

  const getAverageGrade = () => {
    const gradedAssignments = assignments.filter(assignment => {
      const submission = assignment.submissions?.find(
        sub => sub.studentId === studentId && sub.grade !== undefined
      );
      return submission !== undefined;
    });

    if (gradedAssignments.length === 0) return 0;

    const totalGrade = gradedAssignments.reduce((acc, assignment) => {
      const submission = assignment.submissions.find(
        sub => sub.studentId === studentId
      );
      return acc + (submission.grade || 0);
    }, 0);

    return totalGrade / gradedAssignments.length;
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
        Assignment Performance Overview
      </Typography>
      <Grid container spacing={3}>
        {/* Total Assignments Card */}
        <Grid item xs={12} md={4}>
          <ProgressCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Typography 
                  variant="h2" 
                  color="primary" 
                  sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {totalAssignments}
                </Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                Total Assignments
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {submittedAssignments} submitted, {totalAssignments - submittedAssignments} pending
              </Typography>
            </CardContent>
          </ProgressCard>
        </Grid>

        {/* Submission Rate Card */}
        <Grid item xs={12} md={4}>
          <ProgressCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <CircularProgressBox>
                <CircularProgress
                  variant="determinate"
                  value={parseFloat(assignmentProgress)}
                  size={120}
                  thickness={4}
                  sx={{ color: theme.primary }}
                />
                <ProgressValue sx={{ color: theme.primary }}>
                  {assignmentProgress}%
                </ProgressValue>
              </CircularProgressBox>
              <Typography variant="h6" gutterBottom>
                Submission Rate
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {submittedAssignments} of {totalAssignments} assignments submitted
              </Typography>
            </CardContent>
          </ProgressCard>
        </Grid>

        {/* Average Grade Card */}
        <Grid item xs={12} md={4}>
          <ProgressCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <CircularProgressBox>
                <CircularProgress
                  variant="determinate"
                  value={parseFloat(getAverageGrade()) * 10}
                  size={120}
                  thickness={4}
                  sx={{ color: theme.success }}
                />
                <ProgressValue sx={{ color: theme.success }}>
                  {(getAverageGrade() * 10).toFixed(1)}%
                </ProgressValue>
              </CircularProgressBox>
              <Typography variant="h6" gutterBottom>
                Average Grade
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Grade: {getAverageGrade().toFixed(1)}/10
              </Typography>
            </CardContent>
          </ProgressCard>
        </Grid>
      </Grid>

      {/* Recent Assignment Activity */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Recent Assignment Activity
        </Typography>
        <ActivityTimeline>
          {assignments
            .filter(assignment => assignment.submissions?.some(sub => sub.studentId === studentId))
            .map(assignment => {
              const submission = assignment.submissions.find(
                sub => sub.studentId === studentId
              );
              const grade = submission.grade || 0;

              return (
                <TimelineItem key={assignment._id}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {assignment.title}
                        </Typography>
                        {submission.grade ? (
                          <Chip
                            label={`${grade}/10`}
                            color={grade >= 6 ? 'success' : 'error'}
                            size="small"
                          />
                        ) : (
                          <Chip
                            label="Submitted"
                            color="primary"
                            size="small"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="textSecondary">
                        Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                      </Typography>
                    }
                  />
                </TimelineItem>
              );
            })}
        </ActivityTimeline>
      </Box>
    </Box>
  );
};

  if (batchLoading) {
    return (
      <StudentLayout title="Loading...">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </StudentLayout>
    );
  }

  if (batchError) {
    return (
      <StudentLayout title="Error">
        <Box sx={{ p: 3 }}>
          <Typography color="error">{batchError}</Typography>
        </Box>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title={batchDetails?.name || 'Batch Details'}>
      <Box sx={{ 
        p: 3, 
        backgroundColor: theme.background,
        minHeight: '100vh'
      }}>
        <Grid container spacing={3}>
          {/* Batch Information Card */}
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color={theme.primary}>
                    Batch Information
                  </Typography>
                  <AnimatedChip
                    icon={isLocked ? <LockIcon /> : <UnlockIcon />}
                    label={isLocked ? 'Account Locked' : 'Account Active'}
                    color={isLocked ? 'error' : 'success'}
                    variant="outlined"
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SubjectIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Subject: {batchDetails?.subject}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TimeIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Time: {formatTime(batchDetails?.startTime)} - {formatTime(batchDetails?.endTime)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Opening Date: {formatDate(batchDetails?.openingDate)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Teacher: {batchDetails?.teacher?.name}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Add Payment Section here, after the batch information card */}
          {/* <PaymentSection /> */}

          {/* Tabs Section */}
          <Grid item xs={12}>
            <StyledTabs value={activeTab} onChange={handleTabChange}>
              <Tab 
                label="Batch Activity" 
                value="activity"
                disabled={isLocked}
              />
              <Tab 
                label="My Progress" 
                value="progress"
                disabled={isLocked}
              />
              <Tab 
                label="Fee Payment" 
                value="payment"
              />
            </StyledTabs>
          </Grid>

          {/* Content based on active tab */}
          {activeTab === 'activity' && (
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  {/* Notes Section */}
                  <NotesSection />

                  {/* Quizzes Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color={theme.primary} gutterBottom>
                      Quizzes
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {quizzesLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : quizzesError ? (
                      <Typography color="error" textAlign="center">
                        {quizzesError}
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {quizzes.map((quiz) => (
                          <Grid item xs={12} sm={6} md={4} key={quiz._id}>
                            <QuizCard quiz={quiz} />
                          </Grid>
                        ))}
                        {quizzes.length === 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary" textAlign="center">
                              No quizzes available
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    )}
                  </Box>

                  {/* Assignments Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color={theme.primary} gutterBottom>
                      Assignments
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {assignmentsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : assignmentsError ? (
                      <Typography color="error" textAlign="center">
                        {assignmentsError}
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {assignments.map((assignment) => (
                          <Grid item xs={12} sm={6} md={4} key={assignment._id}>
                            <StyledCard 
                              onClick={() => handleAssignmentClick(assignment)}
                            >
                              <CardContent>
                                <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                                  {assignment.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  Due: {assignment.endTime ? new Date(assignment.endTime).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  }) : 'No due date set'}
                                </Typography>
                                {assignment.fileUrl && (
                                  <Box sx={{ mb: 2 }}>
                                    <StyledIconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent card click
                                        window.open(assignment.fileUrl, '_blank')
                                      }}
                                      title="Download Assignment"
                                    >
                                      <DownloadIcon />
                                    </StyledIconButton>
                                  </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    {isAssignmentOverdue(assignment.endTime) ? (
                                      <AnimatedChip 
                                        label="Overdue" 
                                        color="error" 
                                        size="small" 
                                      />
                                    ) : (
                                      <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
                                        {getTimeRemaining(assignment.endTime)}
                                      </Box>
                                    )}
                                  </Box>
                                  <AnimatedChip
                                    label={assignment.submitted ? 'Submitted' : 'Not Submitted'}
                                    color={assignment.submitted ? 'success' : 'warning'}
                                    size="small"
                                  />
                                </Box>
                              </CardContent>
                            </StyledCard>
                          </Grid>
                        ))}
                        {assignments.length === 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary" textAlign="center">
                              No assignments available
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    )}
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          )}

          {activeTab === 'progress' && (
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  <QuizProgressSection quizzes={quizzes} />

                  <Divider sx={{ my: 4 }} />
                  <AssignmentProgressSection assignments={assignments} />
                  
                  {/* Remove the old Recent Activity section */}
                </CardContent>
              </StyledCard>
            </Grid>
          )}

          {activeTab === 'payment' && <PaymentSection />}
        </Grid>
      </Box>
      <QuizResultDialog />
      <ExpiredQuizDialog />
    </StudentLayout>
  );
}
