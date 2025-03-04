import React, { useState } from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import TeacherLayout from '../components/TeacherLayout';
import { createMultipleStudents, checkStudentEmail } from '../services/api';

const emptyStudent = {
  email: '',
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

      const response = await createMultipleStudents(studentsData, batchDetails);
      
      if (response.success) {
        if (response.partialSuccess) {
          setError(`Some students were added successfully, but there were issues: ${response.errors.join('; ')}`);
          setTimeout(() => {
            navigate(`/teacher-dashboard/batch/${batchId}`);
          }, 3000);
        } else {
          navigate(`/teacher-dashboard/batch/${batchId}`);
        }
      } else {
        setError(response.message || 'Failed to add students');
      }
    } catch (err) {
      console.error('Error adding students:', err);
      setError(err.message || 'Failed to add students');
    }
  };

  return (
    <TeacherLayout title="Add Students">
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
    </TeacherLayout>
  );
};

export default AddStudent;
