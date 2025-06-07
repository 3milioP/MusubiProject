import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import DeleteIcon from '@mui/icons-material/Delete';
import CodeIcon from '@mui/icons-material/Code';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LanguageIcon from '@mui/icons-material/Language';
import DesignServicesIcon from '@mui/icons-material/DesignServices';

const Skills = () => {
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'development',
    level: 'intermediate'
  });
  
  // Estado simulado para un MVP
  const [skills, setSkills] = useState<any[]>([]);

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setSkills([
        { id: 1, name: 'Solidity', category: 'development', level: 'advanced', karma: 85, status: 'validated', validations: 3 },
        { id: 2, name: 'React', category: 'development', level: 'expert', karma: 120, status: 'validated', validations: 4 },
        { id: 3, name: 'Project Management', category: 'business', level: 'intermediate', karma: 65, status: 'validated', validations: 2 },
        { id: 4, name: 'UI/UX Design', category: 'design', level: 'beginner', karma: 30, status: 'validated', validations: 1 },
        { id: 5, name: 'Python', category: 'development', level: 'intermediate', karma: 0, status: 'pending', validations: 0 },
        { id: 6, name: 'English', category: 'language', level: 'advanced', karma: 0, status: 'pending', validations: 0 }
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
    setNewSkill({
      ...newSkill,
      [name]: value
    });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setNewSkill({
      ...newSkill,
      [name]: value
    });
  };

  const handleAddSkill = () => {
    // Aquí iría la lógica para añadir en blockchain
    console.log('Añadiendo skill:', newSkill);
    
    // Simulación para MVP
    const newId = skills.length + 1;
    setSkills([
      ...skills,
      {
        id: newId,
        name: newSkill.name,
        category: newSkill.category,
        level: newSkill.level,
        karma: 0,
        status: 'pending',
        validations: 0
      }
    ]);
    
    setNewSkill({
      name: '',
      category: 'development',
      level: 'intermediate'
    });
    
    setOpenDialog(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'development':
        return <CodeIcon />;
      case 'business':
        return <BusinessCenterIcon />;
      case 'language':
        return <LanguageIcon />;
      case 'design':
        return <DesignServicesIcon />;
      default:
        return <CodeIcon />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'info';
      case 'intermediate':
        return 'success';
      case 'advanced':
        return 'warning';
      case 'expert':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'validated' ? 
      <VerifiedIcon color="success" /> : 
      <PendingIcon color="warning" />;
  };

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
          onClick={handleOpenDialog}
        >
          Añadir Habilidad
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Habilidades Declaradas
                </Typography>
                
                <List>
                  {skills.map((skill) => (
                    <React.Fragment key={skill.id}>
                      <ListItem>
                        <ListItemIcon>
                          {getCategoryIcon(skill.category)}
                        </ListItemIcon>
                        <ListItemText 
                          primary={skill.name}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Chip 
                                label={skill.level} 
                                size="small" 
                                color={getLevelColor(skill.level) as any}
                                sx={{ mr: 1 }}
                              />
                              {skill.status === 'validated' && (
                                <Chip 
                                  label={`${skill.karma} Karma`} 
                                  size="small" 
                                  color="primary"
                                />
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon(skill.status)}
                            <IconButton edge="end" aria-label="delete" sx={{ ml: 1 }}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumen
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total de habilidades
                  </Typography>
                  <Typography variant="h4">
                    {skills.length}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Habilidades validadas
                  </Typography>
                  <Typography variant="h4">
                    {skills.filter(s => s.status === 'validated').length}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Karma total
                  </Typography>
                  <Typography variant="h4">
                    {skills.reduce((sum, skill) => sum + skill.karma, 0)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Solicitar Validación
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  Solicita a empresas o instituciones que validen tus habilidades para aumentar tu Karma.
                </Alert>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth
                >
                  Solicitar Validación
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Diálogo para añadir habilidad */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Añadir Nueva Habilidad</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Nombre de la habilidad"
            type="text"
            fullWidth
            variant="outlined"
            value={newSkill.name}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="category-label">Categoría</InputLabel>
            <Select
              labelId="category-label"
              id="category"
              name="category"
              value={newSkill.category}
              label="Categoría"
              onChange={handleSelectChange}
            >
              <MenuItem value="development">Desarrollo</MenuItem>
              <MenuItem value="business">Negocios</MenuItem>
              <MenuItem value="design">Diseño</MenuItem>
              <MenuItem value="language">Idiomas</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel id="level-label">Nivel</InputLabel>
            <Select
              labelId="level-label"
              id="level"
              name="level"
              value={newSkill.level}
              label="Nivel"
              onChange={handleSelectChange}
            >
              <MenuItem value="beginner">Principiante</MenuItem>
              <MenuItem value="intermediate">Intermedio</MenuItem>
              <MenuItem value="advanced">Avanzado</MenuItem>
              <MenuItem value="expert">Experto</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleAddSkill} 
            variant="contained" 
            color="primary"
            disabled={!newSkill.name}
          >
            Añadir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Skills;
