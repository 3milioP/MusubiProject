import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Paper,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StorefrontIcon from '@mui/icons-material/Storefront';

const Dashboard = () => {
  // Estado simulado para un MVP
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalKarma: 0,
    validatedSkills: 0,
    pendingValidations: 0,
    hoursRegistered: 0,
    marketplaceServices: 0
  });

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        totalKarma: 450,
        validatedSkills: 8,
        pendingValidations: 3,
        hoursRegistered: 124,
        marketplaceServices: 2
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button variant="contained" color="primary">
          Actualizar Perfil
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      ) : (
        <>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 2,
              background: 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
              color: 'white'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h5" gutterBottom>
                  Bienvenido a Musubi
                </Typography>
                <Typography variant="body1">
                  Tu perfil profesional está tomando forma. Continúa validando tus habilidades y acumulando Karma para destacar en el ecosistema.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  display: 'inline-flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  p: 2,
                  borderRadius: 2
                }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {stats.totalKarma}
                  </Typography>
                  <Typography variant="subtitle1">
                    Karma Total
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <VerifiedIcon />
                    </Avatar>
                    <Typography variant="h6">
                      Habilidades
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {stats.validatedSkills}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Habilidades validadas
                  </Typography>
                  <Chip 
                    label={`${stats.pendingValidations} pendientes`} 
                    size="small" 
                    color="warning" 
                    sx={{ mt: 1 }} 
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <AccessTimeIcon />
                    </Avatar>
                    <Typography variant="h6">
                      Horas
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {stats.hoursRegistered}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Horas registradas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <StorefrontIcon />
                    </Avatar>
                    <Typography variant="h6">
                      Marketplace
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {stats.marketplaceServices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Servicios publicados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <TrendingUpIcon />
                    </Avatar>
                    <Typography variant="h6">
                      Tendencias
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Habilidades más demandadas:
                  </Typography>
                  <Box>
                    <Chip label="Blockchain" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    <Chip label="React" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    <Chip label="Python" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
