import { useState, useEffect } from 'react';
import StudentLayout from '../components/StudentLayout';
import Loading from '../components/Loading';
import { Typography, Grid, Card, CardContent, CardHeader, Box, Avatar } from '@mui/material';
import { getStudentBatches } from '../services/api';
import { getUserFromCookie } from '../utils/cookies';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

// Define the same theme as TeacherDashboard for consistency
const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9',
  upcoming: '#ff9800',
};

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const userData = getUserFromCookie();
        const response = await getStudentBatches(userData.user.id);
        setBatches(response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  // Helper function to format display time
  const formatDisplayTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Helper function to format display date
  const formatDisplayDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to check if a batch is upcoming
  const isUpcomingBatch = (openingDate) => {
    return new Date(openingDate) > new Date();
  };

  const handleBatchClick = (batch) => {
    const encodedBatchName = encodeURIComponent(batch.name);
    navigate(`/student-dashboard/batch/${batch._id}?name=${encodedBatchName}`);
  };

  if (loading) return <Loading message="Loading dashboard..." />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <StudentLayout title="Dashboard">
      <Box>
        {/* <Typography variant="h4" sx={{ mb: 4 }}>
          Welcome, {getUserFromCookie()?.user?.name || 'Student'}
        </Typography> */}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            My Batches
          </Typography>
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
              You are not enrolled in any batches
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
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      cursor: 'pointer'
                    },
                    position: 'relative',
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
                          {batch.subject}
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
                         {batch.teacherName || 'N/A'}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        Opens: {formatDisplayDate(batch.openingDate)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </StudentLayout>
  );
}
