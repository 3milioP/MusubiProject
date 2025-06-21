import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import { useWeb3 } from '../contexts/Web3Context';
import { useProfile } from '../hooks/useContracts';
import { formatAddress } from '../utils/blockchain';

const Profile = () => {
  const { isConnected, account } = useWeb3();
  const { profile, loading, txState, registerProfile, updateProfile, clearTxState } = useProfile();
  
  const [editMode, setEditMode] = useState(false);
  const [profileType, setProfileType] = useState<'individual' | 'company'>('individual');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    skills: [] as string[]
  });
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // Cargar datos del perfil existente
  useEffect(() => {
    if (profile && profile.metadataURI) {
      // En una implementación real, aquí cargarías los datos desde IPFS o un servidor
      // Por ahora, usamos datos de ejemplo
      setFormData({
        name: profile.isCompany ? 'Mi Empresa' : 'Mi Nombre',
        bio: 'Descripción del perfil...',
        location: 'Ciudad, País',
        website: 'https://mi-sitio.com',
        skills: ['JavaScript', 'React', 'Blockchain']
      });
      setProfileType(profile.isCompany ? 'company' : 'individual');
    }
  }, [profile]);

  const handleProfileTypeChange = (event: SelectChangeEvent) => {
    setProfileType(event.target.value as 'individual' | 'company');
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleSave = async () => {
    if (!isConnected) return;

    try {
      // En una implementación real, aquí subirías los datos a IPFS
      const metadataURI = `ipfs://example-hash-${Date.now()}`;
      
      if (profile) {
        await updateProfile(metadataURI);
      } else {
        await registerProfile(profileType === 'company', metadataURI);
      }
      
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleRegisterProfile = () => {
    setShowRegisterDialog(true);
  };

  const confirmRegisterProfile = async () => {
    setShowRegisterDialog(false);
    await handleSave();
  };

  if (!isConnected) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Mi Perfil
        </Typography>
        <Alert severity="warning">
          Por favor, conecta tu wallet para ver y editar tu perfil.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mi Perfil
        </Typography>
        {profile ? (
          <Button 
            variant="contained" 
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            onClick={editMode ? handleSave : toggleEditMode}
            disabled={txState.loading}
          >
            {txState.loading ? <CircularProgress size={20} /> : (editMode ? 'Guardar' : 'Editar')}
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleRegisterProfile}
            disabled={txState.loading}
          >
            {txState.loading ? <CircularProgress size={20} /> : 'Registrar Perfil'}
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Información básica */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información Básica
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Dirección de Wallet
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {account}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editMode}>
                      <InputLabel>Tipo de Perfil</InputLabel>
                      <Select
                        value={profileType}
                        label="Tipo de Perfil"
                        onChange={handleProfileTypeChange}
                      >
                        <MenuItem value="individual">Individual</MenuItem>
                        <MenuItem value="company">Empresa</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={profileType === 'company' ? 'Nombre de la Empresa' : 'Nombre Completo'}
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      disabled={!editMode}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Biografía"
                      value={formData.bio}
                      onChange={handleInputChange('bio')}
                      disabled={!editMode}
                      placeholder="Cuéntanos sobre ti o tu empresa..."
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Ubicación"
                      value={formData.location}
                      onChange={handleInputChange('location')}
                      disabled={!editMode}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Sitio Web"
                      value={formData.website}
                      onChange={handleInputChange('website')}
                      disabled={!editMode}
                      placeholder="https://..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Estado del perfil */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estado del Perfil
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {profileType === 'company' ? <BusinessIcon sx={{ mr: 1 }} /> : <PersonIcon sx={{ mr: 1 }} />}
                    <Typography variant="body2">
                      {profileType === 'company' ? 'Empresa' : 'Individual'}
                    </Typography>
                  </Box>
                </Box>

                {profile ? (
                  <Box>
                    <FormControlLabel
                      control={<Switch checked={profile.isActive} disabled />}
                      label="Perfil Activo"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Tu perfil está registrado en la blockchain
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="info">
                    No tienes un perfil registrado aún. Haz clic en "Registrar Perfil" para crear uno.
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Estadísticas del perfil */}
            {profile && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estadísticas
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Dirección Corta
                    </Typography>
                    <Typography variant="body2">
                      {formatAddress(account || '')}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Tipo
                    </Typography>
                    <Typography variant="body2">
                      {profile.isCompany ? 'Empresa' : 'Individual'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Estado
                    </Typography>
                    <Typography variant="body2" color={profile.isActive ? 'success.main' : 'error.main'}>
                      {profile.isActive ? 'Activo' : 'Inactivo'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* Dialog de confirmación para registro */}
      <Dialog open={showRegisterDialog} onClose={() => setShowRegisterDialog(false)}>
        <DialogTitle>Registrar Perfil</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres registrar tu perfil como {profileType === 'company' ? 'empresa' : 'individual'}?
            Esta acción requerirá una transacción en la blockchain.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRegisterDialog(false)}>Cancelar</Button>
          <Button onClick={confirmRegisterProfile} variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={txState.success}
        autoHideDuration={6000}
        onClose={clearTxState}
      >
        <Alert onClose={clearTxState} severity="success" sx={{ width: '100%' }}>
          {profile ? 'Perfil actualizado exitosamente' : 'Perfil registrado exitosamente'}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!txState.error}
        autoHideDuration={6000}
        onClose={clearTxState}
      >
        <Alert onClose={clearTxState} severity="error" sx={{ width: '100%' }}>
          {txState.error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;

