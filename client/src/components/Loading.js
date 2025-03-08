import React from 'react';
import '../styles/loader.css';
import { Box, Typography } from '@mui/material';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh'
    }}>
      <div className="loader"></div>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;
