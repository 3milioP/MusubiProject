import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Link
} from '@mui/material';
import {
  AccountBalanceWallet,
  Download,
  Security,
  CheckCircle,
  Warning,
  OpenInNew
} from '@mui/icons-material';

interface MetaMaskTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const MetaMaskTutorial: React.FC<MetaMaskTutorialProps> = ({ onComplete, onSkip }) => {
  const [activeStep, setActiveStep] = React.useState(0);

  const steps = [
    {
      label: '¿Qué es MetaMask?',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            MetaMask es una wallet (billetera) digital que te permite interactuar con aplicaciones blockchain como Musubi.
            Es como tu cuenta bancaria digital para criptomonedas y aplicaciones descentralizadas.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Security color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Segura</Typography>
                  <Typography variant="body2">
                    Tus claves privadas se almacenan localmente en tu navegador
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <AccountBalanceWallet color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Fácil de usar</Typography>
                  <Typography variant="body2">
                    Interfaz simple para gestionar tus activos digitales
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckCircle color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Confiable</Typography>
                  <Typography variant="body2">
                    Utilizada por millones de usuarios en todo el mundo
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )
    },
    {
      label: 'Instalar MetaMask',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Sigue estos pasos para instalar MetaMask en tu navegador:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Download color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="1. Visita metamask.io"
                secondary={
                  <Link 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                  >
                    Descargar MetaMask <OpenInNew sx={{ ml: 0.5, fontSize: 16 }} />
                  </Link>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="2. Haz clic en 'Download'"
                secondary="Selecciona tu navegador (Chrome, Firefox, Edge, etc.)"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="3. Instala la extensión"
                secondary="Sigue las instrucciones de tu navegador para instalar"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="4. Fija la extensión"
                secondary="Haz clic en el icono de puzzle y fija MetaMask para acceso fácil"
              />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Consejo:</strong> Después de instalar, verás el icono de MetaMask (🦊) en la barra de herramientas de tu navegador.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Crear tu Wallet',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Una vez instalado MetaMask, necesitas crear tu primera wallet:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="1. Abre MetaMask"
                secondary="Haz clic en el icono del zorro en tu navegador"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="2. Acepta los términos"
                secondary="Lee y acepta los términos de uso y política de privacidad"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="3. Crea una nueva wallet"
                secondary="Selecciona 'Crear una nueva wallet' (no importar)"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="4. Crea una contraseña segura"
                secondary="Esta contraseña protegerá tu wallet en este dispositivo"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="5. Guarda tu frase de recuperación"
                secondary="¡MUY IMPORTANTE! Escribe las 12 palabras en papel y guárdalas en un lugar seguro"
              />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>⚠️ IMPORTANTE:</strong> Tu frase de recuperación es la única forma de recuperar tu wallet si pierdes acceso. 
              Nunca la compartas con nadie y guárdala en un lugar seguro offline.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Configurar Red Local',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Para usar Musubi en modo desarrollo, necesitas conectarte a nuestra red local:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="1. Abre MetaMask"
                secondary="Haz clic en el icono del zorro"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="2. Cambia de red"
                secondary="Haz clic en el selector de red (arriba en el centro)"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="3. Añadir red manualmente"
                secondary="Selecciona 'Añadir red manualmente' al final de la lista"
              />
            </ListItem>
          </List>
          
          <Card variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>Datos de la Red Hardhat Local:</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Nombre de la red:</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>Hardhat Local</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Nueva URL de RPC:</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>http://localhost:8545</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">ID de cadena:</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>31337</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Símbolo de moneda:</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>KRM</Typography>
              </Grid>
            </Grid>
          </Card>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Nota:</strong> Esta red solo funciona cuando el servidor de desarrollo de Musubi está ejecutándose.
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

  const handleComplete = () => {
    onComplete();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
          <AccountBalanceWallet sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h4" component="h1" gutterBottom>
          Configuración de Wallet
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Te guiaremos paso a paso para configurar tu wallet y empezar a usar Musubi
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Typography variant="h6">{step.label}</Typography>
            </StepLabel>
            <StepContent>
              {step.content}
              <Box sx={{ mb: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={index === steps.length - 1 ? handleComplete : handleNext}
                  sx={{ mr: 1 }}
                >
                  {index === steps.length - 1 ? 'Completar Tutorial' : 'Siguiente'}
                </Button>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Atrás
                </Button>
                <Button
                  onClick={onSkip}
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
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            ¡Tutorial Completado!
          </Typography>
          <Typography variant="body1" paragraph>
            Ya tienes todo lo necesario para usar Musubi. Ahora puedes conectar tu wallet y empezar a explorar.
          </Typography>
          <Button variant="contained" size="large" onClick={onComplete}>
            Ir a Musubi
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MetaMaskTutorial;

