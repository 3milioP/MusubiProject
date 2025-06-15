import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Rating
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VerifiedIcon from '@mui/icons-material/Verified';

interface Service {
  id: number;
  title: string;
  description: string;
  provider: string;
  rating: number;
  price: number;
  skills: string[];
  verified: boolean;
  favorite: boolean;
}

const Marketplace = () => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  // Simular carga de servicios
  useEffect(() => {
    const timer = setTimeout(() => {
      setServices([
        {
          id: 1,
          title: "Desarrollo Web Frontend",
          description: "Desarrollo de aplicaciones web modernas con React, TypeScript y Material-UI",
          provider: "Ana García",
          rating: 4.8,
          price: 45,
          skills: ["React", "TypeScript", "Material-UI"],
          verified: true,
          favorite: false
        },
        {
          id: 2,
          title: "Consultoría Blockchain",
          description: "Asesoramiento en implementación de soluciones blockchain y smart contracts",
          provider: "Carlos Ruiz",
          rating: 4.9,
          price: 75,
          skills: ["Solidity", "Ethereum", "Web3"],
          verified: true,
          favorite: true
        },
        {
          id: 3,
          title: "Diseño UX/UI",
          description: "Diseño de interfaces de usuario intuitivas y experiencias digitales excepcionales",
          provider: "María López",
          rating: 4.7,
          price: 50,
          skills: ["Figma", "Adobe XD", "Prototyping"],
          verified: false,
          favorite: false
        }
      ]);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Marketplace
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Publicar Servicio
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar servicios, habilidades o proveedores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Tabs value={tabValue} onChange={handleTabChange} aria-label="marketplace tabs">
          <Tab label="Todos los Servicios" />
          <Tab label="Mis Favoritos" />
          <Tab label="Mis Servicios" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredServices.map((service) => (
            <Grid item xs={12} md={6} lg={4} key={service.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      {service.provider.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {service.provider}
                        {service.verified && (
                          <VerifiedIcon 
                            sx={{ ml: 0.5, fontSize: 16, color: 'primary.main' }} 
                          />
                        )}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={service.rating} readOnly size="small" />
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                          ({service.rating})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    {service.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {service.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    {service.skills.map((skill, index) => (
                      <Chip 
                        key={index}
                        label={skill} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }} 
                      />
                    ))}
                  </Box>

                  <Typography variant="h6" color="primary.main">
                    {service.price} KRM/hora
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button size="small" color="primary">
                    Ver Detalles
                  </Button>
                  <Button size="small" variant="contained" color="primary">
                    Contratar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para publicar nuevo servicio */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Publicar Nuevo Servicio</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Título del Servicio"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={4}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Precio por Hora (KRM)"
              type="number"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Categoría</InputLabel>
              <Select label="Categoría">
                <MenuItem value="desarrollo">Desarrollo</MenuItem>
                <MenuItem value="diseno">Diseño</MenuItem>
                <MenuItem value="consultoria">Consultoría</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            Publicar Servicio
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Marketplace;

