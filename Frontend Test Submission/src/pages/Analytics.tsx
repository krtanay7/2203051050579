import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  ExpandMore,
  ExpandLess,
  Download,
  Search,
  Analytics as AnalyticsIcon,
  TrendingUp,
  LocationOn,
  Schedule,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useUrl } from '../contexts/UrlContext';
import { useLogging } from '../contexts/LoggingContext';

const Analytics: React.FC = () => {
  const { urls } = useUrl();
  const { log, exportLogs } = useLogging();
  const [selectedSort, setSelectedSort] = useState<'clicks' | 'created' | 'expires'>('clicks');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    log('info', 'Analytics page loaded', { totalUrls: urls.length });
  }, [log, urls.length]);

  const filteredUrls = urls.filter(url =>
    url.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    url.shortcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUrls = [...filteredUrls].sort((a, b) => {
    switch (selectedSort) {
      case 'clicks':
        return b.clicks.length - a.clicks.length;
      case 'created':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'expires':
        return a.expiresAt.getTime() - b.expiresAt.getTime();
      default:
        return 0;
    }
  });

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
    log('debug', 'Analytics row expanded/collapsed', { urlId: id, expanded: !expandedRows.has(id) });
  };

  const exportAnalytics = () => {
    const analyticsData = {
      exportedAt: new Date().toISOString(),
      summary: {
        totalUrls: urls.length,
        totalClicks: urls.reduce((sum, url) => sum + url.clicks.length, 0),
        activeUrls: urls.filter(url => new Date() <= url.expiresAt).length,
        expiredUrls: urls.filter(url => new Date() > url.expiresAt).length,
      },
      urls: urls.map(url => ({
        shortcode: url.shortcode,
        originalUrl: url.originalUrl,
        createdAt: url.createdAt.toISOString(),
        expiresAt: url.expiresAt.toISOString(),
        totalClicks: url.clicks.length,
        clicks: url.clicks.map(click => ({
          timestamp: click.timestamp.toISOString(),
          location: click.location,
          referrer: click.referrer,
          userAgent: click.userAgent,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `url-shortener-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    log('info', 'Analytics data exported', { urlCount: urls.length, totalClicks: analyticsData.summary.totalClicks });
  };

  // Prepare chart data
  const clicksChartData = sortedUrls.slice(0, 10).map(url => ({
    shortcode: url.shortcode,
    clicks: url.clicks.length,
  }));

  const locationData = urls.reduce((acc, url) => {
    url.clicks.forEach(click => {
      acc[click.location] = (acc[click.location] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const locationChartData = Object.entries(locationData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([location, clicks]) => ({ location, clicks }));

  const referrerData = urls.reduce((acc, url) => {
    url.clicks.forEach(click => {
      acc[click.referrer] = (acc[click.referrer] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const referrerChartData = Object.entries(referrerData).map(([referrer, clicks]) => ({
    referrer,
    clicks,
  }));

  // Timeline data (clicks over time)
  const timelineData = urls.reduce((acc, url) => {
    url.clicks.forEach(click => {
      const dateKey = click.timestamp.toDateString();
      acc[dateKey] = (acc[dateKey] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const timelineChartData = Object.entries(timelineData)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, clicks]) => ({ date: new Date(date).toLocaleDateString(), clicks }));

  const COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', '#d32f2f', '#0288d1', '#7b1fa2', '#388e3c'];

  const totalClicks = urls.reduce((sum, url) => sum + url.clicks.length, 0);
  const activeUrls = urls.filter(url => new Date() <= url.expiresAt).length;
  const avgClicksPerUrl = urls.length > 0 ? (totalClicks / urls.length).toFixed(1) : '0';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Comprehensive insights into your shortened URLs
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={exportAnalytics}
          sx={{
            background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0 30%, #7b1fa2 90%)',
            },
          }}
        >
          Export Data
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {urls.length}
                  </Typography>
                  <Typography variant="body1">
                    Total URLs
                  </Typography>
                </Box>
                <LinkIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {totalClicks}
                  </Typography>
                  <Typography variant="body1">
                    Total Clicks
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {activeUrls}
                  </Typography>
                  <Typography variant="body1">
                    Active URLs
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {avgClicksPerUrl}
                  </Typography>
                  <Typography variant="body1">
                    Avg Clicks/URL
                  </Typography>
                </Box>
                <AnalyticsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Clicks per URL Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Clicks by URL
              </Typography>
              {clicksChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clicksChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortcode" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No click data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Geographic Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Geographic Distribution
              </Typography>
              {locationChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={locationChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ location, percent }) => `${location} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="clicks"
                    >
                      {locationChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No location data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Timeline Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Clicks Over Time
              </Typography>
              {timelineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="clicks" stroke="#9c27b0" fill="#9c27b0" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No timeline data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Referrer Sources */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Traffic Sources
              </Typography>
              {referrerChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={referrerChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="referrer" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#2e7d32" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No referrer data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed URL Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              Detailed URL Analytics
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search URLs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={selectedSort}
                  label="Sort by"
                  onChange={(e) => setSelectedSort(e.target.value as any)}
                >
                  <MenuItem value="clicks">Clicks</MenuItem>
                  <MenuItem value="created">Created</MenuItem>
                  <MenuItem value="expires">Expires</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {sortedUrls.length === 0 ? (
            <Alert severity="info">
              {searchTerm ? 'No URLs match your search criteria.' : 'No URLs created yet.'}
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Short URL</TableCell>
                    <TableCell>Original URL</TableCell>
                    <TableCell align="center">Clicks</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedUrls.map((url) => {
                    const isExpired = new Date() > url.expiresAt;
                    const isExpanded = expandedRows.has(url.id);
                    
                    return (
                      <React.Fragment key={url.id}>
                        <TableRow sx={{ backgroundColor: isExpired ? 'action.hover' : 'inherit' }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              /s/{url.shortcode}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                              {url.originalUrl}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={url.clicks.length}
                              color={url.clicks.length > 0 ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={isExpired ? 'Expired' : 'Active'}
                              color={isExpired ? 'error' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {url.createdAt.toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => toggleRowExpansion(url.id)}
                              disabled={url.clicks.length === 0}
                            >
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={6} sx={{ py: 0 }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 3, backgroundColor: 'grey.50' }}>
                                <Typography variant="h6" gutterBottom>
                                  Click Details ({url.clicks.length} total)
                                </Typography>
                                {url.clicks.length === 0 ? (
                                  <Typography variant="body2" color="text.secondary">
                                    No clicks recorded yet.
                                  </Typography>
                                ) : (
                                  <List dense>
                                    {url.clicks.slice(0, 10).map((click, index) => (
                                      <ListItem key={index} divider>
                                        <ListItemText
                                          primary={
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                              <Chip label={click.referrer} size="small" />
                                              <Chip label={click.location} size="small" color="secondary" />
                                              <Typography variant="caption">
                                                {click.timestamp.toLocaleString()}
                                              </Typography>
                                            </Box>
                                          }
                                          secondary={
                                            <Typography variant="caption" color="text.secondary">
                                              IP: {click.ip} • User Agent: {click.userAgent}
                                            </Typography>
                                          }
                                        />
                                      </ListItem>
                                    ))}
                                    {url.clicks.length > 10 && (
                                      <ListItem>
                                        <ListItemText>
                                          <Typography variant="caption" color="text.secondary">
                                            ... and {url.clicks.length - 10} more clicks
                                          </Typography>
                                        </ListItemText>
                                      </ListItem>
                                    )}
                                  </List>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Analytics;
