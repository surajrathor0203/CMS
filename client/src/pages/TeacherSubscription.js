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
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import { Check, Lock as LockIcon, LockOpen as UnlockIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import { getSubscriptionPlans, getTeacherProfile } from '../services/api';
import { toast } from 'react-toastify';
import { getUserFromCookie } from '../utils/cookies';

const SubscriptionCard = ({ title, price, duration, features, planId, accountHolderName, upiId, upiNumber, qrCode }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      },
      borderRadius: { xs: 2, sm: 1 }
    }}>
      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        <Typography 
          gutterBottom 
          variant="h5" 
          component="h2" 
          sx={{ 
            color: '#2e7d32', 
            fontWeight: 'bold',
            fontSize: { xs: '1.25rem', sm: '1.5rem' } 
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h4" 
          color="primary" 
          gutterBottom
          sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
        >
          ₹{price}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          {duration}
        </Typography>
        <List sx={{ py: 0 }}>
          {features.map((feature, index) => (
            <ListItem key={index} sx={{ py: 0.5, px: { xs: 0, sm: 1 } }}>
              <ListItemIcon sx={{ minWidth: { xs: 30, sm: 35 } }}>
                <Check size={isMobile ? 16 : 20} color="#2e7d32" />
              </ListItemIcon>
              <ListItemText 
                primary={feature} 
                primaryTypographyProps={{ 
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  lineHeight: 1.5
                }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
      <CardActions sx={{ p: { xs: 2, sm: 2 } }}>
        <Button 
          fullWidth 
          variant="contained" 
          color="primary"
          onClick={handleSubscribe}
          sx={{ 
            bgcolor: '#2e7d32',
            '&:hover': {
              bgcolor: '#1b5e20'
            },
            py: { xs: 1, sm: 1 }
          }}
          size={isMobile ? "medium" : "large"}
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
  const [userStatus, setUserStatus] = useState('active');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
          setUserStatus(response.data.status);
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
            planId: plan._id,
            accountHolderName: plan.accountHolderName,
            upiId: plan.upiId,
            upiNumber: plan.upiNumber,
            qrCode: plan.qrCode
          }))
          .sort((a, b) => a.price - b.price);
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
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
          {userStatus !== 'active' && (
            <Box sx={{ 
              mt: { xs: 1, sm: 2 }, 
              mb: { xs: 2, sm: 3 },
              p: { xs: 1.5, sm: 2 }, 
              bgcolor: '#ffebee', 
              borderRadius: 1,
              border: '1px solid #ef5350'
            }}>
              <Typography 
                color="error" 
                align="center"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Your subscription has expired. Please renew your subscription or contact our helpline at 
                <Typography 
                  component="span" 
                  fontWeight="bold"
                > cms.portal2@gmail.com </Typography>
                for assistance.
              </Typography>
            </Box>
          )}
          
          {/* Subscription Status Card */}
          {subscription && (
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                mb: { xs: 3, sm: 4 }, 
                bgcolor: '#f5f5f5',
                border: '1px solid',
                borderColor: userStatus === 'active' ? '#2e7d32' : '#d32f2f',
                borderRadius: { xs: 2, sm: 1 }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'center', 
                alignItems: isMobile ? 'center' : 'center', 
                mb: { xs: 1.5, sm: 2 },
                position: 'relative',
                gap: isMobile ? 1 : 0
              }}>
                <Typography 
                  variant={isMobile ? 'h6' : 'h5'} 
                  gutterBottom 
                  sx={{ 
                    color: '#2e7d32', 
                    mb: 0,
                    textAlign: 'center',
                    mr: isMobile ? 0 : 2
                  }}
                >
                  Current Subscription
                </Typography>
                <Chip
                  icon={userStatus === 'active' ? <UnlockIcon size={16} /> : <LockIcon size={16} />}
                  label={userStatus === 'active' ? 'Account Active' : 'Account Locked'}
                  color={userStatus === 'active' ? 'success' : 'error'}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    position: isMobile ? 'static' : 'absolute',
                    right: 0,
                    '& .MuiChip-icon': {
                      color: 'inherit'
                    }
                  }}
                />
              </Box>
              
              <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
              
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                <Grid item xs={12} sm={12} md={4}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'row', sm: 'row', md: 'column' },
                    justifyContent: { xs: 'space-between', sm: 'space-between', md: 'flex-start' },
                    mb: { xs: 1, sm: 0 }
                  }}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ mr: { xs: 2, sm: 0 } }}
                    >
                      Last Payment Status
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: subscription.subscriptionStatus === 'active' ? '#2e7d32' : 
                             subscription.subscriptionStatus === 'pending' ? '#ed6c02' : '#d32f2f',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}>
                      {subscription.subscriptionStatus.charAt(0).toUpperCase() + subscription.subscriptionStatus.slice(1)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'row', sm: 'column' },
                    justifyContent: { xs: 'space-between', sm: 'flex-start' },
                    mb: { xs: 1, sm: 0 }
                  }}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ mr: { xs: 2, sm: 0 } }}
                    >
                      Start Date
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {new Date(subscription.startDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'row', sm: 'column' },
                    justifyContent: { xs: 'space-between', sm: 'flex-start' }
                  }}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ mr: { xs: 2, sm: 0 } }}
                    >
                      End Date
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {new Date(subscription.endDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            gutterBottom 
            sx={{ 
              textAlign: 'center', 
              mb: { xs: 2, sm: 4 },
              fontWeight: 'medium'
            }}
          >
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
            <Grid container spacing={{ xs: 2, sm: 4 }}>
              {plans.map((plan, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
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