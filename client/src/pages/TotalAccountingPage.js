import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import { getBatchesAccounting } from '../services/api';
import TeacherLayout from '../components/TeacherLayout';
import { getUserFromCookie } from '../utils/cookies';
import Loading from '../components/Loading';

const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9',
};

export default function TotalAccountingPage() {
  const [batchesData, setBatchesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalStats, setTotalStats] = useState({
    totalPaid: 0,
    totalFees: 0,
  });

  const userData = getUserFromCookie();

  useEffect(() => {
    const fetchBatchesData = async () => {
      try {
        const response = await getBatchesAccounting(userData.user.id);
        if (response.success) {
          const batches = response.data;

          // Calculate totals
          const totalPaid = batches.reduce((sum, batch) => sum + (batch.totalPaid || 0), 0);
          const totalFees = batches.reduce((sum, batch) => sum + (batch.totalFees || 0), 0);

          // Add percentage to each batch
          const batchesWithPercentage = batches.map(batch => ({
            ...batch,
            percentage: batch.totalFees > 0 ? (batch.totalPaid / batch.totalFees) * 100 : 0
          }));

          setBatchesData(batchesWithPercentage);
          setTotalStats({ totalPaid, totalFees });
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
        setError('Failed to fetch accounting data');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchesData();
  }, [userData.user.id]);

  if (loading) {
    return <TeacherLayout><Loading /></TeacherLayout>;
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
        <Typography variant="h4" gutterBottom color={theme.primary}>
          Total Accounting Overview
        </Typography>
        
        {/* Overall Stats Card */}
        <Card elevation={3} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Overall Payment Status
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">
                Total Paid: ₹{totalStats.totalPaid.toLocaleString()} / ₹{totalStats.totalFees.toLocaleString()}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalStats.totalFees > 0 ? (totalStats.totalPaid / totalStats.totalFees) * 100 : 0}
                sx={{
                  mt: 1,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: theme.light,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.primary
                  }
                }}
              />
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {totalStats.totalFees > 0 
                  ? ((totalStats.totalPaid / totalStats.totalFees) * 100).toFixed(1)
                  : 0}% paid
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Batch-wise Details */}
        <Typography variant="h5" gutterBottom color={theme.primary}>
          Batch-wise Payment Details
        </Typography>
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Batch Name</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Total Students</TableCell>
                <TableCell>Total Fees</TableCell>
                <TableCell>Amount Collected</TableCell>
                <TableCell>Progress</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batchesData.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell>{batch.name}</TableCell>
                  <TableCell>{batch.subject}</TableCell>
                  <TableCell>{batch.enrolledStudents?.length || 0}</TableCell>
                  <TableCell>₹{batch.totalFees?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{batch.totalPaid?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={batch.percentage || 0}
                        sx={{
                          width: 100,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.light,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.primary
                          }
                        }}
                      />
                      <Typography variant="body2">
                        {batch.percentage?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </TeacherLayout>
  );
}
