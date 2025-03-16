import { useState } from "react";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
  Dialog,
  DialogContent,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import { Book, Check, ArrowLeft } from "lucide-react";  // Add ArrowLeft import
import { useNavigate, useLocation } from "react-router-dom";  // Add useLocation
import { sendResetOTP, verifyResetOTP, resetPassword } from "../services/api";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2E7D32",
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
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search)
  const userType = searchParams.get('userType')
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successDialog, setSuccessDialog] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendResetOTP(email, userType);
      setStep(2);
      setError("");
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await verifyResetOTP(email, otp, userType);
      setStep(3);
      setError("");
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email, otp, newPassword, userType);
      setSuccessDialog(true);
      setTimeout(() => {
        navigate(`/login?userType=${userType}`);
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  const handleBackToLogin = () => {
    navigate(`/login?userType=${userType}`);
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
          flexDirection: 'column',  // Add this
          alignItems: 'center',
          justifyContent: 'center',
          py: 2,
          position: 'relative',  // Add this
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
              position: "relative", // Add this
            }}
          >
            {/* Move button here and update styling */}
           
            
            <Box
              sx={{
                backgroundColor: "primary.main",
                borderRadius: "50%",
                p: 2,
                mb: 2,
              }}
            >
              <Book size={32} color="white" />
            </Box>
            <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: "bold" }}>
              Reset Password
            </Typography>
            
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            {step === 1 && (
              <Box component="form" onSubmit={handleSendOTP} sx={{ width: "100%" }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : "Send OTP"}
                </Button>
              </Box>
            )}

            {step === 2 && (
              <Box component="form" onSubmit={handleVerifyOTP} sx={{ width: "100%" }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : "Verify OTP"}
                </Button>
              </Box>
            )}

            {step === 3 && (
              <Box component="form" onSubmit={handleResetPassword} sx={{ width: "100%" }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : "Reset Password"}
                </Button>
              </Box>
            )}

            <Button
              onClick={handleBackToLogin}
              sx={{ mt: 2, color: "text.secondary" }}
            >
              Back to Login
            </Button>
          </Box>
        </Container>
      </Box>

      <Dialog
        open={successDialog}
        maxWidth="xs"
        fullWidth={isMobile}
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Box
            sx={{
              backgroundColor: '#E8F5E9',
              borderRadius: '50%',
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <Check size={40} color="#2E7D32" />
          </Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Password Reset Successful
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can now login with your new password
          </Typography>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}
