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
  CircularProgress,
  Alert,
  Button,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TeacherLayout from '../components/TeacherLayout';
import { getBatchById, getStudentsByBatch } from '../services/api';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SubjectIcon from '@mui/icons-material/Subject';

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
    navigate(`/teacher-dashboard/batch/${batchId}/add-student`);
  };

  if (loading) {
    return (
      <TeacherLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
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
          {/* Batch Information Card */}
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color={theme.primary}>
                  Batch Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SubjectIcon sx={{ color: theme.primary, mr: 1 }} />
                  <Typography variant="body1">
                    Subject: {batch.subject}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTimeIcon sx={{ color: theme.primary, mr: 1 }} />
                  <Typography variant="body1">
                    Time: {formatTime(batch.startTime)} - {formatTime(batch.endTime)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarTodayIcon sx={{ color: theme.primary, mr: 1 }} />
                  <Typography variant="body1">
                    Opening Date: {formatDate(batch.openingDate)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ color: theme.primary, mr: 1 }} />
                  <Typography variant="body1">
                    Students: {batch.students?.length || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Students List Card */}
          <Grid item xs={12} md={8}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color={theme.primary}>
                    Enrolled Students
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {students && students.length > 0 ? (
                  <Grid container spacing={2}>
                    {students.map((student) => (
                      <Grid item xs={12} sm={6} key={student._id}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          p: 1,
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                        }}>
                          <Avatar sx={{ bgcolor: theme.primary, mr: 2 }}>
                            {student.name?.[0]?.toUpperCase() || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1">
                              {student.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {student.email} • {student.phone}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {student.subject}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
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
    </TeacherLayout>
  );
}
