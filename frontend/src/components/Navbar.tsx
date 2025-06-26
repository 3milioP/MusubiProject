import { useState, useEffect } from 'react';
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
  Avatar,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useWeb3 } from '../contexts/Web3Context';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useKRM } from '../contexts/KRMContext';
import { useProfile } from '../hooks/useContracts';
import { formatAddress, getNetworkName } from '../utils/blockchain';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
  const { balance, loadBalance } = useKRM();
  const { profile, loadProfile } = useProfile();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Debug logs
  console.log('🔍 Navbar Debug:', {
    isConnected,
    account,
    profile,
    hasRegisteredProfile,
    profileName: profile?.name,
    profileType: typeof profile?.name,
    profileAddress: profile?.address,
    accountMatch: account === profile?.address
  });

  // Cargar perfil automáticamente
  useEffect(() => {
    if (isConnected && account && loadProfile) {
      console.log('🔍 Navbar - Cargando perfil para:', account);
      loadProfile();
    }
  }, [isConnected, account, loadProfile]);

  // Log específico para debuggear el balance en el Navbar
  console.log('💰 Navbar - Balance del contexto KRM:', {
    balance,
    isConnected,
    account
  });

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
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#1976d2',
          boxShadow: 2
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
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
                filter: 'invert(1)', // Hacer el logo blanco en la navbar oscura
                objectFit: 'contain'
              }} 
              onError={(e) => {
                console.log('❌ Error cargando logo:', e);
                // Fallback a texto si el logo no carga
                e.currentTarget.style.display = 'none';
              }}
            />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Musubi
            </Typography>
          </Box>

          {/* Información de red - Solo en desktop */}
          {isConnected && chainId && !isMobile && (
            <Chip
              label={getNetworkName(chainId)}
              color="success"
              size="small"
              sx={{ 
                mr: 2,
                backgroundColor: '#4caf50',
                color: 'white',
                '& .MuiChip-label': {
                  color: 'white'
                }
              }}
            />
          )}

          {/* Balance de KRM - Solo en desktop */}
          {isConnected && !isMobile && (
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1, fontWeight: 500 }}>
                {balance && parseFloat(balance) >= 0 ? `${parseFloat(balance).toFixed(2)} KRM` : '0.00 KRM'}
              </Typography>
            </Box>
          )}

          {/* Indicador de perfil - Solo en desktop */}
          {isConnected && (hasRegisteredProfile || profile) && !isMobile && (
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <Chip
                icon={profile?.isCompany ? <BusinessIcon /> : <PersonIcon />}
                label={profile?.name || (hasRegisteredProfile ? `Perfil ${account?.slice(0, 6)}...` : 'Sin Perfil')}
                color="success"
                size="small"
                sx={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  '& .MuiChip-label': {
                    color: 'white'
                  },
                  '& .MuiChip-icon': {
                    color: 'white'
                  }
                }}
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
              sx={{ 
                ml: 2,
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {connecting ? 'Conectando...' : 'Conectar Wallet'}
            </Button>
          ) : (
            <Tooltip title="Información de la wallet">
              <Button
                color="inherit"
                startIcon={<AccountBalanceWalletIcon />}
                onClick={handleWalletMenuOpen}
                variant="outlined"
                sx={{ 
                  ml: 2,
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                {isMobile ? formatAddress(account || '').slice(0, 8) + '...' : formatAddress(account || '')}
              </Button>
            </Tooltip>
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
            PaperProps={{
              sx: {
                minWidth: 280,
                mt: 1,
                boxShadow: 3
              }
            }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Dirección
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {account}
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Balance KRM
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
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

