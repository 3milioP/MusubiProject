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
  Rating,
  Alert,
  Snackbar,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BusinessIcon from '@mui/icons-material/Business';
import { useWeb3 } from '../contexts/Web3Context';
import { useMarketplace } from '../hooks/useContracts';

interface Service {
  id: number;
  provider: string;
  title: string;
  description: string;
  pricePerHour: number;
  category: string;
  isActive: boolean;
  createdAt: number;
}

interface Order {
  id: number;
  service: Service;
  client: string;
  provider: string;
  totalAmount: number;
  status: number; // 0: Created, 1: Accepted, 2: Completed, 3: Cancelled
  createdAt: number;
  completedAt: number;
}

const Marketplace = () => {
  const { account, isConnected } = useWeb3();
  const { 
    services, 
    orders, 
    loading, 
    error, 
    createService, 
    createOrder,
    acceptOrder,
    completeOrder,
    refreshServices,
    refreshOrders
  } = useMarketplace();

  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [openServiceDialog, setOpenServiceDialog] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [transactionLoading, setTransactionLoading] = useState(false);

  const [newService, setNewService] = useState({
    title: '',
    description: '',
    pricePerHour: 0,
    category: ''
  });

  const [newOrder, setNewOrder] = useState({
    estimatedHours: 0,
    description: ''
  });

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
      refreshServices();
      refreshOrders();
    }
  }, [isConnected, account, refreshServices, refreshOrders]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateService = async () => {
    if (!newService.title.trim() || !newService.description.trim() || newService.pricePerHour <= 0 || !newService.category) {
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
      await createService(
        newService.title,
        newService.description,
        newService.pricePerHour,
        newService.category
      );
      setSnackbar({
        open: true,
        message: 'Servicio creado exitosamente',
        severity: 'success'
      });
      setNewService({ title: '', description: '', pricePerHour: 0, category: '' });
      setOpenServiceDialog(false);
      setTimeout(() => {
        refreshServices();
      }, 2000);
    } catch (error: any) {
      console.error('Error creating service:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al crear el servicio',
        severity: 'error'
      });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedService || newOrder.estimatedHours <= 0) {
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
      const totalAmount = selectedService.pricePerHour * newOrder.estimatedHours;
      await createOrder(selectedService.id, totalAmount);
      setSnackbar({
        open: true,
        message: 'Orden creada exitosamente',
        severity: 'success'
      });
      setNewOrder({ estimatedHours: 0, description: '' });
      setOpenOrderDialog(false);
      setSelectedService(null);
      setTimeout(() => {
        refreshOrders();
      }, 2000);
    } catch (error: any) {
      console.error('Error creating order:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al crear la orden',
        severity: 'error'
      });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    setTransactionLoading(true);
    try {
      await acceptOrder(orderId);
      setSnackbar({
        open: true,
        message: 'Orden aceptada exitosamente',
        severity: 'success'
      });
      setTimeout(() => {
        refreshOrders();
      }, 2000);
    } catch (error: any) {
      console.error('Error accepting order:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al aceptar la orden',
        severity: 'error'
      });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    setTransactionLoading(true);
    try {
      await completeOrder(orderId);
      setSnackbar({
        open: true,
        message: 'Orden completada exitosamente',
        severity: 'success'
      });
      setTimeout(() => {
        refreshOrders();
      }, 2000);
    } catch (error: any) {
      console.error('Error completing order:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al completar la orden',
        severity: 'error'
      });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleOrderService = (service: Service) => {
    setSelectedService(service);
    setOpenOrderDialog(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getOrderStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Creada';
      case 1: return 'Aceptada';
      case 2: return 'Completada';
      case 3: return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  const getOrderStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'warning';
      case 1: return 'info';
      case 2: return 'success';
      case 3: return 'error';
      default: return 'default';
    }
  };

  const filteredServices = services.filter(service =>
    service.isActive && (
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const myServices = services.filter(service => service.provider.toLowerCase() === account?.toLowerCase());
  const myOrders = orders.filter(order => 
    order.client.toLowerCase() === account?.toLowerCase() || 
    order.provider.toLowerCase() === account?.toLowerCase()
  );

  if (!isConnected) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Marketplace
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Por favor conecta tu wallet para acceder al marketplace.
        </Alert>
      </Box>
    );
  }

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
          onClick={() => setOpenServiceDialog(true)}
          disabled={transactionLoading}
        >
          Publicar Servicio
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar servicios, categorías o proveedores..."
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
          <Tab label={`Todos los Servicios (${filteredServices.length})`} />
          <Tab label={`Mis Servicios (${myServices.length})`} />
          <Tab label={`Mis Órdenes (${myOrders.length})`} />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Cargando datos desde la blockchain...
          </Typography>
        </Box>
      ) : (
        <>
          {/* Tab 0: Todos los Servicios */}
          {tabValue === 0 && (
            <>
              {filteredServices.length === 0 ? (
                <Card sx={{ mt: 4, textAlign: 'center', py: 4 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      No hay servicios disponibles
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Sé el primero en publicar un servicio en el marketplace
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<AddIcon />}
                      onClick={() => setOpenServiceDialog(true)}
                    >
                      Publicar Primer Servicio
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Grid container spacing={3}>
                  {filteredServices.map((service) => (
                    <Grid item xs={12} md={6} lg={4} key={service.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              <BusinessIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ 
                                fontFamily: 'monospace', 
                                fontSize: '0.75rem'
                              }}>
                                {service.provider.slice(0, 8)}...{service.provider.slice(-6)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Proveedor
                              </Typography>
                            </Box>
                          </Box>

                          <Typography variant="h6" gutterBottom>
                            {service.title}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {service.description}
                          </Typography>

                          <Chip 
                            label={service.category} 
                            size="small" 
                            sx={{ mb: 2 }} 
                          />

                          <Typography variant="h6" color="primary.main">
                            {service.pricePerHour} KRM/hora
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            Publicado: {formatDate(service.createdAt)}
                          </Typography>
                        </CardContent>

                        <CardActions>
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="primary"
                            startIcon={<ShoppingCartIcon />}
                            onClick={() => handleOrderService(service)}
                            disabled={transactionLoading || service.provider.toLowerCase() === account?.toLowerCase()}
                          >
                            {service.provider.toLowerCase() === account?.toLowerCase() ? 'Tu Servicio' : 'Contratar'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* Tab 1: Mis Servicios */}
          {tabValue === 1 && (
            <>
              {myServices.length === 0 ? (
                <Card sx={{ mt: 4, textAlign: 'center', py: 4 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      No has publicado servicios
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Publica tu primer servicio para comenzar a recibir órdenes
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<AddIcon />}
                      onClick={() => setOpenServiceDialog(true)}
                    >
                      Publicar Servicio
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Grid container spacing={3}>
                  {myServices.map((service) => (
                    <Grid item xs={12} md={6} lg={4} key={service.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {service.title}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {service.description}
                          </Typography>

                          <Chip 
                            label={service.category} 
                            size="small" 
                            sx={{ mb: 2 }} 
                          />

                          <Typography variant="h6" color="primary.main">
                            {service.pricePerHour} KRM/hora
                          </Typography>

                          <Chip 
                            label={service.isActive ? 'Activo' : 'Inactivo'}
                            color={service.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* Tab 2: Mis Órdenes */}
          {tabValue === 2 && (
            <>
              {myOrders.length === 0 ? (
                <Card sx={{ mt: 4, textAlign: 'center', py: 4 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      No tienes órdenes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Las órdenes que crees o recibas aparecerán aquí
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Grid container spacing={3}>
                  {myOrders.map((order) => (
                    <Grid item xs={12} md={6} key={order.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6">
                              Orden #{order.id}
                            </Typography>
                            <Chip 
                              label={getOrderStatusText(order.status)}
                              color={getOrderStatusColor(order.status) as any}
                              size="small"
                            />
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Cliente:</strong> {order.client.slice(0, 8)}...{order.client.slice(-6)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Proveedor:</strong> {order.provider.slice(0, 8)}...{order.provider.slice(-6)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            <strong>Monto:</strong> {order.totalAmount} KRM
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            Creada: {formatDate(order.createdAt)}
                          </Typography>

                          {order.status === 0 && order.provider.toLowerCase() === account?.toLowerCase() && (
                            <Box sx={{ mt: 2 }}>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="primary"
                                onClick={() => handleAcceptOrder(order.id)}
                                disabled={transactionLoading}
                              >
                                Aceptar Orden
                              </Button>
                            </Box>
                          )}

                          {order.status === 1 && order.provider.toLowerCase() === account?.toLowerCase() && (
                            <Box sx={{ mt: 2 }}>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="success"
                                onClick={() => handleCompleteOrder(order.id)}
                                disabled={transactionLoading}
                              >
                                Completar Orden
                              </Button>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}
        </>
      )}

      {/* Dialog para publicar nuevo servicio */}
      <Dialog open={openServiceDialog} onClose={() => setOpenServiceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Publicar Nuevo Servicio</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Título del Servicio"
              value={newService.title}
              onChange={(e) => setNewService({ ...newService, title: e.target.value })}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Descripción"
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              multiline
              rows={4}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Precio por Hora (KRM)"
              type="number"
              value={newService.pricePerHour}
              onChange={(e) => setNewService({ ...newService, pricePerHour: parseFloat(e.target.value) || 0 })}
              variant="outlined"
              sx={{ mb: 2 }}
              inputProps={{ min: 0.1, step: 0.1 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Categoría</InputLabel>
              <Select 
                value={newService.category}
                label="Categoría"
                onChange={(e) => setNewService({ ...newService, category: e.target.value })}
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
            onClick={() => setOpenServiceDialog(false)}
            disabled={transactionLoading}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateService}
            disabled={transactionLoading}
          >
            {transactionLoading ? 'Publicando...' : 'Publicar Servicio'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear orden */}
      <Dialog open={openOrderDialog} onClose={() => setOpenOrderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contratar Servicio</DialogTitle>
        <DialogContent>
          {selectedService && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedService.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedService.description}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Precio:</strong> {selectedService.pricePerHour} KRM/hora
              </Typography>
              
              <TextField
                fullWidth
                label="Horas Estimadas"
                type="number"
                value={newOrder.estimatedHours}
                onChange={(e) => setNewOrder({ ...newOrder, estimatedHours: parseFloat(e.target.value) || 0 })}
                variant="outlined"
                sx={{ mb: 2 }}
                inputProps={{ min: 0.1, step: 0.1 }}
              />

              <Typography variant="h6" color="primary.main">
                Total: {(selectedService.pricePerHour * newOrder.estimatedHours).toFixed(2)} KRM
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenOrderDialog(false)}
            disabled={transactionLoading}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateOrder}
            disabled={transactionLoading}
          >
            {transactionLoading ? 'Creando...' : 'Crear Orden'}
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

export default Marketplace;

