import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Avatar,
  Paper,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';

const Profile = () => {
  const [profileType, setProfileType] = useState('professional');
  const [editMode, setEditMode] = useState(false);
  
  // Estado simulado para un MVP
  const [profile, setProfile] = useState({
    name: 'Carlos Rodríguez',
    email: 'carlos@example.com',
    bio: 'Desarrollador blockchain con 5 años de experiencia en smart contracts y DApps. Especializado en Solidity y ecosistema Ethereum.',
    company: 'Blockchain Solutions',
    position: 'Senior Developer',
    location: 'Madrid, España',
    website: 'https://carlosrodriguez.dev',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  });

  const handleProfileTypeChange = (event: SelectChangeEvent) => {
    setProfileType(event.target.value);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value
    });
  };

  const handleSaveProfile = () => {
    // Aquí iría la lógica para guardar en blockchain
    console.log('Guardando perfil:', profile);
    setEditMode(false);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mi Perfil
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="profile-type-label">Tipo de Perfil</InputLabel>
          <Select
            labelId="profile-type-label"
            id="profile-type"
            value={profileType}
            label="Tipo de Perfil"
            onChange={handleProfileTypeChange}
          >
            <MenuItem value="professional">Profesional</MenuItem>
            <MenuItem value="company">Empresa</MenuItem>
            <MenuItem value="academy">Academia</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar 
                src={profile.avatar} 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mx: 'auto', 
                  mb: 2,
                  border: '4px solid',
                  borderColor: 'primary.main'
                }}
              >
                <PersonIcon fontSize="large" />
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {profile.name}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {profile.position} en {profile.company}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profile.location}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Chip 
                  icon={<PersonIcon />} 
                  label="Profesional" 
                  color="primary" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  icon={<BusinessIcon />} 
                  label="Verificado" 
                  color="success" 
                />
              </Box>
              
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />} 
                sx={{ mt: 3 }}
                onClick={toggleEditMode}
              >
                {editMode ? 'Cancelar Edición' : 'Editar Perfil'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Información Personal
                </Typography>
                
                {editMode ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nombre"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Biografía"
                        name="bio"
                        value={profile.bio}
                        onChange={handleInputChange}
                        margin="normal"
                        multiline
                        rows={4}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Empresa"
                        name="company"
                        value={profile.company}
                        onChange={handleInputChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Posición"
                        name="position"
                        value={profile.position}
                        onChange={handleInputChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Ubicación"
                        name="location"
                        value={profile.location}
                        onChange={handleInputChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Sitio Web"
                        name="website"
                        value={profile.website}
                        onChange={handleInputChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ mt: 2, textAlign: 'right' }}>
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={handleSaveProfile}
                        >
                          Guardar Cambios
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Box>
                    <Typography variant="body1" paragraph>
                      {profile.bio}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {profile.email}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Sitio Web
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {profile.website}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box>
                <Typography variant="h6" gutterBottom>
                  Estadísticas de Karma
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          450
                        </Typography>
                        <Typography variant="body2">
                          Karma Total
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          8
                        </Typography>
                        <Typography variant="body2">
                          Skills Validadas
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          124
                        </Typography>
                        <Typography variant="body2">
                          Horas Registradas
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
