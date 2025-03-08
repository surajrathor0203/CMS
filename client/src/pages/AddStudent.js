import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getUserFromCookie } from '../utils/cookies';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  IconButton,
  Typography,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import TeacherLayout from '../components/TeacherLayout';
import { createMultipleStudents, checkStudentEmail } from '../services/api';
import Loading from '../components/Loading';

const emptyStudent = {
  email: '',
  username: '',  // Add username field
  name: '',
  phone: '',
  parentPhone: '',
  address: '',
  role: 'student',
  isVerified: false,
  exists: false,
};

const AddStudent = () => {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const [searchParams] = useSearchParams();
  const batchName = searchParams.get('name');
  const userData = getUserFromCookie();
  const [students, setStudents] = useState([{ ...emptyStudent }]);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    // Simulate initial page load
    setTimeout(() => setInitialLoading(false), 1000);
  }, []);

  const handleVerifyEmail = async (index) => {
    setIsVerifying(prev => ({ ...prev, [index]: true }));
    setError('');
    
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(students[index].email)) {
        setError('Invalid email format');
        return;
      }

      const response = await checkStudentEmail(students[index].email, userData.user.id);
      
      const updatedStudents = [...students];
      updatedStudents[index] = {
        ...updatedStudents[index],
        isVerified: true,
        exists: response.exists,
      };

      if (response.exists && response.data) {
        updatedStudents[index] = {
          ...updatedStudents[index],
          username: response.data.username || '',  // Add username from existing data
          name: response.data.name || '',
          phone: response.data.phone || '',
          parentPhone: response.data.parentPhone || '',
          address: response.data.address || '',
        };
      }

      setStudents(updatedStudents);
    } catch (err) {
      setError(err.message || 'Email verification failed');
    } finally {
      setIsVerifying(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleStudentChange = (index, field, value) => {
    const updatedStudents = [...students];
    updatedStudents[index] = {
      ...updatedStudents[index],
      [field]: value,
      isVerified: field === 'email' ? false : updatedStudents[index].isVerified,
    };
    setStudents(updatedStudents);
  };

  const addMoreStudent = () => {
    setStudents([...students, { ...emptyStudent }]);
  };

  const removeStudent = (index) => {
    const updatedStudents = students.filter((_, i) => i !== index);
    setStudents(updatedStudents);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const unverifiedStudents = students.filter(s => !s.isVerified);
    if (unverifiedStudents.length > 0) {
      setError('Please verify all email addresses');
      return;
    }

    setSubmitting(true);
    setProgress(0);
    setProcessedCount(0);
    
    try {
      const studentsData = students.map(student => ({
        ...student,
        teachersInfo: [{
          batchId: batchId,
          teacherId: userData.user.id,
          subject: userData.user.subject
        }]
      }));

      const batchDetails = {
        name: batchName || 'New Batch',
        subject: userData.user.subject
      };

      // Update progress as each student is processed
      const updateProgress = (count) => {
        setProcessedCount(count);
        setProgress((count / students.length) * 100);
      };

      const response = await createMultipleStudents(studentsData, batchDetails);
      setProgress(100);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Students added successfully!',
          severity: 'success'
        });

        if (response.partialSuccess) {
          setError(`Some students were added successfully, but there were issues: ${response.errors.join('; ')}`);
          setTimeout(() => {
            navigate(`/teacher-dashboard/batch/${batchId}`);
          }, 3000);
        } else {
          setTimeout(() => {
            navigate(`/teacher-dashboard/batch/${batchId}`);
          }, 1000);
        }
      } else {
        setError(response.message || 'Failed to add students');
        setSnackbar({
          open: true,
          message: 'Failed to add students',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Error adding students:', err);
      setError(err.message || 'Failed to add students');
      setSnackbar({
        open: true,
        message: 'Error adding students',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TeacherLayout title="Add Students">
      {initialLoading ? (
        <Loading message="Loading form..." />
      ) : (
        <Box sx={{ p: 3 }}>
          <Card>
            <CardContent>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <form onSubmit={handleSubmit}>
                {students.map((student, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Student {index + 1}</Typography>
                      {students.length > 1 && (
                        <IconButton onClick={() => removeStudent(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={student.email}
                        onChange={(e) => handleStudentChange(index, 'email', e.target.value)}
                        required
                        disabled={student.isVerified}
                      />
                      <Button
                        variant="contained"
                        onClick={() => handleVerifyEmail(index)}
                        disabled={student.isVerified || !student.email || isVerifying[index]}
                        sx={{ height: 56 }}
                      >
                        {isVerifying[index] ? 'Verifying...' : student.isVerified ? 'Verified' : 'Verify'}
                      </Button>
                    </Box>

                    {/* <TextField
                      fullWidth
                      label="Username"
                      margin="normal"
                      value={student.username}
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="Username will be auto-generated"
                    /> */}

                    <TextField
                      fullWidth
                      label="Student Name"
                      margin="normal"
                      value={student.name}
                      onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                      required
                      disabled={!student.isVerified || student.exists}
                    />
                    <TextField
                      fullWidth
                      label="Student Phone Number"
                      margin="normal"
                      value={student.phone}
                      onChange={(e) => handleStudentChange(index, 'phone', e.target.value)}
                      required
                      disabled={!student.isVerified || student.exists}
                    />
                    <TextField
                      fullWidth
                      label="Parent's Phone Number"
                      margin="normal"
                      value={student.parentPhone}
                      onChange={(e) => handleStudentChange(index, 'parentPhone', e.target.value)}
                      required
                      disabled={!student.isVerified || student.exists}
                    />
                    <TextField
                      fullWidth
                      label="Address"
                      margin="normal"
                      multiline
                      rows={3}
                      value={student.address}
                      onChange={(e) => handleStudentChange(index, 'address', e.target.value)}
                      required
                      disabled={!student.isVerified || student.exists}
                    />
                    
                    {index < students.length - 1 && (
                      <Divider sx={{ my: 3 }} />
                    )}
                  </Box>
                ))}

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={addMoreStudent}
                  >
                    Add Another Student
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={students.some(s => !s.isVerified)}
                  >
                    Submit All
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/teacher-dashboard/batch/${batchId}`)}
                  >
                    Cancel
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Box>
      )}
      <Dialog open={submitting} disableEscapeKeyDown>
        <DialogTitle>Adding Students</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 3
          }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Processing students... {processedCount}/{students.length}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </TeacherLayout>
  );
};

export default AddStudent;
