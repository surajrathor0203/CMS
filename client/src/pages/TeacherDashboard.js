import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardHeader, 
  CardContent, 
  Grid, 
  IconButton, 
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Menu,
  MenuItem
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TeacherLayout from '../components/TeacherLayout';
import { createBatch, getBatches, updateBatch, deleteBatch, getStudentsByBatch } from '../services/api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { getUserFromCookie } from '../utils/cookies'; // Import the function to get user data from cookies
import Loading from '../components/Loading';

// Define a green color theme
const theme = {
  primary: '#2e7d32', // dark green
  light: '#81c784',   // light green
  background: '#e8f5e9', // very light green background
  upcoming: '#ff9800', // orange color for upcoming badge
};



export default function TeacherDashboard() {
  const [batches, setBatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const userData = getUserFromCookie();
  const teacherSubject = userData?.user?.subject || 'N/A';
  
  const [newBatch, setNewBatch] = useState({
    name: '',
    subject: '',
    startTime: null,
    endTime: null,
    openingDate: null,
    fees: '',
    numberOfInstallments: 1,
    installmentDates: [null],
    upiHolderName: '',
    upiId: '',
    upiNumber: '',
    qrCode: null
  });
  const [errors, setErrors] = useState({
    name: '',
    startTime: '',
    endTime: '',
    openingDate: '',
    general: '',
    fees: '',
    firstInstallmentDate: '',
    secondInstallmentDate: '',
    upiHolderName: '',
    upiId: '',
    upiNumber: '',
    qrCode: '',
    subject: '' // Add subject error field
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editBatch, setEditBatch] = useState({
    name: '',
    subject: '',
    startTime: null,
    endTime: null,
    openingDate: null,
    fees: '',
    numberOfInstallments: 1,
    installmentDates: [null],
    upiHolderName: '',
    upiId: '',
    upiNumber: '',
    qrCode: null
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const [batchStudentCounts, setBatchStudentCounts] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [qrFileName, setQrFileName] = useState('');
  const [editQrFileName, setEditQrFileName] = useState('');

  useEffect(() => {
    fetchBatches().finally(() => setInitialLoading(false));
  }, []);

  const fetchBatches = async () => {
    try {
      const userData = getUserFromCookie();
      const response = await getBatches(userData.user.id);
      if (response.data) {
        const batchesData = response.data.data;
        setBatches(batchesData);

        // Fetch student counts for each batch
        const counts = {};
        for (const batch of batchesData) {
          const studentsResponse = await getStudentsByBatch(batch._id);
          counts[batch._id] = studentsResponse.data?.length || 0;
        }
        setBatchStudentCounts(counts);
      }
    } catch (err) {
      setError('Failed to fetch batches');
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setQrFileName(''); // Reset filename
    setErrors({
      name: '',
      startTime: '',
      endTime: '',
      openingDate: '',
      general: '',
      fees: '',
      firstInstallmentDate: '',
      secondInstallmentDate: '',
      upiHolderName: '',
      upiId: '',
      upiNumber: '',
      qrCode: '',
      subject: '' // Add subject error field
    });
  };

  const handleChange = (e) => {
    setNewBatch({
      ...newBatch,
      [e.target.name]: e.target.value
    });
  };

  const handleTimeChange = (field, value) => {
    setNewBatch({
      ...newBatch,
      [field]: value
    });
  };

  const handleInstallmentChange = (index, field, value) => {
    const updatedInstallments = [...newBatch.installments];
    updatedInstallments[index] = {
      ...updatedInstallments[index],
      [field]: value
    };
    setNewBatch({
      ...newBatch,
      installments: updatedInstallments
    });
  };

  const handleNumberOfInstallmentsChange = (e) => {
    const num = parseInt(e.target.value);
    setNewBatch(prev => ({
      ...prev,
      numberOfInstallments: num,
      installmentDates: Array(num).fill(null)
    }));
  };

  const handleInstallmentDateChange = (index, value) => {
    const updatedDates = [...newBatch.installmentDates];
    updatedDates[index] = value;
    setNewBatch(prev => ({
      ...prev,
      installmentDates: updatedDates
    }));
  };

  const validateForm = (batchData = newBatch) => {
    const newErrors = {
      name: '',
      startTime: '',
      endTime: '',
      openingDate: '',
      general: '',
      fees: '',
      firstInstallmentDate: '',
      secondInstallmentDate: '',
      upiHolderName: '',
      upiId: '',
      upiNumber: '',
      qrCode: '',
      subject: '' // Add subject error field
    };
    let isValid = true;

    // Validate batch name
    if (!batchData.name.trim()) {
      newErrors.name = 'Batch name is required';
      isValid = false;
    } else if (batchData.name.length < 3) {
      newErrors.name = 'Batch name must be at least 3 characters long';
      isValid = false;
    }

    // Validate start time
    if (!batchData.startTime) {
      newErrors.startTime = 'Start time is required';
      isValid = false;
    }

    // Validate end time
    if (!batchData.endTime) {
      newErrors.endTime = 'End time is required';
      isValid = false;
    }

    // Validate time range
    if (batchData.startTime && batchData.endTime) {
      const start = batchData.startTime.valueOf();
      const end = batchData.endTime.valueOf();
      if (end <= start) {
        newErrors.general = 'End time must be after start time';
        isValid = false;
      }
    }

    // Validate opening date - only check if it exists
    if (!batchData.openingDate) {
      newErrors.openingDate = 'Opening date is required';
      isValid = false;
    }

    if (!batchData.fees || batchData.fees <= 0) {
      newErrors.fees = 'Please enter valid fees amount';
      isValid = false;
    }

    if (batchData.installmentDates) {
      const invalidDates = batchData.installmentDates.some(date => !date);
      if (invalidDates) {
        newErrors.general = 'Please set all installment due dates';
        isValid = false;
      }
    }

    if (!batchData.upiHolderName?.trim()) {
      newErrors.upiHolderName = 'UPI holder name is required';
      isValid = false;
    }

    if (!batchData.upiId?.trim()) {
      newErrors.upiId = 'UPI ID is required';
      isValid = false;
    }

    if (!batchData.upiNumber?.trim()) {
      newErrors.upiNumber = 'UPI number is required';
      isValid = false;
    }

    if (!batchData.qrCode && !selectedBatch) {
      newErrors.qrCode = 'QR code image is required';
      isValid = false;
    }

    // Add subject validation
    if (!batchData.subject.trim()) {
      newErrors.subject = 'Subject is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const formatTime = (time) => {
    if (!time) return null;
    // Create a new Date object with today's date and the selected time
    const date = new Date();
    date.setHours(time.hour());
    date.setMinutes(time.minute());
    date.setSeconds(0);
    return date.toISOString();
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const userData = getUserFromCookie();
      const formData = new FormData();
      
      // Basic details
      formData.append('name', newBatch.name.trim());
      formData.append('subject', newBatch.subject); // Use form subject
      formData.append('startTime', formatTime(newBatch.startTime));
      formData.append('endTime', formatTime(newBatch.endTime));
      formData.append('openingDate', newBatch.openingDate.toDate().toISOString());
      formData.append('teacher', userData.user.id);
      
      // Fees and installment details
      formData.append('fees', newBatch.fees);
      formData.append('numberOfInstallments', newBatch.numberOfInstallments);
      
      const installmentDates = JSON.stringify(
        newBatch.installmentDates.map(date => date.toDate().toISOString())
      );
      formData.append('installmentDates', installmentDates);
      
      // Payment details
      formData.append('upiHolderName', newBatch.upiHolderName);
      formData.append('upiId', newBatch.upiId);
      formData.append('upiNumber', newBatch.upiNumber);
      
      // QR Code file
      if (newBatch.qrCode) {
        formData.append('qrCode', newBatch.qrCode);
      }

      const result = await createBatch(formData);
      if (result.success) {
        setSuccess(true);
        handleClose();
        setNewBatch({
          name: '',
          subject: '',
          startTime: null,
          endTime: null,
          openingDate: null,
          fees: '',
          numberOfInstallments: 1,
          installmentDates: [null],
          upiHolderName: '',
          upiId: '',
          upiNumber: '',
          qrCode: null
        });
        fetchBatches();
      }
    } catch (err) {
      setErrors({
        ...errors,
        general: err.message || 'Failed to create batch'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setError('');
    setSuccess(false);
  };

  // Helper function to format display time
  const formatDisplayTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Add this helper function to format display date
  const formatDisplayDate = (isoString) => {
    return dayjs(isoString).format('DD/MM/YYYY');
  };

  // Add this helper function to check if a batch is upcoming
  const isUpcomingBatch = (openingDate) => {
    return dayjs(openingDate).isAfter(dayjs());
  };

  const handleMenuClick = (event, batch) => {
    setAnchorEl(event.currentTarget);
    setSelectedBatch(batch);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setEditBatch({
      name: selectedBatch.name,
      subject: selectedBatch.subject,
      startTime: dayjs(selectedBatch.startTime),
      endTime: dayjs(selectedBatch.endTime),
      openingDate: dayjs(selectedBatch.openingDate),
      fees: selectedBatch.fees,
      numberOfInstallments: selectedBatch.numberOfInstallments,
      installmentDates: selectedBatch.installmentDates.map(date => dayjs(date)),
      upiHolderName: selectedBatch.payment.upiHolderName,
      upiId: selectedBatch.payment.upiId,
      upiNumber: selectedBatch.payment.upiNumber,
      qrCode: null
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedBatch(null);
    setEditQrFileName(''); // Reset filename
    setErrors({
      name: '',
      startTime: '',
      endTime: '',
      openingDate: '',
      general: '',
      fees: '',
      firstInstallmentDate: '',
      secondInstallmentDate: '',
      upiHolderName: '',
      upiId: '',
      upiNumber: '',
      qrCode: '',
      subject: '' // Add subject error field
    });
  };

  const handleEditChange = (e) => {
    setEditBatch({
      ...editBatch,
      [e.target.name]: e.target.value
    });
  };

  const handleEditTimeChange = (field, value) => {
    setEditBatch({
      ...editBatch,
      [field]: value
    });
  };

  const handleEditInstallmentDateChange = (index, value) => {
    const updatedDates = [...editBatch.installmentDates];
    updatedDates[index] = value;
    setEditBatch(prev => ({
      ...prev,
      installmentDates: updatedDates
    }));
  };

  const handleEditNumberOfInstallmentsChange = (e) => {
    const num = parseInt(e.target.value);
    setEditBatch(prev => ({
      ...prev,
      numberOfInstallments: num,
      installmentDates: Array(num).fill(null).map((_, i) => 
        i < prev.installmentDates.length ? prev.installmentDates[i] : null
      )
    }));
  };

  const handleEditSubmit = async () => {
    if (!validateForm(editBatch)) {
      return;
    }

    setLoading(true);
    try {
      // Create a new object with the correct date formats
      const batchDataToUpdate = {
        ...editBatch,
        startTime: dayjs(editBatch.startTime),
        endTime: dayjs(editBatch.endTime),
        openingDate: dayjs(editBatch.openingDate),
        installmentDates: editBatch.installmentDates.map(date => dayjs(date))
      };

      const result = await updateBatch(selectedBatch._id, batchDataToUpdate);
      if (result.success) {
        setSuccess(true);
        handleEditClose();
        fetchBatches();
      }
    } catch (err) {
      console.error('Error updating batch:', err);
      setErrors({
        ...errors,
        general: err.message || 'Failed to update batch'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setSelectedBatch(null);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const result = await deleteBatch(selectedBatch._id);
      if (result.success) {
        setSuccess(true);
        handleDeleteClose();
        // Refresh the batches list
        fetchBatches();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete batch');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchClick = (batch) => {
    const encodedBatchName = encodeURIComponent(batch.name);
    navigate(`/teacher-dashboard/batch/${batch._id}?name=${encodedBatchName}`);
  };

  return (
    <TeacherLayout title="Dashboard">
      {initialLoading ? (
        <Loading message="Loading batches..." />
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              My Batches
            </Typography>
            {/* <Button 
              variant="text" 
              endIcon={<ArrowForwardIcon />}
              sx={{ color: theme.primary }}
            >
              BATCH ARCHIVE
            </Button> */}
          </Box>

          {batches.length === 0 ? (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                No batches created yet
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {batches.map((batch) => (
                <Grid item xs={12} sm={6} md={4} key={batch._id}>
                  <Card 
                    elevation={1} 
                    sx={{ 
                      borderRadius: 2,
                      transition: 'transform 0.3s ease-in-out', // Add smooth transition
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        cursor: 'pointer'
                      },
                      position: 'relative', // Add this
                    }}
                    onClick={() => handleBatchClick(batch)}
                  >
                    {isUpcomingBatch(batch.openingDate) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 15,
                          right: -30,
                          transform: 'rotate(45deg)',
                          backgroundColor: theme.upcoming,
                          color: 'white',
                          padding: '5px 30px',
                          zIndex: 1,
                          fontSize: '0.5rem',
                          fontWeight: 'bold',
                          boxShadow: 2,
                        }}
                      >
                        COMING SOON
                      </Box>
                    )}
                    <CardHeader
                      sx={{ 
                        backgroundColor: theme.primary,
                        color: 'white',
                        py: 1.5
                      }}
                      title={
                        <Box>
                          <Typography variant="subtitle1">
                            {batch.name}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.9 }}>
                            {batch.subject || teacherSubject}
                          </Typography>
                        </Box>
                      }
                    />
                    <CardContent sx={{ pt: 2, pb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Timing: {`${formatDisplayTime(batch.startTime)} - ${formatDisplayTime(batch.endTime)}`}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'transparent', 
                              color: theme.primary,
                              width: 30, 
                              height: 30,
                              mr: 0.5
                            }}
                          >
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" color="text.primary">
                            {batchStudentCounts[batch._id] || 0}
                          </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                          Opens: {formatDisplayDate(batch.openingDate)}
                        </Typography>
                        
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuClick(e, batch);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleOpen}
              sx={{ 
                backgroundColor: theme.primary, 
                // '&:hover': { backgroundColor: '#c62828' },
                borderRadius: 1,
                textTransform: 'none'
              }}
            >
              CREATE BATCH
            </Button>
          </Box>

          {/* Create Batch Dialog */}
          <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ 
                        backgroundColor: theme.primary,
                        color: 'white',
                        py: 1.5
                      }}>Create New Batch</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Batch Name"
                  name="name"
                  value={newBatch.name}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.name}
                  helperText={errors.name}
                />

                <TextField // Add this new TextField for subject
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={newBatch.subject}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.subject}
                  helperText={errors.subject}
                />

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Opening Date"
                    value={newBatch.openingDate}
                    onChange={(newValue) => handleTimeChange('openingDate', newValue)}
                    sx={{ mt: 2, width: '100%' }}
                    slotProps={{
                      textField: {
                        error: !!errors.openingDate,
                        helperText: errors.openingDate,
                        fullWidth: true
                      }
                    }}
                    format="DD/MM/YYYY"  // Add this line
                  />
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TimePicker
                      label="Start Time"
                      value={newBatch.startTime}
                      onChange={(newValue) => handleTimeChange('startTime', newValue)}
                      sx={{ flex: 1 }}
                      slotProps={{
                        textField: {
                          error: !!errors.startTime,
                          helperText: errors.startTime,
                          fullWidth: true
                        }
                      }}
                      views={['hours', 'minutes']}
                      format="HH:mm"
                    />
                    <TimePicker
                      label="End Time"
                      value={newBatch.endTime}
                      onChange={(newValue) => handleTimeChange('endTime', newValue)}
                      sx={{ flex: 1 }}
                      slotProps={{
                        textField: {
                          error: !!errors.endTime,
                          helperText: errors.endTime,
                          fullWidth: true
                        }
                      }}
                      views={['hours', 'minutes']}
                      format="HH:mm"
                    />
                  </Box>
                </LocalizationProvider>
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Fees Details</Typography>
                <TextField
                  fullWidth
                  label="Batch Fees"
                  name="fees"
                  type="number"
                  value={newBatch.fees}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.fees}
                  helperText={errors.fees}
                />
                
                <TextField
                  select
                  fullWidth
                  label="Number of Installments"
                  value={newBatch.numberOfInstallments}
                  onChange={handleNumberOfInstallmentsChange}
                  margin="normal"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map((num) => (
                    <MenuItem key={num} value={num}>
                      {num} {num === 1 ? 'Installment' : 'Installments'}
                    </MenuItem>
                  ))}
                </TextField>

                {newBatch.installmentDates.map((date, index) => (
                  <Box key={index} sx={{ mt: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={`Installment ${index + 1} Due Date`}
                        value={date}
                        onChange={(newValue) => handleInstallmentDateChange(index, newValue)}
                        sx={{ width: '100%' }}
                        format="DD/MM/YYYY"
                      />
                    </LocalizationProvider>
                  </Box>
                ))}
              
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Online Payment Details</Typography>
                <TextField
                  fullWidth
                  label="UPI Holder Name"
                  name="upiHolderName"
                  value={newBatch.upiHolderName}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.upiHolderName}
                  helperText={errors.upiHolderName}
                />
                
                <TextField
                  fullWidth
                  label="UPI ID"
                  name="upiId"
                  value={newBatch.upiId}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.upiId}
                  helperText={errors.upiId}
                />
                
                <TextField
                  fullWidth
                  label="UPI Number"
                  name="upiNumber"
                  value={newBatch.upiNumber}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.upiNumber}
                  helperText={errors.upiNumber}
                />
                
                <Box>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Upload QR Code
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setNewBatch({
                          ...newBatch,
                          qrCode: file
                        });
                        setQrFileName(file ? file.name : '');
                      }}
                    />
                  </Button>
                  {qrFileName && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Selected file: {qrFileName}
                    </Typography>
                  )}
                  {errors.qrCode && (
                    <Typography color="error" variant="caption">
                      {errors.qrCode}
                    </Typography>
                  )}
                </Box>
                {errors.general && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {errors.general}
                  </Alert>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary" disabled={loading}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                variant="contained" 
                disabled={loading}
                sx={{ 
                  bgcolor: theme.primary,
                  '&:hover': { bgcolor: theme.primary }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Add Menu component */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEditClick}>
              <EditIcon sx={{ mr: 1, fontSize: 20 }} />
              Edit Batch
            </MenuItem>
            <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
              Delete Batch
            </MenuItem>
          </Menu>

          {/* Add Edit Batch Dialog */}
          <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ 
                        backgroundColor: theme.primary,
                        color: 'white',
                        py: 1.5
                      }}>Edit Batch</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Batch Name"
                  name="name"
                  value={editBatch.name}
                  onChange={handleEditChange}
                  margin="normal"
                  error={!!errors.name}
                  helperText={errors.name}
                />
                
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={editBatch.subject}
                  onChange={handleEditChange}
                  margin="normal"
                  error={!!errors.subject}
                  helperText={errors.subject}
                />

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Opening Date"
                    value={editBatch.openingDate}
                    onChange={(newValue) => handleEditTimeChange('openingDate', newValue)}
                    sx={{ mt: 2, width: '100%' }}
                    slotProps={{
                      textField: {
                        error: !!errors.openingDate,
                        helperText: errors.openingDate,
                        fullWidth: true
                      }
                    }}
                    format="DD/MM/YYYY"  // Add this line
                  />
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TimePicker
                      label="Start Time"
                      value={editBatch.startTime}
                      onChange={(newValue) => handleEditTimeChange('startTime', newValue)}
                      sx={{ flex: 1 }}
                      slotProps={{
                        textField: {
                          error: !!errors.startTime,
                          helperText: errors.startTime,
                          fullWidth: true
                        }
                      }}
                      views={['hours', 'minutes']}
                      format="HH:mm"
                    />
                    <TimePicker
                      label="End Time"
                      value={editBatch.endTime}
                      onChange={(newValue) => handleEditTimeChange('endTime', newValue)}
                      sx={{ flex: 1 }}
                      slotProps={{
                        textField: {
                          error: !!errors.endTime,
                          helperText: errors.endTime,
                          fullWidth: true
                        }
                      }}
                      views={['hours', 'minutes']}
                      format="HH:mm"
                    />
                  </Box>
                </LocalizationProvider>

                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Fees Details</Typography>
                <TextField
                  fullWidth
                  label="Batch Fees"
                  name="fees"
                  type="number"
                  value={editBatch.fees}
                  onChange={handleEditChange}
                  margin="normal"
                  error={!!errors.fees}
                  helperText={errors.fees}
                />
                
                <TextField
                  select
                  fullWidth
                  label="Number of Installments"
                  value={editBatch.numberOfInstallments}
                  onChange={handleEditNumberOfInstallmentsChange}
                  margin="normal"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map((num) => (
                    <MenuItem key={num} value={num}>
                      {num} {num === 1 ? 'Installment' : 'Installments'}
                    </MenuItem>
                  ))}
                </TextField>

                {editBatch.installmentDates.map((date, index) => (
                  <Box key={index} sx={{ mt: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={`Installment ${index + 1} Due Date`}
                        value={date}
                        onChange={(newValue) => handleEditInstallmentDateChange(index, newValue)}
                        sx={{ width: '100%' }}
                        format="DD/MM/YYYY"
                      />
                    </LocalizationProvider>
                  </Box>
                ))}
              
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Online Payment Details</Typography>
                <TextField
                  fullWidth
                  label="UPI Holder Name"
                  name="upiHolderName"
                  value={editBatch.upiHolderName}
                  onChange={handleEditChange}
                  margin="normal"
                  error={!!errors.upiHolderName}
                  helperText={errors.upiHolderName}
                />
                
                <TextField
                  fullWidth
                  label="UPI ID"
                  name="upiId"
                  value={editBatch.upiId}
                  onChange={handleEditChange}
                  margin="normal"
                  error={!!errors.upiId}
                  helperText={errors.upiId}
                />
                
                <TextField
                  fullWidth
                  label="UPI Number"
                  name="upiNumber"
                  value={editBatch.upiNumber}
                  onChange={handleEditChange}
                  margin="normal"
                  error={!!errors.upiNumber}
                  helperText={errors.upiNumber}
                />
                
                <Box>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Update QR Code
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setEditBatch({
                          ...editBatch,
                          qrCode: file
                        });
                        setEditQrFileName(file ? file.name : '');
                      }}
                    />
                  </Button>
                  {editQrFileName && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Selected file: {editQrFileName}
                    </Typography>
                  )}
                  {errors.qrCode && (
                    <Typography color="error" variant="caption">
                      {errors.qrCode}
                    </Typography>
                  )}
                </Box>
                {errors.general && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {errors.general}
                  </Alert>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditClose} color="primary" disabled={loading}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditSubmit} 
                variant="contained" 
                disabled={loading}
                sx={{ 
                  bgcolor: theme.primary,
                  '&:hover': { bgcolor: theme.primary }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Update'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Add Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleDeleteClose}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle sx={{ 
                        backgroundColor: 'error.main',
                        color: 'white',
                        py: 1.5
                      }}>Delete Batch</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete batch "{selectedBatch?.name}"? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDeleteClose} color="primary" disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                color="error"
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Add Snackbar for notifications */}
          <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
            <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          </Snackbar>
          
          <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseAlert}>
            <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
              Batch created successfully!
            </Alert>
          </Snackbar>
        </Box>
      )}
    </TeacherLayout>
  );
}