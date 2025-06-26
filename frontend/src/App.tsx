import React, { useState } from 'react';
import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Fab, Button, Typography, useTheme, useMediaQuery } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StoreIcon from '@mui/icons-material/Store';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import BuildIcon from '@mui/icons-material/Build';

// Importar contextos y componentes
import { Web3Provider } from './contexts/Web3Context';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { KRMProvider } from './contexts/KRMContext';
import { useWeb3 } from './contexts/Web3Context';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import Navbar from './components/Navbar';
import NotificationContainer from './components/NotificationContainer';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Skills from './pages/Skills';
import TimeRegistry from './pages/TimeRegistry';
import Marketplace from './pages/Marketplace';
import Settings from './pages/Settings';
import DeveloperTools from './pages/DeveloperTools';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
  },
});

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, component: 'dashboard' },
  { text: 'Mi Perfil', icon: <PersonIcon />, component: 'profile' },
  { text: 'Habilidades', icon: <WorkIcon />, component: 'skills' },
  { text: 'Registro de Tiempo', icon: <AccessTimeIcon />, component: 'timeregistry' },
  { text: 'Marketplace', icon: <StoreIcon />, component: 'marketplace' },
  { text: 'Configuración', icon: <SettingsIcon />, component: 'settings' },
  { text: 'Herramientas Dev', icon: <BuildIcon />, component: 'developertools' },
];

// Componente principal de la aplicación
const AppContent = () => {
  const { isConnected, account, connectWallet, error, connecting } = useWeb3();
  const { 
    hasCompletedOnboarding, 
    showOnboarding, 
    hasRegisteredProfile, 
    isCheckingProfile,
    checkProfileInBlockchain, 
    markProfileRegistered, 
    setCurrentWallet,
    goToProfileRegistration,
    completeOnboarding,
    showOnboardingFlow
  } = useOnboarding();
  const { showNotification } = useNotification();

  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [initialStep, setInitialStep] = useState<string | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [notificationShown, setNotificationShown] = useState(false);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Escuchar eventos personalizados para notificaciones
  React.useEffect(() => {
    const handleShowNotification = (event: CustomEvent) => {
      const { message, type, duration } = event.detail;
      showNotification(message, type, duration);
    };

    window.addEventListener('showNotification', handleShowNotification as EventListener);

    return () => {
      window.removeEventListener('showNotification', handleShowNotification as EventListener);
    };
  }, [showNotification]);

  // Actualizar wallet actual en el contexto de onboarding
  React.useEffect(() => {
    if (account) {
      setCurrentWallet(account);
      // Resetear el estado de notificación cuando cambie la cuenta
      setNotificationShown(false);
    } else {
      setCurrentWallet(null);
      setNotificationShown(false);
    }
  }, [account, setCurrentWallet]);

  // Verificar automáticamente si la wallet ya tiene perfil registrado
  const [hasCheckedProfile, setHasCheckedProfile] = React.useState(false);
  
  React.useEffect(() => {
    if (isConnected && account && !hasRegisteredProfile && !isCheckingProfile && !hasCheckedProfile) {
      console.log('🔍 Verificando automáticamente si la wallet tiene perfil registrado:', account);
      setHasCheckedProfile(true);
      
      const checkExistingProfile = async () => {
        try {
          const profileExists = await checkProfileInBlockchain(account);
          if (profileExists) {
            console.log('✅ Perfil encontrado para wallet:', account);
            markProfileRegistered();
            showNotification('Perfil encontrado. ¡Bienvenido de vuelta!', 'success', 3000);
          } else {
            console.log('❌ No se encontró perfil para wallet:', account);
          }
        } catch (error) {
          console.error('❌ Error verificando perfil automáticamente:', error);
        }
      };
      
      checkExistingProfile();
    }
  }, [isConnected, account, hasRegisteredProfile, isCheckingProfile, hasCheckedProfile]);

  // Reset hasCheckedProfile when account changes
  React.useEffect(() => {
    setHasCheckedProfile(false);
  }, [account]);

  const handleMenuItemClick = (component: string) => {
    setActiveComponent(component);
    // Cerrar el sidebar en móvil al hacer click en un item
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleOnboardingComplete = () => {
    completeOnboarding();
  };

  const handleOnboardingExit = () => {
    completeOnboarding();
  };

  const handleShowTutorial = () => {
    showOnboardingFlow();
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <Profile />;
      case 'skills':
        return <Skills />;
      case 'timeregistry':
        return <TimeRegistry />;
      case 'marketplace':
        return <Marketplace />;
      case 'settings':
        return <Settings />;
      case 'developertools':
        return <DeveloperTools />;
      default:
        return <Dashboard />;
    }
  };

  // Mostrar onboarding si es necesario
  if (showOnboarding || (!isConnected && !hasCompletedOnboarding)) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} onExit={handleOnboardingExit} initialStep={initialStep as any} />;
  }

  // Si está conectado pero no ha registrado perfil, sugerir ir a perfil
  if (isConnected && !hasRegisteredProfile && !isCheckingProfile) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}>
        <Box sx={{ maxWidth: 600, mx: 'auto', px: 3 }}>
          <Box sx={{ 
            bgcolor: 'white', 
            p: 4, 
            borderRadius: 3, 
            textAlign: 'center',
            boxShadow: 3
          }}>
            <Typography variant="h4" component="h1" gutterBottom color="primary">
              ¡Bienvenido a Musubi!
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Tu wallet está conectada. Para comenzar a usar Musubi, necesitas registrar tu perfil.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={goToProfileRegistration}
              sx={{ mr: 2 }}
            >
              Registrar Perfil
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleShowTutorial}
            >
              Ver Tutorial
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // Mostrar loading mientras se verifica el perfil
  if (isConnected && isCheckingProfile) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Typography variant="h5" gutterBottom>
            Verificando perfil...
          </Typography>
          <Typography variant="body1">
            Por favor espera mientras verificamos tu perfil en la blockchain.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Navbar */}
      <Navbar onMenuClick={handleDrawerToggle} />
      
      {/* Sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #e0e0e0',
            boxShadow: 3,
          },
        }}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2, px: 1 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleMenuItemClick(item.component)}
                sx={{
                  backgroundColor: activeComponent === item.component ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                  mb: 0.5,
                  mx: 1,
                  borderRadius: 2,
                  minHeight: 48,
                }}
              >
                <ListItemIcon sx={{ 
                  color: activeComponent === item.component ? 'primary.main' : 'text.secondary',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    color: activeComponent === item.component ? 'primary.main' : 'text.primary',
                    fontWeight: activeComponent === item.component ? 600 : 400,
                    '& .MuiListItemText-primary': {
                      fontSize: '0.95rem',
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Contenido principal */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 },
          width: '100%',
          minHeight: '100vh',
          backgroundColor: '#fafafa'
        }}
      >
        <Toolbar />
        <Box sx={{ 
          maxWidth: '100%',
          mx: 'auto',
          minHeight: 'calc(100vh - 64px)'
        }}>
          {renderComponent()}
        </Box>
      </Box>

      {/* Botón flotante para tutorial */}
      <Fab
        color="secondary"
        aria-label="tutorial"
        onClick={handleShowTutorial}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <HelpIcon />
      </Fab>
    </Box>
  );
};

// Componente principal con providers
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <Web3Provider>
          <OnboardingProvider>
            <KRMProvider>
              <div className="App">
                <AppContent />
                <NotificationContainer />
              </div>
            </KRMProvider>
          </OnboardingProvider>
        </Web3Provider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;

