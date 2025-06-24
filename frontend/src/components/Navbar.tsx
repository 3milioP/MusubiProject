import { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Button, 
  Box,
  Menu,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Avatar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useWeb3 } from '../contexts/Web3Context';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useKRMToken, useProfile } from '../hooks/useContracts';
import { formatAddress, getNetworkName } from '../utils/blockchain';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { 
    isConnected, 
    account, 
    chainId, 
    connecting, 
    error, 
    connectWallet, 
    disconnectWallet,
    clearError,
    provider,
    signer
  } = useWeb3();
  
  const { hasRegisteredProfile } = useOnboarding();
  const { balance } = useKRMToken();
  const { profile } = useProfile();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleWalletMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleWalletMenuClose = () => {
    setAnchorEl(null);
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    handleWalletMenuClose();
  };

  const getChainColor = (chainId: number | null): 'success' | 'warning' | 'error' => {
    if (chainId === 31337) return 'success'; // Hardhat local
    if (chainId === 1) return 'success'; // Mainnet
    return 'warning'; // Testnets
  };

  const getConnectionStatus = () => {
    if (!isConnected) return 'No conectado';
    if (!provider || !signer) return 'Error de conexión';
    return 'Conectado';
  };

  const getConnectionColor = (): 'success' | 'warning' | 'error' => {
    if (!isConnected) return 'error';
    if (!provider || !signer) return 'warning';
    return 'success';
  };

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onMenuClick}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Logo y título */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img 
              src="/musubi-logo.png" 
              alt="Musubi Logo" 
              style={{ 
                height: '32px', 
                width: '32px', 
                marginRight: '12px',
                filter: 'invert(1)' // Hacer el logo blanco en la navbar oscura
              }} 
            />
            <Typography variant="h6" component="div">
              Musubi
            </Typography>
          </Box>

          {/* Información de red */}
          {isConnected && chainId && (
            <Chip
              label={getNetworkName(chainId)}
              color={getChainColor(chainId)}
              size="small"
              sx={{ mr: 2 }}
            />
          )}

          {/* Balance de KRM */}
          {isConnected && (
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                {parseFloat(balance).toFixed(2)} KRM
              </Typography>
            </Box>
          )}

          {/* Indicador de perfil */}
          {isConnected && (hasRegisteredProfile || profile) && (
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <Chip
                icon={profile?.isCompany ? <BusinessIcon /> : <PersonIcon />}
                label={profile?.name || 'Perfil Registrado'}
                color="success"
                size="small"
                variant="outlined"
              />
            </Box>
          )}

          {/* Botón de wallet */}
          {!isConnected ? (
            <Button
              color="inherit"
              startIcon={<AccountBalanceWalletIcon />}
              onClick={handleConnectWallet}
              disabled={connecting}
              variant="outlined"
            >
              {connecting ? 'Conectando...' : 'Conectar Wallet'}
            </Button>
          ) : (
            <Button
              color="inherit"
              startIcon={<AccountBalanceWalletIcon />}
              onClick={handleWalletMenuOpen}
              variant="outlined"
            >
              {formatAddress(account || '')}
            </Button>
          )}

          {/* Menú de wallet */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleWalletMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Dirección
                </Typography>
                <Typography variant="body2">
                  {account}
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Balance KRM
                </Typography>
                <Typography variant="body2">
                  {parseFloat(balance).toFixed(4)} KRM
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Red
                </Typography>
                <Typography variant="body2">
                  {chainId ? getNetworkName(chainId) : 'Desconocida'}
                </Typography>
              </Box>
            </MenuItem>
            
            {/* Información del perfil en el menú */}
            {profile && (
              <MenuItem disabled>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Perfil
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {profile.isCompany ? <BusinessIcon sx={{ mr: 0.5, fontSize: 16 }} /> : <PersonIcon sx={{ mr: 0.5, fontSize: 16 }} />}
                    <Typography variant="body2">
                      {profile.name}
                    </Typography>
                    {profile.isVerified && <CheckCircleIcon sx={{ ml: 0.5, fontSize: 16, color: 'success.main' }} />}
                  </Box>
                </Box>
              </MenuItem>
            )}
            
            <MenuItem onClick={handleDisconnectWallet}>
              <LogoutIcon sx={{ mr: 1 }} />
              Desconectar
            </MenuItem>
          </Menu>

          {/* Estado de conexión */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={getConnectionStatus()}
              color={getConnectionColor()}
              size="small"
              variant="outlined"
            />
            {isConnected && account && (
              <Chip
                label={formatAddress(account)}
                color="primary"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Snackbar para errores */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Navbar;

