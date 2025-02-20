import TeacherLayout from '../components/TeacherLayout';
import { Typography } from '@mui/material';

export default function TeacherDashboard() {
  return (
    <TeacherLayout title="Dashboard">
      <Typography variant="h4" sx={{ mb: 4 }}>
        Welcome, Teacher
      </Typography>
      {/* Add your dashboard content here */}
    </TeacherLayout>
  );
}
