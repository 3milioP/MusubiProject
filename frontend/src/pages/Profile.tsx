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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
    if (profile) {
      // Usar los datos enriquecidos desde IPFS que ya vienen en el objeto profile
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        skills: profile.skills || []
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

      // Mostrar mensaje de inicio de proceso
      setSnackbar({
        open: true,
        message: 'Iniciando proceso de registro...',
        severity: 'info'
      });

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

      console.log('🔍 Iniciando registro de perfil:', {
        profileData,
        isUpdate: !!profile
      });

      // Paso 1: Almacenar en IPFS a través de la API
      setSnackbar({
        open: true,
        message: 'Almacenando datos en IPFS...',
        severity: 'info'
      });

      const response = await fetch('http://localhost:5003/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          email: `${account}@musubi.local`, // Email temporal basado en wallet
          wallet_address: account, // Agregar dirección de wallet
          profile_type: profileType === 'company' ? 'company' : 'professional',
          skills: profileData.skills,
          description: profileData.bio
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error almacenando datos en IPFS');
      }

      console.log('✅ Datos almacenados en IPFS:', {
        ipfsHash: result.ipfs_hash,
        blockchainTx: result.blockchain_tx
      });

      // Usar el hash IPFS como metadataURI (sin prefijo ipfs://)
      const metadataURI = result.ipfs_hash;
      
      // Paso 2: Registrar en blockchain
      setSnackbar({
        open: true,
        message: 'Registrando perfil en blockchain...',
        severity: 'info'
      });

      let blockchainTx;
      if (profile) {
        blockchainTx = await updateProfile(formData.name.trim(), formData.bio.trim(), metadataURI);
      } else {
        const profileTypeNumber = profileType === 'company' ? 1 : 0;
        blockchainTx = await registerProfile(
          metadataURI,
          profileTypeNumber
        );
      }

      console.log('✅ Perfil registrado en blockchain:', {
        txHash: blockchainTx?.hash,
        metadataURI
      });

      // Paso 3: Esperar confirmación de la transacción
      if (blockchainTx && blockchainTx.hash) {
        setSnackbar({
          open: true,
          message: 'Esperando confirmación de la transacción...',
          severity: 'info'
        });

        try {
          await blockchainTx.wait();
          console.log('✅ Transacción confirmada');
        } catch (txError) {
          console.warn('⚠️ Error esperando confirmación:', txError);
          // Continuar aunque no se pueda esperar la confirmación
        }
      }
      
      // Paso 4: Recargar el perfil después de guardar
      setSnackbar({
        open: true,
        message: 'Actualizando datos del perfil...',
        severity: 'info'
      });

      await loadProfile();
      setEditMode(false);
      
      // Paso 5: Mostrar mensaje de éxito final
      setSnackbar({
        open: true,
        message: `${profile ? 'Perfil actualizado' : 'Perfil registrado'} exitosamente! 🎉`,
        severity: 'success'
      });

      // Log final para debugging
      console.log('✅ Proceso de registro completado:', {
        profileData,
        ipfsHash: result.ipfs_hash,
        blockchainTx: blockchainTx?.hash || result.blockchain_tx,
        isUpdate: !!profile
      });

    } catch (error) {
      console.error('❌ Error en el proceso de registro:', error);
      
      let errorMessage = 'Error al guardar el perfil';
      
      if (error instanceof Error) {
        if (error.message.includes('IPFS')) {
          errorMessage = 'Error al almacenar datos en IPFS. Verifica que la API esté funcionando.';
        } else if (error.message.includes('blockchain') || error.message.includes('contract')) {
          errorMessage = 'Error en la transacción de blockchain. Verifica tu conexión y fondos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
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
    <Box sx={{ maxWidth: '100%' }}>
      <Box sx={{ 
        mb: { xs: 3, md: 4 }, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
          Mi Perfil
        </Typography>
        {profile && (
          <Button
            variant={editMode ? "contained" : "outlined"}
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            onClick={editMode ? handleSave : toggleEditMode}
            disabled={txState.loading}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              borderRadius: 2
            }}
          >
            {editMode ? 'Guardar Cambios' : 'Editar Perfil'}
          </Button>
        )}
      </Box>

      {/* Estado de carga */}
      {loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Cargando perfil...
          </Typography>
        </Box>
      )}

      {/* Estado de transacción */}
      {txState.loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Transacción en progreso:</strong> Procesando en la blockchain...
          </Typography>
        </Alert>
      )}

      {/* Error de transacción */}
      {txState.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Error:</strong> {txState.error}
          </Typography>
        </Alert>
      )}

      {/* Información de la wallet */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Información de Wallet
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                Dirección
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {formatAddress(account || '')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                Estado de Conexión
              </Typography>
              <Typography variant="body1">
                {isConnected ? 'Conectado' : 'No conectado'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Información básica */}
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
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Estado
                  </Typography>
                  <Typography variant="body2">
                    {profile.isActive ? 'Activo' : 'Inactivo'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Estado de IPFS y Blockchain */}
          {profile && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estado de Almacenamiento
                </Typography>
                
                {/* Estado de IPFS */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    IPFS (Datos del Perfil)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {profile.metadataURI || 'No disponible'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Datos almacenados de forma descentralizada
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Estado de Blockchain */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Blockchain (Registro)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      Perfil registrado
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Hash IPFS verificado en contrato
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Información técnica */}
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Información Técnica
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                    <strong>Contrato:</strong> ProfileRegistry
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                    <strong>Red:</strong> Local (Hardhat)
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>Verificación:</strong> Hash SHA256 en IPFSRegistry
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Datos adicionales de IPFS */}
          {profile && (profile.github || profile.linkedin || profile.hourlyRate || profile.languages?.length || profile.industry || profile.services?.length) && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Datos Adicionales (IPFS)
                </Typography>
                
                {profile.github && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      GitHub
                    </Typography>
                    <Typography variant="body2">
                      {profile.github}
                    </Typography>
                  </Box>
                )}
                
                {profile.linkedin && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      LinkedIn
                    </Typography>
                    <Typography variant="body2">
                      {profile.linkedin}
                    </Typography>
                  </Box>
                )}
                
                {profile.hourlyRate && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Tarifa por Hora
                    </Typography>
                    <Typography variant="body2">
                      {profile.hourlyRate} EUR/h
                    </Typography>
                  </Box>
                )}
                
                {profile.languages && profile.languages.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Idiomas
                    </Typography>
                    <Typography variant="body2">
                      {profile.languages.join(', ')}
                    </Typography>
                  </Box>
                )}
                
                {profile.industry && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Industria
                    </Typography>
                    <Typography variant="body2">
                      {profile.industry}
                    </Typography>
                  </Box>
                )}
                
                {profile.size && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Tamaño
                    </Typography>
                    <Typography variant="body2">
                      {profile.size}
                    </Typography>
                  </Box>
                )}
                
                {profile.founded && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Fundada
                    </Typography>
                    <Typography variant="body2">
                      {profile.founded}
                    </Typography>
                  </Box>
                )}
                
                {profile.services && profile.services.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Servicios
                    </Typography>
                    <Typography variant="body2">
                      {profile.services.join(', ')}
                    </Typography>
                  </Box>
                )}
                
                {profile.availability && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Disponibilidad
                    </Typography>
                    <Typography variant="body2">
                      {profile.availability}
                    </Typography>
                  </Box>
                )}
                
                {profile.project && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Proyecto
                    </Typography>
                    <Typography variant="body2">
                      {profile.project}
                    </Typography>
                  </Box>
                )}
                
                {profile.budget && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Presupuesto
                    </Typography>
                    <Typography variant="body2">
                      {profile.budget}
                    </Typography>
                  </Box>
                )}
                
                {profile.timeline && (
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Timeline
                    </Typography>
                    <Typography variant="body2">
                      {profile.timeline}
                    </Typography>
                  </Box>
                )}
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

