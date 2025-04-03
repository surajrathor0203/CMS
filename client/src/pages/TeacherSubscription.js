import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import { getSubscriptionPlans, getTeacherProfile } from '../services/api';
import { toast } from 'react-toastify';
import { getUserFromCookie } from '../utils/cookies';

const SubscriptionCard = ({ title, price, duration, features, planId, accountHolderName, upiId, upiNumber, qrCode }) => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate(`/teacher/subscription/payment/${planId}`, { 
      state: { 
        title, 
        price, 
        duration, 
        features,
        accountHolderName,
        upiId,
        upiNumber,
        qrCode
      }
    });
  };

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      transition: '0.3s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: 3
      }
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h5" component="h2" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Typography variant="h4" color="primary" gutterBottom>
          ₹{price}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          {duration}
        </Typography>
        <List>
          {features.map((feature, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 35 }}>
                <Check size={20} color="#2e7d32" />
              </ListItemIcon>
              <ListItemText primary={feature} />
            </ListItem>
          ))}
        </List>
      </CardContent>
      <CardActions>
        <Button 
          fullWidth 
          variant="contained" 
          color="primary"
          onClick={handleSubscribe}
          sx={{ 
            bgcolor: '#2e7d32',
            '&:hover': {
              bgcolor: '#1b5e20'
            }
          }}
        >
          Subscribe Now
        </Button>
      </CardActions>
    </Card>
  );
};

const TeacherSubscription = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    fetchSubscriptionPlans();
    fetchTeacherSubscription();
  }, []);

  const fetchTeacherSubscription = async () => {
    try {
      const userData = getUserFromCookie();
      if (userData && userData.user.id) {
        const response = await getTeacherProfile(userData.user.id);
        if (response.success) {
          setSubscription(response.data.subscription);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch subscription details');
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const response = await getSubscriptionPlans();
      if (response.success) {
        const formattedPlans = response.data
          .map(plan => ({
            title: plan.title,
            price: plan.price,
            duration: `${plan.duration} ${plan.duration === 1 ? 'Month' : 'Months'}`,
            features: [
              `Create up to ${plan.maxBatches === -1 ? 'unlimited' : plan.maxBatches} batches`,
              ...plan.features || []
            ],
            planId: plan._id, // Change this line from plan.id to plan._id
            accountHolderName: plan.accountHolderName,
            upiId: plan.upiId,
            upiNumber: plan.upiNumber,
            qrCode: plan.qrCode
          }))
          .sort((a, b) => a.price - b.price); // Sort by price ascending
        setPlans(formattedPlans);
      }
    } catch (error) {
      toast.error('Failed to fetch subscription plans');
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherLayout
      mobileOpen={mobileOpen}
      handleDrawerToggle={handleDrawerToggle}
      title="Subscription Plans"
    >
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {/* Subscription Status Card */}
          {subscription && (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                mb: 4, 
                bgcolor: '#f5f5f5',
                border: '1px solid',
                borderColor: subscription.subscriptionStatus === 'active' ? '#2e7d32' : 
                           subscription.subscriptionStatus === 'pending' ? '#ed6c02' : '#d32f2f'
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ color: '#2e7d32' }}>
                Current Subscription
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: subscription.subscriptionStatus === 'active' ? '#2e7d32' : 
                           subscription.subscriptionStatus === 'pending' ? '#ed6c02' : '#d32f2f',
                    fontWeight: 'bold'
                  }}>
                    {subscription.subscriptionStatus.charAt(0).toUpperCase() + subscription.subscriptionStatus.slice(1)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(subscription.startDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(subscription.endDate).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            Choose Your Subscription Plan
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : plans.length === 0 ? (
            <Typography textAlign="center" color="text.secondary">
              No subscription plans available at the moment.
            </Typography>
          ) : (
            <Grid container spacing={4}>
              {plans.map((plan, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <SubscriptionCard {...plan} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>
    </TeacherLayout>
  );
};

export default TeacherSubscription;
