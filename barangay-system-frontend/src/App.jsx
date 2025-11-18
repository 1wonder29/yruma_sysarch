// src/App.jsx
import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import HomeIcon from '@mui/icons-material/Home';
import ReportIcon from '@mui/icons-material/Report';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import LogoutIcon from '@mui/icons-material/Logout';
import CertificatesPage from './pages/CertificatesPage';
import ResidentsPage from './pages/ResidentsPage.jsx';
import HouseholdsPage from './pages/HouseholdsPage.jsx';
import IncidentsPage from './pages/IncidentsPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { setAuthToken } from './api.js';
import OfficialsPage from './pages/OfficialsPage.jsx';

const App = () => {
  const [page, setPage] = useState('residents');
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
    case 'residents':
      return <ResidentsPage />;
    case 'households':
      return <HouseholdsPage />;
    case 'incidents':
      return <IncidentsPage />;
    case 'services':
      return <ServicesPage />;
    case 'certificates':
      return <CertificatesPage />;
    case 'officials':
      return <OfficialsPage />;
    default:
      return <ResidentsPage />;
  }
};


  // If not logged in, show AuthPage
  if (!token || !user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Barangay Information System
          </Typography>

          <Button
            color={page === 'residents' ? 'secondary' : 'inherit'}
            startIcon={<PeopleIcon />}
            onClick={() => setPage('residents')}
          >
            Residents
          </Button>
          <Button
            color={page === 'households' ? 'secondary' : 'inherit'}
            startIcon={<HomeIcon />}
            onClick={() => setPage('households')}
          >
            Households
          </Button>
          <Button
            color={page === 'incidents' ? 'secondary' : 'inherit'}
            startIcon={<ReportIcon />}
            onClick={() => setPage('incidents')}
          >
            Incidents
          </Button>
          <Button
            color={page === 'services' ? 'secondary' : 'inherit'}
            startIcon={<VolunteerActivismIcon />}
            onClick={() => setPage('services')}
          >
            Services
          </Button>
          <Button
  color="inherit"
  onClick={() => setPage('certificates')}
>
  Certificates
</Button>

<Button
  color={page === 'officials' ? 'secondary' : 'inherit'}
  startIcon={<GroupsIcon />}
  onClick={() => setPage('officials')}
>
  Officials
</Button>


          <Typography variant="body2" sx={{ mx: 2 }}>
            {user?.full_name} ({user?.role})
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {renderPage()}
      </Container>
    </Box>
  );
};

export default App;
