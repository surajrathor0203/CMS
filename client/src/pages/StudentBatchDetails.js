import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentBatchDetails, getNotesByBatch, getQuizzesByBatch, getAssignmentsByBatch } from '../services/api';
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
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SubjectIcon from '@mui/icons-material/Subject';
import DownloadIcon from '@mui/icons-material/Download';
import { toast } from 'react-toastify';
import { getUserFromCookie } from '../utils/cookies';

// Same theme as BatchPage
const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9',
};

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

  useEffect(() => {
    // Get student ID from cookies when component mounts
    const userData = getUserFromCookie();
    if (userData?.user?.id) {
      setStudentId(userData.user.id);
    }
  }, []);

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

  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        setBatchLoading(true);
        const response = await getStudentBatchDetails(batchId);
        setBatchDetails(response);
      } catch (err) {
        setBatchError(err.message || 'Failed to fetch batch details');
      } finally {
        setBatchLoading(false);
      }
    };

    fetchBatchDetails();
  }, [batchId]);

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

const QuizCard = ({ quiz }) => {
  const studentAttempt = quiz.students?.find(
    student => student.studentId === studentId
  );

  return (
    <Card 
      elevation={2}
      sx={{ 
        cursor: 'pointer',
        '&:hover': { boxShadow: 6 }
      }}
      onClick={() => handleQuizClick(quiz)}
    >
      <CardContent>
        <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
          {quiz.title}
        </Typography>
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
                <Typography variant="h6" gutterBottom color={theme.primary}>
                  Batch Information
                </Typography>
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

          {/* Tabs Section */}
          <Grid item xs={12}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': { fontWeight: 'bold' },
                  '& .Mui-selected': { color: theme.primary },
                  '& .MuiTabs-indicator': { backgroundColor: theme.primary }
                }}
              >
                <Tab label="Batch Activity" value="activity" />
                <Tab label="My Progress" value="progress" />
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
        </Grid>
      </Box>
      <QuizResultDialog />
    </StudentLayout>
  );
}
