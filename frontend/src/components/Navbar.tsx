import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Button, Avatar, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  // En un escenario real, esto vendría de un contexto de autenticación
  const isConnected = false;
  const walletAddress = '';

  const connectWallet = async () => {
    // Aquí iría la lógica para conectar con MetaMask u otro proveedor
    console.log('Conectando wallet...');
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Musubi
        </Typography>
        
        {isConnected ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <NotificationsIcon />
            </IconButton>
            <Button 
              color="inherit" 
              startIcon={<AccountCircleIcon />}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                borderRadius: 2,
                px: 2
              }}
            >
              {formatAddress(walletAddress)}
            </Button>
          </Box>
        ) : (
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={connectWallet}
            sx={{ 
              fontWeight: 'bold',
              px: 3
            }}
          >
            Conectar Wallet
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
