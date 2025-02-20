import StudentLayout from '../components/StudentLayout';
import { Typography } from '@mui/material';

export default function StudentDashboard() {
  return (
    <StudentLayout title="Dashboard">
      <Typography variant="h4" sx={{ mb: 4 }}>
        Welcome, Student
      </Typography>
      {/* Add your dashboard content here */}
    </StudentLayout>
  );
}
