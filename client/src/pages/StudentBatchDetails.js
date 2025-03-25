import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentBatchDetails, getNotesByBatch, getQuizzesByBatch, getAssignmentsByBatch, getPayments, submitPayment } from '../services/api';
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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SubjectIcon from '@mui/icons-material/Subject';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockIcon from '@mui/icons-material/Lock'; // Add this import
import LockOpenIcon from '@mui/icons-material/LockOpen'; // Add this import
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { getUserFromCookie } from '../utils/cookies';

// Same theme as BatchPage
const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9',
};

const UploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
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

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
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
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => window.open(note.fileUrl, '_blank')}
                    title="Download Note"
                  >
                    <DownloadIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={note.title} />
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
        submittedAt: studentAttempt.submittedAt
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
    <Card 
      elevation={2}
      sx={{ 
        cursor: 'pointer',
        '&:hover': { boxShadow: 6 },
        position: 'relative' // Add this for absolute positioning of status chip
      }}
      onClick={() => handleQuizClick(quiz)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3">
            {quiz.title}
          </Typography>
          <Chip 
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
            <Chip 
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
    </Card>
  );
};

const QuizResultDialog = () => (
  <Dialog open={showScoreDialog} onClose={() => setShowScoreDialog(false)}>
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
      <Button onClick={() => setShowScoreDialog(false)}>Close</Button>
    </DialogActions>
  </Dialog>
);

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
  <Card elevation={2}>
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
  </Card>
);

const PaymentSection = () => {
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
        <Card elevation={3} sx={{ borderRadius: 2 }}>
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
              <UploadBox>
                <CloudUploadIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
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
              </UploadBox>
              
              {formData.receipt && (
                <Paper variant="outlined" sx={{ p: 1, mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {formData.receipt.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => setFormData(prev => ({ ...prev, receipt: null }))}
                  >
                    ×
                  </IconButton>
                </Paper>
              )}

              {/* Submit Button */}
              <Button 
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
              </Button>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Payment History Section */}
      <Grid item xs={12}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
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
                      <IconButton 
                        edge="end" 
                        color="primary"
                        onClick={() => window.open(payment.receiptUrl, '_blank')}
                      >
                        <DownloadIcon />
                      </IconButton>
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
                            <Chip 
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
        </Card>
      </Grid>
    </Grid>
  );
}

const fetchPaymentHistory = async () => {
  try {
    const response = await getPayments(batchId, studentId);
    setPaymentHistory(response.data.payments || []);
  } catch (error) {
    toast.error('Failed to fetch payment history');
  }
};

useEffect(() => {
  if (studentId) {
    fetchPaymentHistory();
  }
}, [studentId]);

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
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Batch Information Card */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color={theme.primary}>
                    Batch Information
                  </Typography>
                  <Chip
                    icon={isLocked ? <LockIcon /> : <LockOpenIcon />}
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
                      <AccessTimeIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Time: {formatTime(batchDetails?.startTime)} - {formatTime(batchDetails?.endTime)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarTodayIcon sx={{ color: theme.primary, mr: 1 }} />
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
            </Card>
          </Grid>

          {/* Add Payment Section here, after the batch information card */}
          {/* <PaymentSection /> */}

          {/* Tabs Section */}
          <Grid item xs={12}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': { 
                    fontWeight: 'bold',
                    '&.Mui-disabled': {
                      color: 'rgba(0, 0, 0, 0.38)' // Grayed out color for disabled tabs
                    }
                  },
                  '& .Mui-selected': { color: theme.primary },
                  '& .MuiTabs-indicator': { backgroundColor: theme.primary }
                }}
              >
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
              </Tabs>
            </Box>
          </Grid>

          {/* Content based on active tab */}
          {activeTab === 'activity' && (
            <Grid item xs={12}>
              <Card elevation={2}>
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
                            <Card 
                              elevation={2}
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { boxShadow: 6 }
                              }}
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
                                    <IconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent card click
                                        window.open(assignment.fileUrl, '_blank')
                                      }}
                                      title="Download Assignment"
                                    >
                                      <DownloadIcon />
                                    </IconButton>
                                  </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {isAssignmentOverdue(assignment.endTime) ? 
                                      <Chip 
                                        label="Overdue" 
                                        color="error" 
                                        size="small" 
                                      /> : 
                                      <Typography variant="body2" color="text.secondary">
                                        {getTimeRemaining(assignment.endTime)}
                                      </Typography>
                                    }
                                  </Typography>
                                  <Chip
                                    label={assignment.submitted ? 'Submitted' : 'Not Submitted'}
                                    color={assignment.submitted ? 'success' : 'warning'}
                                    size="small"
                                  />
                                </Box>
                              </CardContent>
                            </Card>
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
              </Card>
            </Grid>
          )}

          {activeTab === 'progress' && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    My Progress Coming Soon...
                  </Typography>
                </CardContent>
              </Card>
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
