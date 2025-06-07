import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  CardMedia,
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
  Divider,
  Rating,
  Avatar,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StarIcon from '@mui/icons-material/Star';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`marketplace-tabpanel-${index}`}
      aria-labelledby={`marketplace-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Marketplace = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado simulado para un MVP
  const [services, setServices] = useState<any[]>([]);
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    pricePerHour: 50,
    category: 'development',
    skills: []
  });
  
  // Datos simulados de categorías y habilidades
  const categories = [
    { id: 'development', name: 'Desarrollo' },
    { id: 'design', name: 'Diseño' },
    { id: 'business', name: 'Negocios' },
    { id: 'language', name: 'Idiomas' }
  ];
  
  const availableSkills = [
    { id: '1', name: 'Solidity', category: 'development' },
    { id: '2', name: 'React', category: 'development' },
    { id: '3', name: 'Project Management', category: 'business' },
    { id: '4', name: 'UI/UX Design', category: 'design' },
    { id: '5', name: 'Python', category: 'development' },
    { id: '6', name: 'English', category: 'language' }
  ];

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setServices([
        { 
          id: 1, 
          title: 'Desarrollo de Smart Contracts', 
          description: 'Desarrollo de contratos inteligentes en Solidity para proyectos blockchain. Especializado en DeFi y NFTs.',
          pricePerHour: 80,
          provider: 'Carlos Rodríguez',
          providerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          category: 'development',
          skills: ['Solidity', 'Ethereum'],
          rating: 4.8,
          reviews: 12,
          favorite: false
        },
        { 
          id: 2, 
          title: 'Diseño UI/UX para DApps', 
          description: 'Diseño de interfaces de usuario para aplicaciones descentralizadas. Enfoque en usabilidad y experiencia de usuario.',
          pricePerHour: 65,
          provider: 'Laura Martínez',
          providerAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          category: 'design',
          skills: ['UI/UX Design', 'Figma'],
          rating: 4.5,
          reviews: 8,
          favorite: true
        },
        { 
          id: 3, 
          title: 'Consultoría en Tokenómica', 
          description: 'Asesoramiento en diseño de tokenómica para proyectos blockchain. Análisis de incentivos y modelado económico.',
          pricePerHour: 90,
          provider: 'Miguel Sánchez',
          providerAvatar: 'https://randomuser.me/api/portraits/men/67.jpg',
          category: 'business',
          skills: ['Tokenomics', 'Business Strategy'],
          rating: 4.9,
          reviews: 15,
          favorite: false
        },
        { 
          id: 4, 
          title: 'Clases de Inglés Técnico', 
          description: 'Clases de inglés especializado en tecnología blockchain y desarrollo de software.',
          pricePerHour: 40,
          provider: 'Ana García',
          providerAvatar: 'https://randomuser.me/api/portraits/women/22.jpg',
          category: 'language',
          skills: ['English', 'Technical Writing'],
          rating: 4.7,
          reviews: 20,
          favorite: false
        }
      ]);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewService({
      ...newService,
      [name]: value
    });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setNewService({
      ...newService,
      [name]: value
    });
  };

  const handleSkillsChange = (e: any) => {
    const { value } = e.target;
    setNewService({
      ...newService,
      skills: value
    });
  };

  const handleAddService = () => {
    // Aquí iría la lógica para añadir en blockchain
    console.log('Añadiendo servicio:', newService);
    
    // Simulación para MVP
    const newId = services.length + 1;
    setServices([
      ...services,
      {
        id: newId,
        title: newService.title,
        description: newService.description,
        pricePerHour: newService.pricePerHour,
        provider: 'Carlos Rodríguez',
        providerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        category: newService.category,
        skills: newService.skills.map(id => availableSkills.find(s => s.id === id)?.name),
        rating: 0,
        reviews: 0,
        favorite: false
      }
    ]);
    
    // Resetear formulario
    setNewService({
      title: '',
      description: '',
      pricePerHour: 50,
      category: 'development',
      skills: []
    });
    
    setOpenDialog(false);
  };

  const toggleFavorite = (id: number) => {
    setServices(services.map(service => 
      service.id === id ? { ...service, favorite: !service.favorite } : service
    ));
  };

  const filteredServices = searchQuery 
    ? services.filter(service => 
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.skills.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : services;

  const myServices = services.filter(service => service.provider === 'Carlos Rodríguez');
  const favoriteServices = services.filter(service => service.favorite);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Marketplace P2P
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Ofrecer Servicio
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar servicios, habilidades o proveedores..."
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <FilterListIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="marketplace tabs">
          <Tab label="Explorar" id="marketplace-tab-0" aria-controls="marketplace-tabpanel-0" />
          <Tab label="Mis Servicios" id="marketplace-tab-1" aria-controls="marketplace-tabpanel-1" />
          <Tab label="Favoritos" id="marketplace-tab-2" aria-controls="marketplace-tabpanel-2" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      ) : (
        <>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {filteredServices.map((service) => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="div">
                          {service.title}
                        </Typography>
                        <IconButton 
                          size="small" 
                          color={service.favorite ? "secondary" : "default"}
                          onClick={() => toggleFavorite(service.id)}
                        >
                          {service.favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar src={service.providerAvatar} sx={{ mr: 1, width: 24, height: 24 }} />
                        <Typography variant="body2" color="text.secondary">
                          {service.provider}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
                        {service.description}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        {service.skills.map((skill: string, index: number) => (
                          <Chip 
                            key={index} 
                            label={skill} 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }} 
                          />
                        ))}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating 
                          value={service.rating} 
                          readOnly 
                          precision={0.1}
                          size="small"
                          emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                        />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({service.reviews})
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                      <Typography variant="h6" color="primary">
                        {service.pricePerHour} KRM
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          /hora
                        </Typography>
                      </Typography>
                      
                      <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<ShoppingCartIcon />}
                      >
                        Contratar
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {myServices.length > 0 ? (
              <Grid container spacing={3}>
                {myServices.map((service) => (
                  <Grid item xs={12} sm={6} md={4} key={service.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div" gutterBottom>
                          {service.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {service.description}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          {service.skills.map((skill: string, index: number) => (
                            <Chip 
                              key={index} 
                              label={skill} 
                              size="small" 
                              sx={{ mr: 0.5, mb: 0.5 }} 
                            />
                          ))}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating 
                            value={service.rating} 
                            readOnly 
                            precision={0.1}
                            size="small"
                            emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                          />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({service.reviews})
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <Divider />
                      
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                        <Typography variant="h6" color="primary">
                          {service.pricePerHour} KRM
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            /hora
                          </Typography>
                        </Typography>
                        
                        <Button 
                          variant="outlined" 
                          size="small"
                        >
                          Editar
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No tienes servicios publicados
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  sx={{ mt: 2 }}
                >
                  Ofrecer Servicio
                </Button>
              </Box>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            {favoriteServices.length > 0 ? (
              <Grid container spacing={3}>
                {favoriteServices.map((service) => (
                  <Grid item xs={12} sm={6} md={4} key={service.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="div">
                            {service.title}
                          </Typography>
                          <IconButton 
                            size="small" 
                            color="secondary"
                            onClick={() => toggleFavorite(service.id)}
                          >
                            <FavoriteIcon />
                          </IconButton>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar src={service.providerAvatar} sx={{ mr: 1, width: 24, height: 24 }} />
                          <Typography variant="body2" color="text.secondary">
                            {service.provider}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {service.description}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          {service.skills.map((skill: string, index: number) => (
                            <Chip 
                              key={index} 
                              label={skill} 
                              size="small" 
                              sx={{ mr: 0.5, mb: 0.5 }} 
                            />
                          ))}
                        </Box>
                      </CardContent>
                      
                      <Divider />
                      
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                        <Typography variant="h6" color="primary">
                          {service.pricePerHour} KRM
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            /hora
                          </Typography>
                        </Typography>
                        
                        <Button 
                          variant="contained" 
                          size="small" 
                          startIcon={<ShoppingCartIcon />}
                        >
                          Contratar
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No tienes servicios favoritos
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => setTabValue(0)}
                  sx={{ mt: 2 }}
                >
                  Explorar Servicios
                </Button>
              </Box>
            )}
          </TabPanel>
        </>
      )}

      {/* Diálogo para añadir servicio */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Ofrecer Nuevo Servicio</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                id="title"
                name="title"
                label="Título del servicio"
                type="text"
                fullWidth
                variant="outlined"
                value={newService.title}
                onChange={handleInputChange}
                sx={{ mt: 1 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                margin="dense"
                id="description"
                name="description"
                label="Descripción detallada"
                type="text"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={newService.description}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel id="category-label">Categoría</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="category"
                  value={newService.category}
                  label="Categoría"
                  onChange={handleSelectChange}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                id="pricePerHour"
                name="pricePerHour"
                label="Precio por hora (KRM)"
                type="number"
                fullWidth
                variant="outlined"
                value={newService.pricePerHour}
                onChange={handleInputChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">KRM</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel id="skills-label">Habilidades relacionadas</InputLabel>
                <Select
                  labelId="skills-label"
                  id="skills"
                  name="skills"
                  multiple
                  value={newService.skills}
                  label="Habilidades relacionadas"
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
                  {availableSkills
                    .filter(skill => skill.category === newService.category)
                    .map((skill) => (
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
            onClick={handleAddService} 
            variant="contained" 
            color="primary"
            disabled={!newService.title || !newService.description || newService.pricePerHour <= 0}
          >
            Publicar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Marketplace;
