import { useState } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Avatar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import EditIcon from '@mui/icons-material/Edit';

const Profile = () => {
  const [profileType, setProfileType] = useState('professional');
  const [editMode, setEditMode] = useState(false);
  
  // Estado simulado para un MVP
  const [profile, setProfile] = useState({
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    bio: 'Desarrollador Full Stack con 5 años de experiencia en tecnologías web modernas.',
    location: 'Madrid, España',
    website: 'https://juanperez.dev',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Blockchain'],
    experience: [
      {
        title: 'Senior Developer',
        company: 'Tech Solutions',
        period: '2021 - Presente',
        description: 'Desarrollo de aplicaciones web escalables'
      },
      {
        title: 'Frontend Developer',
        company: 'Digital Agency',
        period: '2019 - 2021',
        description: 'Creación de interfaces de usuario modernas'
      }
    ]
  });

  const handleProfileTypeChange = (event: SelectChangeEvent) => {
    setProfileType(event.target.value);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mi Perfil
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<EditIcon />}
          onClick={toggleEditMode}
        >
          {editMode ? 'Guardar' : 'Editar Perfil'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem'
                }}
              >
                {profile.name.charAt(0)}
              </Avatar>
              
              {editMode ? (
                <TextField
                  fullWidth
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  sx={{ mb: 2 }}
                />
              ) : (
                <Typography variant="h5" gutterBottom>
                  {profile.name}
                </Typography>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tipo de Perfil</InputLabel>
                <Select
                  value={profileType}
                  label="Tipo de Perfil"
                  onChange={handleProfileTypeChange}
                  disabled={!editMode}
                >
                  <MenuItem value="professional">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1 }} />
                      Profesional
                    </Box>
                  </MenuItem>
                  <MenuItem value="company">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ mr: 1 }} />
                      Empresa
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {editMode ? (
                <TextField
                  fullWidth
                  value={profile.location}
                  onChange={(e) => setProfile({...profile, location: e.target.value})}
                  placeholder="Ubicación"
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {profile.location}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información Personal
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profile.email}
                    disabled={!editMode}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Sitio Web"
                    value={profile.website}
                    disabled={!editMode}
                    onChange={(e) => setProfile({...profile, website: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Biografía"
                    multiline
                    rows={4}
                    value={profile.bio}
                    disabled={!editMode}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Habilidades
              </Typography>
              <Box>
                {profile.skills.map((skill, index) => (
                  <Chip 
                    key={index}
                    label={skill} 
                    sx={{ mr: 1, mb: 1 }}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              {editMode && (
                <Button variant="outlined" sx={{ mt: 2 }}>
                  Añadir Habilidad
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Experiencia Profesional
              </Typography>
              {profile.experience.map((exp, index) => (
                <Box key={index} sx={{ mb: 3, pb: 2, borderBottom: index < profile.experience.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {exp.title}
                  </Typography>
                  <Typography variant="subtitle2" color="primary.main">
                    {exp.company}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {exp.period}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {exp.description}
                  </Typography>
                </Box>
              ))}
              {editMode && (
                <Button variant="outlined">
                  Añadir Experiencia
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;

