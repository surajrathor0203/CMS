import { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import StudentLayout from '../components/StudentLayout';
import { getUserFromCookie } from '../utils/cookies';
import PersonIcon from '@mui/icons-material/Person';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { getStudentProfile, updateStudentProfile, updateStudentPassword } from '../services/api';
import Loading from '../components/Loading'; // Add this import
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DeleteIcon from '@mui/icons-material/Delete';

export default function StudentProfile() {
  const user = getUserFromCookie()?.user;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    parentPhone: '',
    address: '',
    profilePictureUrl: '',
    previewUrl: '',
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
        const response = await getStudentProfile(user.id);
        if (response.success) {
          setFormData({
            name: response.data.name,
            email: response.data.email,
            phone: response.data.phone,
            parentPhone: response.data.parentPhone,
            address: response.data.address,
            profilePictureUrl: response.data.profilePicture?.url || '', // Add this line
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
      const response = await updateStudentPassword(user.id, {
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
      // Optional: Show preview
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
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('parentPhone', formData.parentPhone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('removeProfilePicture', 'true');

      const response = await updateStudentProfile(user.id, formDataToSend);
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
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('parentPhone', formData.parentPhone);
      formDataToSend.append('address', formData.address);
      
      if (profilePicture) {
        formDataToSend.append('file', profilePicture);
      }

      const response = await updateStudentProfile(user.id, formDataToSend);
      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        // Update the profile picture URL in the form data
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
      <StudentLayout title="Profile Settings">
        <Loading message="Loading profile data..." />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Profile Settings">
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Card elevation={3}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={formData.previewUrl || formData.profilePictureUrl}
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: '#2e7d32',
                    mb: 2,
                    '& img': { // Add styles for the image
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%'
                    }
                  }}
                >
                  {(!formData.previewUrl && !formData.profilePictureUrl) && (
                    <PersonIcon sx={{ fontSize: 60 }} />
                  )}
                </Avatar>
                {isEditing && (
                  <Box sx={{ position: 'absolute', bottom: 16, right: -16, display: 'flex', gap: 1 }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProfilePictureChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <IconButton
                      sx={{
                        bgcolor: 'rgba(0, 0, 0, 0.3)',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.5)' }
                      }}
                      onClick={handleProfilePictureClick}
                    >
                      <PhotoCamera sx={{ color: 'white' }} />
                    </IconButton>
                    {(formData.profilePictureUrl || formData.previewUrl) && (
                      <IconButton
                        sx={{
                          bgcolor: 'rgba(211, 47, 47, 0.3)',
                          '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.5)' }
                        }}
                        onClick={handleRemoveProfilePicture}
                      >
                        <DeleteIcon sx={{ color: 'white' }} />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
              <Typography variant="h5" gutterBottom>
                {formData.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Student ID: {user?.username}
              </Typography>
            </Box>

            {message && (
              <Alert severity={message.type} sx={{ mb: 3 }}>
                {message.text}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Parent's Phone"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    {!isEditing ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <>
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
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </form>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenPasswordDialog(true)}
              sx={{ mt: 2 }}
            >
              Change Password
            </Button>
            <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
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
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
                <Button onClick={handlePasswordUpdate} variant="contained" color="primary">
                  Update Password
                </Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      </Box>
    </StudentLayout>
  );
}
