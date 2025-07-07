import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import AdminLayout from '../components/AdminLayout';
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan
} from '../services/api';

const AdminSubscriptionPlans = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    duration: '',
    maxBatches: '',
    accountHolderName: '',
    upiId: '',
    upiNumber: '',
    qrCode: null
  });
  const [qrFileName, setQrFileName] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await getSubscriptionPlans();
      if (response.success) {
        const sortedPlans = response.data.sort((a, b) => a.price - b.price);
        setPlans(sortedPlans);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch plans');
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    resetForm();
    setOpenDialog(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.duration || formData.duration <= 0) newErrors.duration = 'Valid duration is required';
    if (!formData.maxBatches) newErrors.maxBatches = 'Max batches is required';
    if (!formData.accountHolderName.trim()) newErrors.accountHolderName = 'Account holder name is required';
    if (!formData.upiId.trim()) newErrors.upiId = 'UPI ID is required';
    if (!formData.upiNumber.trim()) newErrors.upiNumber = 'UPI number is required';
    if (!formData.qrCode && !editingPlan) newErrors.qrCode = 'QR code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('maxBatches', formData.maxBatches);
      formDataToSend.append('accountHolderName', formData.accountHolderName);
      formDataToSend.append('upiId', formData.upiId);
      formDataToSend.append('upiNumber', formData.upiNumber);

      if (formData.qrCode) {
        formDataToSend.append('qrCode', formData.qrCode);
      }

      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan._id, formDataToSend);
        toast.success('Plan updated successfully');
      } else {
        await createSubscriptionPlan(formDataToSend);
        toast.success('Plan created successfully');
      }

      setOpenDialog(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      price: '',
      duration: '',
      maxBatches: '',
      accountHolderName: '',
      upiId: '',
      upiNumber: '',
      qrCode: null
    });
    setQrFileName('');
    setEditingPlan(null);
    setErrors({});
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      price: plan.price.toString(),
      duration: plan.duration.toString(),
      maxBatches: plan.maxBatches.toString(),
      accountHolderName: plan.accountHolderName || '',
      upiId: plan.upiId || '',
      upiNumber: plan.upiNumber || '',
      qrCode: null
    });
    setOpenDialog(true);
  };

  const handleDelete = (planId) => {
    setPlanToDelete(planId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    try {
      await deleteSubscriptionPlan(planToDelete);
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      toast.error(error.message || 'Failed to delete plan');
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  return (
    <AdminLayout
      mobileOpen={mobileOpen}
      handleDrawerToggle={handleDrawerToggle}
    >
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Manage Subscription Plans
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleAddPlan}
              sx={{ bgcolor: '#2e7d32' }}
            >
              Add New Plan
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {plans.map((plan) => (
              <Grid item xs={12} md={4} key={plan._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" component="h2" sx={{ color: '#2e7d32' }}>
                      {plan.title}
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ my: 2 }}>
                      ₹{plan.price}
                    </Typography>
                    <Typography color="text.secondary">
                      Duration: {plan.duration} {plan.duration === 1 ? 'Month' : 'Months'}
                    </Typography>
                    <Typography color="text.secondary">
                      Max Batches: {plan.maxBatches === -1 ? 'Unlimited' : plan.maxBatches}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        sx={{ mr: 1 }}
                        onClick={() => handleEdit(plan)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error"
                        onClick={() => handleDelete(plan._id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {editingPlan ? 'Edit Subscription Plan' : 'Add New Subscription Plan'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Plan Title"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={!!errors.title}
            helperText={errors.title}
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            error={!!errors.price}
            helperText={errors.price}
          />
          <TextField
            margin="dense"
            label="Duration (in months)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            error={!!errors.duration}
            helperText={errors.duration}
          />
          <TextField
            margin="dense"
            label="Maximum Batches"
            fullWidth
            variant="outlined"
            value={formData.maxBatches}
            onChange={(e) => setFormData({ ...formData, maxBatches: e.target.value })}
            error={!!errors.maxBatches}
            helperText={errors.maxBatches}
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Payment Details</Typography>
          
          <TextField
            fullWidth
            label="Account Holder Name"
            value={formData.accountHolderName}
            onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
            margin="dense"
            error={!!errors.accountHolderName}
            helperText={errors.accountHolderName}
          />

          <TextField
            fullWidth
            label="UPI ID"
            value={formData.upiId}
            onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
            margin="dense"
            error={!!errors.upiId}
            helperText={errors.upiId}
          />

          <TextField
            fullWidth
            label="UPI Number"
            value={formData.upiNumber}
            onChange={(e) => setFormData({ ...formData, upiNumber: e.target.value })}
            margin="dense"
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
              {editingPlan ? 'Update QR Code' : 'Upload QR Code'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setFormData({ ...formData, qrCode: file });
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ bgcolor: '#2e7d32' }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {editingPlan ? (loading ? 'Updating...' : 'Update Plan') : (loading ? 'Saving...' : 'Save Plan')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this subscription plan?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSubscriptionPlans;
