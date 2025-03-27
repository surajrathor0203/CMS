import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    CircularProgress,
    Divider,
    Paper,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { getAssignmentById, submitAssignment, getStudentSubmission, deleteAssignmentSubmission } from '../services/api';
import StudentLayout from '../components/StudentLayout';
import { toast } from 'react-toastify';
import { getUserFromCookie } from '../utils/cookies';

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export default function AssignmentSubmissionPage() {
    const { assignmentId, batchId } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [error, setError] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = getUserFromCookie();
                const [assignmentResponse, submissionResponse] = await Promise.all([
                    getAssignmentById(assignmentId),
                    getStudentSubmission(assignmentId, userData.user.id)
                ]);
                setAssignment(assignmentResponse.data);
                setSubmission(submissionResponse.data);
            } catch (err) {
                setError(err.message || 'Failed to fetch assignment details');
                toast.error('Error loading assignment details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [assignmentId]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to submit');
            return;
        }

        try {
            setSubmitting(true);
            const response = await submitAssignment(assignmentId, selectedFile);
            setSubmission(response.data);
            toast.success('Assignment submitted successfully');
            setSelectedFile(null);
        } catch (err) {
            toast.error(err.message || 'Failed to submit assignment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSubmission = async () => {
        try {
            await deleteAssignmentSubmission(assignmentId);
            setSubmission(null);
            setDeleteDialogOpen(false);
            toast.success('Submission removed successfully');
        } catch (err) {
            toast.error(err.message || 'Error removing submission');
        }
    };

    const isOverdue = () => {
        if (!assignment?.endTime) return false;
        return new Date(assignment.endTime) < new Date();
    };

    const renderSubmissionGrade = (submission) => {
        return (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                    Grading
                </Typography>
                {submission.grade ? (
                    <>
                        <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Score: {submission.grade}/10
                        </Typography>
                        {submission.feedback && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Feedback:
                                </Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {submission.feedback}
                                </Typography>
                            </Box>
                        )}
                    </>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Not graded yet
                    </Typography>
                )}
            </Box>
        );
    };

    if (loading) {
        return (
            <StudentLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </StudentLayout>
        );
    }

    if (error) {
        return (
            <StudentLayout>
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title='assignment submission'>
            <Box sx={{ p: 3 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            {assignment.title}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="body1" paragraph>
                            {assignment.question}
                        </Typography>

                        {assignment.fileUrl && (
                            <Box sx={{ mt: 2, mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Assignment Resources:
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => window.open(assignment.fileUrl, '_blank')}
                                >
                                    View Assignment File
                                </Button>
                            </Box>
                        )}

                        <Divider sx={{ my: 3 }} />

                        {isOverdue() && !submission && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                This assignment is past its due date. Submissions are no longer accepted.
                            </Alert>
                        )}

                        {submission && !isOverdue() && (
                            <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <Typography variant="h6" gutterBottom>
                                            Your Submission
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Submitted on: {new Date(submission.submittedAt).toLocaleString()}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{ mt: 1 }}
                                            onClick={() => window.open(submission.fileUrl, '_blank')}
                                        >
                                            View Submitted File
                                        </Button>
                                    </div>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        Remove Submission
                                    </Button>
                                </Box>
                                
                                <Divider sx={{ my: 2 }} />
                                
                                {renderSubmissionGrade(submission)}
                                
                                <Divider sx={{ my: 2 }} />
                                
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    You can resubmit a new file before the due date if needed.
                                </Typography>
                                
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        component="label"
                                        variant="contained"
                                        startIcon={<CloudUploadIcon />}
                                        disabled={submitting}
                                    >
                                        Upload New File
                                        <VisuallyHiddenInput type="file" onChange={handleFileChange} />
                                    </Button>
                                    {selectedFile && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            Selected: {selectedFile.name}
                                        </Typography>
                                    )}
                                </Box>

                                {selectedFile && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        sx={{ mt: 2 }}
                                    >
                                        {submitting ? <CircularProgress size={24} /> : 'Submit New File'}
                                    </Button>
                                )}
                            </Paper>
                        )}

                        {submission && isOverdue() && (
                            <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                                <Typography variant="h6" gutterBottom>
                                    Your Submission
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Submitted on: {new Date(submission.submittedAt).toLocaleString()}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ mt: 1 }}
                                    onClick={() => window.open(submission.fileUrl, '_blank')}
                                >
                                    View Submitted File
                                </Button>

                                {renderSubmissionGrade(submission)}
                            </Paper>
                        )}

                        {!isOverdue() && !submission && (
                            <>
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        component="label"
                                        variant="contained"
                                        startIcon={<CloudUploadIcon />}
                                        disabled={submitting}
                                    >
                                        Select File
                                        <VisuallyHiddenInput type="file" onChange={handleFileChange} />
                                    </Button>
                                    {selectedFile && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            Selected: {selectedFile.name}
                                        </Typography>
                                    )}
                                </Box>

                                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleSubmit}
                                        disabled={!selectedFile || submitting}
                                    >
                                        {submitting ? <CircularProgress size={24} /> : 'Submit Assignment'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate(`/student-dashboard/batch/${batchId}`)}
                                    >
                                        Back to Batch
                                    </Button>
                                </Box>
                            </>
                        )}

                        {(isOverdue() || submission) && (
                            <Box sx={{ mt: 3 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(`/student-dashboard/batch/${batchId}`)}
                                >
                                    Back to Batch
                                </Button>
                            </Box>
                        )}

                        {/* Add Delete Confirmation Dialog */}
                        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                            <DialogTitle>Remove Submission</DialogTitle>
                            <DialogContent>
                                Are you sure you want to remove your submission? You can submit again before the due date.
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleDeleteSubmission} color="error" variant="contained">
                                    Remove
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </CardContent>
                </Card>
            </Box>
        </StudentLayout>
    );
}
