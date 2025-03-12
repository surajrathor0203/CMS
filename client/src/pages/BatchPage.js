import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TeacherLayout from '../components/TeacherLayout';
import { getBatchById, getStudentsByBatch, deleteStudentFromBatch, uploadBatchNotes } from '../services/api';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SubjectIcon from '@mui/icons-material/Subject';
import Loading from '../components/Loading';

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
  const [activeTab, setActiveTab] = useState('activity');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteFile, setNoteFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [batchId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchResponse, studentsResponse] = await Promise.all([
        getBatchById(batchId),
        getStudentsByBatch(batchId)
      ]);

      if (batchResponse.data) {
        setBatch(batchResponse.data);
      }
      if (studentsResponse.data) {
        setStudents(studentsResponse.data);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

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

  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setNoteTitle('');
    setNoteFile(null);
  };

  const handleFileChange = (event) => {
    setNoteFile(event.target.files[0]);
  };

  const handleUploadSubmit = async () => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', noteTitle);
      formData.append('file', noteFile);

      await uploadBatchNotes(batchId, formData);
      handleUploadDialogClose();
      // Show success message
      setError('');
      // Optionally refresh the notes list here
    } catch (err) {
      setError('Failed to upload notes: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
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

  if (loading) {
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
                              <TableCell>Subject</TableCell>
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
                                    <TableCell>{teacherInfo?.subject || 'N/A'}</TableCell>
                                    <TableCell>
                                      <IconButton
                                        onClick={() => handleDeleteClick(student)}
                                        color="error"
                                        size="small"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
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
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" color={theme.primary}>
                        Notes
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        onClick={handleUploadDialogOpen}
                        sx={{ bgcolor: theme.primary }}
                      >
                        Upload Notes
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      No notes available
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Box>

                  {/* Quizzes Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color={theme.primary} gutterBottom>
                      Quizzes
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      No quizzes available
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Box>

                  {/* Assignments Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color={theme.primary} gutterBottom>
                      Assignments
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      No assignments available
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Box>
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

      <Dialog open={uploadDialogOpen} onClose={handleUploadDialogClose}>
        <DialogTitle>Upload Batch Notes</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please enter a title for the notes and select a file to upload.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Note Title"
            type="text"
            fullWidth
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <input
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            id="note-file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="note-file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
            >
              Select File
            </Button>
          </label>
          {noteFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected file: {noteFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUploadSubmit}
            disabled={!noteTitle || !noteFile || uploading}
            sx={{ color: theme.primary }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </TeacherLayout>
  );
}
