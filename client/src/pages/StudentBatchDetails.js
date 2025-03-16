import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import StudentLayout from '../components/StudentLayout';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  Paper,
  IconButton,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SubjectIcon from '@mui/icons-material/Subject';
import DownloadIcon from '@mui/icons-material/Download';

// Same theme as BatchPage
const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9',
};

// Dummy data
const dummyBatchDetails = {
  _id: "123",
  name: "React Development Batch",
  subject: "Web Development",
  teacherName: "John Doe",
  openingDate: "2024-02-01",
  startTime: "2024-02-01T09:00:00",
  endTime: "2024-02-01T11:00:00",
};

const dummyAssignments = [
  {
    _id: "1",
    title: "React Components Assignment",
    dueDate: "2024-02-15",
    status: "Pending",
    submitted: false
  },
  {
    _id: "2",
    title: "State Management Project",
    dueDate: "2024-02-20",
    status: "Submitted",
    submitted: true
  },
  {
    _id: "3",
    title: "API Integration Exercise",
    dueDate: "2024-02-25",
    status: "Pending",
    submitted: false
  }
];

const dummyNotes = [
  {
    _id: "1",
    title: "React Fundamentals",
    fileUrl: "#"
  },
  {
    _id: "2",
    title: "State Management in React",
    fileUrl: "#"
  }
];

const dummyQuizzes = [
  {
    _id: "1",
    title: "React Basics Quiz",
    duration: 30,
    startTime: "2024-02-10T10:00:00",
    questions: Array(10).fill({})
  },
  {
    _id: "2",
    title: "Advanced React Concepts",
    duration: 45,
    startTime: "2024-02-15T14:00:00",
    questions: Array(15).fill({})
  }
];

export default function StudentBatchDetails() {
  const { batchId } = useParams();
  const [searchParams] = useSearchParams();
  const batchName = searchParams.get('name');
  const [activeTab, setActiveTab] = useState('activity');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const NotesSection = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" color={theme.primary} gutterBottom>
        Notes
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {dummyNotes.length > 0 ? (
        <Paper>
          <List>
            {dummyNotes.map((note) => (
              <ListItem
                key={note._id}
                secondaryAction={
                  <IconButton edge="end" onClick={() => window.open(note.fileUrl, '_blank')}>
                    <DownloadIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={note.title} />
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography variant="body1" color="text.secondary" textAlign="center">
          No notes available
        </Typography>
      )}
    </Box>
  );

  return (
    <StudentLayout title={batchName || 'Batch Details'}>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Batch Information Card */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color={theme.primary}>
                  Batch Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SubjectIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Subject: {dummyBatchDetails.subject}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccessTimeIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Time: {formatTime(dummyBatchDetails.startTime)} - {formatTime(dummyBatchDetails.endTime)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarTodayIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Opening Date: {formatDate(dummyBatchDetails.openingDate)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ color: theme.primary, mr: 1 }} />
                      <Typography variant="body1">
                        Teacher: {dummyBatchDetails.teacherName}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Tabs Section */}
          <Grid item xs={12}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': { fontWeight: 'bold' },
                  '& .Mui-selected': { color: theme.primary },
                  '& .MuiTabs-indicator': { backgroundColor: theme.primary }
                }}
              >
                <Tab label="Batch Activity" value="activity" />
                <Tab label="My Progress" value="progress" />
              </Tabs>
            </Box>
          </Grid>

          {/* Content based on active tab */}
          {activeTab === 'activity' && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  {/* Notes Section */}
                  <NotesSection />

                  {/* Quizzes Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color={theme.primary} gutterBottom>
                      Quizzes
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {dummyQuizzes.map((quiz) => (
                        <Grid item xs={12} sm={6} md={4} key={quiz._id}>
                          <Card 
                            elevation={2}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { boxShadow: 6 }
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                                {quiz.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Duration: {quiz.duration} minutes
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Start Time: {new Date(quiz.startTime).toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Questions: {quiz.questions.length}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    {dummyQuizzes.length === 0 && (
                      <Typography variant="body1" color="text.secondary" textAlign="center">
                        No quizzes available
                      </Typography>
                    )}
                  </Box>

                  {/* Assignments Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color={theme.primary} gutterBottom>
                      Assignments
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {dummyAssignments.map((assignment) => (
                        <Grid item xs={12} sm={6} md={4} key={assignment._id}>
                          <Card 
                            elevation={2}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { boxShadow: 6 }
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                                {assignment.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Due: {formatDate(assignment.dueDate)}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Chip
                                  label={assignment.submitted ? 'Submitted' : 'Not Submitted'}
                                  color={assignment.submitted ? 'success' : 'warning'}
                                  size="small"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {activeTab === 'progress' && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    My Progress Coming Soon...
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </StudentLayout>
  );
}
