// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  MenuItem,
} from '@mui/material';
import api from '../api';
import logo from '../assets/logo.png';

const AuthPage = ({ onLogin }) => {
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Register

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'Staff',
  });

  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');
  const [errorRegister, setErrorRegister] = useState('');
  const [successRegister, setSuccessRegister] = useState('');

  const handleTabChange = (e, newValue) => {
    setTab(newValue);
    setErrorLogin('');
    setErrorRegister('');
    setSuccessRegister('');
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const normalizeError = (err, fallback) => {
    // If backend returned JSON with message, use that
    const msgFromServer = err?.response?.data?.message;
    if (msgFromServer) return msgFromServer;

    // If backend returned HTML (e.g. Cannot POST /something)
    const raw = err?.response?.data;
    if (typeof raw === 'string' && raw.includes('Cannot POST')) {
      return 'API route not found. Check that server.js has /api/auth/... routes and is running on port 5000.';
    }

    return fallback;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    try {
      setLoadingLogin(true);
      // baseURL: http://localhost:5000/api + /auth/login = /api/auth/login
      const res = await api.post('/auth/login', loginForm);
      onLogin({ token: res.data.token, user: res.data.user });
    } catch (err) {
      console.error('Login error:', err);
      setErrorLogin(normalizeError(err, 'Login failed'));
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorRegister('');
    setSuccessRegister('');
    try {
      setLoadingRegister(true);
      // baseURL: http://localhost:5000/api + /auth/register = /api/auth/register
      await api.post('/auth/register', registerForm);
      setSuccessRegister('User registered successfully. You can now log in.');
      // Auto switch to login tab with username prefilled
      setTab(0);
      setLoginForm({
        username: registerForm.username,
        password: '',
      });
      setRegisterForm({
        username: '',
        password: '',
        full_name: '',
        role: 'Staff',
      });
    } catch (err) {
      console.error('Register error:', err);
      setErrorRegister(normalizeError(err, 'Registration failed'));
    } finally {
      setLoadingRegister(false);
    }
  };


  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        bgcolor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column', // For vertically stacking potential footer/messages
        justifyContent: 'center', // Vertical centering
        alignItems: 'center', // Horizontal centering
        p: { xs: 2, sm: 4 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 450 }}>
        <Paper
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
          }}
          elevation={4}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                borderRadius: '50%',
                objectFit: 'cover',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                border: '3px solid rgba(136, 8, 8, 0.15)',
              }}
            />
            <Typography
              variant="h5"
              align="center"
              sx={{
                fontWeight: 'bold',
                color: '#333',
                lineHeight: 1.2
              }}
            >
              Barangay 635 Information System
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, letterSpacing: 0.5 }}
            >
              Management Dashboard
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={handleTabChange}
            centered
            sx={{
              mb: 3,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { fontWeight: 'bold' }
            }}
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {tab === 0 && (
            <Box component="form" onSubmit={handleLoginSubmit}>
              <TextField
                margin="normal"
                label="Username"
                name="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                fullWidth
                required
              />
              <TextField
                margin="normal"
                label="Password"
                name="password"
                type="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                fullWidth
                required
              />
              {errorLogin && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {errorLogin}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                disabled={loadingLogin}
              >
                {loadingLogin ? 'Logging in...' : 'Login'}
              </Button>
            </Box>
          )}

          {tab === 1 && (
            <Box component="form" onSubmit={handleRegisterSubmit}>
              <TextField
                margin="normal"
                label="Full Name"
                name="full_name"
                value={registerForm.full_name}
                onChange={handleRegisterChange}
                fullWidth
                required
              />
              <TextField
                margin="normal"
                label="Username"
                name="username"
                value={registerForm.username}
                onChange={handleRegisterChange}
                fullWidth
                required
              />
              <TextField
                margin="normal"
                label="Password"
                name="password"
                type="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                fullWidth
                required
              />
              <TextField
                select
                margin="normal"
                label="Role"
                name="role"
                value={registerForm.role}
                onChange={handleRegisterChange}
                fullWidth
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Staff">Staff</MenuItem>
                <MenuItem value="Chairman">Chairman</MenuItem>
                <MenuItem value="Secretary">Secretary</MenuItem>
              </TextField>

              {errorRegister && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {errorRegister}
                </Typography>
              )}
              {successRegister && (
                <Typography color="primary" variant="body2" sx={{ mt: 1 }}>
                  {successRegister}
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                disabled={loadingRegister}
              >
                {loadingRegister ? 'Registering...' : 'Register'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AuthPage;
