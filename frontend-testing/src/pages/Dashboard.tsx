import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Alert,
  Skeleton,
  Chip
} from '@mui/material';
import { 
  AccountBalanceWallet, 
  Work, 
  AccessTime,
  CheckCircle
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { useKRMToken, useProfile, useSkills, useTimeRegistry, useMarketplace } from '../hooks/useContracts';
import { formatTokenAmount, formatAddress } from '../utils/blockchain';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading = false }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 1, 
          backgroundColor: `${color}20`,
          color: color,
          mr: 2 
        }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
      </Box>
      {loading ? (
        <Skeleton variant="text" width="60%" height={40} />
      ) : (
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { isConnected, account, chainId } = useWeb3();
  const { balance, loading: krmLoading } = useKRMToken();
  const { profile, loading: profileLoading } = useProfile();
  const { userSkills, loading: skillsLoading } = useSkills();
  const { timeRecords, loading: timeLoading } = useTimeRegistry();
  const { userServices, userOrders, loading: marketplaceLoading } = useMarketplace();

  const [stats, setStats] = useState({
    totalEarnings: '0',
    completedProjects: 0,
    totalHours: 0,
    validatedSkills: 0
  });

  useEffect(() => {
    if (!isConnected) return;

    // Calcular estadísticas reales
    const validatedSkills = userSkills.filter(skill => skill.isValidated).length;
    const totalHours = timeRecords.reduce((total, record) => {
      const duration = (record.endTime - record.startTime) / 3600; // Convertir a horas
      return total + duration;
    }, 0);
    const completedProjects = userOrders.filter(order => order.status === 2).length; // Status 2 = Completed
    const totalEarnings = userOrders
      .filter(order => order.status === 2)
      .reduce((total, order) => total + parseFloat(order.totalPrice), 0);

    setStats({
      totalEarnings: totalEarnings.toFixed(2),
      completedProjects,
      totalHours: Math.round(totalHours),
      validatedSkills
    });
  }, [isConnected, userSkills, timeRecords, userOrders]);

  if (!isConnected) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Por favor, conecta tu wallet para ver tu dashboard personalizado.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Información de cuenta */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Información de Cuenta
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                Dirección
              </Typography>
              <Typography variant="body1">
                {formatAddress(account || '')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                Balance KRM
              </Typography>
              <Typography variant="body1">
                {formatTokenAmount(balance)} KRM
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                Estado del Perfil
              </Typography>
              {profileLoading ? (
                <Skeleton variant="text" width="100px" />
              ) : profile ? (
                <Chip 
                  label={profile.isActive ? "Activo" : "Inactivo"} 
                  color={profile.isActive ? "success" : "default"}
                  size="small"
                />
              ) : (
                <Chip label="Sin perfil" color="warning" size="small" />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Estadísticas principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Balance KRM"
            value={`${formatTokenAmount(balance)} KRM`}
            icon={<AccountBalanceWallet />}
            color="#1976d2"
            loading={krmLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Habilidades Validadas"
            value={stats.validatedSkills}
            icon={<CheckCircle />}
            color="#2e7d32"
            loading={skillsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Horas Trabajadas"
            value={stats.totalHours}
            icon={<AccessTime />}
            color="#ed6c02"
            loading={timeLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Proyectos Completados"
            value={stats.completedProjects}
            icon={<Work />}
            color="#9c27b0"
            loading={marketplaceLoading}
          />
        </Grid>
      </Grid>

      {/* Resumen de actividad */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mis Servicios
              </Typography>
              {marketplaceLoading ? (
                <Box>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </Box>
              ) : userServices.length > 0 ? (
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Tienes {userServices.length} servicio(s) activo(s)
                  </Typography>
                  {userServices.slice(0, 3).map((service, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {service.title} - {service.pricePerHour} KRM/hora
                      </Typography>
                    </Box>
                  ))}
                  {userServices.length > 3 && (
                    <Typography variant="body2" color="textSecondary">
                      +{userServices.length - 3} más...
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No tienes servicios publicados aún.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registros de Tiempo Recientes
              </Typography>
              {timeLoading ? (
                <Box>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </Box>
              ) : timeRecords.length > 0 ? (
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {timeRecords.length} registro(s) de tiempo
                  </Typography>
                  {timeRecords.slice(0, 3).map((record, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {record.description} - {Math.round((record.endTime - record.startTime) / 3600)}h
                      </Typography>
                      <Chip 
                        label={record.status === 1 ? "Validado" : record.status === 0 ? "Pendiente" : "Rechazado"}
                        color={record.status === 1 ? "success" : record.status === 0 ? "warning" : "error"}
                        size="small"
                      />
                    </Box>
                  ))}
                  {timeRecords.length > 3 && (
                    <Typography variant="body2" color="textSecondary">
                      +{timeRecords.length - 3} más...
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No tienes registros de tiempo aún.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Información de red */}
      {chainId && chainId !== 31337 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          Estás conectado a la red {chainId}. Para usar todas las funcionalidades, 
          conecta a la red Hardhat Local (Chain ID: 31337).
        </Alert>
      )}
    </Box>
  );
};

export default Dashboard;

