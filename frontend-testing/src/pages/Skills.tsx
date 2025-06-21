import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  CardActions,
  Chip,
  LinearProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import { useWeb3 } from '../contexts/Web3Context';
import { useSkills } from '../hooks/useContracts';

interface Skill {
  id: number;
  name: string;
  category: string;
  isValidated: boolean;
  validatedBy: string;
  validatedAt: number;
  declaredAt: number;
}

const Skills = () => {
  const { account, isConnected } = useWeb3();
  const { 
    userSkills, 
    loading, 
    txState, 
    createSkill, 
    declareSkill,
    loadUserSkills
  } = useSkills();

  const [openDialog, setOpenDialog] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', category: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [transactionLoading, setTransactionLoading] = useState(false);

  const categories = [
    'Desarrollo',
    'Diseño',
    'Marketing',
    'Consultoría',
    'Finanzas',
    'Educación',
    'Salud',
    'Legal',
    'Ingeniería',
    'Otros'
  ];

  useEffect(() => {
    if (isConnected && account) {
      loadUserSkills();
    }
  }, [isConnected, account, loadUserSkills]);

  const handleAddSkill = async () => {
    if (!newSkill.name.trim() || !newSkill.category) {
      setSnackbar({
        open: true,
        message: 'Por favor completa todos los campos',
        severity: 'error'
      });
      return;
    }

    if (!isConnected) {
      setSnackbar({
        open: true,
        message: 'Por favor conecta tu wallet',
        severity: 'error'
      });
      return;
    }

    setTransactionLoading(true);
    try {
      await createSkill(newSkill.name, newSkill.category);
      setSnackbar({
        open: true,
        message: 'Habilidad creada exitosamente',
        severity: 'success'
      });
      setNewSkill({ name: '', category: '' });
      setOpenDialog(false);
      // Refresh skills after successful creation
      setTimeout(() => {
        loadUserSkills();
      }, 2000);
    } catch (error: any) {
      console.error('Error creating skill:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al crear la habilidad',
        severity: 'error'
      });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleRequestValidation = async (skillId: number) => {
    if (!isConnected) {
      setSnackbar({
        open: true,
        message: 'Por favor conecta tu wallet',
        severity: 'error'
      });
      return;
    }

    setTransactionLoading(true);
    try {
      await declareSkill(skillId, 1); // Intermediate level
      setSnackbar({
        open: true,
        message: 'Habilidad declarada exitosamente',
        severity: 'success'
      });
      // Refresh skills after successful request
      setTimeout(() => {
        loadUserSkills();
      }, 2000);
    } catch (error: any) {
      console.error('Error declaring skill:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al declarar habilidad',
        severity: 'error'
      });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'No validada';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getSkillStatusColor = (skill: any) => {
    if (skill.isValidated) return 'success';
    return 'default';
  };

  const getSkillStatusIcon = (skill: any) => {
    if (skill.isValidated) return <VerifiedIcon />;
    return <PendingIcon />;
  };

  if (!isConnected) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Habilidades
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Por favor conecta tu wallet para ver y gestionar tus habilidades.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mis Habilidades
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={transactionLoading}
        >
          Declarar Habilidad
        </Button>
      </Box>

      {txState.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {txState.error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Cargando habilidades desde la blockchain...
          </Typography>
        </Box>
      ) : (
        <>
          {userSkills.length === 0 ? (
            <Card sx={{ mt: 4, textAlign: 'center', py: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  No tienes habilidades declaradas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Declara tus primeras habilidades para comenzar a construir tu perfil profesional
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                >
                  Declarar Primera Habilidad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {userSkills.map((skill) => (
                <Grid item xs={12} md={6} lg={4} key={skill.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          {skill.skill?.name || 'Habilidad'}
                        </Typography>
                        <Chip 
                          icon={getSkillStatusIcon(skill)}
                          label={skill.isValidated ? 'Validada' : 'Pendiente'}
                          color={getSkillStatusColor(skill)}
                          size="small"
                        />
                      </Box>
                      
                      <Chip 
                        label={skill.skill?.category || 'Sin categoría'} 
                        size="small" 
                        sx={{ mb: 2 }} 
                      />

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Nivel:</strong> {['Principiante', 'Intermedio', 'Avanzado'][skill.declaredLevel]}
                      </Typography>

                      {skill.isValidated && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.75rem',
                            wordBreak: 'break-all'
                          }}>
                            <strong>Validada por:</strong> {skill.validatedBy}
                          </Typography>
                        </>
                      )}
                    </CardContent>

                    <CardActions>
                      {!skill.isValidated && (
                        <Button 
                          size="small" 
                          color="primary"
                          onClick={() => handleRequestValidation(skill.skillId)}
                          disabled={transactionLoading}
                        >
                          Solicitar Validación
                        </Button>
                      )}
                      <Box sx={{ flexGrow: 1 }} />
                      <Tooltip title="Eliminar habilidad">
                        <IconButton 
                          size="small" 
                          color="error"
                          disabled={transactionLoading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Dialog para declarar nueva habilidad */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Declarar Nueva Habilidad</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre de la Habilidad"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              variant="outlined"
              sx={{ mb: 2 }}
              placeholder="ej. React, Solidity, Diseño UX..."
            />
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select 
                value={newSkill.category}
                label="Categoría"
                onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
            disabled={transactionLoading}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddSkill}
            disabled={transactionLoading}
          >
            {transactionLoading ? 'Declarando...' : 'Declarar Habilidad'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Skills;

