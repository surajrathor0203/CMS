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
  Chip
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
  verifyPayment
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

const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9',
};

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
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
        
        // Set the active tab based on pending payments
        if (payments.length > 0) {
          setActiveTab('verify');
        } else if (activeTab === null) {
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

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteStudentFromBatch(studentToDelete._id, batchId);
      // Refresh the students list
      const studentsResponse = await getStudentsByBatch(batchId);
      setStudents(studentsResponse.data);
      setDeleteDialogOpen(false);
    } catch (err) {
      setError('Failed to delete student');
    }
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
    if (!selectedFile || !batchId) return;

    try {
      setUploadLoading(true);
      await uploadNote(selectedFile, batchId);
      
      // Refresh notes
      const notesResponse = await getNotesByBatch(batchId);
      setNotes(notesResponse.data);
      
      setNotesUploadOpen(false);
      setSelectedFile(null);
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
    return (
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacherInfo?.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={handleNotesUpload}
          sx={{ bgcolor: theme.primary }}
          size="small"
        >
          Upload Notes
        </Button>
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
                    <IconButton
                      size="small"
                      onClick={() => document.getElementById(`update-note-${note._id}`).click()}
                      disabled={noteActionLoading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => window.open(note.fileUrl, '_blank')}
                      disabled={noteActionLoading}
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteNoteClick(note)}
                      disabled={noteActionLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
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

  const InstallmentVerificationSection = () => {
    const [pendingPayments, setPendingPayments] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
  
    const fetchPendingPayments = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await getPendingPayments(batchId);
        const payments = response.data || [];
        setPendingPayments(payments);
        setPendingCount(payments.length); // Update the count here
      } catch (error) {
        console.error('Error fetching pending payments:', error);
        toast.error('Failed to fetch pending payments');
        setPendingCount(0);
      } finally {
        setIsLoading(false);
      }
    }, [batchId]);
  
    useEffect(() => {
      fetchPendingPayments();
    }, [fetchPendingPayments]);
  
    const handleVerify = (payment) => {
      setSelectedPayment(payment);
      setVerifyDialogOpen(true);
    };
  
    const handleApprovePayment = async () => {
      try {
        await verifyPayment(
          batchId,
          selectedPayment.paymentId,
          'approved',
          selectedPayment.studentId
        );
        toast.success('Payment approved successfully');
        setVerifyDialogOpen(false);
        fetchPendingPayments(); // Refresh the list
      } catch (error) {
        console.error('Error approving payment:', error);
        toast.error('Failed to approve payment');
      }
    };
  
    const handleRejectPayment = async () => {
      try {
        await verifyPayment(
          batchId,
          selectedPayment.paymentId,
          'rejected',
          selectedPayment.studentId
        );
        toast.success('Payment rejected');
        setVerifyDialogOpen(false);
        fetchPendingPayments(); // Refresh the list
      } catch (error) {
        console.error('Error rejecting payment:', error);
        toast.error('Failed to reject payment');
      }
    };
  
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }
  
    return (
      <Box>
        <Typography variant="h6" color={theme.primary} gutterBottom>
          Pending Installment Verifications
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {pendingPayments.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Installment</TableCell>
                  <TableCell>Submission Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingPayments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{payment.studentName}</TableCell>
                    <TableCell>₹{payment.amount}</TableCell>
                    <TableCell>{payment.installmentNumber}</TableCell>
                    <TableCell>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => window.open(payment.receiptUrl, '_blank')}
                          startIcon={<DownloadIcon />}
                        >
                          View Receipt
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleVerify(payment)}
                          startIcon={<PaidIcon />}
                          sx={{ bgcolor: theme.primary }}
                        >
                          Verify
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" color="text.secondary" textAlign="center">
            No pending installments to verify
          </Typography>
        )}
  
        <Dialog
          open={verifyDialogOpen}
          onClose={() => setVerifyDialogOpen(false)}
        >
          <DialogTitle>Verify Payment</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please verify the payment of ₹{selectedPayment?.amount} from {selectedPayment?.studentName}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setVerifyDialogOpen(false)}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectPayment}
              color="error"
              startIcon={<CancelIcon />}
            >
              Reject
            </Button>
            <Button
              onClick={handleApprovePayment}
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  return (
    <TeacherLayout title={batch.name}>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
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
            </Card>
          </Grid>

          {/* Tabs */}
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
                <Tab label="Students" value="students" />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Verify Installment
                      {pendingCount > 0 && (
                        <Chip
                          label={pendingCount}
                          color="error"
                          size="small"
                          sx={{ ml: 1, height: 20, minWidth: 20 }}
                        />
                      )}
                    </Box>
                  } 
                  value="verify" 
                />
              </Tabs>
            </Box>
          </Grid>

          {/* Content based on active tab */}
          {activeTab === 'students' && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddStudentClick}
                  sx={{ bgcolor: theme.primary }}
                >
                  Add New Student
                </Button>
              </Box>
              <Card elevation={2}>
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
                              <TableCell>Name</TableCell>
                              <TableCell>Email</TableCell>
                              <TableCell>Phone</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredStudents
                              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                              .map((student) => {
                                const teacherInfo = student.teachersInfo?.find(info => info.batchId === batchId);
                                return (
                                  <TableRow
                                    key={student._id}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                  >
                                    <TableCell component="th" scope="row">
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ bgcolor: theme.primary, width: 32, height: 32 }}>
                                          {student.name?.[0]?.toUpperCase() || 'S'}
                                        </Avatar>
                                        {student.name}
                                      </Box>
                                    </TableCell>
                                    <TableCell>{student.email}</TableCell>
                                    <TableCell>{student.phone}</TableCell>
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
                                        <IconButton
                                          onClick={() => handleDeleteClick(student)}
                                          color="error"
                                          size="small"
                                        >
                                          <DeleteIcon />
                                        </IconButton>
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
              </Card>
            </Grid>
          )}

          {activeTab === 'activity' && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  {/* Notes Section */}
                  <NotesSection />

                  {/* Quizzes Section */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" color={theme.primary}>
                        Quizzes
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleQuizDialogOpen}
                        sx={{ bgcolor: theme.primary }}
                        size="small"
                      >
                        Create Quiz
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {quizzes.map((quiz) => (
                        <Grid item xs={12} sm={6} md={4} key={quiz._id}>
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
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleEditQuiz(quiz._id, e)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleDeleteQuizClick(quiz, e)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
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
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAssignmentDialogOpen}
                        sx={{ bgcolor: theme.primary }}
                        size="small"
                      >
                        Add Assignment
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
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
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleDeleteAssignmentClick(assignment, e)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
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
              </Card>
            </Grid>
          )}

          {activeTab === 'verify' && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <InstallmentVerificationSection />
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {studentToDelete?.name} from this batch?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
      >
        <DialogTitle>Upload Notes</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please select a file to upload as notes for this batch.
          </DialogContentText>
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
            onClick={() => setNotesUploadOpen(false)}
            disabled={uploadLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUploadSubmit}
            disabled={!selectedFile || uploadLoading}
            variant="contained"
            sx={{ bgcolor: theme.primary }}
          >
            {uploadLoading ? 'Uploading...' : 'Upload'}
          </Button>
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
          <Button 
            onClick={handleAssignmentSubmit}
            variant="contained"
            sx={{ bgcolor: theme.primary }}
            disabled={!assignmentData.title || 
                     (!assignmentData.question && !assignmentData.file) || 
                     !assignmentData.endTime ||
                     uploadLoading}
          >
            {uploadLoading ? 'Creating...' : 'Create Assignment'}
          </Button>
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
    </TeacherLayout>
  );
}
