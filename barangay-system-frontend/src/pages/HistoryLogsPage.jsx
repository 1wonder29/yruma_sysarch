// src/pages/HistoryLogsPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Chip,
} from '@mui/material';
import api from '../api';

const HistoryLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/history-logs');
        setLogs(res.data || []);
      } catch (err) {
        console.error('Error fetching history logs:', err);
        if (err.response?.status === 403) {
          setError('Access denied. Only Chairman and Secretary can view history logs.');
        } else {
          setError('Failed to load history logs.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getModuleColor = (moduleType) => {
    const colors = {
      'Certificates': 'primary',
      'Residents': 'success',
      'Households': 'info',
      'Incidents': 'warning',
      'Officials': 'secondary',
    };
    return colors[moduleType] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          History Logs
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        History Logs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Complete audit trail of all system activities. Logs are read-only and chronologically ordered.
      </Typography>

      <Paper sx={{ p: 2 }} elevation={2}>
        {logs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No history logs found.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action Description</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Certificate Type</TableCell>
                  <TableCell>Resident Name</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  // Format action as "The [Role] [action]"
                  const actionText = log.action.startsWith('The ') 
                    ? log.action 
                    : `The ${log.user_role} ${log.action}`;
                  
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell>{formatDateTime(log.created_at)}</TableCell>
                      <TableCell>
                        <Box>
                          <Chip
                            label={log.user_role}
                            size="small"
                            color={log.user_role === 'Chairman' || log.user_role === 'Secretary' ? 'primary' : 'default'}
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant="caption" display="block" color="text.secondary">
                            {log.user_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {actionText}
                        </Typography>
                      </TableCell>
                    <TableCell>
                      {log.module_type && (
                        <Chip
                          label={log.module_type}
                          size="small"
                          color={getModuleColor(log.module_type)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {log.certificate_type && (
                        <Typography variant="caption">
                          {log.certificate_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                      )}
                    </TableCell>
                      <TableCell>{log.resident_name || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {log.details || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default HistoryLogsPage;
