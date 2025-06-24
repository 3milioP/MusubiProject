import React, { useState } from 'react';
import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Fab, Button, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StoreIcon from '@mui/icons-material/Store';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import BugReportIcon from '@mui/icons-material/BugReport';

// Importar contextos y componentes
import { Web3Provider } from './contexts/Web3Context';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import { useWeb3 } from './contexts/Web3Context';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Skills from './pages/Skills';
import TimeRegistry from './pages/TimeRegistry';
import Marketplace from './pages/Marketplace';
import Settings from './pages/Settings';
import Debug from './pages/Debug';
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
});

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, component: 'dashboard' },
  { text: 'Mi Perfil', icon: <PersonIcon />, component: 'profile' },
  { text: 'Habilidades', icon: <WorkIcon />, component: 'skills' },
  { text: 'Registro de Tiempo', icon: <AccessTimeIcon />, component: 'timeregistry' },
  { text: 'Marketplace', icon: <StoreIcon />, component: 'marketplace' },
  { text: 'Configuración', icon: <SettingsIcon />, component: 'settings' },
  { text: 'Debug Blockchain', icon: <BugReportIcon />, component: 'debug' },
];

// Componente principal de la aplicación
const AppContent = () => {
  const [mobileOpen, setMobileOpen] = useState(true); // Abierto por defecto
  const [activeComponent, setActiveComponent] = useState('dashboard');
  
  const { isConnected } = useWeb3();
  const { 
    showOnboarding, 
    hasCompletedOnboarding, 
    hasRegisteredProfile,
    completeOnboarding, 
    showOnboardingFlow,
    goToProfileRegistration,
    initialStep,
    setInitialStep
  } = useOnboarding();

  // Debug: Monitorear estado de conexión
  React.useEffect(() => {
    console.log('🔍 AppContent - Estado de conexión actualizado:', {
      isConnected,
      showOnboarding,
      hasCompletedOnboarding,
      hasRegisteredProfile
    });
  }, [isConnected, showOnboarding, hasCompletedOnboarding, hasRegisteredProfile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuItemClick = (component: string) => {
    setActiveComponent(component);
    // No cerrar el sidebar automáticamente al hacer click en un item
    // El sidebar solo debe cerrarse con el botón toggle
  };

  const handleOnboardingComplete = () => {
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
      case 'debug':
        return <Debug />;
      default:
        return <Dashboard />;
    }
  };

  // Mostrar onboarding si es necesario
  if (showOnboarding || (!isConnected && !hasCompletedOnboarding)) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} initialStep={initialStep as any} />;
  }

  // Si está conectado pero no ha registrado perfil, sugerir ir a perfil
  if (isConnected && !hasRegisteredProfile) {
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

  const drawer = (
    <div>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text}
            onClick={() => handleMenuItemClick(item.component)}
            sx={{ 
              cursor: 'pointer',
              backgroundColor: activeComponent === item.component ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              }
            }}
          >
            <ListItemIcon sx={{ color: activeComponent === item.component ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ color: activeComponent === item.component ? 'primary.main' : 'inherit' }}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar onMenuClick={handleDrawerToggle} />
      
      <Box
        component="nav"
        sx={{ width: { sm: mobileOpen ? drawerWidth : 0 }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="persistent"
          open={mobileOpen}
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              transition: 'width 0.3s ease-in-out'
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            xs: '100%',
            sm: mobileOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
          },
          height: '100vh',
          overflow: 'auto',
          backgroundColor: '#f5f5f5',
          transition: 'width 0.3s ease-in-out'
        }}
      >
        <Toolbar />
        <Box sx={{ pb: 4 }}>
          {renderComponent()}
        </Box>
      </Box>

      {/* Botón flotante para mostrar tutorial */}
      {hasCompletedOnboarding && (
        <Fab
          color="primary"
          aria-label="tutorial"
          onClick={handleShowTutorial}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          <HelpIcon />
        </Fab>
      )}
    </Box>
  );
};

function App() {
  return (
    <OnboardingProvider>
      <Web3Provider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppContent />
        </ThemeProvider>
      </Web3Provider>
    </OnboardingProvider>
  );
}

export default App;

