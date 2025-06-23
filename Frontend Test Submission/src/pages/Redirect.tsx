
import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Launch, Error, Schedule } from '@mui/icons-material';
import { useUrl } from '../contexts/UrlContext';
import { useLogging } from '../contexts/LoggingContext';

const Redirect: React.FC = () => {
  const { shortcode } = useParams<{ shortcode: string }>();
  const { getUrlByShortcode, recordClick } = useUrl();
  const { log } = useLogging();
  const [redirecting, setRedirecting] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!shortcode) {
      setError('Invalid short URL');
      setRedirecting(false);
      return;
    }

    const url = getUrlByShortcode(shortcode);
    
    if (!url) {
      setError('Short URL not found');
      setRedirecting(false);
      log('warning', 'Redirect attempted for non-existent URL', { shortcode });
      return;
    }

    // Check if URL is expired
    if (new Date() > url.expiresAt) {
      setError('This short URL has expired');
      setRedirecting(false);
      log('warning', 'Redirect attempted for expired URL', { 
        shortcode, 
        expiresAt: url.expiresAt.toISOString() 
      });
      return;
    }

    // Record the click
    recordClick(shortcode);

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          window.location.href = url.originalUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    log('info', 'URL redirect initiated', {
      shortcode,
      originalUrl: url.originalUrl,
      redirectDelay: '3 seconds',
    });

    return () => clearInterval(countdownInterval);
  }, [shortcode, getUrlByShortcode, recordClick, log]);

  const handleImmediateRedirect = () => {
    const url = getUrlByShortcode(shortcode!);
    if (url) {
      log('info', 'Immediate redirect requested', { shortcode });
      window.location.href = url.originalUrl;
    }
  };

  if (!shortcode) {
    return <Navigate to="/404" replace />;
  }

  const url = getUrlByShortcode(shortcode);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card elevation={4} sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {error ? (
            <Box>
              <Error color="error" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" gutterBottom color="error" fontWeight="bold">
                {error}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {error === 'Short URL not found' 
                  ? 'The short URL you are looking for does not exist or may have been deleted.'
                  : error === 'This short URL has expired'
                  ? 'This link has passed its expiration date and is no longer valid.'
                  : 'There was an issue processing your request.'
                }
              </Typography>
              <Button
                variant="contained"
                href="/"
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
            </Box>
          ) : redirecting && url ? (
            <Box>
              <Launch color="primary" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" gutterBottom fontWeight="bold">
                Redirecting...
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  You will be redirected to:
                </Typography>
                <Card variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {url.originalUrl}
                  </Typography>
                </Card>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
                <CircularProgress size={24} />
                <Typography variant="h5" fontWeight="bold">
                  {countdown}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  seconds
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }}>
                <Chip
                  icon={<Schedule />}
                  label={`Created: ${url.createdAt.toLocaleDateString()}`}
                  variant="outlined"
                />
                <Chip
                  label={`Clicks: ${url.clicks.length}`}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleImmediateRedirect}
                  size="large"
                  sx={{
                    background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0 30%, #7b1fa2 90%)',
                    },
                  }}
                >
                  Go Now
                </Button>
                <Button
                  variant="outlined"
                  href="/"
                  size="large"
                >
                  Cancel
                </Button>
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  This page will automatically redirect you to the destination URL. 
                  If the redirect doesn't work, click "Go Now" to proceed manually.
                </Typography>
              </Alert>
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Redirect;
