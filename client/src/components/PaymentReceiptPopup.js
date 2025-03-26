import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';

const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9'
};

export default function PaymentReceiptPopup({ open, onClose, payment }) {
  if (!payment) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: theme.background
      }}>
        <Typography variant="h6">Payment Receipt</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Student Name:</strong> {payment.studentName}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Amount:</strong> ₹{payment.amount}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Installment Number:</strong> {payment.installmentNumber}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Payment Date:</strong> {new Date(payment.paymentDate).toLocaleString()}
          </Typography>
          
          {payment.receiptUrl && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Receipt:</strong>
              </Typography>
              <Box sx={{ 
                mt: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}>
                <img 
                  src={payment.receiptUrl} 
                  alt="Payment Receipt" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '400px',
                    objectFit: 'contain' 
                  }} 
                />
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => window.open(payment.receiptUrl, '_blank')}
                  sx={{ bgcolor: theme.primary }}
                >
                  Download Receipt
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            color: theme.primary,
            borderColor: theme.primary 
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
