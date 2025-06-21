import React from 'react';
import { 
  Typography, 
  Box, 
  Alert,
  Container
} from '@mui/material';
import { useWeb3 } from '../contexts/Web3Context';

const Marketplace = () => {
  const { account, isConnected } = useWeb3();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Marketplace
      </Typography>
      
      {!isConnected && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Conecta tu wallet para publicar servicios y realizar órdenes. 
          Puedes explorar los servicios disponibles sin conectar.
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Servicios Disponibles
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No hay servicios disponibles en este momento.
        </Typography>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Mis Órdenes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No tienes órdenes activas.
        </Typography>
      </Box>
    </Container>
  );
};

export default Marketplace;

