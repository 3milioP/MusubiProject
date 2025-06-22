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
import { useKRMToken, useProfile, useSkills, useTimeRegistry, useMarketplace } from '../hooks/useContracts';
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
  console.log('🧭 Dashboard - Renderizando...');
  
  const { isConnected, account, chainId } = useWeb3();
  const { hasRegisteredProfile } = useOnboarding();
  const { balance, loading: krmLoading, loadBalance } = useKRMToken();
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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [navigationLog, setNavigationLog] = useState<string[]>([]);
  const [walletEvents, setWalletEvents] = useState<string[]>([]);
  const [krmBalance, setKrmBalance] = useState<string>('0');

  // Log del estado de carga
  useEffect(() => {
    console.log('📊 Dashboard - Estado de carga:', {
      krmLoading,
      profileLoading,
      skillsLoading,
      timeLoading,
      marketplaceLoading,
      isConnected,
      hasAccount: !!account
    });
  }, [krmLoading, profileLoading, skillsLoading, timeLoading, marketplaceLoading, isConnected, account]);

  useEffect(() => {
    if (!isConnected) {
      console.log('🔌 Dashboard - No conectado, saliendo...');
      return;
    }

    console.log('🔄 Dashboard - Calculando estadísticas...');

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

    console.log('📈 Dashboard - Estadísticas calculadas:', newStats);
    setStats(newStats);
  }, [isConnected, userSkills, timeRecords, userOrders]);

  const handleRefresh = async () => {
    console.log('🔄 Dashboard - Refrescando datos...');
    setIsRefreshing(true);
    
    try {
      if (account) {
        await Promise.all([
          loadBalance(),
          loadProfile(),
          loadUserSkills(),
          loadTimeRecords(),
          loadUserServices(),
          loadOrders()
        ]);
        console.log('✅ Dashboard - Datos refrescados exitosamente');
      }
    } catch (error) {
      console.error('❌ Dashboard - Error refrescando datos:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  // Test específico para balance KRM
  const testKRMBalance = async () => {
    console.log('💰 Test específico de balance KRM...');
    setIsRefreshing(true);
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask no está disponible');
      }

      const results: any = {};

      // Test 1: Verificar balance usando RPC nativo
      console.log('📡 Test 1: Balance usando RPC nativo...');
      if (account) {
        try {
          // Verificar código del contrato KRM
          const krmCode = await window.ethereum.request({
            method: 'eth_getCode',
            params: [CONTRACT_ADDRESSES.KRMToken, 'latest']
          });
          results.krmContractCode = krmCode !== '0x';
          console.log('✅ Contrato KRM tiene código:', krmCode !== '0x');

          // Llamada directa al contrato para balance
          const balanceData = {
            to: CONTRACT_ADDRESSES.KRMToken,
            data: '0x70a08231' + '000000000000000000000000' + account.slice(2) // balanceOf(address)
          };
          
          const balanceResult = await window.ethereum.request({
            method: 'eth_call',
            params: [balanceData, 'latest']
          });
          
          // Convertir de hex a decimal
          const balanceWei = BigInt(balanceResult);
          const balanceKRM = Number(balanceWei) / Math.pow(10, 18);
          results.krmBalanceWei = balanceResult;
          results.krmBalanceKRM = balanceKRM;
          console.log('✅ Balance KRM (Wei):', balanceResult);
          console.log('✅ Balance KRM:', balanceKRM);
          
          // Actualizar el estado con el balance real
          setKrmBalance(balanceKRM.toFixed(4));
          
        } catch (err: any) {
          console.error('❌ Error obteniendo balance:', err);
          results.balanceError = err.message;
        }
      }

      // Test 2: Verificar usando ethers
      console.log('📡 Test 2: Balance usando ethers...');
      try {
        const { ethers } = await import('ethers');
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        const krmContract = new ethers.Contract(
          CONTRACT_ADDRESSES.KRMToken,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );

        if (account) {
          const balance = await krmContract.balanceOf(account);
          results.ethersBalance = ethers.formatEther(balance);
          console.log('✅ Balance con ethers:', results.ethersBalance);
          
          // Actualizar también con ethers
          setKrmBalance(Number(results.ethersBalance).toFixed(4));
        }
      } catch (err: any) {
        console.error('❌ Error con ethers:', err);
        results.ethersError = err.message;
      }

      console.log('📊 Test de balance KRM completado:', results);
      
    } catch (err: any) {
      console.error('❌ Error en test de balance KRM:', err);
    } finally {
      console.log('🏁 Finalizando test de balance KRM');
      setIsRefreshing(false);
    }
  };

  const clearLogs = () => {
    setNavigationLog([]);
    setWalletEvents([]);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={isRefreshing ? <CircularProgress size={20} /> : <Refresh />}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </Button>
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
      {profile && !profile.isVerified && (
        <Alert severity="info" sx={{ mb: 3 }}>
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

      {/* Tarjeta de Balance KRM Real */}
      <Card sx={{ mb: 3, backgroundColor: '#e3f2fd' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance color="primary" />
            Balance KRM Real (Test)
          </Typography>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            {krmBalance} KRM
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Balance obtenido directamente del contrato blockchain
          </Typography>
        </CardContent>
      </Card>

      {/* Estado de carga general */}
      {isLoading && (
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
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Proyectos Recientes ({userOrders.length})
              </Typography>
              {marketplaceLoading ? (
                <Skeleton variant="rectangular" height={100} />
              ) : userOrders.length > 0 ? (
                <Box>
                  {userOrders.slice(0, 3).map((order, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
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

