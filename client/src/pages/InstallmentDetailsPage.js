import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Tabs,
  Avatar,
  Chip,
  IconButton
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TeacherLayout from '../components/TeacherLayout';
import { getBatchById, getStudentsByBatch } from '../services/api';

const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9',
};

export default function InstallmentDetailsPage() {
  const { batchId, installmentNumber } = useParams();
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [batchRes, studentsRes] = await Promise.all([
          getBatchById(batchId),
          getStudentsByBatch(batchId)
        ]);

        setBatch(batchRes.data);
        setStudents(studentsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [batchId]);

  const getPaidStudents = () => {
    if (!batch || !students) return [];

    return students.filter(student => {
      // Find this student's payment record in batch
      const studentPaymentRecord = batch.studentPayments?.find(
        payment => payment.student.toString() === student._id.toString()
      );

      if (!studentPaymentRecord) return false;

      // Check if this student has paid the current installment
      return studentPaymentRecord.payments?.some(payment => 
        payment.installmentNumber === parseInt(installmentNumber) && 
        payment.status === 'approved'
      );
    });
  };

  const getPendingStudents = () => {
    if (!batch || !students) return [];

    return students.filter(student => {
      // Find this student's payment record in batch
      const studentPaymentRecord = batch.studentPayments?.find(
        payment => payment.student.toString() === student._id.toString()
      );

      // If no payment record exists, student is pending
      if (!studentPaymentRecord) return true;

      // Check if student has NOT paid this installment or payment is not approved
      return !studentPaymentRecord.payments?.some(payment => 
        payment.installmentNumber === parseInt(installmentNumber) && 
        payment.status === 'approved'
      );
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return <TeacherLayout>Loading...</TeacherLayout>;
  }

  const installmentAmount = batch ? batch.fees / batch.numberOfInstallments : 0;
  const paidStudents = getPaidStudents();
  const pendingStudents = getPendingStudents();

  const renderTableRow = (student) => {
    // Find student's payment record
    const studentPayment = batch.studentPayments?.find(
      payment => payment.student.toString() === student._id.toString()
    );

    // Find all payments for this installment
    const installmentPayments = studentPayment?.payments?.filter(
      payment => 
        payment.installmentNumber === parseInt(installmentNumber) &&
        (activeTab === 0 ? payment.status === 'approved' : true)
    ) || [];

    // Calculate total amount for this installment
    const totalAmount = installmentPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Create amount display string with individual amounts if multiple payments
    let amountDisplay = '';
    if (activeTab === 0) {
      if (installmentPayments.length > 1) {
        amountDisplay = installmentPayments
          .map(p => `₹${p.amount.toLocaleString()}`)
          .join(' + ') + ` = ₹${totalAmount.toLocaleString()}`;
      } else {
        amountDisplay = `₹${totalAmount.toLocaleString()}`;
      }
    } else {
      amountDisplay = `₹${installmentAmount.toLocaleString()}`;
    }

    return (
      <TableRow key={student._id}>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar 
              src={student.profilePicture?.url}
              sx={{ bgcolor: theme.primary }}
            >
              {student.name[0].toUpperCase()}
            </Avatar>
            {student.name}
          </Box>
        </TableCell>
        <TableCell>{student.email}</TableCell>
        <TableCell>{student.phone}</TableCell>
        <TableCell>{amountDisplay}</TableCell>
      </TableRow>
    );
  };

  return (
    <TeacherLayout>
      <Box sx={{ p: 3 }}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom color={theme.primary}>
              Installment {installmentNumber} Details
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Amount per student: ₹{installmentAmount.toLocaleString()}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Due Date: {new Date(batch?.installmentDates[installmentNumber - 1]).toLocaleDateString()}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab 
                  label={`Paid Students (${paidStudents.length})`}
                  sx={{ 
                    color: activeTab === 0 ? theme.primary : 'inherit',
                    fontWeight: 'bold'
                  }}
                />
                <Tab 
                  label={`Pending Students (${pendingStudents.length})`}
                  sx={{ 
                    color: activeTab === 1 ? theme.primary : 'inherit',
                    fontWeight: 'bold'
                  }}
                />
              </Tabs>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(activeTab === 0 ? paidStudents : pendingStudents).map((student) => renderTableRow(student))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </TeacherLayout>
  );
}
