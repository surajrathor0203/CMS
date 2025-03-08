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
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TeacherLayout from '../components/TeacherLayout';
import { getBatchById, getStudentsByBatch, deleteStudentFromBatch } from '../services/api';
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

        <Grid container spacing={3}>
          {/* Batch Information Card - Full Width */}
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

          {/* Students List Card - New Row */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color={theme.primary}>
                    Enrolled Students
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {/* Add Search Box */}
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
        </Grid>
      </Box>

      {/* Add Delete Confirmation Dialog */}
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
    </TeacherLayout>
  );
}
