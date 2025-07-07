import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  Alert,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  LinearProgress,
  Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TeacherLayout from '../components/TeacherLayout';
import { 
  getBatchById, 
  getStudentsByBatch, 
  deleteStudentFromBatch, 
  uploadNote, 
  getNotesByBatch, 
  deleteNote, 
  updateNote,
  createAssignment,
  getAssignmentsByBatch,
  deleteAssignment,
  getQuizzesByBatch,
  deleteQuiz,
  getPendingPayments,
  verifyPayment,
  deleteMultipleStudents,
  toggleStudentLock,
  sendMessage,
  getMessages
} from '../services/api';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SubjectIcon from '@mui/icons-material/Subject';
import Loading from '../components/Loading';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import PaidIcon from '@mui/icons-material/Paid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { styled } from '@mui/material/styles';

// Enhanced Theme
const theme = {
  primary: '#2e7d32',
  secondary: '#1976d2',
  background: '#f4f6f8',
  text: {
    primary: '#333',
    secondary: '#666'
  },
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

export default function BatchPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(null);
  const [notesUploadOpen, setNotesUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState([]); // Initialize as empty array instead of null
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteNoteDialogOpen, setDeleteNoteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [noteActionLoading, setNoteActionLoading] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    question: '',
    endTime: '',
    file: null
  });
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [deleteAssignmentDialogOpen, setDeleteAssignmentDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [deleteQuizDialogOpen, setDeleteQuizDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [deleteMultipleDialogOpen, setDeleteMultipleDialogOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState('all'); // Add this line
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false); // Add this to the state declarations

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [batchResponse, studentsResponse, notesResponse] = await Promise.all([
        getBatchById(batchId),
        getStudentsByBatch(batchId),
        getNotesByBatch(batchId)
      ]);

      if (batchResponse.data) {
        setBatch(batchResponse.data);
      }
      if (studentsResponse.data) {
        setStudents(studentsResponse.data);
      }
      if (notesResponse.data) {
        setNotes(notesResponse.data);
      } else {
        setNotes([]); // Set empty array if no notes data
      }
    } catch (err) {
      setError('Failed to fetch data');
      setNotes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await getAssignmentsByBatch(batchId);
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
    }
  }, [batchId]);

  const fetchQuizzes = useCallback(async () => {
    try {
      const response = await getQuizzesByBatch(batchId);
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to fetch quizzes');
    }
  }, [batchId]);

  useEffect(() => {
    fetchData();
    fetchAssignments();
    fetchQuizzes();
  }, [batchId, fetchData, fetchAssignments, fetchQuizzes]);

  useEffect(() => {
    const checkPendingPayments = async () => {
      try {
        const response = await getPendingPayments(batchId);
        const payments = response.data || [];
        setPendingCount(payments.length);
        
        // Remove setting activeTab to verify, always default to activity
        if (activeTab === null) {
          setActiveTab('activity');
        }
      } catch (error) {
        console.error('Error checking pending payments:', error);
        setPendingCount(0);
        setActiveTab('activity');
      }
    };

    checkPendingPayments();
  }, [batchId]);

  useEffect(() => {
    const fetchPendingPayments = async () => {
      try {
        const response = await getPendingPayments(batchId);
        setPendingPayments(response.data || []);
      } catch (error) {
        console.error('Error fetching pending payments:', error);
        setPendingPayments([]);
      }
    };

    fetchPendingPayments();
  }, [batchId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (activeTab === 'message') {
        try {
          const response = await getMessages(batchId);
          setMessages(response.messages || []);
        } catch (error) {
          console.error('Error fetching messages:', error);
          toast.error('Failed to load messages');
        }
      }
    };
    fetchMessages();
  }, [batchId, activeTab]);

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAddStudentClick = () => {
    const encodedBatchName = encodeURIComponent(batch.name);
    navigate(`/teacher-dashboard/batch/${batchId}/add-student?name=${encodedBatchName}`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNotesUpload = () => {
    setNotesUploadOpen(true);
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !batchId || !noteTitle) return;

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('batchId', batchId);
      formData.append('title', noteTitle);

      await uploadNote(formData);
      
      // Refresh notes
      const notesResponse = await getNotesByBatch(batchId);
      setNotes(notesResponse.data);
      
      setNotesUploadOpen(false);
      setSelectedFile(null);
      setNoteTitle('');
    } catch (error) {
      setError('Failed to upload note');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      setNoteActionLoading(true);
      await deleteNote(noteId, batchId);
      // Refresh notes
      const notesResponse = await getNotesByBatch(batchId);
      setNotes(notesResponse.data);
      setDeleteNoteDialogOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      setError('Failed to delete note');
    } finally {
      setNoteActionLoading(false);
    }
  };

  const handleUpdateNote = async (noteId, file) => {
    try {
      setUploadLoading(true);
      await updateNote(noteId, file, batchId);
      
      // Refresh notes
      const notesResponse = await getNotesByBatch(batchId);
      setNotes(notesResponse.data);
    } catch (error) {
      setError('Failed to update note');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteNoteClick = (note) => {
    setNoteToDelete(note);
    setDeleteNoteDialogOpen(true);
  };

  const handleAssignmentDialogOpen = () => {
    setAssignmentDialogOpen(true);
  };

  const handleAssignmentDialogClose = () => {
    setAssignmentDialogOpen(false);
    setAssignmentData({
      title: '',
      question: '',
      endTime: '',
      file: null
    });
  };

  const handleAssignmentChange = (field) => (event) => {
    setAssignmentData(prev => ({
      ...prev,
      [field]: field === 'file' ? event.target.files[0] : event.target.value
    }));
  };

  const handleAssignmentSubmit = async () => {
    try {
      setUploadLoading(true);
      await createAssignment(assignmentData, batchId);
      handleAssignmentDialogClose();
      fetchAssignments();
    } catch (error) {
      setError('Failed to create assignment');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteAssignmentClick = (assignment, e) => {
    e.stopPropagation();
    setAssignmentToDelete(assignment);
    setDeleteAssignmentDialogOpen(true);
  };

  const handleDeleteAssignmentConfirm = async () => {
    try {
      setActionLoading(true);
      await deleteAssignment(assignmentToDelete._id, batchId);
      toast.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    } finally {
      setActionLoading(false);
      setDeleteAssignmentDialogOpen(false);
      setAssignmentToDelete(null);
    }
  };

  const handleQuizDialogOpen = () => {
    navigate(`/teacher-dashboard/batch/${batchId}/create-quiz`);
  };

  const handleDeleteQuizClick = (quiz, e) => {
    e.stopPropagation();
    setQuizToDelete(quiz);
    setDeleteQuizDialogOpen(true);
  };

  const handleDeleteQuizConfirm = async () => {
    try {
      setActionLoading(true);
      await deleteQuiz(quizToDelete._id);
      toast.success('Quiz deleted successfully');
      fetchQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    } finally {
      setActionLoading(false);
      setDeleteQuizDialogOpen(false);
      setQuizToDelete(null);
    }
  };

  const handleEditQuiz = (quizId, e) => {
    e.stopPropagation();
    navigate(`/teacher-dashboard/batch/${batchId}/edit-quiz/${quizId}`);
  };

  const handleQuizClick = (quiz) => {
    navigate(`/teacher-dashboard/batch/${batchId}/quiz/${quiz._id}/results?totalStudents=${filteredStudents.length}`);
  };

  const handleAssignmentClick = (assignment) => {
    navigate(`/teacher-dashboard/batch/${batchId}/assignment/${assignment._id}`, {
      state: assignment
    });
  };

  const filteredStudents = students.filter(student => {
    const teacherInfo = student.teachersInfo?.find(info => info.batchId === batchId);
    const matchesSearch = (
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacherInfo?.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isLocked = batch.lockedStudents?.some(ls => ls.studentId === student._id);

    switch (studentFilter) {
      case 'active':
        return matchesSearch && !isLocked;
      case 'locked':
        return matchesSearch && isLocked;
      default:
        return matchesSearch;
    }
  });

  const handleNotificationClick = () => {
    // Do nothing - removed setActiveTab('verify')
  };

  const handleApprovePayment = async (payment) => {
    try {
      await verifyPayment(
        batchId,
        payment.paymentId,
        'approved',
        payment.studentId
      );
      toast.success('Payment approved successfully');
      // Refresh pending payments
      const response = await getPendingPayments(batchId);
      setPendingPayments(response.data || []);
      setPendingCount((response.data || []).length);
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    }
  };

  const handleRejectPayment = async (payment) => {
    try {
      await verifyPayment(
        batchId,
        payment.paymentId,
        'rejected',
        payment.studentId
      );
      toast.success('Payment rejected');
      // Refresh pending payments
      const response = await getPendingPayments(batchId);
      setPendingPayments(response.data || []);
      setPendingCount((response.data || []).length);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedStudents(filteredStudents.map(student => student._id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleDeleteMultipleStudents = async () => {
    try {
      setActionLoading(true);
      
      await deleteMultipleStudents(selectedStudents, batchId);
      
      // Refresh the students list
      const studentsResponse = await getStudentsByBatch(batchId);
      setStudents(studentsResponse.data);
      
      // Clear selection
      setSelectedStudents([]);
      setDeleteMultipleDialogOpen(false);
      toast.success('Selected students and their data deleted successfully');
    } catch (error) {
      console.error('Error deleting students:', error);
      toast.error('Failed to delete some students');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async (studentId) => {
    try {
      await toggleStudentLock(batchId, studentId);
      // Refresh batch data to get updated locked students
      const batchResponse = await getBatchById(batchId);
      if (batchResponse.data) {
        setBatch(batchResponse.data);
      }
      toast.success('Student status updated successfully');
    } catch (error) {
      console.error('Error toggling student lock:', error);
      toast.error('Failed to update student status');
    }
  };

  if (loading || activeTab === null) {
    return (
      <TeacherLayout>
        <Loading message="Loading batch details..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout>
        <Alert severity="error">{error}</Alert>
      </TeacherLayout>
    );
  }

  if (!batch) {
    return (
      <TeacherLayout>
        <Alert severity="info">Batch not found</Alert>
      </TeacherLayout>
    );
  }

  const NotesSection = () => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" color={theme.primary}>
          Notes
        </Typography>
        <GradientButton
          startIcon={<UploadFileIcon />}
          onClick={handleNotesUpload}
          size="small"
        >
          Upload Notes
        </GradientButton>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {Array.isArray(notes) && notes.length > 0 ? ( // Add Array.isArray check
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(notes) && notes.map((note) => (
                <TableRow key={note._id}>
                  <TableCell>{note.title}</TableCell>
                  <TableCell align="right">
                    <input
                      type="file"
                      id={`update-note-${note._id}`}
                      style={{ display: 'none' }}
                      onChange={(e) => handleUpdateNote(note._id, e.target.files[0])}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      disabled={noteActionLoading}
                    />
                    <StyledIconButton
                      size="small"
                      onClick={() => document.getElementById(`update-note-${note._id}`).click()}
                      disabled={noteActionLoading}
                    >
                      <EditIcon />
                    </StyledIconButton>
                    <StyledIconButton
                      size="small"
                      onClick={() => window.open(note.fileUrl, '_blank')}
                      disabled={noteActionLoading}
                    >
                      <DownloadIcon />
                    </StyledIconButton>
                    <StyledIconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteNoteClick(note)}
                      disabled={noteActionLoading}
                    >
                      <DeleteIcon />
                    </StyledIconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body1" color="text.secondary" textAlign="center">
          No notes available
        </Typography>
      )}
    </Box>
  );

  const BatchAccountingSection = () => {
    const [accountingData, setAccountingData] = useState({
      totalPaid: 0,
      totalFees: 0,
      installmentBreakdown: []
    });
  
    useEffect(() => {
      if (!students || !batch) return;
  
      // Calculate total fees
      const totalFees = batch.fees * students.length;
      let totalPaid = 0;
      let installmentBreakdown = new Array(batch.numberOfInstallments).fill(0);
  
      // Calculate paid amounts for each installment
      batch.studentPayments.forEach(payment => {
        if (payment.payments) {
          payment.payments.forEach(p => {
            if (p.status === 'approved') {
              totalPaid += p.amount;
              if (p.installmentNumber && p.installmentNumber <= batch.numberOfInstallments) {
                installmentBreakdown[p.installmentNumber - 1] += p.amount;
              }
            }
          });
        }
      });
  
      setAccountingData({
        totalPaid,
        totalFees,
        installmentBreakdown
      });
    }, [students, batch]);
  
    return (
      <Box>
        <Typography variant="h6" color={theme.primary} gutterBottom>
          Batch Accounting Overview
        </Typography>
        <Divider sx={{ mb: 2 }} />
  
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Overall Payment Status
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    Total Paid: ₹{accountingData.totalPaid.toLocaleString()} / ₹{accountingData.totalFees.toLocaleString()}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(accountingData.totalPaid / accountingData.totalFees) * 100}
                    sx={{ 
                      mt: 1, 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: theme.light,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.primary
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                    {((accountingData.totalPaid / accountingData.totalFees) * 100).toFixed(1)}% paid
                  </Typography>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
  
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Installment Breakdown
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Installment</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Amount Collected</TableCell>
                        <TableCell>Expected Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accountingData.installmentBreakdown.map((amount, index) => {
                        const expectedAmount = (batch.fees / batch.numberOfInstallments) * students.length;
                        const percentage = (amount / expectedAmount) * 100;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>Installment {index + 1}</TableCell>
                            <TableCell>
                              {new Date(batch.installmentDates[index]).toLocaleDateString()}
                            </TableCell>
                            <TableCell>₹{amount.toLocaleString()}</TableCell>
                            <TableCell>₹{expectedAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={percentage}
                                  sx={{ 
                                    width: 100,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: theme.light,
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: theme.primary
                                    }
                                  }}
                                />
                                <Typography variant="body2">
                                  {percentage.toFixed(1)}%
                                </Typography>
                                <StyledIconButton
                                  size="small"
                                  onClick={() => navigate(`/teacher-dashboard/batch/${batchId}/installment/${index + 1}`)}
                                  sx={{ color: theme.primary }}
                                >
                                  <ArrowForwardIcon />
                                </StyledIconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <TeacherLayout 
      title={batch.name}
      pendingCount={pendingCount}
      onNotificationClick={handleNotificationClick}
      pendingPayments={pendingPayments}
      onApprovePayment={handleApprovePayment}
      onRejectPayment={handleRejectPayment}
      batchId={batchId} // Add this prop
    >
      <Box sx={{ p: 3, backgroundColor: theme.background, minHeight: '100vh' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" color={theme.primary} gutterBottom>
                  Batch Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SubjectIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Subject: {batch.subject}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccessTimeIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Time: {formatTime(batch.startTime)} - {formatTime(batch.endTime)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarTodayIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Opening Date: {formatDate(batch.openingDate)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Students: {filteredStudents.length}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Tabs */}
          <Grid item xs={12}>
            <StyledTabs 
              value={activeTab} 
              onChange={handleTabChange}
            >
              <Tab label="Batch Activity" value="activity" />
              <Tab label="Students" value="students" />
              <Tab label="Accounting" value="accounting" />
              <Tab label="Message" value="message" />
            </StyledTabs>
          </Grid>

          {/* Content based on active tab */}
          {activeTab === 'students' && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {selectedStudents.length > 0 && (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => setDeleteMultipleDialogOpen(true)}
                      startIcon={<DeleteIcon />}
                    >
                      Delete Selected ({selectedStudents.length})
                    </Button>
                  )}
                </Box>
                <GradientButton
                  startIcon={<AddIcon />}
                  onClick={handleAddStudentClick}
                >
                  Add New Student
                </GradientButton>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant={studentFilter === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setStudentFilter('all')}
                  sx={{ 
                    borderRadius: '20px',
                    '&.MuiButton-contained': {
                      background: theme.primary
                    }
                  }}
                >
                  All Students ({students.length})
                </Button>
                <Button
                  variant={studentFilter === 'active' ? 'contained' : 'outlined'}
                  onClick={() => setStudentFilter('active')}
                  color="success"
                  sx={{ 
                    borderRadius: '20px',
                    '&.MuiButton-contained': {
                      background: '#2e7d32'
                    }
                  }}
                >
                  Active ({students.filter(s => !batch.lockedStudents?.some(ls => ls.studentId === s._id)).length})
                </Button>
                <Button
                  variant={studentFilter === 'locked' ? 'contained' : 'outlined'}
                  onClick={() => setStudentFilter('locked')}
                  color="error"
                  sx={{ 
                    borderRadius: '20px',
                    '&.MuiButton-contained': {
                      background: '#d32f2f'
                    }
                  }}
                >
                  Locked ({batch.lockedStudents?.length || 0})
                </Button>
              </Box>
              <StyledCard>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Search students by name, email, phone or subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: theme.light,
                          },
                          '&:hover fieldset': {
                            borderColor: theme.primary,
                          },
                        },
                      }}
                    />
                  </Box>
                  
                  {students && students.length > 0 ? (
                    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                      <TableContainer>
                        <Table stickyHeader aria-label="students table">
                          <TableHead>
                            <TableRow>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
                                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                                  onChange={handleSelectAll}
                                />
                              </TableCell>
                              <TableCell>UserName</TableCell>
                              <TableCell>Email</TableCell>
                              <TableCell>Phone</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredStudents
                              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                              .map((student) => {
                                const isLocked = batch.lockedStudents?.some(
                                  ls => ls.studentId === student._id
                                );
                                
                                return (
                                  <TableRow
                                    key={student._id}
                                    selected={selectedStudents.includes(student._id)}
                                  >
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={selectedStudents.includes(student._id)}
                                        onChange={() => handleSelectStudent(student._id)}
                                      />
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar 
                                          src={student.profilePicture?.url}
                                          sx={{ 
                                            bgcolor: theme.primary, 
                                            width: 35, 
                                            height: 35,
                                            '& img': {
                                              objectFit: 'cover',
                                              width: '100%',
                                              height: '100%'
                                            }
                                          }}
                                        >
                                          {(!student.profilePicture?.url) && (student.username?.[0]?.toUpperCase() || 'S')}
                                        </Avatar>
                                        {student.username}
                                      </Box>
                                    </TableCell>
                                    <TableCell>{student.email}</TableCell>
                                    <TableCell>{student.phone}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={isLocked ? "Locked" : "Active"}
                                        color={isLocked ? "error" : "success"}
                                        size="small"
                                        sx={{
                                          '& .MuiChip-label': {
                                            fontWeight: 500
                                          }
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          onClick={() => navigate(`/teacher-dashboard/batch/${batchId}/student/${student._id}`)}
                                          sx={{ color: theme.primary, borderColor: theme.primary }}
                                        >
                                          Detail
                                        </Button>
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          color={isLocked ? "success" : "error"}
                                          onClick={() => handleToggleLock(student._id)}
                                        >
                                          {isLocked ? "Unlock" : "Lock"}
                                        </Button>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredStudents.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                      />
                    </Paper>
                  ) : (
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      No students enrolled yet
                    </Typography>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>
          )}

          {activeTab === 'activity' && (
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  {/* Notes Section */}
                  <NotesSection />

                  {/* Quizzes Section */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" color={theme.primary}>
                        Quizzes
                      </Typography>
                      <GradientButton
                        startIcon={<AddIcon />}
                        onClick={handleQuizDialogOpen}
                        size="small"
                      >
                        Create Quiz
                      </GradientButton>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {quizzes.map((quiz) => (
                        <Grid item xs={12} sm={6} md={4} key={quiz._id}>
                          <StyledCard
                            sx={{ cursor: 'pointer' }}
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
                                Start Time: {new Date(quiz.startTime).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Questions: {quiz.questions.length}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                <StyledIconButton
                                  size="small"
                                  onClick={(e) => handleEditQuiz(quiz._id, e)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </StyledIconButton>
                                <StyledIconButton
                                  size="small"
                                  onClick={(e) => handleDeleteQuizClick(quiz, e)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </StyledIconButton>
                              </Box>
                            </CardContent>
                          </StyledCard>
                        </Grid>
                      ))}
                    </Grid>
                    {quizzes.length === 0 && (
                      <Typography variant="body1" color="text.secondary" textAlign="center">
                        No quizzes available
                      </Typography>
                    )}
                    <Divider sx={{ mt: 2 }} />
                  </Box>

                  {/* Assignments Section */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" color={theme.primary}>
                        Assignments
                      </Typography>
                      <GradientButton
                        startIcon={<AddIcon />}
                        onClick={handleAssignmentDialogOpen}
                        size="small"
                      >
                        Add Assignment
                      </GradientButton>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {assignments.map((assignment) => (
                        <Grid item xs={12} sm={6} md={4} key={assignment._id}>
                          <StyledCard
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleAssignmentClick(assignment)}
                          >
                            <CardContent>
                              <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                                {assignment.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Due: {new Date(assignment.endTime).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <StyledIconButton
                                  size="small"
                                  onClick={(e) => handleDeleteAssignmentClick(assignment, e)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </StyledIconButton>
                              </Box>
                            </CardContent>
                          </StyledCard>
                        </Grid>
                      ))}
                    </Grid>
                    {assignments.length === 0 && (
                      <Typography variant="body1" color="text.secondary" textAlign="center">
                        No assignments available
                      </Typography>
                    )}
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          )}

          {activeTab === 'accounting' && (
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  <BatchAccountingSection />
                </CardContent>
              </StyledCard>
            </Grid>
          )}

          {activeTab === 'message' && (
            <Grid item xs={12}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <StyledCard>
                    <CardContent>
                      <Typography variant="h6" color={theme.primary} gutterBottom>
                        Write Message
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        placeholder="Type your message here..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        sx={{ mb: 2 }}
                        disabled={sendingMessage}
                      />
                      <GradientButton
                        onClick={async () => {
                          if (newMessage.trim()) {
                            try {
                              setSendingMessage(true);
                              const response = await sendMessage(batchId, newMessage.trim());
                              
                              if (response.success) {
                                setMessages(prev => [...prev, response.data]);
                                setNewMessage('');
                                toast.success('Message sent successfully');
                              }
                            } catch (error) {
                              console.error('Error sending message:', error);
                              toast.error('Failed to send message');
                            } finally {
                              setSendingMessage(false);
                            }
                          }
                        }}
                        disabled={!newMessage.trim() || sendingMessage}
                        fullWidth
                      >
                        {sendingMessage ? (
                          <>
                            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                            Sending...
                          </>
                        ) : (
                          'Send Message'
                        )}
                      </GradientButton>
                    </CardContent>
                  </StyledCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <StyledCard>
                    <CardContent>
                      <Typography variant="h6" color={theme.primary} gutterBottom>
                        Messages History
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ height: '400px', overflowY: 'auto' }}>
                        {messages.length > 0 ? (
                          [...messages].reverse().map((message) => {
                            const isRecent = (new Date() - new Date(message.timestamp)) < (48 * 60 * 60 * 1000);
                            
                            return (
                              <Box
                                key={message._id || `msg-${message.timestamp}`}
                                sx={{
                                  mb: 2,
                                  p: 2,
                                  backgroundColor: isRecent ? '#e8f5e9' : '#f5f5f5',
                                  borderRadius: 2,
                                  '&:hover': {
                                    backgroundColor: isRecent ? '#c8e6c9' : '#f0f0f0'
                                  }
                                }}
                              >
                                <Typography 
                                  variant="subtitle2" 
                                  color={isRecent ? "success.main" : "primary"}
                                  gutterBottom
                                >
                                  {message.senderName}
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                  {message.content}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(message.timestamp).toLocaleString()}
                                </Typography>
                              </Box>
                            );
                          })
                        ) : (
                          <Typography variant="body1" color="text.secondary" textAlign="center">
                            No messages yet
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Box>
      <Dialog
        open={deleteNoteDialogOpen}
        onClose={() => !noteActionLoading && setDeleteNoteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this note? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteNoteDialogOpen(false)}
            disabled={noteActionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleDeleteNote(noteToDelete?._id)}
            color="error" 
            disabled={noteActionLoading}
          >
            {noteActionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={notesUploadOpen} 
        onClose={() => !uploadLoading && setNotesUploadOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: theme.borderRadius,
            p: 1
          }
        }}
      >
        <DialogTitle>Upload Notes</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please enter a title and select a file to upload as notes for this batch.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Note Title"
            fullWidth
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            disabled={uploadLoading}
          />
          {uploadLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography>Uploading...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setNotesUploadOpen(false);
              setNoteTitle('');
              setSelectedFile(null);
            }}
            disabled={uploadLoading}
          >
            Cancel
          </Button>
          <GradientButton
            onClick={handleUploadSubmit}
            disabled={!selectedFile || !noteTitle || uploadLoading}
          >
            {uploadLoading ? 'Uploading...' : 'Upload'}
          </GradientButton>
        </DialogActions>
      </Dialog>
      <Dialog 
        open={assignmentDialogOpen} 
        onClose={handleAssignmentDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Assignment Title"
              fullWidth
              value={assignmentData.title}
              onChange={handleAssignmentChange('title')}
              required
            />
            
            <TextField
              label="Question"
              fullWidth
              multiline
              rows={4}
              value={assignmentData.question}
              onChange={handleAssignmentChange('question')}
              required
            />
            
            <TextField
              label="End Time"
              type="datetime-local"
              fullWidth
              value={assignmentData.endTime}
              onChange={handleAssignmentChange('endTime')}
              InputLabelProps={{
                shrink: true,
              }}
              required
            />
            
            <Box>
              <input
                type="file"
                id="assignment-file"
                style={{ display: 'none' }}
                onChange={handleAssignmentChange('file')}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="assignment-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadFileIcon />}
                >
                  Upload File (Optional)
                </Button>
              </label>
              {assignmentData.file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {assignmentData.file.name}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignmentDialogClose}>Cancel</Button>
          <GradientButton 
            onClick={handleAssignmentSubmit}
            disabled={!assignmentData.title || 
                     (!assignmentData.question && !assignmentData.file) || 
                     !assignmentData.endTime ||
                     uploadLoading}
          >
            {uploadLoading ? 'Creating...' : 'Create Assignment'}
          </GradientButton>
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteAssignmentDialogOpen}
        onClose={() => !actionLoading && setDeleteAssignmentDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this assignment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteAssignmentDialogOpen(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAssignmentConfirm}
            color="error" 
            disabled={actionLoading}
          >
            {actionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteQuizDialogOpen}
        onClose={() => !actionLoading && setDeleteQuizDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this quiz? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteQuizDialogOpen(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteQuizConfirm}
            color="error" 
            disabled={actionLoading}
          >
            {actionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteMultipleDialogOpen}
        onClose={() => !actionLoading && setDeleteMultipleDialogOpen(false)}
      >
        <DialogTitle>Confirm Multiple Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {selectedStudents.length} selected students from this batch?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteMultipleDialogOpen(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteMultipleStudents}
            color="error" 
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {actionLoading ? 'Deleting...' : 'Delete Selected'}
          </Button>
        </DialogActions>
      </Dialog>
    </TeacherLayout>
  );
}
