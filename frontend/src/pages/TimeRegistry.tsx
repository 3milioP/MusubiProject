import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import BusinessIcon from '@mui/icons-material/Business';
import { useWeb3 } from '../contexts/Web3Context';
import { useTimeRegistry, useSkills } from '../hooks/useContracts';
import { ProfessionalSkill } from '../types';

interface TimeRecord {
  id: number;
  worker: string;
  company: string;
  skillId: number;
  skillName: string;
  description: string;
  duration: number;
  timestamp: number;
  isValidated: boolean;
  validatedBy: string;
  validatedAt: number;
}

const TimeRegistry = () => {
  const { account, isConnected } = useWeb3();
  const { 
    timeRecords, 
    loading, 
    txState, 
    registerTime, 
    validateTimeRecord,
    loadTimeRecords
  } = useTimeRegistry();
  
  const { userSkills, loadUserSkills } = useSkills();

  const [openDialog, setOpenDialog] = useState(false);
  const [newRecord, setNewRecord] = useState({
    company: '',
    skillId: 0,
    description: '',
    duration: 0
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [transactionLoading, setTransactionLoading] = useState(false);

  // Cargar skills del usuario
  useEffect(() => {
    if (isConnected && account) {
      loadUserSkills(account);
    }
  }, [isConnected, account, loadUserSkills]);

  useEffect(() => {
    if (isConnected && account) {
      loadTimeRecords();
    }
  }, [isConnected, account, loadTimeRecords]);

  const handleCreateRecord = async () => {
    if (!newRecord.company.trim() || !newRecord.description.trim() || newRecord.duration <= 0 || newRecord.skillId === 0) {
      setSnackbar({
        open: true,
        message: 'Por favor completa todos los campos correctamente, incluyendo la skill',
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

    // Verificar que el usuario tiene la skill seleccionada
    const selectedSkill = userSkills.find(skill => skill.skillId === newRecord.skillId);
    if (!selectedSkill || !selectedSkill.isValidated) {
      setSnackbar({
        open: true,
        message: 'Debes seleccionar una skill que tengas validada',
        severity: 'error'
      });
      return;
    }

    setTransactionLoading(true);
    try {
      await registerTime(
        newRecord.company,
        newRecord.skillId,
        Math.floor(Date.now() / 1000), // startTime en segundos
        Math.floor((Date.now() + (newRecord.duration * 3600000)) / 1000), // endTime en segundos
        newRecord.description
      );
      setSnackbar({
        open: true,
        message: `Registro de tiempo creado exitosamente para ${selectedSkill.name}`,
        severity: 'success'
      });
      setNewRecord({ company: '', skillId: 0, description: '', duration: 0 });
      setOpenDialog(false);
      // Refresh records after successful creation
      setTimeout(() => {
        loadTimeRecords();
      }, 2000);
    } catch (error: any) {
      console.error('Error creating time record:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al crear el registro de tiempo',
        severity: 'error'
      });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleValidateRecord = async (recordId: number) => {
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
      await validateTimeRecord(recordId);
      setSnackbar({
        open: true,
        message: 'Registro validado exitosamente',
        severity: 'success'
      });
      // Refresh records after successful validation
      setTimeout(() => {
        loadTimeRecords();
      }, 2000);
    } catch (error: any) {
      console.error('Error validating time record:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al validar el registro',
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
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours} h`;
  };

  const getStatusColor = (record: TimeRecord) => {
    if (record.isValidated) return 'success';
    return 'warning';
  };

  const getStatusIcon = (record: TimeRecord) => {
    if (record.isValidated) return <CheckCircleIcon />;
    return <PendingIcon />;
  };

  const getStatusText = (record: TimeRecord) => {
    if (record.isValidated) return 'Validado';
    return 'Pendiente';
  };

  const totalHours = timeRecords.reduce((sum, record) => sum + record.duration, 0);
  const validatedHours = timeRecords.filter(record => record.isValidated).reduce((sum, record) => sum + record.duration, 0);
  const pendingHours = totalHours - validatedHours;

  if (!isConnected) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Registro de Tiempo
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Por favor conecta tu wallet para ver y gestionar tus registros de tiempo.
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
          Registro de Tiempo
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={!isConnected}
          sx={{ 
            minWidth: { xs: '100%', sm: 'auto' },
            borderRadius: 2
          }}
        >
          Nuevo Registro
        </Button>
      </Box>

      {/* Estado de carga */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Cargando registros de tiempo...
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

      {/* Tabla de registros */}
      <Card>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          <Typography variant="h6" gutterBottom>
            Registros de Tiempo ({timeRecords.length})
          </Typography>
          
          {timeRecords.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AccessTimeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="textSecondary" gutterBottom>
                No hay registros de tiempo
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {!isConnected 
                  ? 'Conecta tu wallet para ver tus registros' 
                  : 'Crea tu primer registro de tiempo usando el botón "Nuevo Registro"'
                }
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ 
              maxHeight: 600,
              '& .MuiTable-root': {
                minWidth: { xs: 400, md: 650 }
              }
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Empresa</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Skill</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Descripción</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Duración</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeRecords.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        #{record.id}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {record.company}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`Skill #${record.skillId}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={record.description}>
                          <Typography variant="body2" sx={{ 
                            maxWidth: 150,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {record.description}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatDuration(record.duration)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {formatDate(record.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(record)}
                          label={getStatusText(record)}
                          color={getStatusColor(record)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {!record.isValidated && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleValidateRecord(record.id)}
                            disabled={transactionLoading}
                            sx={{ borderRadius: 2 }}
                          >
                            Validar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear nuevo registro */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AddIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Crear Nuevo Registro de Tiempo
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box>
            <TextField
              fullWidth
              label="Dirección de la Empresa"
              value={newRecord.company}
              onChange={(e) => setNewRecord({ ...newRecord, company: e.target.value })}
              variant="outlined"
              sx={{ mb: 3 }}
              placeholder="0x..."
              helperText="Dirección Ethereum de la empresa para la que trabajaste"
              error={!newRecord.company.trim()}
            />
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="skill-label">Skill Validada</InputLabel>
              <Select
                labelId="skill-label"
                id="skill"
                value={newRecord.skillId}
                label="Skill Validada"
                onChange={(e) => setNewRecord({ ...newRecord, skillId: e.target.value as number })}
                error={newRecord.skillId === 0}
              >
                <MenuItem value={0} disabled>
                  Selecciona una skill validada
                </MenuItem>
                {userSkills
                  .filter(skill => skill.isValidated)
                  .map((skill) => (
                    <MenuItem key={skill.skillId} value={skill.skillId}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Typography>{skill.name}</Typography>
                        <Chip 
                          label={`Nivel ${skill.declaredLevel}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  ))
                }
              </Select>
              {userSkills.filter(skill => skill.isValidated).length === 0 && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  No tienes skills validadas. Ve a la sección de Habilidades para declarar y validar skills.
                </Typography>
              )}
            </FormControl>
            
            <TextField
              fullWidth
              label="Descripción del Trabajo"
              value={newRecord.description}
              onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              variant="outlined"
              multiline
              rows={3}
              sx={{ mb: 3 }}
              placeholder="Describe el trabajo realizado, tareas específicas, tecnologías utilizadas..."
              helperText="Sé específico sobre el trabajo realizado"
              error={!newRecord.description.trim()}
            />
            
            <TextField
              fullWidth
              label="Duración (horas)"
              type="number"
              value={newRecord.duration}
              onChange={(e) => setNewRecord({ ...newRecord, duration: parseFloat(e.target.value) || 0 })}
              variant="outlined"
              inputProps={{ min: 0.1, step: 0.1 }}
              helperText="Tiempo trabajado en horas (ej: 2.5 para 2 horas y 30 minutos)"
              error={newRecord.duration <= 0}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            disabled={transactionLoading}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateRecord}
            disabled={transactionLoading || !newRecord.company.trim() || !newRecord.description.trim() || newRecord.duration <= 0 || newRecord.skillId === 0}
            sx={{ borderRadius: 2 }}
          >
            {transactionLoading ? 'Creando...' : 'Crear Registro'}
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

export default TimeRegistry;

