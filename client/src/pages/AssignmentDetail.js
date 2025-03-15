import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TeacherLayout from '../components/TeacherLayout';

export default function AssignmentDetail() {
  const { state: assignment } = useLocation();

  if (!assignment) {
    return (
      <TeacherLayout>
        <Typography>Assignment not found</Typography>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <Box sx={{ p: 3, maxWidth: '800px', margin: '0 auto' }}>
        <Card elevation={2}>
          <CardContent>
            {/* Title Section */}
            <Typography variant="h4" gutterBottom>
              {assignment.title}
            </Typography>
            <Divider sx={{ my: 2 }} />

            {/* Due Date Section */}
            <Typography 
              variant="subtitle1" 
              color="text.secondary" 
              sx={{ mb: 3 }}
            >
              Due Date: {new Date(assignment.endTime).toLocaleString()}
            </Typography>

            {/* Question Section */}
            <Typography variant="h6" gutterBottom>
              Question:
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 3, 
                backgroundColor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1 
              }}
            >
              {assignment.question}
            </Typography>

            {/* Attachment Section */}
            {assignment.fileUrl && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => window.open(assignment.fileUrl, '_blank')}
                >
                  Download Attachment
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </TeacherLayout>
  );
}
