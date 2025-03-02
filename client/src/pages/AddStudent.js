import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserFromCookie } from '../utils/cookies';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import TeacherLayout from '../components/TeacherLayout';
import { createMultipleStudents, checkStudentEmail, updateStudentTeacherInfo } from '../services/api';

const AddStudent = () => {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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
  const [studentExists, setStudentExists] = useState(false);

  const handleVerifyEmail = async () => {
    setIsVerifying(true);
    setError('');
    
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(studentData.email)) {
        setError('Invalid email format');
        return;
      }

      const response = await checkStudentEmail(studentData.email, userData.user.id);
      
      setEmailVerified(true);
      
      if (response.exists) {
        setStudentExists(true);
        setError('Student already exists in the system');
        // Assuming the response includes student data
        if (response.data) {
          setStudentData({
            ...studentData,
            name: response.data.name || '',
            phone: response.data.phone || '',
            parentPhone: response.data.parentPhone || '',
            address: response.data.address || '',
          });
        }
      } else {
        setStudentExists(false);
      }
    } catch (err) {
      setError(err.message || 'Email verification failed');
      setEmailVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailVerified) {
      setError('Please verify email first');
      return;
    }
    try {
      if (!userData || !userData.user || !userData.user.id) {
        setError('Teacher authentication required');
        return;
      }

      const teacherInfo = {
        batchId: batchId,
        teacherId: userData.user.id,
        subject: userData.user.subject
      };

      if (studentExists) {
        // Update existing student
        const response = await updateStudentTeacherInfo(studentData.email, teacherInfo);
        if (response.success) {
          navigate(`/teacher-dashboard/batch/${batchId}`);
        } else {
          setError(response.message || 'Failed to update student');
        }
      } else {
        // Create new student
        const students = [{
          ...studentData,
          teachersInfo: [teacherInfo],
          role: 'student'
        }];
        
        const response = await createMultipleStudents(students);
        if (response.success) {
          navigate(`/teacher-dashboard/batch/${batchId}`);
        } else {
          setError(response.message || 'Failed to add student');
        }
      }
    } catch (err) {
      console.error('Error adding/updating student:', err);
      setError(err.message || 'Failed to add/update student');
    }
  };

  return (
    <TeacherLayout title={studentExists ? "Update Student" : "Add New Student"}>
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {emailVerified && !studentExists && (
              <Alert severity="success" sx={{ mb: 2 }}>Email verified. You can proceed with adding the student.</Alert>
            )}
            {studentExists && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This student is already registered. Please use a different email address.
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  margin="normal"
                  value={studentData.email}
                  onChange={(e) => {
                    setStudentData({...studentData, email: e.target.value});
                    setEmailVerified(false);
                    setStudentExists(false);
                    setError('');
                  }}
                  required
                  disabled={emailVerified || isVerifying}
                />
                <Button
                  variant="contained"
                  onClick={handleVerifyEmail}
                  disabled={emailVerified || !studentData.email || isVerifying}
                  sx={{ mt: 1, height: 56 }}
                >
                  {isVerifying ? 'Verifying...' : emailVerified ? 'Verified' : 'Verify'}
                </Button>
              </Box>
              <TextField
                fullWidth
                label="Student Name"
                margin="normal"
                value={studentData.name}
                onChange={(e) => setStudentData({...studentData, name: e.target.value})}
                required
                disabled={!emailVerified || studentExists}
              />
              <TextField
                fullWidth
                label="Student Phone Number"
                margin="normal"
                value={studentData.phone}
                onChange={(e) => setStudentData({...studentData, phone: e.target.value})}
                required
                disabled={!emailVerified || studentExists}
              />
              <TextField
                fullWidth
                label="Parent's Phone Number"
                margin="normal"
                value={studentData.parentPhone}
                onChange={(e) => setStudentData({...studentData, parentPhone: e.target.value})}
                required
                disabled={!emailVerified || studentExists}
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
                disabled={!emailVerified || studentExists}
              />
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={!emailVerified}
                >
                  {studentExists ? 'Update Student' : 'Add Student'}
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
