import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Grid
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Person,
  Business,
  Warning,
  CheckCircle,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';
import { useWeb3 } from '../../contexts/Web3Context';
import { useProfile } from '../../hooks/useContracts';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { debugWeb3State, debugProfileRegistryContract, simulateProfileRegistration } from '../../utils/debugWeb3';

interface ProfileRegistrationProps {
  onComplete: () => void;
  onSkip: () => void;
  onRestartTutorial?: () => void;
}

const steps = ['Información Básica', 'Disclaimer Legal', 'Confirmación'];

const ProfileRegistration: React.FC<ProfileRegistrationProps> = ({ onComplete, onSkip, onRestartTutorial }) => {
  const { isConnected, account, provider, signer, connectWallet, clearInconsistentState } = useWeb3();
  const { registerProfile, loadProfile, txState } = useProfile();
  const { markProfileRegistered } = useOnboarding();
  
  console.log('🔍 ProfileRegistration - Renderizado con estado:', {
    isConnected,
    account,
    provider: !!provider,
    signer: !!signer,
    txState
  });

  const [activeStep, setActiveStep] = useState(0);
  const [profileType, setProfileType] = useState<'individual' | 'company'>('individual');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: ''
  });
  const [acceptDisclaimer, setAcceptDisclaimer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Debug: Monitorear estado de conexión
  useEffect(() => {
    console.log('🔍 ProfileRegistration - Renderizado con estado:', {
      isConnected,
      account,
      provider: !!provider,
      signer: !!signer,
      txState
    });
  }, [isConnected, account, provider, signer, txState]);

  const handleProfileTypeChange = (event: SelectChangeEvent) => {
    setProfileType(event.target.value as 'individual' | 'company');
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validar información básica
      if (!formData.name.trim()) {
        setError('El nombre es obligatorio');
        return;
      }
      if (!formData.bio.trim()) {
        setError('La descripción es obligatoria');
        return;
      }
      setError(null);
    } else if (activeStep === 1) {
      // Validar disclaimer
      if (!acceptDisclaimer) {
        setError('Debes aceptar el disclaimer para continuar');
        return;
      }
      setError(null);
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError(null);
  };

  const handleRegister = async () => {
    if (!acceptDisclaimer) {
      setError('Debes aceptar el disclaimer para continuar');
      return;
    }

    if (!formData.name.trim() || !formData.bio.trim()) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    setError('');
    setIsRegistering(true);

    try {
      // Subir datos reales a la API para almacenarlos en IPFS
      const response = await fetch('http://localhost:5003/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: `${account}@musubi.local`, // Email temporal basado en wallet
          profile_type: profileType === 'company' ? 'company' : 'professional',
          skills: [], // Puedes agregar skills si están en el formulario
          description: formData.bio.trim(),
          location: formData.location,
          website: formData.website,
          wallet_address: account
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Error almacenando datos en IPFS');
      }

      console.log('🔍 Respuesta de la API:', result);
      console.log('🔍 Tipo de ipfs_hash:', typeof result.ipfs_hash);
      console.log('🔍 Valor de ipfs_hash:', result.ipfs_hash);

      // Usar el hash IPFS real como metadataURI (sin prefijo ipfs://)
      const metadataURI = result.ipfs_hash;
      const profileTypeNumber = profileType === 'company' ? 1 : 0;

      console.log('🔍 Enviando al contrato:', {
        metadataURI,
        profileTypeNumber,
        metadataURIType: typeof metadataURI
      });

      await registerProfile(
        metadataURI,
        profileTypeNumber
      );

      // Recargar perfil y marcar como registrado
      await loadProfile();
      markProfileRegistered();
      onComplete();
    } catch (error) {
      console.error('Error registering profile:', error);
      setError(error instanceof Error ? error.message : 'Error al registrar el perfil');
    } finally {
      setIsRegistering(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Información de tu Perfil
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Completa la información básica de tu perfil. Esta información quedará registrada en la blockchain.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Perfil</InputLabel>
                  <Select
                    value={profileType}
                    label="Tipo de Perfil"
                    onChange={handleProfileTypeChange}
                  >
                    <MenuItem value="individual">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1 }} />
                        Individual
                      </Box>
                    </MenuItem>
                    <MenuItem value="company">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Business sx={{ mr: 1 }} />
                        Empresa
                      </Box>
                    </MenuItem>
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
                  error={!formData.name.trim()}
                  helperText={!formData.name.trim() ? 'El nombre es obligatorio' : ''}
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
                  placeholder="Cuéntanos sobre ti o tu empresa..."
                  error={!formData.bio.trim()}
                  helperText={!formData.bio.trim() ? 'La descripción es obligatoria' : ''}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ubicación"
                  value={formData.location}
                  onChange={handleInputChange('location')}
                  placeholder="Ciudad, País"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Sitio Web"
                  value={formData.website}
                  onChange={handleInputChange('website')}
                  placeholder="https://..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Disclaimer Legal
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 3 }}>
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
                <Typography variant="body2" component="li">
                  No se puede eliminar o modificar la información una vez registrada
                </Typography>
              </Box>
            </Alert>

            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>Dirección de Wallet:</strong> {account}
              </Typography>
            </Card>

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
                  He leído y acepto el disclaimer legal. Entiendo que mi perfil quedará asociado permanentemente a mi wallet.
                </Typography>
              }
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirmar Registro
            </Typography>
            
            <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Resumen de tu perfil:
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Tipo de Perfil
                </Typography>
                <Typography variant="body1">
                  {profileType === 'company' ? 'Empresa' : 'Individual'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Nombre
                </Typography>
                <Typography variant="body1">
                  {formData.name}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Descripción
                </Typography>
                <Typography variant="body1">
                  {formData.bio}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Wallet
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {account}
                </Typography>
              </Box>
            </Card>

            <Alert severity="info">
              <Typography variant="body2">
                Al confirmar, se realizará una transacción en la blockchain para registrar tu perfil. 
                Esta acción no se puede deshacer.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}>
        <Box sx={{ maxWidth: 600, mx: 'auto', px: 3 }}>
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Wallet No Conectada
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Para registrar tu perfil, primero debes conectar tu wallet MetaMask.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" onClick={connectWallet}>
                Conectar Wallet
              </Button>
              <Button variant="outlined" onClick={onRestartTutorial || onSkip}>
                Volver a ver el tutorial
              </Button>
            </Box>
          </Card>
        </Box>
      </Box>
    );
  }

  // Si está conectada pero no tiene provider o signer, mostrar mensaje de error
  if (isConnected && (!provider || !signer)) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}>
        <Box sx={{ maxWidth: 600, mx: 'auto', px: 3 }}>
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Error de Conexión
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              La wallet está conectada pero faltan datos de conexión. Por favor, reconecta tu wallet.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={connectWallet}>
                Reconectar Wallet
              </Button>
              <Button variant="outlined" onClick={clearInconsistentState} color="warning">
                Limpiar Estado
              </Button>
              <Button variant="outlined" onClick={onRestartTutorial || onSkip}>
                Volver a ver el tutorial
              </Button>
            </Box>
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      py: 4
    }}>
      <Box sx={{ maxWidth: 800, mx: 'auto', px: 3, width: '100%' }}>
        <Card sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom color="primary">
              Registro de Perfil
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Último paso: Crea tu perfil en Musubi
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Step Content */}
          <Box sx={{ mb: 4 }}>
            {renderStepContent(activeStep)}
          </Box>

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Anterior
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={onRestartTutorial || onSkip}
              >
                Volver a ver el tutorial
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleRegister}
                  disabled={isRegistering || txState.loading}
                  startIcon={isRegistering || txState.loading ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {isRegistering || txState.loading ? 'Registrando...' : 'Registrar Perfil'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  Siguiente
                </Button>
              )}
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default ProfileRegistration; 