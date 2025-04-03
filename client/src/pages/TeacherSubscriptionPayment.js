import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { toast } from 'react-toastify';
import TeacherLayout from '../components/TeacherLayout';
import { getUserFromCookie } from '../utils/cookies';
import { getSubscriptionPlanById, submitSubscriptionPayment } from '../services/api';

const TeacherSubscriptionPayment = () => {
  const location = useLocation();
  const { planId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentFile, setPaymentFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [planDetails, setPlanDetails] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const userData = getUserFromCookie();

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const response = await getSubscriptionPlanById(planId);
        if (response.success) {
          setPlanDetails(response.data);
        } else {
          toast.error('Failed to fetch plan details');
        }
      } catch (error) {
        toast.error(error.message || 'Error fetching plan details');
        navigate('/teacher/subscription');
      } finally {
        setLoadingPlan(false);
      }
    };

    if (planId) {
      fetchPlanDetails();
    }
  }, [planId, navigate]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentFile) {
      toast.error('Please upload payment screenshot');
      return;
    }

    setLoading(true);
    try {
      const response = await submitSubscriptionPayment(planId, paymentFile);
      if (response.success) {
        toast.success('Payment submitted successfully. Awaiting verification.');
        navigate('/teacher/subscription');
      } else {
        throw new Error(response.message || 'Failed to submit payment');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlan) {
    return (
      <TeacherLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </TeacherLayout>
    );
  }

  if (!planDetails) {
    return <Navigate to="/teacher/subscription" replace />;
  }

  return (
    <TeacherLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Plan Summary */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ color: '#2e7d32' }}>
                  Plan Summary
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  ₹{planDetails.price}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {planDetails.title}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  Duration: {planDetails.duration} {planDetails.duration === 1 ? 'Month' : 'Months'}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Features:
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {[
                    `Create up to ${planDetails.maxBatches === -1 ? 'unlimited' : planDetails.maxBatches} batches`,
                    ...(planDetails.features || [])
                  ].map((feature, index) => (
                    <Typography key={index} component="li" variant="body2">
                      {feature}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Details */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Payment Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Account Holder Name
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {planDetails.accountHolderName}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    UPI ID
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {planDetails.upiId}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    UPI Number
                  </Typography>
                  <Typography variant="body1">
                    {planDetails.upiNumber}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  {planDetails.qrCode?.url && (
                    <Box sx={{ textAlign: 'center' }}>
                      <img 
                        src={planDetails.qrCode.url} 
                        alt="Payment QR Code"
                        style={{ 
                          maxWidth: '200px',
                          width: '100%',
                          height: 'auto'
                        }}
                      />
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
            </Grid>
            <Grid item xs={12}>

            {/* Payment Form */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Submit Payment
              </Typography>
              <Box component="form" onSubmit={handlePaymentSubmit}>
                <TextField
                  fullWidth
                  label="Plan Name"
                  margin="normal"
                  value={planDetails.title}
                  disabled
                />
                <TextField
                  fullWidth
                  label="Amount"
                  margin="normal"
                  value={`₹${planDetails.price}`}
                  disabled
                />
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                  >
                    Upload Payment Receipt
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setPaymentFile(file);
                        setFileName(file ? file.name : '');
                      }}
                    />
                  </Button>
                  {fileName && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      Selected file: {fileName}
                    </Typography>
                  )}
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ 
                    mt: 3,
                    bgcolor: '#2e7d32',
                    '&:hover': { bgcolor: '#1b5e20' }
                  }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit Payment'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </TeacherLayout>
  );
};

export default TeacherSubscriptionPayment;
