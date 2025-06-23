
import React from 'react';
import { Container, Typography, Button, Box, Card, CardContent } from '@mui/material';
import { Home, Error } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLogging } from '../contexts/LoggingContext';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { log } = useLogging();

  React.useEffect(() => {
    log('warning', '404 page accessed', { path: window.location.pathname });
  }, [log]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card elevation={4} sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent sx={{ p: 6, textAlign: 'center' }}>
          <Error color="error" sx={{ fontSize: 80, mb: 2 }} />
          
          <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
            404
          </Typography>
          
          <Typography variant="h4" gutterBottom color="text.secondary">
            Page Not Found
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
            The page you are looking for might have been removed, had its name changed, 
            or is temporarily unavailable.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              size="large"
              sx={{
                background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #7b1fa2 90%)',
                },
              }}
            >
              Go to Homepage
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              size="large"
            >
              Go Back
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default NotFound;
