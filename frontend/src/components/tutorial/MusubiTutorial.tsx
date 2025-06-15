import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Avatar
} from '@mui/material';
import {
  AccountBalanceWallet,
  Work,
  AccessTime,
  Store,
  TrendingUp,
  CheckCircle,
  PlayArrow
} from '@mui/icons-material';

interface MusubiTutorialProps {
  onComplete: () => void;
}

const MusubiTutorial: React.FC<MusubiTutorialProps> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: 'Dashboard - Tu Centro de Control',
      icon: <TrendingUp />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            El Dashboard es tu página principal donde puedes ver:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Balance de tokens KRM" 
                secondary="Tus ganancias y tokens disponibles"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Estadísticas de actividad" 
                secondary="Horas trabajadas, proyectos completados, habilidades validadas"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Resumen de servicios" 
                secondary="Tus servicios activos y órdenes recientes"
              />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Consejo:</strong> Revisa tu dashboard regularmente para mantener un seguimiento de tu actividad.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Mi Perfil - Tu Identidad Digital',
      icon: <AccountBalanceWallet />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Tu perfil es tu identidad en la blockchain de Musubi:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Registro de perfil" 
                secondary="Crea tu perfil como individual o empresa"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Información profesional" 
                secondary="Añade tu biografía, ubicación y sitio web"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Verificación blockchain" 
                secondary="Tu perfil queda registrado permanentemente en la blockchain"
              />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Importante:</strong> Registrar tu perfil requiere una transacción en la blockchain.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Habilidades - Valida tu Talento',
      icon: <Work />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            El sistema de habilidades te permite demostrar tu experiencia:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Declarar habilidades" 
                secondary="Añade las habilidades que dominas con su nivel de experiencia"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Validación por terceros" 
                secondary="Otros usuarios pueden validar tus habilidades basándose en tu trabajo"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Crear nuevas habilidades" 
                secondary="Si tu habilidad no existe, puedes crearla para la comunidad"
              />
            </ListItem>
          </List>
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Beneficio:</strong> Las habilidades validadas aumentan tu credibilidad y oportunidades de trabajo.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Registro de Tiempo - Transparencia Total',
      icon: <AccessTime />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Registra y valida las horas que trabajas:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Registro detallado" 
                secondary="Registra inicio, fin, descripción y habilidades utilizadas"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Validación por empresas" 
                secondary="Las empresas pueden validar tus registros de tiempo"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Historial inmutable" 
                secondary="Todos los registros quedan permanentemente en la blockchain"
              />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Nota:</strong> Solo las empresas registradas pueden validar registros de tiempo.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Marketplace - Conecta y Trabaja',
      icon: <Store />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            El marketplace te permite ofrecer y contratar servicios:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Publicar servicios" 
                secondary="Crea servicios con descripción, precio por hora y habilidades requeridas"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Contratar servicios" 
                secondary="Busca y contrata servicios de otros profesionales"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Pagos seguros" 
                secondary="Todos los pagos se realizan con tokens KRM de forma segura"
              />
            </ListItem>
          </List>
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Ventaja:</strong> Sin intermediarios, trabajas directamente con clientes y proveedores.
            </Typography>
          </Alert>
        </Box>
      )
    }
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
          <PlayArrow sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h4" component="h1" gutterBottom>
          Cómo usar Musubi
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Descubre todas las funcionalidades de la plataforma
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {step.icon}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {step.label}
                </Typography>
              </Box>
            </StepLabel>
            <StepContent>
              {step.content}
              <Box sx={{ mb: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={index === steps.length - 1 ? onComplete : handleNext}
                  sx={{ mr: 1 }}
                >
                  {index === steps.length - 1 ? 'Empezar a usar Musubi' : 'Siguiente'}
                </Button>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Atrás
                </Button>
                <Button
                  onClick={onComplete}
                  color="inherit"
                >
                  Saltar Tutorial
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {activeStep === steps.length && (
        <Card sx={{ mt: 3, p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <CheckCircle sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            ¡Listo para empezar!
          </Typography>
          <Typography variant="body1" paragraph>
            Ya conoces todas las funcionalidades de Musubi. 
            ¡Es hora de conectar tu wallet y comenzar tu viaje en Web3!
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={onComplete}
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
          >
            Conectar Wallet y Empezar
          </Button>
        </Card>
      )}
    </Box>
  );
};

export default MusubiTutorial;

