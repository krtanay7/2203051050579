
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Analytics, Home, BugReport, Download } from '@mui/icons-material';
import { useLogging } from '../contexts/LoggingContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { logs, clearLogs, exportLogs } = useLogging();
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);

  const handleExportLogs = () => {
    const logsData = exportLogs();
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `url-shortener-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🔗 URL Shortener
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              component={Link}
              to="/"
              startIcon={!isMobile ? <Home /> : undefined}
              sx={{
                backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
            >
              {isMobile ? <Home /> : 'Shortener'}
            </Button>
            
            <Button
              color="inherit"
              component={Link}
              to="/analytics"
              startIcon={!isMobile ? <Analytics /> : undefined}
              sx={{
                backgroundColor: location.pathname === '/analytics' ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
            >
              {isMobile ? <Analytics /> : 'Analytics'}
            </Button>
            
            <IconButton
              color="inherit"
              onClick={() => setLogsDialogOpen(true)}
              title="View Logs"
            >
              <BugReport />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog
        open={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '80vh' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Application Logs ({logs.length})
            <Box>
              <Button
                startIcon={<Download />}
                onClick={handleExportLogs}
                size="small"
                sx={{ mr: 1 }}
              >
                Export
              </Button>
              <Button onClick={clearLogs} color="warning" size="small">
                Clear
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <List>
            {logs.length === 0 ? (
              <ListItem>
                <ListItemText primary="No logs available" />
              </ListItem>
            ) : (
              logs.slice(0, 50).map((log) => (
                <ListItem key={log.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={log.level.toUpperCase()}
                          size="small"
                          color={getLogLevelColor(log.level) as any}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {log.event}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      log.data && (
                        <Typography
                          variant="caption"
                          component="pre"
                          sx={{
                            backgroundColor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: 100,
                          }}
                        >
                          {JSON.stringify(log.data, null, 2)}
                        </Typography>
                      )
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
          {logs.length > 50 && (
            <Typography variant="caption" color="text.secondary" sx={{ p: 2 }}>
              Showing latest 50 logs of {logs.length} total
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setLogsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;
