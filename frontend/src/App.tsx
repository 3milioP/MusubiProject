import { useState } from 'react';
import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Fab } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StoreIcon from '@mui/icons-material/Store';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';

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
];

// Componente principal de la aplicación
const AppContent = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState('dashboard');
  
  const { isConnected } = useWeb3();
  const { 
    showOnboarding, 
    hasCompletedOnboarding, 
    completeOnboarding, 
    showOnboardingFlow 
  } = useOnboarding();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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
      default:
        return <Dashboard />;
    }
  };

  // Mostrar onboarding si es necesario
  if (showOnboarding || (!isConnected && !hasCompletedOnboarding)) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  const drawer = (
    <div>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text}
            onClick={() => {
              setActiveComponent(item.component);
              setMobileOpen(false);
            }}
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
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
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
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Toolbar />
        {renderComponent()}
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

