import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../components/AdminLayout';
import { getTeachers, toggleTeacherStatus, updateTeacher, deleteTeacher } from '../services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem, // Add this import
  DialogContentText, // Add this import
} from '@mui/material';
import { Search, Edit, Trash2, Lock, Unlock } from 'lucide-react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'; // Change to dayjs adapter
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'; // Change this line
import dayjs from 'dayjs'; // Add this import

const TeachersManagement = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        teacherId: null,
        teacherName: '',
        currentStatus: ''
    });
    const [editDialog, setEditDialog] = useState({
        open: false,
        teacher: null,
        status: '',
        subscriptionEndDate: dayjs() // Use dayjs instead of new Date()
    });
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        teacher: null,
        loading: false
    });

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await getTeachers();
            if (response.success) {
                setTeachers(response.data);
            }
        } catch (error) {
            console.error('Error fetching teachers:', error);
            toast.error(error.message || 'Failed to fetch teachers');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (teacherId, teacherName, currentStatus) => {
        setConfirmDialog({
            open: true,
            teacherId,
            teacherName,
            currentStatus
        });
    };

    const handleConfirmToggle = async () => {
        try {
            const response = await toggleTeacherStatus(confirmDialog.teacherId);
            if (response.success) {
                toast.success(response.message);
                fetchTeachers(); // Refresh the list
            }
        } catch (error) {
            toast.error(error.message || 'Failed to toggle teacher status');
        } finally {
            setConfirmDialog({ ...confirmDialog, open: false });
        }
    };

    const handleEditClick = (teacher) => {
        setEditDialog({
            open: true,
            teacher,
            status: teacher.status,
            subscriptionEndDate: dayjs(teacher.subscription?.endDate || new Date())
        });
    };

    const handleUpdateTeacher = async () => {
        try {
            const response = await updateTeacher(editDialog.teacher._id, {
                status: editDialog.status,
                subscriptionEndDate: editDialog.subscriptionEndDate
            });

            if (response.success) {
                toast.success('Teacher updated successfully');
                fetchTeachers(); // Refresh the list
                setEditDialog(prev => ({ ...prev, open: false }));
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update teacher');
        }
    };

    const handleDeleteClick = (teacher) => {
        setDeleteDialog({
            open: true,
            teacher,
            loading: false
        });
    };

    const handleDeleteTeacher = async () => {
        try {
            setDeleteDialog(prev => ({ ...prev, loading: true }));
            const response = await deleteTeacher(deleteDialog.teacher._id);
            
            if (response.success) {
                toast.success('Teacher deleted successfully');
                fetchTeachers(); // Refresh the list
                setDeleteDialog({ open: false, teacher: null, loading: false });
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete teacher');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const filteredTeachers = teachers.filter(teacher => {
        const searchTermLower = searchTerm.toLowerCase().trim();
        
        // If search is empty, return all teachers
        if (!searchTermLower) return true;

        // Create an array of searchable fields, handling potential undefined values
        const searchableFields = [
            teacher.name,
            teacher.email,
            teacher.phoneNumber,
            teacher.cochingName,
            teacher.countryCode,
            teacher.username
        ].filter(Boolean); // Remove any undefined/null values
        
        // Check if any field includes the search term
        return searchableFields.some(field => 
            field.toString().toLowerCase().includes(searchTermLower)
        );
    });

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <AdminLayout title="Teacher Management">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <TextField
                    placeholder="Search teachers..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={20} />
                            </InputAdornment>
                        ),
                    }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => toast.info('Add Teacher functionality coming soon!')}
                >
                    Add Teacher
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="teachers table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Coaching Name</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Subscription End</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTeachers.map((teacher) => (
                            <TableRow
                                key={teacher._id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar
                                            src={teacher.profilePicture?.url}
                                            alt={teacher.name}
                                        />
                                        <Typography>{teacher.name}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>{teacher.email}</TableCell>
                                <TableCell>
                                    {teacher.countryCode} {teacher.phoneNumber}
                                </TableCell>
                                <TableCell>{teacher.cochingName}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={teacher.status === 'locked' ? 'Locked' : 'Active'}
                                        color={teacher.status === 'locked' ? 'error' : 'success'}
                                        size="small"
                                        sx={{ borderRadius: '16px', fontSize: '0.75rem' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    {teacher.subscription?.endDate ? (
                                        <Chip
                                            label={new Date(teacher.subscription.endDate).toLocaleDateString()}
                                            color={new Date(teacher.subscription.endDate) > new Date() ? 'primary' : 'error'}
                                            size="small"
                                            sx={{ 
                                                borderRadius: '16px', 
                                                fontSize: '0.75rem',
                                                bgcolor: new Date(teacher.subscription.endDate) > new Date() ? '#e8f5e9' : '#ffebee',
                                                color: new Date(teacher.subscription.endDate) > new Date() ? '#2e7d32' : '#d32f2f'
                                            }}
                                        />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Not subscribed
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton 
                                        color={teacher.status === 'locked' ? 'success' : 'error'}
                                        onClick={() => handleToggleStatus(
                                            teacher._id, 
                                            teacher.name,
                                            teacher.status
                                        )}
                                    >
                                        {teacher.status === 'locked' ? 
                                            <Unlock size={20} /> : 
                                            <Lock size={20} />
                                        }
                                    </IconButton>
                                    <IconButton 
                                        color="primary"
                                        onClick={() => handleEditClick(teacher)}
                                    >
                                        <Edit size={20} />
                                    </IconButton>
                                    <IconButton 
                                        color="error"
                                        onClick={() => handleDeleteClick(teacher)}
                                    >
                                        <Trash2 size={20} />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
            >
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogContent>
                    Are you sure you want to {confirmDialog.currentStatus === 'locked' ? 'unlock' : 'lock'} {confirmDialog.teacherName}?
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                        color="primary"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmToggle} 
                        color={confirmDialog.currentStatus === 'locked' ? 'success' : 'error'}
                        variant="contained"
                    >
                        {confirmDialog.currentStatus === 'locked' ? 'Unlock' : 'Lock'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={editDialog.open}
                onClose={() => setEditDialog(prev => ({ ...prev, open: false }))}
            >
                <DialogTitle>Edit Teacher</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            select
                            label="Status"
                            value={editDialog.status}
                            onChange={(e) => setEditDialog(prev => ({ 
                                ...prev, 
                                status: e.target.value 
                            }))}
                            fullWidth
                        >
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="locked">Locked</MenuItem>
                        </TextField>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Subscription End Date"
                                value={editDialog.subscriptionEndDate}
                                onChange={(newValue) => setEditDialog(prev => ({
                                    ...prev,
                                    subscriptionEndDate: newValue
                                }))
                                }
                                slotProps={{ textField: { fullWidth: true } }}
                                format="DD/MM/YYYY" // Add this line to set date format
                            />
                        </LocalizationProvider>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog(prev => ({ ...prev, open: false }))}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleUpdateTeacher}
                        variant="contained" 
                        color="primary"
                    >
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, teacher: null, loading: false })}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        Are you sure you want to delete {deleteDialog.teacher?.name}? 
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        This will also delete:
                    </Typography>
                    <Box component="ul" sx={{ mt: 1, mb: 2 }}>
                        <li>All their batches</li>
                        <li>All notes and assignments</li>
                        <li>All quizzes and messages</li>
                        <li>All uploaded files and images</li>
                    </Box>
                    <Typography variant="body1" color="error.main">
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setDeleteDialog({ open: false, teacher: null, loading: false })}
                        disabled={deleteDialog.loading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteTeacher}
                        color="error"
                        variant="contained"
                        disabled={deleteDialog.loading}
                        startIcon={deleteDialog.loading ? <CircularProgress size={20} /> : null}
                    >
                        {deleteDialog.loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
};

export default TeachersManagement;
// export default TeachersManagement;
