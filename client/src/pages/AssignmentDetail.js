import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField as GradeTextField,
  Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit'; // Fixed import path
import GradeIcon from '@mui/icons-material/Grade';
import TeacherLayout from '../components/TeacherLayout';
import { editAssignment, getAssignmentById, gradeAssignment } from '../services/api';
import { toast } from 'react-toastify';

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

  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({
    grade: '',
    feedback: ''
  });

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        const response = await getAssignmentById(assignment._id);
        setAssignmentDetails(response.data);
      } catch (error) {
        console.error('Error fetching assignment details:', error);
      }
    };

    fetchAssignmentDetails();
  }, [assignment._id]);

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

  const handleGradeOpen = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
    setGradeDialogOpen(true);
  };

  const handleGradeClose = () => {
    setGradeDialogOpen(false);
    setSelectedSubmission(null);
    setGradeData({ grade: '', feedback: '' });
  };

  const handleGradeSubmit = async () => {
    try {
      await gradeAssignment(assignment._id, selectedSubmission.studentId, gradeData);
      
      // Update the assignments details in state
      setAssignmentDetails(prev => ({
        ...prev,
        submissions: prev.submissions.map(sub => 
          sub._id === selectedSubmission._id 
            ? { ...sub, grade: gradeData.grade, feedback: gradeData.feedback }
            : sub
        )
      }));

      handleGradeClose();
      toast.success('Grade submitted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to submit grade');
      console.error('Error submitting grade:', error);
    }
  };

  return (
    <TeacherLayout title='Assignment Details'>
      <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}> {/* Changed maxWidth from 800px to 1200px */}
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
          
          {/* Submissions Section */}
          <Box sx={{ mt: 4, mb: 2, px: 3 }}> {/* Added horizontal padding */}
            <Typography variant="h6" gutterBottom>
              Submissions ({assignmentDetails?.submissions?.length || 0})
            </Typography>
            <TableContainer component={Paper} sx={{ width: '100%' }}> {/* Added width 100% */}
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Submitted At</TableCell>
                    <TableCell>File</TableCell>
                    <TableCell>Grade/10</TableCell>
                    <TableCell>Feedback</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignmentDetails?.submissions?.length > 0 ? (
                    assignmentDetails.submissions.map((submission) => (
                      <TableRow key={submission._id}>
                        <TableCell>{submission.studentId}</TableCell>
                        <TableCell>
                          {new Date(submission.submittedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => window.open(submission.fileUrl, '_blank')}
                          >
                            Download
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {submission.grade || 'Not graded'}
                            <Tooltip title="Grade Submission">
                              <IconButton
                                size="small"
                                onClick={() => handleGradeOpen(submission)}
                              >
                                <GradeIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell>{submission.feedback || '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No submissions yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
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

        {/* Add Grading Dialog */}
        <Dialog open={gradeDialogOpen} onClose={handleGradeClose}>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, gap: 2, display: 'flex', flexDirection: 'column' }}>
              <GradeTextField
                label="Grade"
                type="number"
                value={gradeData.grade}
                onChange={(e) => setGradeData(prev => ({ ...prev, grade: e.target.value }))}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
              />
              <GradeTextField
                label="Feedback"
                multiline
                rows={4}
                value={gradeData.feedback}
                onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleGradeClose}>Cancel</Button>
            <Button onClick={handleGradeSubmit} variant="contained">
              Submit Grade
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </TeacherLayout>
  );
}
