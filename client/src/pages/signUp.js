import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Button,
  Container,
  CssBaseline,
  Link,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
  useMediaQuery
} from "@mui/material"
import { Book, Eye, EyeOff, Check, ArrowLeft } from "lucide-react"
import { signup } from '../services/api';

const countryCodes = [
  { code: '+91', country: 'India' },
  { code: '+1', country: 'USA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+86', country: 'China' },
  { code: '+81', country: 'Japan' },
  { code: '+971', country: 'UAE' },
  { code: '+65', country: 'Singapore' }
]

const theme = createTheme({
  palette: {
    primary: {
      main: "#2E7D32",
    },
    background: {
      default: "#ffffff",
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#e8f5e9",
            borderRadius: "12px",
            "& fieldset": {
              borderColor: "transparent",
            },
            "&:hover fieldset": {
              borderColor: "transparent",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#2E7D32",
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          padding: "12px",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: "#e8f5e9",
          borderRadius: "12px",
        },
      },
    },
  },
})

export default function SignUp() {
  const navigate = useNavigate()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cochingName: "",
    phoneNumber: "",
    countryCode: "+91",
    address: "",
    role: "teacher"
  })

  const [showPassword, setShowPassword] = useState(false)
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false)
  const [errors, setErrors] = useState({});
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [processingDialog, setProcessingDialog] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Password validation (minimum 6 characters)
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number (10 digits required)';
    }

    // Coaching Name validation
    if (!formData.cochingName.trim()) {
      newErrors.cochingName = 'Coaching name is required';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      setErrorDialog({
        open: true,
        message: Object.values(errors).join('\n')
      });
      return;
    }

    setIsLoading(true);
    setProcessingDialog(true);

    try {
      const response = await signup(formData);
      if (response.success) {
        localStorage.setItem('token', response.token);
        setProcessingDialog(false);
        setOpenSuccessDialog(true);
      } else {
        setProcessingDialog(false);
        setErrorDialog({
          open: true,
          message: response.message || 'Registration failed'
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setProcessingDialog(false);
      const errorMessage = error.response?.data?.message || 
                        'User already exists with this email';
      setErrorDialog({
        open: true,
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setOpenSuccessDialog(false);
    navigate('/login?userType=teacher');
  };

  const handleCloseErrorDialog = () => {
    setErrorDialog({
      open: false,
      message: ''
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          background: 'radial-gradient(circle at center, #2E7D32 0%, #4CAF50 40%, #A5D6A7 75%, #ffffff 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 2,
          position: 'relative',
        }}
      >
        <Button
          startIcon={<ArrowLeft size={isMobile ? 16 : 20} />}
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            left: { xs: 16, sm: 30, md: 50 },
            top: { xs: 16, sm: 30, md: 50 },
            color: "white",
            backgroundColor: "primary.main",
            fontSize: { xs: '0.875rem', sm: '1rem' },
            py: { xs: 1, sm: 1.5 },
            px: { xs: 2, sm: 3 },
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': {
              backgroundColor: '#1B5E20',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          }}
        >
          Back to Home
        </Button>
        <Container component="main" maxWidth="sm" sx={{ px: isMobile ? 2 : 3, mt: { xs: 5, sm: 6, md: 7 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: isMobile ? "16px" : "24px",
              padding: isMobile ? "24px 16px" : "40px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              width: "100%",
              margin: "0 auto",
            }}
          >
            <Box
              sx={{
                backgroundColor: "primary.main",
                borderRadius: "50%",
                p: isMobile ? 1.5 : 2,
                mb: isMobile ? 1.5 : 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Book size={isMobile ? 24 : 32} color="white" />
            </Box>
            <Typography component="h1" variant={isMobile ? "h6" : "h5"} sx={{ mb: 1, fontWeight: "bold" }}>
              Teacher Registration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: "center" }}>
              Create your teacher account
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: 1.5 }} // Reduced margin for mobile
                inputProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
                InputLabelProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                sx={{ mb: 1.5 }}
                inputProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
                InputLabelProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                sx={{ mb: 1.5 }}
                inputProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
                InputLabelProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size={isMobile ? "small" : "medium"}
                      >
                        {showPassword ? <EyeOff size={isMobile ? 16 : 20} /> : <Eye size={isMobile ? 16 : 20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="cochingName"
                label="Coaching Name"
                value={formData.cochingName}
                onChange={handleChange}
                error={!!errors.cochingName}
                helperText={errors.cochingName}
                sx={{ mb: 1.5 }}
                inputProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
                InputLabelProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
              />
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: 1, 
                mb: 1.5 
              }}>
                <FormControl sx={{ 
                  width: isMobile ? '100%' : '40%',
                  mb: isMobile ? 1.5 : 0
                }}>
                  <InputLabel style={{ fontSize: isMobile ? 14 : 16 }}>Code</InputLabel>
                  <Select
                    name="countryCode"
                    value={formData.countryCode}
                    label="Code"
                    onChange={handleChange}
                    inputProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
                  >
                    {countryCodes.map((country) => (
                      <MenuItem key={country.code} value={country.code} style={{ fontSize: isMobile ? 14 : 16 }}>
                        {country.country} ({country.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  required
                  name="phoneNumber"
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber}
                  sx={{ width: isMobile ? '100%' : '60%' }}
                  inputProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
                  InputLabelProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
                />
              </Box>

              <TextField
                required
                fullWidth
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                error={!!errors.address}
                helperText={errors.address}
                sx={{ mb: 1.5 }}
                inputProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
                InputLabelProps={{ style: { fontSize: isMobile ? 14 : 16 } }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: isMobile ? 1 : 1.5,
                  fontSize: isMobile ? 14 : 16,
                  backgroundColor: "primary.main",
                }}
              >
                {isLoading ? (
                  <CircularProgress size={isMobile ? 20 : 24} sx={{ color: 'white' }} />
                ) : (
                  'Sign Up'
                )}
              </Button>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                mt: 1 
              }}>
                <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary" align="center">
                  Already have an account?{" "}
                  <Link 
                    href="/login" 
                    onClick={(e) => {
                      e.preventDefault()
                      navigate('/login?userType=teacher')
                    }}
                    sx={{ color: "primary.main", textDecoration: "none", fontWeight: "medium" }}
                  >
                    Log in
                  </Link>
                </Typography>
                {/* Remove or comment out the old "Go to Home" button inside the form */}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Dialog
        open={openSuccessDialog}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth={isMobile}
        fullScreen={isMobile && window.innerHeight < 500}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '12px' : '16px',
            m: isMobile ? 2 : 'auto'
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: isMobile ? 2 : 4 }}>
          <Box
            sx={{
              backgroundColor: '#E8F5E9',
              borderRadius: '50%',
              width: isMobile ? 60 : 80,
              height: isMobile ? 60 : 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <Check size={isMobile ? 30 : 40} color="#2E7D32" />
          </Box>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 1, fontWeight: 'bold' }}>
            Registration Successful!
          </Typography>
          <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
            Your teacher account has been created successfully. Please login to continue.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: isMobile ? 2 : 3 }}>
          <Button
            variant="contained"
            onClick={handleGoToLogin}
            sx={{
              borderRadius: '12px',
              px: 3,
              py: isMobile ? 0.75 : 1,
              fontSize: isMobile ? 14 : 16,
              backgroundColor: "primary.main",
            }}
          >
            Go to Login
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={errorDialog.open}
        onClose={handleCloseErrorDialog}
        maxWidth="xs"
        fullWidth={isMobile}
        fullScreen={isMobile && window.innerHeight < 500}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '12px' : '16px',
            m: isMobile ? 2 : 'auto'
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: isMobile ? 2 : 4 }}>
          <Box
            sx={{
              backgroundColor: '#FFEBEE',
              borderRadius: '50%',
              width: isMobile ? 60 : 80,
              height: isMobile ? 60 : 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <svg width={isMobile ? 30 : 40} height={isMobile ? 30 : 40} viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </Box>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 1, fontWeight: 'bold', color: '#D32F2F' }}>
            Registration Error
          </Typography>
          <Typography variant={isMobile ? "body2" : "body1"} color="error" sx={{ whiteSpace: 'pre-line' }}>
            {errorDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: isMobile ? 2 : 3 }}>
          <Button
            variant="contained"
            onClick={handleCloseErrorDialog}
            sx={{
              borderRadius: '12px',
              px: 3,
              py: isMobile ? 0.75 : 1,
              fontSize: isMobile ? 14 : 16,
              backgroundColor: "#D32F2F",
              '&:hover': {
                backgroundColor: '#C62828'
              }
            }}
          >
            Try Again
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={processingDialog}
        maxWidth="xs"
        fullWidth={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '16px' : '24px',
            minWidth: isMobile ? '80%' : '300px',
            m: isMobile ? 2 : 'auto'
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: isMobile ? 2 : 3 }}>
          <CircularProgress sx={{ color: 'primary.main', mb: 1.5 }} size={isMobile ? 30 : 40} />
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 0.5 }}>
            Processing Registration
          </Typography>
          <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
            Please wait while we create your account...
          </Typography>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  )
}