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
} from 'lucide-react';
import { getUserFromCookie } from '../utils/cookies';
import { logout } from '../utils/auth';

const drawerWidth = 240;

export default function StudentSidebar({ mobileOpen, handleDrawerToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user data from cookie
  const userData = getUserFromCookie();
  const userName = userData?.user?.name || 'Student';

  const menuItems = [
    { text: 'Dashboard', icon: <BookOpen size={24} />, path: '/student-dashboard' },
    { text: 'Courses', icon: <GraduationCap size={24} />, path: '/student/courses' },
    { text: 'Schedule', icon: <Calendar size={24} />, path: '/student/schedule' },
    { text: 'Assignments', icon: <FileText size={24} />, path: '/student/assignments' },
    { text: 'Grades', icon: <Award size={24} />, path: '/student/grades' },
    { text: 'Messages', icon: <MessageCircle size={24} />, path: '/student/messages' },
    { text: 'Settings', icon: <Settings size={24} />, path: '/student/settings' },
  ];

  const drawer = (
    <Box>
      <Toolbar 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          minHeight: '49px !important', // Reduce default height
          py: 1 // Reduce padding
        }}
      >
        <Avatar 
          sx={{ 
            bgcolor: 'primary.main',
            width: 32, // Reduced from 40
            height: 32, // Reduced from 40
          }}
        >
          <User size={20} /> {/* Reduced from 24 */}
        </Avatar>
        <Box>
          <Typography 
            variant="subtitle2" // Changed from subtitle1
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 'medium',
              color: 'primary.main'
            }}
          >
            {userName}
          </Typography>
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
