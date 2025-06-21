import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip
} from '@mui/material';
import {
  Rocket,
  AccountBalanceWallet,
  Work,
  AccessTime,
  Store,
  CheckCircle,
  Star
} from '@mui/icons-material';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSkipTutorial: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onSkipTutorial }) => {
  const features = [
    {
      icon: <AccountBalanceWallet color="primary" />,
      title: 'Gestión de Tokens KRM',
      description: 'Gana y gestiona tokens KRM por tu trabajo y habilidades validadas'
    },
    {
      icon: <Work color="primary" />,
      title: 'Sistema de Habilidades',
      description: 'Declara y valida tus habilidades profesionales en la blockchain'
    },
    {
      icon: <AccessTime color="primary" />,
      title: 'Registro de Tiempo',
      description: 'Registra y valida las horas trabajadas de forma transparente'
    },
    {
      icon: <Store color="primary" />,
      title: 'Marketplace P2P',
      description: 'Ofrece y contrata servicios directamente con otros usuarios'
    }
  ];

  const benefits = [
    'Transparencia total gracias a la blockchain',
    'Pagos seguros con tokens KRM',
    'Validación descentralizada de habilidades',
    'Sin intermediarios ni comisiones excesivas',
    'Control total de tus datos profesionales'
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      py: 4
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        <Grid container spacing={4} alignItems="center">
          {/* Lado izquierdo - Información */}
          <Grid item xs={12} lg={6}>
            <Box sx={{ color: 'white', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'white' }}>
                  <Rocket sx={{ fontSize: 30, color: 'primary.main' }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" component="h1" fontWeight="bold">
                    Musubi
                  </Typography>
                  <Chip 
                    label="Plataforma Web3" 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              </Box>
              
              <Typography variant="h5" paragraph sx={{ opacity: 0.9 }}>
                La primera plataforma descentralizada para gestión de talento y servicios profesionales
              </Typography>
              
              <Typography variant="body1" paragraph sx={{ opacity: 0.8, fontSize: '1.1rem' }}>
                Conecta tu talento con oportunidades reales, valida tus habilidades en la blockchain 
                y gana tokens KRM por tu trabajo. Todo de forma transparente y descentralizada.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ¿Por qué elegir Musubi?
                </Typography>
                <List dense>
                  {benefits.map((benefit, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={benefit} 
                        sx={{ color: 'white', opacity: 0.9 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          </Grid>

          {/* Lado derecho - Características y CTA */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" component="h2" gutterBottom color="primary">
                  ¡Bienvenido a Web3!
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Para usar Musubi necesitas una wallet digital. Te guiaremos paso a paso.
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                {features.map((feature, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Box sx={{ mr: 2, mt: 0.5 }}>
                          {feature.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {feature.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>¿Primera vez en Web3?</strong> No te preocupes, te guiaremos para configurar 
                  tu wallet MetaMask en menos de 5 minutos.
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={onGetStarted}
                  startIcon={<Star />}
                  sx={{ flex: 1 }}
                >
                  Configurar Wallet
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={onSkipTutorial}
                  sx={{ flex: 1 }}
                >
                  Ya tengo Wallet
                </Button>
              </Box>

              <Typography variant="caption" display="block" sx={{ textAlign: 'center', mt: 2, opacity: 0.7 }}>
                El tutorial toma aproximadamente 5 minutos
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default WelcomeScreen;

