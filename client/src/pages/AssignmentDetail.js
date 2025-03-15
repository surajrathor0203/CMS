import React, { useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import TeacherLayout from '../components/TeacherLayout';
import { editAssignment } from '../services/api';

export default function AssignmentDetail() {
  const { state: assignment } = useLocation();
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [openEdit, setOpenEdit] = useState(false);
  const [editedAssignment, setEditedAssignment] = useState({
    title: assignment?.title || '',
    question: assignment?.question || '',
    endTime: assignment?.endTime ? new Date(assignment.endTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    file: null,
    _id: assignment?._id,
    batchId: batchId
  });

  if (!assignment) {
    return (
      <TeacherLayout>
        <Typography>Assignment not found</Typography>
      </TeacherLayout>
    );
  }

  const handleEditOpen = () => {
    setOpenEdit(true);
  };

  const handleEditClose = () => {
    setOpenEdit(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedAssignment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setEditedAssignment(prev => ({
      ...prev,
      file: e.target.files[0]
    }));
  };

  const handleSubmit = async () => {
    try {
      const formattedAssignment = {
        ...editedAssignment,
        endTime: new Date(editedAssignment.endTime).toISOString()
      };
      await editAssignment(editedAssignment._id, formattedAssignment, batchId);
      handleEditClose();
      navigate(`/teacher-dashboard/batch/${batchId}`);
    } catch (error) {
      console.error('Error updating assignment:', error);
      // Handle error (show notification, etc.)
    }
  };

  return (
    <TeacherLayout title='Assignment Details'>
      <Box sx={{ p: 3, maxWidth: '800px', margin: '0 auto' }}>
        <Card elevation={2}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" gutterBottom>
                {assignment.title}
              </Typography>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditOpen}
                sx={{ mb: 2 }}
              >
                Edit
              </Button>
            </Box>
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

        {/* Edit Dialog */}
        <Dialog open={openEdit} onClose={handleEditClose} maxWidth="md" fullWidth>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={editedAssignment.title}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Question"
                name="question"
                value={editedAssignment.question}
                onChange={handleInputChange}
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Due Date"
                type="datetime-local"
                name="endTime"
                value={editedAssignment.endTime}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <input
                type="file"
                onChange={handleFileChange}
                style={{ marginTop: '1rem' }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </TeacherLayout>
  );
}
