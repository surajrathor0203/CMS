import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../components/AdminLayout';
import { getTeachers, toggleTeacherStatus } from '../services/api';
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
} from '@mui/material';
import { Search, Edit, Trash2, Lock, Unlock } from 'lucide-react';

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

    const filteredTeachers = teachers.filter(teacher => 
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.cochingName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                        onClick={() => toast.info('Edit functionality coming soon!')}
                                    >
                                        <Edit size={20} />
                                    </IconButton>
                                    <IconButton 
                                        color="error"
                                        onClick={() => toast.info('Delete functionality coming soon!')}
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
        </AdminLayout>
    );
};

export default TeachersManagement;
