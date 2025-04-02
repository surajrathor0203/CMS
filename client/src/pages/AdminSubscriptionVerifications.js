import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar
} from '@mui/material';
import { toast } from 'react-toastify';
import AdminLayout from '../components/AdminLayout';
import { getPendingSubscriptionPayments, verifySubscriptionPayment } from '../services/api';
import { format } from 'date-fns';

const AdminSubscriptionVerifications = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await getPendingSubscriptionPayments();
      if (response.success) {
        setPayments(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId, status) => {
    try {
      const response = await verifySubscriptionPayment(userId, status);
      if (response.success) {
        toast.success(`Payment ${status === 'verified' ? 'approved' : 'rejected'}`);
        fetchPendingPayments();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update payment status');
    }
    setOpenDialog(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Pending Subscription Payments
        </Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Teacher</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Receipt</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={payment.teacher.profilePicture?.url} />
                      {payment.teacher.name}
                    </Box>
                  </TableCell>
                  <TableCell>{payment.plan.title}</TableCell>
                  <TableCell>₹{payment.amount}</TableCell>
                  <TableCell>
                    {payment.paymentDate ? 
                      format(new Date(payment.paymentDate), 'dd/MM/yyyy') : 
                      'Not available'
                    }
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setOpenDialog(true);
                      }}
                    >
                      View Receipt
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      color="success"
                      onClick={() => handleVerify(payment._id, 'verified')}
                      sx={{ mr: 1 }}
                    >
                      Approve
                    </Button>
                    <Button
                      color="error"
                      onClick={() => handleVerify(payment._id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Payment Receipt</DialogTitle>
          <DialogContent>
            {selectedPayment?.receipt?.url && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <img
                  src={selectedPayment.receipt.url}
                  alt="Payment Receipt"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
};

export default AdminSubscriptionVerifications;
