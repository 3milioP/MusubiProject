import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import { useWeb3 } from '../contexts/Web3Context';

const Settings = () => {
  const { account, isConnected, chainId, balance, connectWallet, disconnectWallet } = useWeb3();
  const [language, setLanguage] = useState('es');
  const [openDialog, setOpenDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Configuraciones locales (en una app real, estas se guardarían en localStorage o backend)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false
  });
  
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    skillsVisible: true,
    experienceVisible: true
  });

  useEffect(() => {
    // Cargar configuraciones desde localStorage
    const savedLanguage = localStorage.getItem('musubi_language');
    const savedNotifications = localStorage.getItem('musubi_notifications');
    const savedPrivacy = localStorage.getItem('musubi_privacy');

    if (savedLanguage) setLanguage(savedLanguage);
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedPrivacy) setPrivacy(JSON.parse(savedPrivacy));
  }, []);

  const handleLanguageChange = (event: any) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    localStorage.setItem('musubi_language', newLanguage);
  };

  const handleNotificationChange = (type: keyof typeof notifications) => {
    const newNotifications = {
      ...notifications,
      [type]: !notifications[type]
    };
    setNotifications(newNotifications);
    localStorage.setItem('musubi_notifications', JSON.stringify(newNotifications));
  };

  const handlePrivacyChange = (type: keyof typeof privacy) => {
    const newPrivacy = {
      ...privacy,
      [type]: !privacy[type]
    };
    setPrivacy(newPrivacy);
    localStorage.setItem('musubi_privacy', JSON.stringify(newPrivacy));
  };

  const handleCopyAddress = async () => {
    if (account) {
      try {
        await navigator.clipboard.writeText(account);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Error copying address:', err);
      }
    }
  };

  const handleViewOnExplorer = () => {
    if (account) {
      // Para red local, no hay explorer, pero en mainnet sería etherscan.io
      const explorerUrl = chainId === 31337 
        ? `#` // Red local no tiene explorer
        : `https://etherscan.io/address/${account}`;
      
      if (chainId !== 31337) {
        window.open(explorerUrl, '_blank');
      }
    }
  };

  const handleDeleteAccount = () => {
    setOpenDialog(true);
  };

  const confirmDeleteAccount = () => {
    // En una app real, esto eliminaría los datos del usuario del backend
    // Por ahora solo limpiamos localStorage y desconectamos wallet
    localStorage.removeItem('musubi_language');
    localStorage.removeItem('musubi_notifications');
    localStorage.removeItem('musubi_privacy');
    disconnectWallet();
    setOpenDialog(false);
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 3: return 'Ropsten Testnet';
      case 4: return 'Rinkeby Testnet';
      case 5: return 'Goerli Testnet';
      case 31337: return 'Hardhat Local';
      default: return `Red ${chainId}`;
    }
  };

  const getNetworkColor = (chainId: number) => {
    switch (chainId) {
      case 1: return 'success';
      case 31337: return 'info';
      default: return 'warning';
    }
  };

  if (!isConnected) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Configuración
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Por favor conecta tu wallet para acceder a la configuración.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={connectWallet}
          sx={{ mt: 2 }}
        >
          Conectar Wallet
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Configuración
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Wallet
                </Typography>
              </Box>
              
              <Alert severity="success" sx={{ mb: 2 }}>
                Tu wallet está conectada y verificada
              </Alert>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Dirección:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ 
                    fontFamily: 'monospace', 
                    bgcolor: 'grey.100', 
                    p: 1, 
                    borderRadius: 1,
                    wordBreak: 'break-all',
                    flexGrow: 1
                  }}>
                    {account}
                  </Typography>
                  <Tooltip title={copySuccess ? "¡Copiado!" : "Copiar dirección"}>
                    <IconButton size="small" onClick={handleCopyAddress}>
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                  {chainId !== 31337 && (
                    <Tooltip title="Ver en explorador">
                      <IconButton size="small" onClick={handleViewOnExplorer}>
                        <LaunchIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Red:
                </Typography>
                <Chip 
                  label={getNetworkName(chainId || 0)}
                  color={getNetworkColor(chainId || 0) as any}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Balance ETH:
                </Typography>
                <Typography variant="h6">
                  {balance ? parseFloat(balance).toFixed(4) : '0.0000'} ETH
                </Typography>
              </Box>
              
              <Button 
                variant="outlined" 
                color="error"
                onClick={disconnectWallet}
                sx={{ mt: 2 }}
              >
                Desconectar Wallet
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LanguageIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Idioma y Región
                </Typography>
              </Box>
              
              <FormControl fullWidth>
                <InputLabel>Idioma</InputLabel>
                <Select
                  value={language}
                  label="Idioma"
                  onChange={handleLanguageChange}
                >
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Notificaciones
                </Typography>
              </Box>
              
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Notificaciones por Email"
                    secondary="Recibir actualizaciones importantes por correo"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.email}
                      onChange={() => handleNotificationChange('email')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="Notificaciones Push"
                    secondary="Alertas en tiempo real en el navegador"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.push}
                      onChange={() => handleNotificationChange('push')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="Notificaciones SMS"
                    secondary="Mensajes de texto para eventos críticos"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.sms}
                      onChange={() => handleNotificationChange('sms')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VisibilityIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Privacidad
                </Typography>
              </Box>
              
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Perfil Público"
                    secondary="Permitir que otros vean tu perfil"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={privacy.profileVisible}
                      onChange={() => handlePrivacyChange('profileVisible')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="Habilidades Visibles"
                    secondary="Mostrar tus habilidades en el marketplace"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={privacy.skillsVisible}
                      onChange={() => handlePrivacyChange('skillsVisible')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="Experiencia Visible"
                    secondary="Permitir ver tu historial profesional"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={privacy.experienceVisible}
                      onChange={() => handlePrivacyChange('experienceVisible')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Seguridad
                </Typography>
              </Box>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                Las siguientes acciones son irreversibles
              </Alert>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" color="error">
                    Eliminar Datos Locales
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Eliminar configuraciones locales y desconectar wallet
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteAccount}
                >
                  Limpiar Datos
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de confirmación para eliminar datos */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>¿Eliminar datos locales?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta acción eliminará todas tus configuraciones locales y desconectará tu wallet. 
            Tus datos en la blockchain permanecerán intactos.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={confirmDeleteAccount} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;

