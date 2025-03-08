import StudentLayout from '../components/StudentLayout';
import { Typography } from '@mui/material';
import Loading from '../components/Loading';
import { useState, useEffect } from 'react';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <StudentLayout title="Dashboard">
      {loading ? (
        <Loading message="Loading dashboard..." />
      ) : (
        <>
          <Typography variant="h4" sx={{ mb: 4 }}>
            Welcome, Student
          </Typography>
          {/* Add your dashboard content here */}
        </>
      )}
    </StudentLayout>
  );
}
