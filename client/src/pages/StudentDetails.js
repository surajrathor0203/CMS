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
  Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import TeacherLayout from '../components/TeacherLayout';
import Loading from '../components/Loading';
import { getStudentProfile, getPayments, toggleStudentLock, getBatchById } from '../services/api';
import { toast } from 'react-toastify';

const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9',
};

export default function StudentDetails() {
  const { studentId, batchId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false); // Add this state
  const [batchFees, setBatchFees] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentResponse, paymentsResponse, batchResponse] = await Promise.all([
          getStudentProfile(studentId),
          getPayments(batchId, studentId),
          getBatchById(batchId)
        ]);

        // Get batch fees
        setBatchFees(batchResponse.data.fees);

        // Rest of your existing code...
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

  const handleToggleLock = async () => {
    try {
      await toggleStudentLock(batchId, studentId);
      setIsLocked(!isLocked); // Toggle local state
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

  // Update getLockButton to use isLocked state instead of student.isLocked
  const getLockButton = (locked) => {
    if (locked) {
      return {
        icon: <LockIcon />,
        text: 'Unlock Account',
        color: 'error', // Red for locked state
        buttonVariant: 'contained' // Solid button for more emphasis
      };
    }
    return {
      icon: <LockOpenIcon />,
      text: 'Lock Account',
      color: 'success',
      buttonVariant: 'outlined'
    };
  };

  // Add this helper function
  const calculateApprovedTotal = (payments) => {
    return payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);
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
            {/* Profile Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              {/* Left side - Avatar and Name */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  src={student.profilePicture?.url}
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: theme.primary,
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

              {/* Right side - Lock Status and Action */}
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
                          minWidth: '150px' // Ensure consistent button width
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

            {/* Student Details Grid */}
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
              <Typography variant="h6" color={theme.primary}>
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
                {/* Add total approved payments summary */}
                <Box sx={{ mb: 3 }}>
                  {/* <Typography variant="h6" color="text.secondary">
                    Total Approved Payments: ₹{calculateApprovedTotal(payments)}
                  </Typography> */}
                </Box>

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
                                color: theme.primary,
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

            {/* Payment Summary */}
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
      </Box>
    </TeacherLayout>
  );
}
