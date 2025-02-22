import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  ThemeProvider,
  Typography,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import { UserCircle2 } from "lucide-react";

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
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          padding: "12px 24px",
          fontSize: "1rem",
        },
      },
    },
  },
});

export default function Landing() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          background: 'radial-gradient(circle at center, #2E7D32 0%, #4CAF50 40%, #A5D6A7 75%, #ffffff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant={isMobile ? "h4" : "h2"}
            align="center"
            sx={{
              mb: 6,
              fontWeight: "bold",
              color: "white",
              textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            Welcome to CMS
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 4,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Teacher Section */}
            <Box
              sx={{
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: isMobile ? '24px' : '40px',
                width: isMobile ? '100%' : '400px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                },
              }}
            >
              <UserCircle2 
                size={isMobile ? 120 : 160} 
                color="#2E7D32"
                style={{ marginBottom: '24px' }}
              />
              <Typography
                variant={isMobile ? "h5" : "h4"}
                sx={{ mb: 2, fontWeight: "bold", color: "#2E7D32" }}
              >
                Teacher
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/signup')}
                  sx={{
                    backgroundColor: "#2E7D32",
                    '&:hover': { backgroundColor: '#1B5E20' },
                  }}
                >
                  Sign Up
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  sx={{
                    borderColor: "#2E7D32",
                    color: "#2E7D32",
                    '&:hover': {
                      borderColor: '#1B5E20',
                      backgroundColor: 'rgba(46, 125, 50, 0.04)',
                    },
                  }}
                >
                  Login
                </Button>
              </Box>
            </Box>

            {/* Student Section */}
            <Box
              sx={{
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: isMobile ? '24px' : '40px',
                width: isMobile ? '100%' : '400px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                },
              }}
            >
              <UserCircle2 
                size={isMobile ? 120 : 160} 
                color="#2E7D32"
                style={{ marginBottom: '24px' }}
              />
              <Typography
                variant={isMobile ? "h5" : "h4"}
                sx={{ mb: 2, fontWeight: "bold", color: "#2E7D32" }}
              >
                Student
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/login', { state: { userType: 'student' } })}
                sx={{
                  backgroundColor: "#2E7D32",
                  '&:hover': { backgroundColor: '#1B5E20' },
                }}
              >
                Login
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
