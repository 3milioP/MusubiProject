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
  Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import BusinessIcon from '@mui/icons-material/Business';
import { useWeb3 } from '../contexts/Web3Context';
import { useTimeRegistry } from '../hooks/useContracts';

interface TimeRecord {
  id: number;
  worker: string;
  company: string;
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

  const [openDialog, setOpenDialog] = useState(false);
  const [newRecord, setNewRecord] = useState({
    company: '',
    description: '',
    duration: 0
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [transactionLoading, setTransactionLoading] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      loadTimeRecords();
    }
  }, [isConnected, account, loadTimeRecords]);

  const handleCreateRecord = async () => {
    if (!newRecord.company.trim() || !newRecord.description.trim() || newRecord.duration <= 0) {
      setSnackbar({
        open: true,
        message: 'Por favor completa todos los campos correctamente',
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
      await registerTime(
        newRecord.company,
        Date.now(),
        Date.now() + (newRecord.duration * 3600000), // Convert hours to milliseconds
        newRecord.description,
        []
      );
      setSnackbar({
        open: true,
        message: 'Registro de tiempo creado exitosamente',
        severity: 'success'
      });
      setNewRecord({ company: '', description: '', duration: 0 });
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
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Registro de Tiempo
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={transactionLoading}
        >
          Nuevo Registro
        </Button>
      </Box>

      {txState.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {txState.error}
        </Alert>
      )}

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">
                    {formatDuration(totalHours)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Registrado
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6">
                    {formatDuration(validatedHours)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Horas Validadas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PendingIcon sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h6">
                    {formatDuration(pendingHours)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Cargando registros desde la blockchain...
          </Typography>
        </Box>
      ) : (
        <>
          {timeRecords.length === 0 ? (
            <Card sx={{ mt: 4, textAlign: 'center', py: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  No tienes registros de tiempo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Crea tu primer registro de tiempo para comenzar a trackear tu trabajo
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                >
                  Crear Primer Registro
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Empresa</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Duración</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <BusinessIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ 
                              fontFamily: 'monospace', 
                              fontSize: '0.75rem',
                              wordBreak: 'break-all'
                            }}>
                              {record.company}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {record.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatDuration(record.duration)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
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
                          <Tooltip title="Validar registro (solo empresas)">
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleValidateRecord(record.id)}
                              disabled={transactionLoading}
                            >
                              Validar
                            </Button>
                          </Tooltip>
                        )}
                        {record.isValidated && (
                          <Typography variant="caption" color="text.secondary">
                            Validado por: {record.validatedBy.slice(0, 8)}...
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Dialog para crear nuevo registro */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Nuevo Registro de Tiempo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Dirección de la Empresa"
              value={newRecord.company}
              onChange={(e) => setNewRecord({ ...newRecord, company: e.target.value })}
              variant="outlined"
              sx={{ mb: 2 }}
              placeholder="0x..."
              helperText="Dirección Ethereum de la empresa para la que trabajaste"
            />
            <TextField
              fullWidth
              label="Descripción del Trabajo"
              value={newRecord.description}
              onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              variant="outlined"
              multiline
              rows={3}
              sx={{ mb: 2 }}
              placeholder="Describe el trabajo realizado..."
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
            />
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
            onClick={handleCreateRecord}
            disabled={transactionLoading}
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

