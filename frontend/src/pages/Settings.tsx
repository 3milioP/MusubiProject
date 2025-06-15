import { useState } from 'react';
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
  DialogActions
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DeleteIcon from '@mui/icons-material/Delete';

const Settings = () => {
  const [walletAddress] = useState('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
  const [language, setLanguage] = useState('es');
  const [openDialog, setOpenDialog] = useState(false);
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

  const handleLanguageChange = (event: any) => {
    setLanguage(event.target.value);
  };

  const handleNotificationChange = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handlePrivacyChange = (type: keyof typeof privacy) => {
    setPrivacy(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleDeleteAccount = () => {
    setOpenDialog(true);
  };

  const confirmDeleteAccount = () => {
    // Aquí iría la lógica para eliminar la cuenta
    console.log('Eliminando cuenta...');
    setOpenDialog(false);
  };

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
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Tu wallet está conectada y verificada
              </Alert>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Dirección actual:
              </Typography>
              <Typography variant="body2" sx={{ 
                fontFamily: 'monospace', 
                bgcolor: 'grey.100', 
                p: 1, 
                borderRadius: 1,
                wordBreak: 'break-all'
              }}>
                {walletAddress}
              </Typography>
              
              <Button variant="outlined" sx={{ mt: 2 }}>
                Cambiar Wallet
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
                    Eliminar Cuenta
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Eliminar permanentemente tu cuenta y todos los datos asociados
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteAccount}
                >
                  Eliminar Cuenta
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de confirmación para eliminar cuenta */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>¿Eliminar cuenta?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta acción eliminará permanentemente tu cuenta y todos los datos asociados. 
            No podrás recuperar esta información una vez eliminada.
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

