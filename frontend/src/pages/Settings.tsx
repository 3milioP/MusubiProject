import React, { useState } from 'react';
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
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DeleteIcon from '@mui/icons-material/Delete';

const Settings = () => {
  const [walletAddress, setWalletAddress] = useState('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
  const [language, setLanguage] = useState('es');
  const [openDialog, setOpenDialog] = useState(false);
  
  // Estado simulado para un MVP
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: 'public',
    twoFactorAuth: false,
    darkMode: false
  });

  const handleSettingChange = (setting: string, value: any) => {
    setSettings({
      ...settings,
      [setting]: value
    });
  };

  const handleLanguageChange = (event: any) => {
    setLanguage(event.target.value);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const disconnectWallet = () => {
    // Aquí iría la lógica para desconectar wallet
    console.log('Desconectando wallet');
    setOpenDialog(false);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Configuración
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona tus preferencias y configuración de cuenta
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cuenta
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <AccountBalanceWalletIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Wallet conectada" 
                    secondary={walletAddress}
                  />
                  <ListItemSecondaryAction>
                    <Button 
                      variant="outlined" 
                      color="error"
                      size="small"
                      onClick={handleOpenDialog}
                    >
                      Desconectar
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <LanguageIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Idioma" 
                    secondary="Selecciona tu idioma preferido"
                  />
                  <ListItemSecondaryAction>
                    <FormControl sx={{ minWidth: 120 }}>
                      <Select
                        value={language}
                        onChange={handleLanguageChange}
                        size="small"
                      >
                        <MenuItem value="es">Español</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="fr">Français</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItemSecondaryAction>
                </ListItem>
                
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Autenticación de dos factores" 
                    secondary="Aumenta la seguridad de tu cuenta"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <DeleteIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Eliminar cuenta" 
                    secondary="Elimina permanentemente tu cuenta y datos"
                  />
                  <ListItemSecondaryAction>
                    <Button 
                      variant="outlined" 
                      color="error"
                      size="small"
                    >
                      Eliminar
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Apariencia
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Modo oscuro" 
                    secondary="Cambia entre tema claro y oscuro"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.darkMode}
                      onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Privacidad
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <VisibilityIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Visibilidad del perfil" 
                    secondary="Controla quién puede ver tu perfil"
                  />
                  <ListItemSecondaryAction>
                    <FormControl sx={{ minWidth: 120 }}>
                      <Select
                        value={settings.profileVisibility}
                        onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                        size="small"
                      >
                        <MenuItem value="public">Público</MenuItem>
                        <MenuItem value="contacts">Solo contactos</MenuItem>
                        <MenuItem value="private">Privado</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Tus datos personales están protegidos y solo se almacenan en la blockchain los datos necesarios para el funcionamiento del sistema.
              </Alert>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notificaciones
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <NotificationsIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Notificaciones por email" 
                    secondary="Recibe actualizaciones importantes por email"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <NotificationsIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Notificaciones push" 
                    secondary="Recibe notificaciones en tiempo real"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogo para desconectar wallet */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Desconectar Wallet</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas desconectar tu wallet? Necesitarás volver a conectarla para acceder a todas las funcionalidades de Musubi.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={disconnectWallet} color="error">
            Desconectar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
