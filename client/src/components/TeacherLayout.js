import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Button,
} from '@mui/material';
import { Menu as MenuIcon } from 'lucide-react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TeacherSidebar from './TeacherSidebar';
import PaymentReceiptPopup from './PaymentReceiptPopup';

const drawerWidth = 240;

export default function TeacherLayout({ 
  children, 
  title, 
  pendingCount, 
  pendingPayments = [], 
  onApprovePayment, 
  onRejectPayment,
  batchId // Add this prop
}) {
  const navigate = useNavigate(); // Add this
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [receiptPopupOpen, setReceiptPopupOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handlePaymentAction = async (payment, action) => {
    try {
      if (action === 'approve') {
        await onApprovePayment(payment);
      } else {
        await onRejectPayment(payment);
      }
      handleNotificationClose();
      // Redirect to student detail page
      navigate(`/teacher-dashboard/batch/${batchId}/student/${payment.studentId}`);
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error);
    }
  };

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setReceiptPopupOpen(true);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#2e7d32',
          color: 'white',
          boxShadow: 1
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {title}
            </Typography>
          </Box>

          <IconButton 
            color="inherit" 
            onClick={handleNotificationClick}
            size="large"
          >
            <Badge 
              badgeContent={pendingCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  display: pendingCount > 0 ? 'flex' : 'none'
                }
              }}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleNotificationClose}
            PaperProps={{
              elevation: 3,
              sx: { 
                width: 400,  // Increased from 320 to 400
                maxHeight: '80vh',
                overflowY: 'auto'
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {pendingCount > 0 ? (
              <>
                <MenuItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pending Verifications
                  </Typography>
                  <Typography variant="body2">
                    {pendingCount} installment{pendingCount > 1 ? 's' : ''} pending verification
                  </Typography>
                </MenuItem>
                <Divider />
                {pendingPayments.map((payment) => (
                  <MenuItem key={payment._id} sx={{ flexDirection: 'column', py: 1 }}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle2">
                        {payment.studentName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Amount: ₹{payment.amount} - Installment {payment.installmentNumber}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePaymentAction(payment, 'approve');
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePaymentAction(payment, 'reject');
                          }}
                        >
                          Reject
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePaymentClick(payment);
                          }}
                        >
                          View Receipt
                        </Button>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
                <Divider />
              </>
            ) : (
              <MenuItem>
                <Typography color="text.secondary">
                  No pending verifications
                </Typography>
              </MenuItem>
            )}
          </Menu>
        </Toolbar>
      </AppBar>
      
      <TeacherSidebar 
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>

      <PaymentReceiptPopup
        open={receiptPopupOpen}
        onClose={() => setReceiptPopupOpen(false)}
        payment={selectedPayment}
      />
    </Box>
  );
}
