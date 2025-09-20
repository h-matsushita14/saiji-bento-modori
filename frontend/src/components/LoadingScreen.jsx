import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

function LoadingScreen({ progress }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        p: 3,
      }}
    >
      <Typography variant="h6" gutterBottom>
        データを読み込んでいます...
      </Typography>
      <Box sx={{ width: '50%', maxWidth: 400 }}>
        <LinearProgress variant="determinate" value={progress} />
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
        {`${Math.round(progress)}%`}
      </Typography>
    </Box>
  );
}

export default LoadingScreen;
