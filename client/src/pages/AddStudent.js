import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserFromCookie } from '../utils/cookies';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import TeacherLayout from '../components/TeacherLayout';
import { createMultipleStudents } from '../services/api';

const AddStudent = () => {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const [emailVerified, setEmailVerified] = useState(false);
  const userData = getUserFromCookie(); // Add this line to get user data
  const [studentData, setStudentData] = useState({
    email: '',
    name: '',
    phone: '',
    parentPhone: '',
    address: '',
    role: 'student',
    subject: userData?.user?.subject || '' // Get subject from teacher's data
  });
  const [error, setError] = useState('');

  const handleVerifyEmail = async () => {
    // Add your email verification logic here
    try {
      // Example verification check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(studentData.email)) {
        setEmailVerified(true);
        setError('');
      } else {
        setError('Invalid email format');
      }
    } catch (err) {
      setError('Email verification failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailVerified) {
      setError('Please verify email first');
      return;
    }
    try {
      // Check if user data exists
      if (!userData || !userData.user || !userData.user.id) {
        setError('Teacher authentication required');
        return;
      }

      console.log('User Data:', userData); // For debugging
      
      const students = [{
        ...studentData,
        batchId,
        teacherId: userData.user.id,
        role: 'student',
        subject: userData.user.subject // Ensure subject is included
      }];

      console.log('Sending student data:', students); // For debugging
      
      const response = await createMultipleStudents(students);
      if (response.success) {
        navigate(`/teacher-dashboard/batch/${batchId}`);
      } else {
        setError(response.message || 'Failed to add student');
      }
    } catch (err) {
      console.error('Error adding student:', err);
      setError(err.message || 'Failed to add student');
    }
  };

  return (
    <TeacherLayout title={"Add New Student"}>
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {emailVerified && <Alert severity="success" sx={{ mb: 2 }}>Email verified successfully!</Alert>}
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  margin="normal"
                  value={studentData.email}
                  onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                  required
                  disabled={emailVerified}
                />
                <Button
                  variant="contained"
                  onClick={handleVerifyEmail}
                  disabled={emailVerified || !studentData.email}
                  sx={{ mt: 1, height: 56 }}
                >
                  Verify
                </Button>
              </Box>
              <TextField
                fullWidth
                label="Student Name"
                margin="normal"
                value={studentData.name}
                onChange={(e) => setStudentData({...studentData, name: e.target.value})}
                required
              />
              <TextField
                fullWidth
                label="Student Phone Number"
                margin="normal"
                value={studentData.phone}
                onChange={(e) => setStudentData({...studentData, phone: e.target.value})}
                required
              />
              <TextField
                fullWidth
                label="Parent's Phone Number"
                margin="normal"
                value={studentData.parentPhone}
                onChange={(e) => setStudentData({...studentData, parentPhone: e.target.value})}
                required
              />
              <TextField
                fullWidth
                label="Address"
                margin="normal"
                multiline
                rows={3}
                value={studentData.address}
                onChange={(e) => setStudentData({...studentData, address: e.target.value})}
                required
              />
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                >
                  Add Student
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
