import { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Badge,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { Menu as MenuIcon, Bell } from 'lucide-react';
import { getMessages } from '../services/api';
import { useParams } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';

const drawerWidth = 240;

export default function StudentLayout({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const { batchId } = useParams();
  const open = Boolean(anchorEl);

  // Filter messages less than 48 hours old
  const recentMessages = messages.filter(message => {
    return (new Date() - new Date(message.timestamp)) < (48 * 60 * 60 * 1000);
  });

  useEffect(() => {
    if (batchId) {
      const fetchMessages = async () => {
        try {
          const response = await getMessages(batchId);
          setMessages(response.messages || []);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };
      fetchMessages();

      // Set up polling every 30 seconds
      const interval = setInterval(fetchMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [batchId]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#2e7d32',
          color: 'white',
          boxShadow: 1
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {title}
            </Typography>
          </Box>

          {batchId && (
            <IconButton
              color="inherit"
              onClick={handleNotificationClick}
              sx={{ ml: 2 }}
            >
              <Badge badgeContent={recentMessages.length} color="error">
                <Bell />
              </Badge>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            width: '350px',
            mt: 1,
            overflow: 'auto'
          }
        }}
      >
        <MenuItem sx={{ justifyContent: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Messages
          </Typography>
        </MenuItem>
        <Divider />
        {recentMessages.length > 0 ? (
          [...recentMessages].reverse().map((message, index) => {
            const isRecent = (new Date() - new Date(message.timestamp)) < (48 * 60 * 60 * 1000);
            
            return (
              <MenuItem 
                key={message._id || `msg-${message.timestamp}`}
                sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}
              >
                <Typography variant="subtitle2" color={isRecent ? "success.main" : "primary"}>
                  {message.senderName}
                </Typography>
                <Typography variant="body2" sx={{ my: 0.5, wordBreak: 'break-word' }}>
                  {message.content}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatMessageTime(message.timestamp)}
                </Typography>
                {index < recentMessages.length - 1 && <Divider sx={{ width: '100%', my: 1 }} />}
              </MenuItem>
            );
          })
        ) : (
          <MenuItem sx={{ justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No recent messages
            </Typography>
          </MenuItem>
        )}
      </Menu>

      <StudentSidebar 
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
}
