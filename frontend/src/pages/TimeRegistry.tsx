import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  TextField,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { es } from 'date-fns/locale';

const TimeRegistry = () => {
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  
  // Estado simulado para un MVP
  const [timeRecords, setTimeRecords] = useState<any[]>([]);
  const [newRecord, setNewRecord] = useState({
    company: '',
    description: '',
    skills: []
  });
  
  // Datos simulados de empresas y habilidades
  const companies = [
    { id: '1', name: 'Blockchain Solutions' },
    { id: '2', name: 'Tech Innovators' },
    { id: '3', name: 'Digital Ventures' }
  ];
  
  const availableSkills = [
    { id: '1', name: 'Solidity' },
    { id: '2', name: 'React' },
    { id: '3', name: 'Project Management' },
    { id: '4', name: 'UI/UX Design' }
  ];

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeRecords([
        { 
          id: 1, 
          company: 'Blockchain Solutions', 
          startTime: new Date('2025-06-05T09:00:00'), 
          endTime: new Date('2025-06-05T17:00:00'),
          description: 'Desarrollo de smart contracts para marketplace',
          skills: ['Solidity', 'React'],
          status: 'validated',
          hours: 8
        },
        { 
          id: 2, 
          company: 'Tech Innovators', 
          startTime: new Date('2025-06-06T10:00:00'), 
          endTime: new Date('2025-06-06T18:00:00'),
          description: 'Diseño de interfaz para DApp',
          skills: ['UI/UX Design', 'React'],
          status: 'pending',
          hours: 8
        },
        { 
          id: 3, 
          company: 'Digital Ventures', 
          startTime: new Date('2025-06-07T09:00:00'), 
          endTime: new Date('2025-06-07T13:00:00'),
          description: 'Reunión de planificación de sprint',
          skills: ['Project Management'],
          status: 'validated',
          hours: 4
        }
      ]);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRecord({
      ...newRecord,
      [name]: value
    });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setNewRecord({
      ...newRecord,
      [name]: value
    });
  };

  const handleSkillsChange = (e: any) => {
    const { value } = e.target;
    setNewRecord({
      ...newRecord,
      skills: value
    });
  };

  const handleAddRecord = () => {
    if (!startDate || !endDate || !newRecord.company || !newRecord.description) {
      return;
    }
    
    // Aquí iría la lógica para añadir en blockchain
    console.log('Añadiendo registro horario:', {
      ...newRecord,
      startTime: startDate,
      endTime: endDate
    });
    
    // Simulación para MVP
    const hours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    const newId = timeRecords.length + 1;
    
    setTimeRecords([
      ...timeRecords,
      {
        id: newId,
        company: companies.find(c => c.id === newRecord.company)?.name,
        startTime: startDate,
        endTime: endDate,
        description: newRecord.description,
        skills: newRecord.skills.map(id => availableSkills.find(s => s.id === id)?.name),
        status: 'pending',
        hours
      }
    ]);
    
    // Resetear formulario
    setNewRecord({
      company: '',
      description: '',
      skills: []
    });
    setStartDate(new Date());
    setEndDate(new Date());
    
    setOpenDialog(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Registro Horario
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Nuevo Registro
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mis Registros Horarios
                </Typography>
                
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Empresa</TableCell>
                        <TableCell>Fecha Inicio</TableCell>
                        <TableCell>Fecha Fin</TableCell>
                        <TableCell>Horas</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Habilidades</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timeRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.company}</TableCell>
                          <TableCell>{formatDate(record.startTime)}</TableCell>
                          <TableCell>{formatDate(record.endTime)}</TableCell>
                          <TableCell>{record.hours}</TableCell>
                          <TableCell>{record.description}</TableCell>
                          <TableCell>
                            {record.skills.map((skill: string, index: number) => (
                              <Chip 
                                key={index} 
                                label={skill} 
                                size="small" 
                                sx={{ mr: 0.5, mb: 0.5 }} 
                              />
                            ))}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getStatusIcon(record.status)}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {record.status === 'validated' ? 'Validado' : 
                                 record.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumen
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total de horas registradas
                  </Typography>
                  <Typography variant="h4">
                    {timeRecords.reduce((sum, record) => sum + record.hours, 0)}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Horas validadas
                  </Typography>
                  <Typography variant="h4">
                    {timeRecords
                      .filter(record => record.status === 'validated')
                      .reduce((sum, record) => sum + record.hours, 0)}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Registros pendientes
                  </Typography>
                  <Typography variant="h4">
                    {timeRecords.filter(record => record.status === 'pending').length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información Legal
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  El registro horario es obligatorio según el Real Decreto-ley 8/2019. Todos los registros son almacenados en blockchain para garantizar su inmutabilidad y trazabilidad.
                </Alert>
                
                <Typography variant="body2" paragraph>
                  El sistema de registro horario de Musubi cumple con la normativa española sobre registro de jornada laboral, proporcionando un mecanismo seguro, transparente y auditable para empresas y trabajadores.
                </Typography>
                
                <Typography variant="body2">
                  Cada registro horario debe ser validado por la empresa correspondiente para garantizar su veracidad. Una vez validado, el registro genera Karma asociado a las habilidades utilizadas durante ese tiempo.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Diálogo para añadir registro */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Nuevo Registro Horario</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DateTimePicker
                  label="Fecha y hora de inicio"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  sx={{ width: '100%', mt: 2 }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DateTimePicker
                  label="Fecha y hora de fin"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  sx={{ width: '100%', mt: 2 }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="company-label">Empresa</InputLabel>
                <Select
                  labelId="company-label"
                  id="company"
                  name="company"
                  value={newRecord.company}
                  label="Empresa"
                  onChange={handleSelectChange}
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                margin="normal"
                id="description"
                name="description"
                label="Descripción de actividades"
                type="text"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={newRecord.description}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel id="skills-label">Habilidades utilizadas</InputLabel>
                <Select
                  labelId="skills-label"
                  id="skills"
                  name="skills"
                  multiple
                  value={newRecord.skills}
                  label="Habilidades utilizadas"
                  onChange={handleSkillsChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const skill = availableSkills.find(s => s.id === value);
                        return (
                          <Chip key={value} label={skill?.name} />
                        );
                      })}
                    </Box>
                  )}
                >
                  {availableSkills.map((skill) => (
                    <MenuItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleAddRecord} 
            variant="contained" 
            color="primary"
            disabled={!startDate || !endDate || !newRecord.company || !newRecord.description}
          >
            Registrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeRegistry;
