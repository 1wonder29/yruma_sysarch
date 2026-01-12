// src/pages/HomePage.jsx
import React, { useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Link,
  Grid,
  Divider,
} from '@mui/material';
import logo from '../assets/logo.png';

const HomePage = () => {
  const demographicsRef = useRef(null);
  const locationRef = useRef(null);
  const adjacentRef = useRef(null);
  const notesRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        position: 'relative',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
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
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: { xs: '100%', md: '900px', lg: '1200px' },
          margin: '0 auto',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4, md: 5 },
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 5,
            backgroundColor: '#ffffff',
            py: { xs: 4, sm: 5 },
            px: { xs: 2, sm: 3 },
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #880808 0%, #a02020 50%, #880808 100%)',
            },
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3.5rem' },
              mb: 1.5,
              color: '#1a1a1a',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            Barangay 635
          </Typography>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 400,
              fontSize: { xs: '1.1rem', sm: '1.35rem' },
              color: '#555555',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '0.01em',
            }}
          >
            City of Manila
          </Typography>
        </Box>

        {/* Contents / Navigation Section */}
        <Paper
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 4,
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            },
          }}
        >
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              mb: 2.5,
              fontSize: '1.15rem',
              color: '#1a1a1a',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '-0.01em',
            }}
          >
            Contents
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
            }}
          >
            <Link
              component="button"
              onClick={() => scrollToSection(demographicsRef)}
              sx={{
                textAlign: 'left',
                textDecoration: 'none',
                color: '#0645ad',
                cursor: 'pointer',
                fontSize: '1rem',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  textDecoration: 'underline',
                  backgroundColor: 'rgba(6, 69, 173, 0.05)',
                },
                '&:visited': {
                  color: '#0b0080',
                },
              }}
            >
              Demographics
            </Link>
            <Link
              component="button"
              onClick={() => scrollToSection(locationRef)}
              sx={{
                textAlign: 'left',
                textDecoration: 'none',
                color: '#0645ad',
                cursor: 'pointer',
                fontSize: '1rem',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  textDecoration: 'underline',
                  backgroundColor: 'rgba(6, 69, 173, 0.05)',
                },
                '&:visited': {
                  color: '#0b0080',
                },
              }}
            >
              Location
            </Link>
            <Link
              component="button"
              onClick={() => scrollToSection(adjacentRef)}
              sx={{
                textAlign: 'left',
                textDecoration: 'none',
                color: '#0645ad',
                cursor: 'pointer',
                fontSize: '1rem',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  textDecoration: 'underline',
                  backgroundColor: 'rgba(6, 69, 173, 0.05)',
                },
                '&:visited': {
                  color: '#0b0080',
                },
              }}
            >
              Adjacent Barangays
            </Link>
            <Link
              component="button"
              onClick={() => scrollToSection(notesRef)}
              sx={{
                textAlign: 'left',
                textDecoration: 'none',
                color: '#0645ad',
                cursor: 'pointer',
                fontSize: '1rem',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  textDecoration: 'underline',
                  backgroundColor: 'rgba(6, 69, 173, 0.05)',
                },
                '&:visited': {
                  color: '#0b0080',
                },
              }}
            >
              Notes
            </Link>
          </Box>
        </Paper>

        {/* Summary Data Card */}
        <Paper
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 4,
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 2,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            },
          }}
        >
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: '1.05rem',
              color: '#1a1a1a',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              textTransform: 'uppercase',
              textAlign: 'center',
              letterSpacing: '0.05em',
            }}
          >
            SUMMARY DATA
          </Typography>
          <Divider sx={{ mb: 3, borderColor: 'rgba(0,0,0,0.12)' }} />
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#2c2c2c',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Type:
                </Typography>
                <Link
                  href="#"
                  sx={{
                    color: '#0645ad',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#0b0080',
                    },
                  }}
                >
                  barangay
                </Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#2c2c2c',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Island group:
                </Typography>
                <Link
                  href="#"
                  sx={{
                    color: '#0645ad',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#0b0080',
                    },
                  }}
                >
                  Luzon
                </Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#2c2c2c',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Region:
                </Typography>
                <Link
                  href="#"
                  sx={{
                    color: '#0645ad',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    textAlign: 'right',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#0b0080',
                    },
                  }}
                >
                  National Capital Region (NCR)
                </Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#2c2c2c',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  City:
                </Typography>
                <Link
                  href="#"
                  sx={{
                    color: '#0645ad',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#0b0080',
                    },
                  }}
                >
                  Manila
                </Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#2c2c2c',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  District:
                </Typography>
                <Typography
                  sx={{
                    color: '#1a1a1a',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 500,
                  }}
                >
                  Sampaloc
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#2c2c2c',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Population (2020):
                </Typography>
                <Typography
                  sx={{
                    color: '#1a1a1a',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 500,
                  }}
                >
                  660
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#2c2c2c',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Philippine major island(s):
                </Typography>
                <Link
                  href="#"
                  sx={{
                    color: '#0645ad',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#0b0080',
                    },
                  }}
                >
                  Luzon
                </Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, alignItems: 'flex-start' }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#2c2c2c',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    flexShrink: 0,
                    mr: 1,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Coordinates:
                </Typography>
                <Box sx={{ textAlign: 'right', flex: 1 }}>
                  <Typography
                    sx={{
                      color: '#1a1a1a',
                      fontSize: '0.975rem',
                      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                      mb: 0.5,
                      fontWeight: 500,
                    }}
                  >
                    14.5980, 120.9998
                  </Typography>
                  <Typography
                    sx={{
                      color: '#1a1a1a',
                      fontSize: '0.975rem',
                      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                      lineHeight: 1.4,
                    }}
                  >
                    (14° 36' North,
                  </Typography>
                  <Typography
                    sx={{
                      color: '#1a1a1a',
                      fontSize: '0.975rem',
                      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                      lineHeight: 1.4,
                    }}
                  >
                    120° 60' East)
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, alignItems: 'flex-start' }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#2c2c2c',
                    fontSize: '0.975rem',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    flexShrink: 0,
                    mr: 1,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Estimated elevation above sea level:
                </Typography>
                <Box sx={{ textAlign: 'right', flex: 1 }}>
                  <Typography
                    sx={{
                      color: '#1a1a1a',
                      fontSize: '0.975rem',
                      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      lineHeight: 1.5,
                    }}
                  >
                    6.5 meters (21.3 feet)
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Body Text Section */}
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            mb: 4,
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            },
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: '#1a1a1a',
              fontSize: '1.05rem',
              lineHeight: 1.75,
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              mb: 4,
              textAlign: 'justify',
            }}
          >
            Barangay 635 is a barangay in the city of Manila, under the administrative district of Sampaloc. Its population as determined by the 2020 Census was 660. This represented 0.04% of the total population of Manila.
          </Typography>

          <Divider sx={{ my: 4, borderColor: 'rgba(0,0,0,0.12)' }} />

          {/* Demographics Section */}
          <Box ref={demographicsRef} sx={{ mb: 4, scrollMarginTop: '80px' }}>
            <Typography
              variant="h5"
              component="h3"
              sx={{
                fontWeight: 700,
                mb: 2.5,
                fontSize: { xs: '1.35rem', sm: '1.5rem' },
                color: '#1a1a1a',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.02em',
                borderBottom: '2px solid rgba(136, 8, 8, 0.2)',
                pb: 1,
                display: 'inline-block',
                width: '100%',
              }}
            >
              Demographics
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#2c2c2c',
                fontSize: '1.05rem',
                lineHeight: 1.75,
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                textAlign: 'justify',
              }}
            >
              According to the 2020 Census, Barangay 635 has a population of 660 residents, representing 0.04% of Manila's total population.
            </Typography>
          </Box>

          <Divider sx={{ my: 4, borderColor: 'rgba(0,0,0,0.12)' }} />

          {/* Location Section */}
          <Box ref={locationRef} sx={{ mb: 4, scrollMarginTop: '80px' }}>
            <Typography
              variant="h5"
              component="h3"
              sx={{
                fontWeight: 700,
                mb: 2.5,
                fontSize: { xs: '1.35rem', sm: '1.5rem' },
                color: '#1a1a1a',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.02em',
                borderBottom: '2px solid rgba(136, 8, 8, 0.2)',
                pb: 1,
                display: 'inline-block',
                width: '100%',
              }}
            >
              Location
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#2c2c2c',
                fontSize: '1.05rem',
                lineHeight: 1.75,
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                textAlign: 'justify',
                mb: 3,
              }}
            >
              Barangay 635 is located in the Sampaloc district of Manila, National Capital Region (NCR), on the island of Luzon. The barangay's coordinates are approximately 14.5980°N, 120.9998°E, with an estimated elevation of 6.5 meters above sea level.
            </Typography>
            
            {/* Interactive Map */}
            <Box
              sx={{
                width: '100%',
                height: { xs: '300px', sm: '400px', md: '500px' },
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.08)',
                mb: 2,
              }}
            >
              <iframe
                src={`https://www.google.com/maps?q=14.5980,120.9998&hl=en&z=15&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Barangay 635 Location Map"
              />
            </Box>
            
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                flexWrap: 'wrap',
                mt: 2,
              }}
            >
              <Link
                href="https://www.google.com/maps?q=14.5980,120.9998"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#0645ad',
                  fontSize: '0.95rem',
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Open in Google Maps →
              </Link>
            </Box>
            
            <Typography
              variant="body2"
              sx={{
                color: '#666666',
                fontSize: '0.9rem',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              Click on the map to view in Google Maps
            </Typography>
          </Box>

          <Divider sx={{ my: 4, borderColor: 'rgba(0,0,0,0.12)' }} />

          {/* Adjacent Barangays Section */}
          <Box ref={adjacentRef} sx={{ mb: 4, scrollMarginTop: '80px' }}>
            <Typography
              variant="h5"
              component="h3"
              sx={{
                fontWeight: 700,
                mb: 2.5,
                fontSize: { xs: '1.35rem', sm: '1.5rem' },
                color: '#1a1a1a',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.02em',
                borderBottom: '2px solid rgba(136, 8, 8, 0.2)',
                pb: 1,
                display: 'inline-block',
                width: '100%',
              }}
            >
              Adjacent Barangays
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#2c2c2c',
                fontSize: '1.05rem',
                lineHeight: 1.75,
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                textAlign: 'justify',
              }}
            >
              Barangay 635 is situated within the Sampaloc district and is surrounded by other barangays in the same administrative district of Manila.
            </Typography>
          </Box>

          <Divider sx={{ my: 4, borderColor: 'rgba(0,0,0,0.12)' }} />

          {/* Notes Section */}
          <Box ref={notesRef} sx={{ mb: 2, scrollMarginTop: '80px' }}>
            <Typography
              variant="h5"
              component="h3"
              sx={{
                fontWeight: 700,
                mb: 2.5,
                fontSize: { xs: '1.35rem', sm: '1.5rem' },
                color: '#1a1a1a',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.02em',
                borderBottom: '2px solid rgba(136, 8, 8, 0.2)',
                pb: 1,
                display: 'inline-block',
                width: '100%',
              }}
            >
              Notes
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#2c2c2c',
                fontSize: '1.05rem',
                lineHeight: 1.75,
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                textAlign: 'justify',
              }}
            >
              This barangay is part of Zone 64, District VI of Manila. The information provided is based on the 2020 Census data and official administrative records.
            </Typography>
          </Box>
        </Paper>

        {/* Clickable Logo */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 5,
            mb: 3,
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Barangay 635 Logo"
            onClick={handleLogoClick}
            sx={{
              width: { xs: '90px', sm: '110px', md: '130px' },
              height: { xs: '90px', sm: '110px', md: '130px' },
              borderRadius: '50%',
              objectFit: 'cover',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))',
              border: '3px solid rgba(136, 8, 8, 0.1)',
              '&:hover': {
                opacity: 0.85,
                transform: 'scale(1.05)',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
                borderColor: 'rgba(136, 8, 8, 0.2)',
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
