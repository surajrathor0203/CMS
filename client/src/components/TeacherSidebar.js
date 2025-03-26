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
  Settings,
  LogOut,
  BookOpen,
  User,
  Book,
  Wallet, // Add this import
} from 'lucide-react';
import { getUserFromCookie } from '../utils/cookies';
import { logout } from '../utils/auth';
import { getTeacherProfile } from '../services/api';

const drawerWidth = 240;

export default function TeacherSidebar({ mobileOpen, handleDrawerToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [teacherData, setTeacherData] = useState(null);
  
  // Get user data from cookie
  const userData = getUserFromCookie();
  const userId = userData?.user?.id;

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        if (userId) {
          const response = await getTeacherProfile(userId);
          if (response.success) {
            setTeacherData({
              ...response.data,
              profilePictureUrl: response.data.profilePicture?.url || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching teacher profile:', error);
      }
    };

    fetchTeacherProfile();
  }, [userId]);

  // Use teacherData.name if available, otherwise fall back to userData or default
  const userName = teacherData?.name || userData?.user?.name || 'Teacher';

  // Define a green color theme
const theme = {
  primary: '#2e7d32', // dark green
  light: '#81c784',   // light green
  background: '#e8f5e9' // very light green background
};

  const menuItems = [
    { text: 'Dashboard', icon: <BookOpen size={24} />, path: '/teacher-dashboard' },
    { text: 'Library', icon: <Book size={24} />, path: '/teacher/library' },
    { text: 'Total Accounting', icon: <Wallet size={24} />, path: '/teacher/accounting' }, // Add this line
    { text: 'Settings', icon: <Settings size={24} />, path: '/teacher/settings' }, 
  ];

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
          src={teacherData?.profilePictureUrl}
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
          {!teacherData?.profilePictureUrl && <User size={24} />}
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
            {userName}
          </Typography>
          {/* <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              lineHeight: 1 
            }}
          >
            {userRole}
          </Typography> */}
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.primary,
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
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
            navigate('/login?userType=teacher');
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
