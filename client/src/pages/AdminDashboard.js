import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getTeachers, getPendingPaymentsCount, getRejectedPaymentsCount } from '../services/api';
import {
    Box,
    Grid,
    Paper,
    Typography,
    CircularProgress,
    Container,
    Card,
    CardContent,
    Avatar,
    Button
} from '@mui/material';
import { Users, School, BookOpen, CreditCard, BanknoteIcon, XCircle } from 'lucide-react';

const StatsCard = ({ title, value, icon, link, onNavigate }) => (
    <Paper 
        sx={{ 
            p: 3, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            cursor: 'pointer',
            '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)'
            }
        }}
        onClick={() => link && onNavigate(link)}
    >
        <Box sx={{ 
            p: 2, 
            borderRadius: '50%', 
            bgcolor: 'primary.light',
            color: 'primary.main'
        }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="h6" component="div">
                {value}
            </Typography>
            <Typography color="text.secondary" variant="body2">
                {title}
            </Typography>
        </Box>
    </Paper>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        teacherCount: 0,
        studentCount: 0,
        batchCount: 0
    });
    const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
    const [rejectedPaymentsCount, setRejectedPaymentsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [teacherResponse, pendingPaymentsResponse, rejectedPaymentsResponse] = await Promise.all([
                getTeachers(),
                getPendingPaymentsCount(),
                getRejectedPaymentsCount()
            ]);

            if (teacherResponse.success) {
                setStats(prev => ({
                    ...prev,
                    teacherCount: teacherResponse.data.length
                }));
            }

            if (pendingPaymentsResponse.success) {
                setPendingPaymentsCount(pendingPaymentsResponse.data);
            }

            if (rejectedPaymentsResponse.success) {
                setRejectedPaymentsCount(rejectedPaymentsResponse.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (path) => {
        navigate(path);
    };

    const dashboardItems = [
        {
            title: 'Total Teachers',
            description: 'Number of teachers in the system',
            icon: <Users size={24} />,
            link: '/admin/teachers',
            color: '#1976d2'
        },
        {
            title: 'Total Students',
            description: 'Number of students in the system',
            icon: <School size={24} />,
            link: '/admin/students',
            color: '#1976d2'
        },
        {
            title: 'Total Batches',
            description: 'Number of batches in the system',
            icon: <BookOpen size={24} />,
            link: '/admin/batches',
            color: '#1976d2'
        }
    ];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <AdminLayout title="Dashboard">
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    {/* Subscription Payment Verification Card */}
                    <Grid item xs={12} md={4}>
                        <Card 
                            sx={{ 
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                            }}
                            onClick={() => navigate('/admin/subscription-verifications')}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar sx={{ bgcolor: '#2e7d32', mr: 2 }}>
                                        <BanknoteIcon size={24} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6">Pending Verifications</Typography>
                                        <Typography variant="h4" color="primary">
                                            {pendingPaymentsCount}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button 
                                    variant="contained" 
                                    fullWidth
                                    sx={{ 
                                        bgcolor: '#2e7d32',
                                        '&:hover': { bgcolor: '#1b5e20' }
                                    }}
                                >
                                    View Payments
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Rejected Verifications Card */}
                    <Grid item xs={12} md={4}>
                        <Card 
                            sx={{ 
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                            }}
                            onClick={() => navigate('/admin/rejected-verifications')}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar sx={{ bgcolor: '#d32f2f', mr: 2 }}>
                                        <XCircle size={24} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6">Rejected Verifications</Typography>
                                        <Box display="flex" alignItems="baseline" gap={1}>
                                            <Typography variant="h4" color="error">
                                                {rejectedPaymentsCount}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                total rejected/locked
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Button 
                                    variant="contained" 
                                    fullWidth
                                    sx={{ 
                                        bgcolor: '#d32f2f',
                                        '&:hover': { bgcolor: '#9a0007' }
                                    }}
                                >
                                    View Rejected
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Subscription Plans Card */}
                    <Grid item xs={12} md={4}>
                        <Card 
                            sx={{ 
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                            }}
                            onClick={() => navigate('/admin/subscription-plans')}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar sx={{ bgcolor: '#2e7d32', mr: 2 }}>
                                        <CreditCard size={24} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6">Subscription Plans</Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            Manage subscription plans
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button 
                                    variant="contained" 
                                    fullWidth
                                    sx={{ 
                                        bgcolor: '#2e7d32',
                                        '&:hover': { bgcolor: '#1b5e20' }
                                    }}
                                >
                                    Manage Plans
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {dashboardItems.map((item, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <StatsCard
                                title={item.title}
                                value={stats[item.title.toLowerCase().replace(' ', '')] || ''}
                                icon={item.icon}
                                link={item.link}
                                onNavigate={handleNavigate}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </AdminLayout>
    );
};

export default AdminDashboard;
