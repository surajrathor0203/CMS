import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Avatar,
} from '@mui/material';
import {
  BookOpen,
  Calendar,
  FileText,
  Settings,
  LogOut,
  GraduationCap,
  MessageCircle,
  Award,
  User,
  Book,  // Add this import
} from 'lucide-react';
import { getUserFromCookie, clearUserCookies } from '../utils/cookies';
import { logout } from '../utils/auth';
import { getStudentProfile } from '../services/api';

const drawerWidth = 240;

export default function StudentSidebar({ mobileOpen, handleDrawerToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  
  // Get user ID from cookie
  const user = getUserFromCookie()?.user;

  const theme = {
    primary: '#2e7d32', // dark green
    light: '#81c784',   // light green
    background: '#e8f5e9' // very light green background
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          const response = await getStudentProfile(user.id);
          if (response.success) {
            setUserData({
              ...response.data,
              profilePictureUrl: response.data.profilePicture?.url || ''
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user?.id]);

  const menuItems = [
    { text: 'Dashboard', icon: <BookOpen size={24} />, path: '/student-dashboard' },
    { text: 'Courses', icon: <GraduationCap size={24} />, path: '/student/courses' },
    { text: 'Schedule', icon: <Calendar size={24} />, path: '/student/schedule' },
    { text: 'Library', icon: <Book size={24} />, path: '/student/library' },
    { text: 'Grades', icon: <Award size={24} />, path: '/student/grades' },
    { text: 'Messages', icon: <MessageCircle size={24} />, path: '/student/messages' },
    { text: 'Settings', icon: <Settings size={24} />, path: '/student/settings' },
  ];

  const handleNavigation = (path) => {
    if (path === '/logout') {
      clearUserCookies();
      navigate('/login');
      return;
    }
    navigate(path);
  };

  const drawer = (
    <Box>
      <Toolbar 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5,
        minHeight: '64px !important',
        bgcolor: theme.background
      }}
      >
        <Avatar 
          src={userData?.profilePictureUrl}
          sx={{ 
            bgcolor: theme.primary,
            width: 40,
            height: 40,
            '& img': {
              objectFit: 'cover',
              width: '100%',
              height: '100%'
            }
          }}
        >
          {!userData?.profilePictureUrl && <User size={24} />}
        </Avatar>
        <Box>
          <Typography 
            variant="subtitle1"
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              color: theme.primary
            }}
          >
            {userData?.name}
            {/* {loading ? 'Loading...' : userData?.name || 'Student'} */}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(76, 175, 80, 1)',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.5)',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            logout();
            navigate('/login?userType=student');
          }}>
            <ListItemIcon>
              <LogOut size={24} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}
