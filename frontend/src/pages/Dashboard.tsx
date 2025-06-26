import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Alert,
  Skeleton,
  Chip,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import { 
  AccountBalanceWallet, 
  Work, 
  AccessTime,
  CheckCircle,
  Refresh,
  TrendingUp,
  Person,
  Business,
  AccountBalance,
  Warning
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useKRM } from '../contexts/KRMContext';
import { useProfile, useSkills, useTimeRegistry, useMarketplace } from '../hooks/useContracts';
import { formatTokenAmount, formatAddress } from '../utils/blockchain';
import { CONTRACT_ADDRESSES } from '../config';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading = false }) => (
  <Card sx={{ 
    height: '100%',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
    }
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          backgroundColor: `${color}15`,
          color: color,
          mr: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 48,
          height: 48
        }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div" sx={{ 
          flexGrow: 1,
          fontSize: { xs: '0.9rem', md: '1rem' },
          fontWeight: 500
        }}>
          {title}
        </Typography>
      </Box>
      {loading ? (
        <Skeleton variant="text" width="60%" height={40} />
      ) : (
        <Typography variant="h4" component="div" sx={{ 
          fontWeight: 'bold',
          fontSize: { xs: '1.5rem', md: '2rem' },
          color: color
        }}>
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  // Elimino el log de renderizado que causa spam
  // console.log('🧭 Dashboard - Renderizando...');
  
  const { isConnected, account, chainId } = useWeb3();
  const { hasRegisteredProfile } = useOnboarding();
  const { balance, loading: krmLoading, loadBalance } = useKRM();
  const { profile, loading: profileLoading, loadProfile } = useProfile();
  const { userSkills, loading: skillsLoading, loadUserSkills } = useSkills();
  const { timeRecords, loading: timeLoading, loadTimeRecords } = useTimeRegistry();
  const { userServices, userOrders, loading: marketplaceLoading, loadUserServices, loadOrders } = useMarketplace();

  const [stats, setStats] = useState({
    totalEarnings: '0',
    completedProjects: 0,
    totalHours: 0,
    validatedSkills: 0
  });

  const [navigationLog, setNavigationLog] = useState<string[]>([]);
  const [walletEvents, setWalletEvents] = useState<string[]>([]);
  const [showProfileAlert, setShowProfileAlert] = useState(true);

  // Log específico para debuggear el balance en el Dashboard
  console.log('💰 Dashboard - Balance del contexto KRM:', {
    balance,
    krmLoading,
    isConnected,
    account,
    balanceType: typeof balance,
    balanceValue: balance,
    formattedBalance: formatTokenAmount(balance)
  });

  // Log adicional para verificar el estado del contexto KRM
  useEffect(() => {
    console.log('🔍 Dashboard - useEffect - Estado del balance:', {
      balance,
      krmLoading,
      isConnected,
      account,
      hasLoadBalance: !!loadBalance
    });
  }, [balance, krmLoading, isConnected, account, loadBalance]);

  useEffect(() => {
    if (!isConnected) {
      // console.log('🔌 Dashboard - No conectado, saliendo...');
      return;
    }

    // console.log('🔄 Dashboard - Calculando estadísticas...');

    // Calcular estadísticas reales
    const validatedSkills = userSkills.filter(skill => skill.isValidated).length;
    const totalHours = timeRecords.reduce((total, record) => {
      const duration = record.duration / 3600; // Convertir a horas
      return total + duration;
    }, 0);
    const completedProjects = userOrders.filter(order => order.status === 2).length; // Status 2 = Completed
    const totalEarnings = userOrders
      .filter(order => order.status === 2)
      .reduce((total, order) => total + order.totalAmount, 0);

    const newStats = {
      totalEarnings: totalEarnings.toFixed(2),
      completedProjects,
      totalHours: Math.round(totalHours),
      validatedSkills
    };

    // console.log('📈 Dashboard - Estadísticas calculadas:', newStats);
    setStats(newStats);
  }, [isConnected, userSkills, timeRecords, userOrders]);

  // Recargar datos cuando cambie la cuenta (igual que el Navbar)
  useEffect(() => {
    if (isConnected && account) {
      // Recargar balance KRM
      if (loadBalance) {
        console.log('🔍 Dashboard - Recargando balance KRM para cuenta:', account);
        loadBalance();
      }
      
      // Recargar perfil
      if (loadProfile) {
        loadProfile();
      }
      
      // Recargar otros datos
      if (loadUserSkills) {
        loadUserSkills();
      }
      
      if (loadTimeRecords) {
        loadTimeRecords();
      }
      
      if (loadUserServices) {
        loadUserServices();
      }
      
      if (loadOrders) {
        loadOrders();
      }
    }
  }, [isConnected, account, loadBalance, loadProfile, loadUserSkills, loadTimeRecords, loadUserServices, loadOrders]);

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

  const isLoading = krmLoading || profileLoading || skillsLoading || timeLoading || marketplaceLoading;

  const clearLogs = () => {
    setNavigationLog([]);
    setWalletEvents([]);
  };

  // Función para cerrar el alert de perfil registrado
  const handleCloseProfileAlert = () => {
    setShowProfileAlert(false);
  };

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <Box sx={{ 
        mb: { xs: 3, md: 4 }, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
          Dashboard
        </Typography>
      </Box>

      {/* Banner de perfil no registrado */}
      {!hasRegisteredProfile && !profile && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" href="/profile">
              Registrar Perfil
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Perfil no registrado:</strong> Para aprovechar todas las funcionalidades de Musubi, 
            registra tu perfil en la página de Perfil.
          </Typography>
        </Alert>
      )}

      {/* Banner de perfil registrado pero no verificado */}
      {profile && !profile.isVerified && showProfileAlert && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          onClose={handleCloseProfileAlert}
        >
          <Typography variant="body2">
            <strong>Perfil registrado:</strong> Tu perfil está registrado en la blockchain. 
            Puedes comenzar a usar todas las funcionalidades de Musubi.
          </Typography>
        </Alert>
      )}

      {/* Información de cuenta */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Información de Cuenta
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="textSecondary">
                Dirección
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {formatAddress(account || '')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="textSecondary">
                Balance KRM
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {krmLoading ? (
                  <Skeleton variant="text" width="80px" />
                ) : (
                  `${formatTokenAmount(balance)} KRM`
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
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

      {/* Estado de carga general - Solo mostrar si realmente está cargando */}
      {isLoading && (krmLoading || profileLoading) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Cargando datos del dashboard...
        </Alert>
      )}

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
            value={marketplaceLoading ? 0 : stats.completedProjects}
            icon={<Work />}
            color="#9c27b0"
            loading={false}
          />
        </Grid>
      </Grid>

      {/* Resumen de actividad */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Habilidades ({userSkills.length})
              </Typography>
              {skillsLoading ? (
                <Skeleton variant="rectangular" height={100} />
              ) : userSkills.length > 0 ? (
                <Box>
                  {userSkills.slice(0, 3).map((skill, index) => (
                    <Chip
                      key={index}
                      label={`Habilidad #${skill.skillId} (Nivel ${skill.declaredLevel})`}
                      color={skill.isValidated ? "success" : "default"}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                  {userSkills.length > 3 && (
                    <Typography variant="body2" color="textSecondary">
                      +{userSkills.length - 3} más...
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No hay habilidades declaradas
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Proyectos Recientes ({userOrders.length})
              </Typography>
              {marketplaceLoading ? (
                <Skeleton variant="rectangular" height={100} />
              ) : userOrders.length > 0 ? (
                <Box>
                  {userOrders.slice(0, 3).map((order, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, borderRadius: 1, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Proyecto #{order.id} - {order.status === 2 ? 'Completado' : 'En progreso'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {order.totalAmount} KRM
                      </Typography>
                    </Box>
                  ))}
                  {userOrders.length > 3 && (
                    <Typography variant="body2" color="textSecondary">
                      +{userOrders.length - 3} más...
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No hay proyectos recientes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

