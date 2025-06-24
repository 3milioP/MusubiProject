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
  DialogActions,
  Checkbox,
  Divider
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import WarningIcon from '@mui/icons-material/Warning';
import { useWeb3 } from '../contexts/Web3Context';
import { useProfile } from '../hooks/useContracts';
import { formatAddress } from '../utils/blockchain';

const Profile = () => {
  const { isConnected, account, provider, signer } = useWeb3();
  const { profile, loading, txState, registerProfile, updateProfile, clearTxState, loadProfile } = useProfile();
  
  const [editMode, setEditMode] = useState(false);
  const [profileType, setProfileType] = useState<'individual' | 'company'>('individual');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    skills: [] as string[]
  });
  const [acceptDisclaimer, setAcceptDisclaimer] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

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
    } else {
      // Si no hay perfil, permitir edición para el primer registro
      setEditMode(true);
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
    if (!isConnected || !provider || !signer) {
      setSnackbar({
        open: true,
        message: 'Wallet no conectada o datos de conexión incompletos. Por favor, reconecta tu wallet.',
        severity: 'error'
      });
      return;
    }

    try {
      // Validar campos requeridos
      if (!formData.name.trim()) {
        setSnackbar({
          open: true,
          message: 'El nombre es obligatorio',
          severity: 'error'
        });
        return;
      }

      if (!formData.bio.trim()) {
        setSnackbar({
          open: true,
          message: 'La descripción es obligatoria',
          severity: 'error'
        });
        return;
      }

      // Si es un nuevo perfil, validar que se aceptó el disclaimer
      if (!profile && !acceptDisclaimer) {
        setSnackbar({
          open: true,
          message: 'Debes aceptar el disclaimer para continuar',
          severity: 'error'
        });
        return;
      }

      // Preparar datos del perfil para IPFS
      const profileData = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        website: formData.website.trim(),
        skills: formData.skills,
        profile_type: profileType,
        wallet_address: account,
        created_at: profile ? new Date().toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Almacenar en IPFS a través de la API
      const response = await fetch('http://localhost:5003/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          email: `${account}@musubi.local`, // Email temporal basado en wallet
          profile_type: profileType,
          skills: profileData.skills,
          description: profileData.bio
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error almacenando datos en IPFS');
      }

      // Usar el hash IPFS como metadataURI
      const metadataURI = `ipfs://${result.ipfs_hash}`;
      
      if (profile) {
        await updateProfile(formData.name.trim(), formData.bio.trim(), metadataURI);
      } else {
        const profileTypeNumber = profileType === 'company' ? 1 : 0;
        await registerProfile(
          formData.name.trim(),
          formData.bio.trim(),
          metadataURI,
          profileTypeNumber,
          acceptDisclaimer
        );
      }
      
      // Recargar el perfil después de guardar
      await loadProfile();
      setEditMode(false);
      
      // Mostrar mensaje de éxito con información de IPFS
      setSnackbar({
        open: true,
        message: `${profile ? 'Perfil actualizado' : 'Perfil registrado'} exitosamente. Datos almacenados en IPFS: ${result.ipfs_hash}`,
        severity: 'success'
      });

      // Log para debugging
      console.log('Perfil guardado:', {
        profileData,
        ipfsHash: result.ipfs_hash,
        blockchainTx: result.blockchain_tx
      });

    } catch (error) {
      console.error('Error saving profile:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al guardar el perfil',
        severity: 'error'
      });
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

  // Si está conectada pero no tiene provider o signer, mostrar mensaje de error
  if (isConnected && (!provider || !signer)) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Mi Perfil
        </Typography>
        <Alert severity="error">
          Error de conexión: La wallet está conectada pero faltan datos de conexión. Por favor, reconecta tu wallet.
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
            onClick={handleSave}
            disabled={txState.loading || !acceptDisclaimer || !formData.name.trim() || !formData.bio.trim()}
            startIcon={<SaveIcon />}
          >
            {txState.loading ? <CircularProgress size={20} /> : 'Registrar Perfil'}
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : !profile ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No tienes un perfil registrado. Completa la información a continuación para crear tu primer perfil.
        </Alert>
      ) : null}
      
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
                    required
                    label={profileType === 'company' ? 'Nombre de la Empresa' : 'Nombre Completo'}
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    disabled={!editMode}
                    error={!profile && !formData.name.trim()}
                    helperText={!profile && !formData.name.trim() ? 'El nombre es obligatorio' : ''}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={3}
                    label="Descripción"
                    value={formData.bio}
                    onChange={handleInputChange('bio')}
                    disabled={!editMode}
                    placeholder="Cuéntanos sobre ti o tu empresa..."
                    error={!profile && !formData.bio.trim()}
                    helperText={!profile && !formData.bio.trim() ? 'La descripción es obligatoria' : ''}
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

          {/* Disclaimer para nuevos registros */}
          {!profile && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="warning.main">
                    Disclaimer Legal
                  </Typography>
                </Box>
                
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Importante:</strong> Al registrar tu perfil en Musubi, aceptas que:
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                    <Typography variant="body2" component="li">
                      Tu perfil quedará asociado permanentemente a tu dirección de wallet
                    </Typography>
                    <Typography variant="body2" component="li">
                      Los datos se almacenan en la blockchain de forma inmutable
                    </Typography>
                    <Typography variant="body2" component="li">
                      Eres responsable de la veracidad de la información proporcionada
                    </Typography>
                    <Typography variant="body2" component="li">
                      Musubi es un prototipo y no garantiza la disponibilidad del servicio
                    </Typography>
                  </Box>
                </Alert>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptDisclaimer}
                      onChange={(e) => setAcceptDisclaimer(e.target.checked)}
                      color="warning"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      He leído y acepto el disclaimer legal
                    </Typography>
                  }
                />
              </CardContent>
            </Card>
          )}
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
                  No tienes un perfil registrado aún. Completa el formulario y acepta el disclaimer para crear uno.
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
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;

