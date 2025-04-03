import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import {
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    CircularProgress,
    Avatar,
    Box,
    Button
} from '@mui/material';
import { getRejectedPayments, verifySubscriptionPayment } from '../services/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const RejectedVerifications = () => {
    const [rejectedPayments, setRejectedPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRejectedPayments = async () => {
        try {
            const response = await getRejectedPayments();
            if (response.success) {
                setRejectedPayments(response.data);
            }
        } catch (error) {
            console.error('Error fetching rejected payments:', error);
            toast.error('Failed to fetch rejected payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRejectedPayments();
    }, []);

    const handleVerify = async (userId) => {
        try {
            const response = await verifySubscriptionPayment(userId, 'verified');
            if (response.success) {
                toast.success('Payment verified successfully');
                fetchRejectedPayments(); // Refresh the list
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            toast.error('Failed to verify payment');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Container>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4">
                        Rejected Verifications
                    </Typography>
                    <Typography variant="h6" color="error">
                        Total: {rejectedPayments.length}
                    </Typography>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Teacher</TableCell>
                                <TableCell>Account Status</TableCell>
                                <TableCell>Plan Details</TableCell>
                                <TableCell>Payment Details</TableCell>
                                <TableCell>Receipt</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rejectedPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No rejected verifications found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rejectedPayments.map((payment) => (
                                    <TableRow key={payment._id}>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar 
                                                    src={payment.teacher.profilePicture?.url} 
                                                    alt={payment.teacher.name}
                                                />
                                                <Box>
                                                    <Typography variant="subtitle2">
                                                        {payment.teacher.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {payment.teacher.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2">
                                                    Account: <span style={{ color: payment.teacher.status === 'locked' ? '#d32f2f' : '#2e7d32' }}>
                                                        {payment.teacher.status}
                                                    </span>
                                                </Typography>
                                                <Typography variant="body2">
                                                    Subscription: <span style={{ color: payment.subscriptionStatus === 'rejected' ? '#d32f2f' : '#2e7d32' }}>
                                                        {payment.subscriptionStatus}
                                                    </span>
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2">
                                                {payment.plan.title}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                ₹{payment.amount}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                Transaction ID: {payment.transactionId}
                                            </Typography>
                                            <Typography variant="body2">
                                                Date: {format(new Date(payment.paymentDate), 'PPP')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {payment.receipt?.url && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => window.open(payment.receipt.url, '_blank')}
                                                >
                                                    View Receipt
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                onClick={() => handleVerify(payment._id)}
                                            >
                                                Verify Again
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </AdminLayout>
    );
};

export default RejectedVerifications;
