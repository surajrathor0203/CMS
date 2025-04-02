import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getTeachers, getPendingPaymentsCount } from '../services/api';
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
import { Users, School, BookOpen, CreditCard, BanknoteIcon } from 'lucide-react';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const teacherResponse = await getTeachers();
            if (teacherResponse.success) {
                setStats(prev => ({
                    ...prev,
                    teacherCount: teacherResponse.data.length
                }));
            }

            const paymentResponse = await getPendingPaymentsCount();
            if (paymentResponse.success) {
                setPendingPaymentsCount(paymentResponse.data);
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
        },
        {
            title: 'Subscription Plans',
            description: 'Manage subscription plans for teachers',
            icon: <CreditCard size={24} />,
            link: '/admin/subscription-plans',
            color: '#2e7d32'
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
                        <Card>
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
                                    onClick={() => navigate('/admin/subscription-verifications')}
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
