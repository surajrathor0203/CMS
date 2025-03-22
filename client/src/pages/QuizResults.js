import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import TeacherLayout from '../components/TeacherLayout';
import { getQuizById } from '../services/api';

const QuizResults = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const totalStudents = searchParams.get('totalStudents')

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const response = await getQuizById(quizId);
        if (response.success) {
          setQuiz(response.data);
        }
      } catch (err) {
        setError('Failed to fetch quiz results');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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

  return (
    <TeacherLayout>
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {quiz?.title} - Results
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip 
                label={`Total Students: ${totalStudents}`} 
                color="primary" 
              />
              <Chip 
                label={`Submitted: ${quiz?.students?.length || 0}`} 
                color="success" 
              />
              <Chip 
                label={`Pending: ${totalStudents - (quiz?.students?.length || 0)}`} 
                color="warning" 
              />
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Submitted" />
                <Tab label="Not Submitted" />
              </Tabs>
            </Box>

            {activeTab === 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student Name</TableCell>
                      <TableCell align="center">Score</TableCell>
                      <TableCell align="center">Correct Answers</TableCell>
                      <TableCell align="center">Submission Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quiz?.students?.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell>{student.studentName}</TableCell>
                        <TableCell align="center">
                          {Math.round((student.score / quiz.questions.length) * 100)}%
                        </TableCell>
                        <TableCell align="center">
                          {student.correctAnswers} / {quiz.questions.length}
                        </TableCell>
                        <TableCell align="center">
                          {new Date(student.submittedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!quiz?.students?.length && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No submissions yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quiz?.nonSubmittedStudents?.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell align="center">
                          <Chip label="Pending" color="warning" size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!quiz?.nonSubmittedStudents?.length && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          All students have submitted the quiz
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </TeacherLayout>
  );
};

export default QuizResults;
