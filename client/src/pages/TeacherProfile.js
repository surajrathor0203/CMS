import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Alert,
  IconButton,
  Zoom,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import TeacherLayout from '../components/TeacherLayout';
import { getUserFromCookie } from '../utils/cookies';
import PersonIcon from '@mui/icons-material/Person';
import { getTeacherProfile, updateTeacherProfile, updateTeacherPassword } from '../services/api';
import Loading from '../components/Loading';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';

export default function TeacherProfile() {
  const user = getUserFromCookie()?.user;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    subject: '',
    address: '',
    profilePictureUrl: '',
    previewUrl: '',
    username: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const fileInputRef = useRef(null);
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getTeacherProfile(user.id);
        if (response.success) {
          setFormData({
            name: response.data.name,
            email: response.data.email,
            phoneNumber: response.data.phoneNumber,
            subject: response.data.subject,
            address: response.data.address,
            profilePictureUrl: response.data.profilePictureUrl || '',
            previewUrl: '',
            username: response.data.username,
          });
        }
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to fetch profile' });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    setPasswordError('');
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    try {
      const response = await updateTeacherPassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setOpenPasswordDialog(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      setPasswordError(error.message || 'Failed to update password');
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current.click();
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          previewUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('removeProfilePicture', 'true');

      const response = await updateTeacherProfile(user.id, formDataToSend);
      if (response.success) {
        setMessage({ type: 'success', text: 'Profile picture removed successfully!' });
        setFormData(prev => ({
          ...prev,
          profilePictureUrl: '',
          previewUrl: ''
        }));
        setProfilePicture(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to remove profile picture' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('address', formData.address);
      
      if (profilePicture) {
        formDataToSend.append('file', profilePicture);
      }

      const response = await updateTeacherProfile(user.id, formDataToSend);
      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        if (response.data.profilePicture?.url) {
          setFormData(prev => ({
            ...prev,
            profilePictureUrl: response.data.profilePicture.url
          }));
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    }
  };

  if (loading) {
    return (
      <TeacherLayout title="Profile Settings">
        <Loading message="Loading profile data..." />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Profile Settings">
      <Box 
        sx={{ 
          maxWidth: 1200, 
          mx: 'auto', 
          mt: 4,
          px: 3,
          position: 'relative'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 4,
              background: 'linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%)',
              overflow: 'visible',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '200px',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                borderRadius: '16px 16px 0 0',
              }
            }}
          >
            <CardContent sx={{ position: 'relative', p: 4 }}>
              <Grid container spacing={4}>
                {/* Profile Header Section */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    mt: 8
                  }}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Avatar
                        src={formData.previewUrl || formData.profilePictureUrl}
                        sx={{
                          width: 180,
                          height: 180,
                          border: '5px solid white',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          bgcolor: 'primary.main',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        {(!formData.previewUrl && !formData.profilePictureUrl) && (
                          <PersonIcon sx={{ fontSize: 80 }} />
                        )}
                      </Avatar>
                    </motion.div>

                    {isEditing && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleProfilePictureChange}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                        <IconButton
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { transform: 'scale(1.1)' },
                            transition: 'all 0.3s ease',
                          }}
                          onClick={handleProfilePictureClick}
                        >
                          <PhotoCamera />
                        </IconButton>
                        {(formData.profilePictureUrl || formData.previewUrl) && (
                          <IconButton
                            sx={{
                              bgcolor: 'error.main',
                              color: 'white',
                              '&:hover': { transform: 'scale(1.1)' },
                              transition: 'all 0.3s ease',
                            }}
                            onClick={handleRemoveProfilePicture}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    )}

                    <Typography 
                      variant="h4" 
                      sx={{ 
                        mt: 3,
                        fontWeight: 700,
                        color: 'text.primary',
                        textAlign: 'center'
                      }}
                    >
                      {formData.name}
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{
                        color: 'text.secondary',
                        mt: 1,
                        mb: 3,
                        textAlign: 'center'
                      }}
                    >
                      {formData.subject}
                    </Typography>
                  </Box>
                </Grid>

                {/* Profile Details Section */}
                <Grid item xs={12} md={8}>
                  <Box sx={{ mt: { xs: 2, md: 12 } }}>
                    {message && (
                      <Alert 
                        severity={message.type} 
                        sx={{ 
                          mb: 3,
                          borderRadius: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        {message.text}
                      </Alert>
                    )}

                    {!isEditing ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 3, 
                            mb: 3,
                            borderRadius: 2,
                            backgroundColor: '#fff',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                          }}
                        >
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                              <Paper 
                                elevation={0}
                                sx={{ 
                                  p: 2, 
                                  mb: 2,
                                  borderRadius: 2,
                                  backgroundColor: '#f8f9fa',
                                }}
                              >
                                <Typography variant="overline" color="primary.main">Name</Typography>
                                <Typography variant="h6">{formData.name}</Typography>
                              </Paper>
                              <Paper 
                                elevation={0}
                                sx={{ 
                                  p: 2, 
                                  mb: 2,
                                  borderRadius: 2,
                                  backgroundColor: '#f8f9fa',
                                }}
                              >
                                <Typography variant="overline" color="primary.main">Username</Typography>
                                <Typography variant="h6">{formData.username}</Typography>
                              </Paper>
                              <Paper 
                                elevation={0}
                                sx={{ 
                                  p: 2, 
                                  mb: 2,
                                  borderRadius: 2,
                                  backgroundColor: '#f8f9fa',
                                }}
                              >
                                <Typography variant="overline" color="primary.main">Email</Typography>
                                <Typography variant="h6">{formData.email}</Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Paper 
                                elevation={0}
                                sx={{ 
                                  p: 2, 
                                  mb: 2,
                                  borderRadius: 2,
                                  backgroundColor: '#f8f9fa',
                                }}
                              >
                                <Typography variant="overline" color="primary.main">Phone Number</Typography>
                                <Typography variant="h6">{formData.phoneNumber}</Typography>
                              </Paper>
                              <Paper 
                                elevation={0}
                                sx={{ 
                                  p: 2,
                                  borderRadius: 2,
                                  backgroundColor: '#f8f9fa',
                                }}
                              >
                                <Typography variant="overline" color="primary.main">Address</Typography>
                                <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
                                  {formData.address}
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                        </Paper>

                        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                          <Button
                            variant="contained"
                            onClick={() => setOpenPasswordDialog(true)}
                            startIcon={<LockResetIcon />}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              px: 3,
                              py: 1.5,
                            }}
                          >
                            Change Password
                          </Button>
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => setIsEditing(true)}
                            startIcon={<EditIcon />}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              px: 3,
                              py: 1.5,
                            }}
                          >
                            Edit Profile
                          </Button>
                        </Box>
                      </motion.div>
                    ) : (
                      // Edit Form View
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 3,
                          borderRadius: 2,
                          backgroundColor: '#fff',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                        }}
                      >
                        <form onSubmit={handleSubmit}>
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                variant="outlined"
                                sx={{ mb: 2 }}
                              />
                              <TextField
                                fullWidth
                                label="Username"
                                name="username"
                                value={formData.username}
                                disabled
                                variant="outlined"
                                sx={{ mb: 2 }}
                              />
                              <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                value={formData.email}
                                disabled
                                variant="outlined"
                                sx={{ mb: 2 }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Phone Number"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                variant="outlined"
                                sx={{ mb: 2 }}
                              />
                              <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                multiline
                                rows={3}
                                variant="outlined"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                  variant="outlined"
                                  onClick={() => setIsEditing(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  type="submit"
                                >
                                  Save Changes
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </form>
                      </Paper>
                    )}

                    {/* Password Change Dialog */}
                    <Dialog 
                      open={openPasswordDialog} 
                      onClose={() => setOpenPasswordDialog(false)}
                      maxWidth="xs"
                      fullWidth
                    >
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogContent>
                        {passwordError && (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {passwordError}
                          </Alert>
                        )}
                        <TextField
                          fullWidth
                          margin="dense"
                          label="Current Password"
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          variant="outlined"
                        />
                        <TextField
                          fullWidth
                          margin="dense"
                          label="New Password"
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          variant="outlined"
                        />
                        <TextField
                          fullWidth
                          margin="dense"
                          label="Confirm New Password"
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          variant="outlined"
                        />
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={handlePasswordUpdate} 
                          variant="contained" 
                          color="primary"
                        >
                          Update Password
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </TeacherLayout>
  );
}