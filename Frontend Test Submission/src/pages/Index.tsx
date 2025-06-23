import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  ContentCopy,
  Delete,
  Link as LinkIcon,
  Timer,
  Launch,
  CheckCircle,
} from '@mui/icons-material';
import { useUrl } from '../contexts/UrlContext';
import { useLogging } from '../contexts/LoggingContext';

const Index: React.FC = () => {
  const { urls, createShortUrl, deleteUrl } = useUrl();
  const { log } = useLogging();
  
  const [originalUrl, setOriginalUrl] = useState('');
  const [customShortcode, setCustomShortcode] = useState('');
  const [validityPeriod, setValidityPeriod] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState<string | null>(null);

  useEffect(() => {
    log('info', 'URL Shortener page loaded');
  }, [log]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originalUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const shortenedUrl = await createShortUrl(
        originalUrl.trim(),
        validityPeriod,
        customShortcode.trim() || undefined
      );
      
      setSuccess(`URL shortened successfully! Short code: ${shortenedUrl.shortcode}`);
      setOriginalUrl('');
      setCustomShortcode('');
      setValidityPeriod(30);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create short URL');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (shortcode: string) => {
    const shortUrl = `${window.location.origin}/s/${shortcode}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setSuccess('Short URL copied to clipboard!');
      log('info', 'URL copied to clipboard', { shortcode, shortUrl });
    } catch (err) {
      setError('Failed to copy to clipboard');
      log('error', 'Failed to copy URL to clipboard', { shortcode, error: err });
    }
  };

  const handleDelete = (id: string) => {
    setUrlToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (urlToDelete) {
      deleteUrl(urlToDelete);
      setSuccess('URL deleted successfully');
      setDeleteDialogOpen(false);
      setUrlToDelete(null);
    }
  };

  const openShortUrl = (shortcode: string) => {
    const shortUrl = `${window.location.origin}/s/${shortcode}`;
    window.open(shortUrl, '_blank');
    log('info', 'Short URL opened in new tab', { shortcode });
  };

  const isExpired = (expiresAt: Date) => new Date() > expiresAt;

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const remaining = expiresAt.getTime() - now.getTime();
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          URL Shortener
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Create short, manageable links with detailed analytics
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* URL Creation Form */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Create Short URL
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Original URL"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/very-long-url"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                  error={!!error && error.includes('URL')}
                />

                <TextField
                  fullWidth
                  label="Custom Short Code (Optional)"
                  value={customShortcode}
                  onChange={(e) => setCustomShortcode(e.target.value)}
                  placeholder="my-custom-code"
                  helperText="3-10 alphanumeric characters"
                  sx={{ mb: 3 }}
                  error={!!error && error.includes('shortcode')}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Validity Period (Minutes)"
                  value={validityPeriod}
                  onChange={(e) => setValidityPeriod(parseInt(e.target.value) || 30)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Timer color="action" />
                      </InputAdornment>
                    ),
                    inputProps: { min: 1, max: 10080 }
                  }}
                  helperText="Default: 30 minutes, Max: 1 week"
                  sx={{ mb: 3 }}
                />

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || urls.length >= 5}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0 30%, #7b1fa2 90%)',
                    },
                  }}
                >
                  {loading ? 'Creating...' : `Create Short URL (${urls.length}/5)`}
                </Button>
              </Box>
              
              {urls.length >= 5 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Maximum of 5 URLs allowed. Delete some URLs to create new ones.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* URL List */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Your Short URLs
              </Typography>
              
              {urls.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No URLs created yet. Create your first short URL!
                  </Typography>
                </Box>
              ) : (
                <List>
                  {urls.map((url) => (
                    <ListItem
                      key={url.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 1,
                        backgroundColor: isExpired(url.expiresAt) ? 'action.disabled' : 'background.paper',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="body1" fontWeight="bold" noWrap>
                              /s/{url.shortcode}
                            </Typography>
                            {isExpired(url.expiresAt) ? (
                              <Chip label="Expired" color="error" size="small" />
                            ) : (
                              <Chip
                                label={getTimeRemaining(url.expiresAt)}
                                color="success"
                                size="small"
                                icon={<Timer />}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {url.originalUrl}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {url.clicks.length} clicks • Created {url.createdAt.toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {!isExpired(url.expiresAt) && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => openShortUrl(url.shortcode)}
                                title="Open URL"
                              >
                                <Launch />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(url.shortcode)}
                                title="Copy URL"
                              >
                                <ContentCopy />
                              </IconButton>
                            </>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(url.id)}
                            color="error"
                            title="Delete URL"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')} icon={<CheckCircle />}>
          {success}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this short URL? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Index;
