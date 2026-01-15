// src/App.jsx
import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Paper,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import HomeIcon from '@mui/icons-material/Home';
import ReportIcon from '@mui/icons-material/Report';
import LogoutIcon from '@mui/icons-material/Logout';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ApartmentIcon from '@mui/icons-material/Apartment';
import HistoryIcon from '@mui/icons-material/History';
import CertificatesPage from './pages/CertificatesPage';
import ResidentsPage from './pages/ResidentsPage.jsx';
import HouseholdsPage from './pages/HouseholdsPage.jsx';
import IncidentsPage from './pages/IncidentsPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { setAuthToken } from './api.js';
import OfficialsPage from './pages/OfficialsPage.jsx';
import HomePage from './pages/HomePage.jsx';
import HistoryLogsPage from './pages/HistoryLogsPage.jsx';
import logo from './assets/logo.png';

const theme = createTheme({
  palette: {
    primary: {
      main: '#880808',
      contrastText: '#fff',
    },
    secondary: {
      main: '#880808',
      contrastText: '#fff',
    },
  },
});

const App = () => {
  const [page, setPage] = useState('home');
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const handleLogin = ({ token, user }) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage />;
      case 'residents':
        return <ResidentsPage />;
      case 'households':
        return <HouseholdsPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'certificates':
        return <CertificatesPage />;
      case 'officials':
        return <OfficialsPage />;
      case 'history-logs':
        return <HistoryLogsPage />;
      default:
        return <HomePage />;
    }
  };


  // Check if user has access (only Chairman and Secretary)
  const hasAccess = user && (user.role === 'Chairman' || user.role === 'Secretary');

  // If not logged in, show AuthPage
  if (!token || !user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthPage onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  // If logged in but doesn't have access (not Chairman or Secretary), show access denied
  if (!hasAccess) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa', background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
            <Typography variant="h5" color="error" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
              Only Chairman and Secretary are allowed to access this system.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your current role: <strong>{user?.role}</strong>
            </Typography>
            <Button
              variant="contained"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa', background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)', position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url(${logo}) no-repeat center center`,
          backgroundSize: 'contain',
          opacity: 0.08,
          zIndex: 0,
          pointerEvents: 'none',
        },
      }}>
        <AppBar position="static" sx={{ position: 'relative', zIndex: 1 }}>
          <Toolbar>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexGrow: 1,
                cursor: 'pointer',
                '&:hover': { opacity: 0.8 }
              }}
              onClick={() => setPage('home')}
            >
              <Box
                component="img"
                src={logo}
                alt="Logo"
                sx={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  mr: 1.25,
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              />
              <Typography variant="h6">
                Barangay 635 Information System
              </Typography>
            </Box>

            <Button
              startIcon={<HomeIcon />}
              onClick={() => setPage('home')}
              sx={{
                color: 'white',
                bgcolor: page === 'home' ? 'rgba(255,255,255,0.2)' : 'transparent',
                mx: 0.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Home
            </Button>
            <Button
              startIcon={<PeopleIcon />}
              onClick={() => setPage('residents')}
              sx={{
                color: 'white',
                bgcolor: page === 'residents' ? 'rgba(255,255,255,0.2)' : 'transparent',
                mx: 0.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Residents
            </Button>
            <Button
              startIcon={<ApartmentIcon />}
              onClick={() => setPage('households')}
              sx={{
                color: 'white',
                bgcolor: page === 'households' ? 'rgba(255,255,255,0.2)' : 'transparent',
                mx: 0.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Households
            </Button>
            <Button
              startIcon={<ReportIcon />}
              onClick={() => setPage('incidents')}
              sx={{
                color: 'white',
                bgcolor: page === 'incidents' ? 'rgba(255,255,255,0.2)' : 'transparent',
                mx: 0.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Incidents
            </Button>
            <Button
              startIcon={<AssignmentIcon />}
              onClick={() => setPage('certificates')}
              sx={{
                color: 'white',
                bgcolor: page === 'certificates' ? 'rgba(255,255,255,0.2)' : 'transparent',
                mx: 0.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Certificates
            </Button>

            <Button
              startIcon={<GroupsIcon />}
              onClick={() => setPage('officials')}
              sx={{
                color: 'white',
                bgcolor: page === 'officials' ? 'rgba(255,255,255,0.2)' : 'transparent',
                mx: 0.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Manage Officials
            </Button>

            {/* Only show History Logs for Chairman and Secretary */}
            {(user?.role === 'Chairman' || user?.role === 'Secretary') && (
              <Button
                startIcon={<HistoryIcon />}
                onClick={() => setPage('history-logs')}
                sx={{
                  color: 'white',
                  bgcolor: page === 'history-logs' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  mx: 0.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                History Logs
              </Button>
            )}

            <Typography variant="body2" sx={{ mx: 2 }}>
              {user?.full_name} ({user?.role})
            </Typography>
            {/* Only show Logout button for Chairman and Secretary */}
            {(user?.role === 'Chairman' || user?.role === 'Secretary') && (
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
          {renderPage()}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
