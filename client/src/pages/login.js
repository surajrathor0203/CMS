import { useState } from "react"
import { useLocation } from "react-router-dom"
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
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  useMediaQuery
} from "@mui/material"
import { Book, Eye, EyeOff, Check, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { login } from "../services/api"

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
  },
})

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const userType = searchParams.get('userType')
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [processingDialog, setProcessingDialog] = useState(false)
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    message: '',
    userName: ''
  })
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    message: ''
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setProcessingDialog(true);

    try {
      const response = await login(
        formData.identifier, 
        formData.password,
        userType || 'teacher'
      );
      
      if (response.success) {
        const userData = response.user; // Get user data from response
        setProcessingDialog(false);
        setSuccessDialog({
          open: true,
          message: 'Login successful!',
          userName: userData.name || 'User'
        });

        // Delay navigation to show the success message
        setTimeout(() => {
          // Handle different user roles and status
          if (userData.role === 'teacher') {
            // Check teacher's status from response data
            const redirectPath = userData.status === 'locked' 
              ? '/teacher/subscription'
              : '/teacher-dashboard';
            navigate(redirectPath);
          } else {
            // Handle other roles as before
            const paths = {
              student: '/student-dashboard',
              admin: '/admin-dashboard',
              default: '/login'
            };
            const redirectPath = paths[userData.role] || paths.default;
            navigate(redirectPath);
          }
        }, 1500);
      }
    } catch (error) {
      setProcessingDialog(false);
      if (error.message === 'Request timed out. Please try again.') {
        setErrorDialog({
          open: true,
          message: 'Server is taking too long to respond. Please try again in a moment.'
        });
      } else {
        setErrorDialog({
          open: true,
          message: error.message || 'Invalid credentials'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseErrorDialog = () => {
    setErrorDialog({ open: false, message: '' });
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
            left: { xs: 10, sm: 20, md: 40 },
            top: { xs: 10, sm: 20, md: 40 },
            color: "white",
            backgroundColor: "primary.main",
            fontSize: { xs: '0.875rem', sm: '1rem' },
            py: { xs: 1, sm: 1.5 },
            px: { xs: 2, sm: 3 },
            '&:hover': {
              backgroundColor: '#1B5E20',
            },
          }}
        >
          Back to Home
        </Button>
        <Container component="main" maxWidth="sm">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: "24px",
              padding: "40px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              width: "100%",
              maxWidth: "600px",
              margin: "0 auto",
              position: "relative",
            }}
          >
            <Box
              sx={{
                backgroundColor: "primary.main",
                borderRadius: "50%",
                p: 2,
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Book size={32} color="white" />
            </Box>
            <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: "bold" }}>
              Welcome Back {userType}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
              Please login to your account
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="identifier"
                label="Email or Username"
                value={formData.identifier}
                onChange={handleChange}
                sx={{ mb: 1.5 }}
                placeholder="Enter your email or username"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                sx={{ mb: 1.5 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  backgroundColor: "primary.main",
                }}
              >
                {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Login'}
              </Button>
              <Typography variant="body2" align="center">
                <Link 
                  href={`/forgot-password?userType=${userType}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/forgot-password?userType=${userType}`);
                  }}
                  sx={{ color: "primary.main", textDecoration: "none" }}
                >
                  Forgot password?
                </Link>
              </Typography>
              {userType === 'teacher' && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                  Don't have an account?{" "}
                  <Link 
                    href={`/signup?userType=${userType}`} 
                    onClick={(e) => {
                      e.preventDefault()
                      navigate(`/signup?userType=${userType}`)
                    }}
                    sx={{ color: "primary.main", textDecoration: "none", fontWeight: "medium" }}
                  >
                    Sign up
                  </Link>
                </Typography>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      <Dialog
        open={successDialog.open}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth={isMobile}
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
            Welcome back, {successDialog.userName}!
          </Typography>
          <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
            You have successfully logged in.
          </Typography>
        </DialogContent>
      </Dialog>

      <Dialog
        open={errorDialog.open}
        onClose={handleCloseErrorDialog}
        maxWidth="xs"
        fullWidth={isMobile}
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
            Login Failed
          </Typography>
          <Typography variant={isMobile ? "body2" : "body1"} color="error">
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
            Logging In
          </Typography>
          <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
            Please wait while we verify your credentials...
          </Typography>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  )
}
