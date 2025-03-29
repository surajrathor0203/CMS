import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText
  // ProgressValue
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import TeacherLayout from '../components/TeacherLayout';
import Loading from '../components/Loading';
import { getStudentProfile, getPayments, toggleStudentLock, getBatchById, getQuizzesByBatch, getAssignmentsByBatch } from '../services/api';
import { toast } from 'react-toastify';
import { styled } from '@mui/material/styles';

const themeConstants = {
  primary: '#2e7d32',
  secondary: '#1976d2',
  background: '#f4f6f8',
  text: {
    primary: '#333',
    secondary: '#666'
  },
  success: '#4caf50', // Add success color
  error: '#f44336',   // Add error color
  borderRadius: 12,
  shadow: '0 4px 6px rgba(0,0,0,0.1)'
};

const ProgressCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    background: 'linear-gradient(90deg, #2196f3, #00bcd4)',
  }
}));

const CircularProgressBox = styled(Box)({
  position: 'relative',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 16,
});

const ProgressValue = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: theme.palette.primary.main,
}));

const ActivityTimeline = styled(List)(({ theme }) => ({
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '16px',
    top: 0,
    bottom: 0,
    width: '2px',
    background: theme.palette.divider,
    zIndex: 1,
  }
}));

const TimelineItem = styled(ListItem)(({ theme }) => ({
  position: 'relative',
  paddingLeft: theme.spacing(5),
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '12px',
    top: '50%',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: theme.palette.primary.main,
    transform: 'translateY(-50%)',
    zIndex: 2,
  }
}));

export default function StudentDetails() {
  const { studentId, batchId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [batchFees, setBatchFees] = useState(0);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentResponse, paymentsResponse, batchResponse] = await Promise.all([
          getStudentProfile(studentId),
          getPayments(batchId, studentId),
          getBatchById(batchId)
        ]);

        setBatchFees(batchResponse.data.fees);

        const isStudentLocked = batchResponse.data.lockedStudents?.some(
          ls => ls.studentId === studentId
        );
        setIsLocked(isStudentLocked);
        setStudent(studentResponse.data);
        setPayments(paymentsResponse.data?.payments || []);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
        setPaymentLoading(false);
      }
    };

    fetchData();
  }, [studentId, batchId]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await getQuizzesByBatch(batchId);
        setQuizzes(response.data || []);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      }
    };
    fetchQuizzes();
  }, [batchId]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await getAssignmentsByBatch(batchId);
        setAssignments(response.data || []);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      }
    };
    fetchAssignments();
  }, [batchId]);

  const handleToggleLock = async () => {
    try {
      await toggleStudentLock(batchId, studentId);
      setIsLocked(!isLocked);
      toast.success(`Student account ${isLocked ? 'unlocked' : 'locked'} successfully`);
    } catch (error) {
      toast.error('Failed to toggle student lock status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getLockButton = (locked) => {
    if (locked) {
      return {
        icon: <LockIcon />,
        text: 'Unlock Account',
        color: 'error',
        buttonVariant: 'contained'
      };
    }
    return {
      icon: <LockOpenIcon />,
      text: 'Lock Account',
      color: 'success',
      buttonVariant: 'outlined'
    };
  };

  const calculateApprovedTotal = (payments) => {
    return payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const QuizProgressSection = ({ quizzes }) => {
    const totalQuizzes = quizzes.length;
    const attemptedQuizzes = quizzes.filter(quiz => 
      quiz.students?.some(student => student.studentId === studentId)
    ).length;

    const quizProgress = totalQuizzes > 0 
      ? ((attemptedQuizzes / totalQuizzes) * 100).toFixed(1) 
      : 0;

    const getAverageScore = () => {
      const attemptedQuizzesData = quizzes.filter(quiz => 
        quiz.students?.some(student => student.studentId === studentId)
      );

      if (attemptedQuizzesData.length === 0) return 0;

      const totalScore = attemptedQuizzesData.reduce((acc, quiz) => {
        const studentAttempt = quiz.students.find(
          student => student.studentId === studentId
        );
        return acc + (studentAttempt.score / studentAttempt.totalQuestions * 100);
      }, 0);

      return (totalScore / attemptedQuizzesData.length).toFixed(1);
    };

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
          Quiz Performance Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <ProgressCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                  <Typography 
                     variant="h2" 
                     color="primary" 
                     sx={{ 
                       fontWeight: 'bold',
                       background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                       WebkitBackgroundClip: 'text',
                       WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {totalQuizzes}
                  </Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Total Quizzes
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {attemptedQuizzes} attempted, {totalQuizzes - attemptedQuizzes} remaining
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <ProgressCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <CircularProgressBox>
                  <CircularProgress
                    variant="determinate"
                    value={parseFloat(quizProgress)}
                    size={120}
                    thickness={4}
                    sx={{ color: themeConstants.primary }}
                  />
                  <ProgressValue sx={{color: themeConstants.primary,}}>
                    {quizProgress}%
                  </ProgressValue>
                </CircularProgressBox>
                <Typography variant="h6" gutterBottom>
                  Completion Rate
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {attemptedQuizzes} of {totalQuizzes} quizzes completed
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <ProgressCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <CircularProgressBox>
                  <CircularProgress
                   variant="determinate"
                   value={parseFloat(getAverageScore())}
                   size={120}
                   thickness={4}
                   sx={{ color: themeConstants.success }}
                  />
                  <ProgressValue
                    
                    sx={{
                      color: themeConstants.primary,
                    }}
                  >
                    {getAverageScore()}%
                  </ProgressValue>
                </CircularProgressBox>
                <Typography variant="h6" gutterBottom>
                  Average Score
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Across all attempted quizzes
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Recent Quiz Activity
          </Typography>
          <ActivityTimeline>
            {quizzes
              .filter(quiz => quiz.students?.some(student => student.studentId === studentId))
              .map(quiz => {
                const studentAttempt = quiz.students.find(
                  student => student.studentId === studentId
                );
                
                return (
                  <TimelineItem key={quiz._id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {quiz.title}
                          </Typography>
                          <Chip
                            label={`${studentAttempt.correctAnswers}/${studentAttempt.totalQuestions}`}
                            color={studentAttempt.correctAnswers >= (studentAttempt.totalQuestions * 0.6) ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary">
                          Completed on {new Date(studentAttempt.submittedAt).toLocaleDateString()}
                        </Typography>
                      }
                    />
                  </TimelineItem>
                );
              })}
          </ActivityTimeline>
        </Box>
      </Box>
    );
  };

  const AssignmentProgressSection = ({ assignments }) => {
    const totalAssignments = assignments.length;
    const submittedAssignments = assignments.filter(assignment => 
      assignment.submissions?.some(sub => sub.studentId === studentId)
    ).length;

    const assignmentProgress = totalAssignments > 0 
      ? ((submittedAssignments / totalAssignments) * 100).toFixed(1) 
      : 0;

    const getAverageGrade = () => {
      const gradedAssignments = assignments.filter(assignment => {
        const submission = assignment.submissions?.find(
          sub => sub.studentId === studentId && sub.grade !== undefined
        );
        return submission !== undefined;
      });

      if (gradedAssignments.length === 0) return 0;

      const totalGrade = gradedAssignments.reduce((acc, assignment) => {
        const submission = assignment.submissions.find(
          sub => sub.studentId === studentId
        );
        return acc + (submission.grade || 0);
      }, 0);

      return totalGrade / gradedAssignments.length;
    };

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
          Assignment Performance Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <ProgressCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                  <Typography 
                     variant="h2" 
                     color="primary" 
                     sx={{ 
                       fontWeight: 'bold',
                       background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                       WebkitBackgroundClip: 'text',
                       WebkitTextFillColor: 'transparent'
                     }}
                  >
                    {totalAssignments}
                  </Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Total Assignments
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {submittedAssignments} submitted, {totalAssignments - submittedAssignments} pending
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <ProgressCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <CircularProgressBox>
                  <CircularProgress
                    variant="determinate"
                    value={parseFloat(assignmentProgress)}
                    size={120}
                    thickness={4}
                    sx={{ color: themeConstants.primary }}
                  />
                  <ProgressValue
          
                    sx={{
                      color: themeConstants.primary,
                    }}
                  >
                    {assignmentProgress}%
                  </ProgressValue>
                </CircularProgressBox>
                <Typography variant="h6" gutterBottom>
                  Submission Rate
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {submittedAssignments} of {totalAssignments} assignments submitted
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <ProgressCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <CircularProgressBox>
                  <CircularProgress
                    variant="determinate"
                    value={parseFloat(getAverageGrade()) * 10}
                    size={120}
                    thickness={4}
                    sx={{ color: themeConstants.success }}
                  />
                  <ProgressValue
                    
                    sx={{
                     color: themeConstants.primary,
                    }}
                  >
                    {(getAverageGrade() * 10).toFixed(1)}%
                  </ProgressValue>
                </CircularProgressBox>
                <Typography variant="h6" gutterBottom>
                  Average Grade
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Grade: {getAverageGrade().toFixed(1)}/10
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Recent Assignment Activity
          </Typography>
          <ActivityTimeline>
            {assignments
              .filter(assignment => assignment.submissions?.some(sub => sub.studentId === studentId))
              .map(assignment => {
                const submission = assignment.submissions.find(
                  sub => sub.studentId === studentId
                );
                const grade = submission.grade || 0;

                return (
                  <TimelineItem key={assignment._id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {assignment.title}
                          </Typography>
                          {submission.grade ? (
                            <Chip
                              label={`${grade}/10`}
                              color={grade >= 6 ? 'success' : 'error'}
                              size="small"
                            />
                          ) : (
                            <Chip
                              label="Submitted"
                              color="primary"
                              size="small"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary">
                          Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                        </Typography>
                      }
                    />
                  </TimelineItem>
                );
              })}
          </ActivityTimeline>
        </Box>
      </Box>
    );
  };

  if (loading) return <Loading />;
  if (error) return <div>{error}</div>;
  if (!student) return <div>Student not found</div>;

  return (
    <TeacherLayout title='Student Details'>
      <Box sx={{ p: 3 }}>
        {/* Basic Info Card */}
        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  src={student.profilePicture?.url}
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: themeConstants.primary,
                    fontSize: '2.5rem',
                    mr: 3
                  }}
                >
                  {student.name?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {student.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Student ID: {student.username}
                  </Typography>
                </Box>
              </Box>

              <Box>
                {(() => {
                  const lockButton = getLockButton(isLocked);
                  return (
                    <>
                      <Button
                        variant={lockButton.buttonVariant}
                        startIcon={lockButton.icon}
                        color={lockButton.color}
                        onClick={handleToggleLock}
                        sx={{ 
                          mb: 1,
                          minWidth: '150px'
                        }}
                      >
                        {lockButton.text}
                      </Button>
                      <Typography 
                        variant="caption" 
                        display="block" 
                        color={isLocked ? "error.main" : "success.main"}
                        sx={{ textAlign: 'center' }}
                      >
                        Account is {isLocked ? 'Locked' : 'Active'}
                      </Typography>
                    </>
                  );
                })()}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6} lg={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {student.email}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Phone Number
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {student.phone}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Parent's Phone
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {student.parentPhone}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Username
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {student.username}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Join Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(student.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {student.address}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Payment Details Card */}
        <Card elevation={3}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color={themeConstants.primary}>
                Payment History
              </Typography>
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Total Paid: ₹{calculateApprovedTotal(payments)} / ₹{batchFees}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="right">
                  {((calculateApprovedTotal(payments) / batchFees) * 100).toFixed(1)}% paid
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {paymentLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Loading />
              </Box>
            ) : payments.length > 0 ? (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Installment</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Receipt</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell>
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>₹{payment.amount}</TableCell>
                          <TableCell>{payment.installmentNumber}</TableCell>
                          <TableCell>
                            <Chip 
                              label={payment.status}
                              color={getStatusColor(payment.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              component="a"
                              href={payment.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                color: themeConstants.primary,
                                textDecoration: 'none',
                                '&:hover': {
                                  textDecoration: 'underline'
                                }
                              }}
                            >
                              View Receipt
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Typography variant="body1" color="text.secondary" textAlign="center">
                No payment history available
              </Typography>
            )}

            {payments.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total paid
                    </Typography>
                    <Typography variant="h6">
                      ₹{calculateApprovedTotal(payments)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Pending Installments
                    </Typography>
                    <Typography variant="h6">
                      {payments.filter(p => p.status === 'pending').length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Payment
                    </Typography>
                    <Typography variant="h6">
                      {payments.length > 0 
                        ? new Date(payments[payments.length - 1].paymentDate).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Progress Section */}
        <Card elevation={3} sx={{ mt: 3 }}>
          <CardContent>
            <QuizProgressSection quizzes={quizzes} />
            <Divider sx={{ my: 4 }} />
            <AssignmentProgressSection assignments={assignments} />
          </CardContent>
        </Card>
      </Box>
    </TeacherLayout>
  );
}
