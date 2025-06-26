import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Build,
  Code,
  Storage,
  AccountBalanceWallet,
  CheckCircle,
  Error,
  Warning,
  ExpandMore,
  PlayArrow,
  Stop,
  Refresh,
  Settings,
  BugReport,
  Speed,
  Memory
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { useKRM } from '../contexts/KRMContext';
import { useProfile, useSkills, useTimeRegistry, useMarketplace } from '../hooks/useContracts';
import { formatTokenAmount, formatAddress } from '../utils/blockchain';
import { CONTRACT_ADDRESSES } from '../config';
import IPFSStatus from '../components/IPFSStatus';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
  timestamp: Date;
}

interface SystemStatus {
  blockchain: boolean;
  ipfs: boolean;
  api: boolean;
  frontend: boolean;
}

const DeveloperTools: React.FC = () => {
  const { isConnected, account, provider, signer } = useWeb3();
  const { balance, loadBalance } = useKRM();
  const { profile, loadProfile } = useProfile();
  const { userSkills, loadUserSkills } = useSkills();
  const { timeRecords, loadTimeRecords } = useTimeRegistry();
  const { userServices, userOrders, loadUserServices, loadOrders } = useMarketplace();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    blockchain: false,
    ipfs: false,
    api: false,
    frontend: true
  });
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('all');

  // Verificar estado del sistema
  useEffect(() => {
    checkSystemStatus();
  }, [isConnected]);

  const checkSystemStatus = async () => {
    const newStatus: SystemStatus = {
      blockchain: isConnected && !!provider,
      ipfs: false,
      api: false,
      frontend: true
    };

    // Verificar IPFS
    try {
      const response = await fetch('http://localhost:5001/api/v0/version');
      newStatus.ipfs = response.ok;
    } catch (error) {
      console.log('IPFS no disponible');
    }

    // Verificar API
    try {
      const response = await fetch('http://localhost:5004/api/health');
      newStatus.api = response.ok;
    } catch (error) {
      console.log('API no disponible');
    }

    setSystemStatus(newStatus);
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 49)]); // Mantener solo los últimos 50
  };

  const runContractTest = async (testName: string, testFunction: () => Promise<any>) => {
    const result: TestResult = {
      name: testName,
      status: 'pending',
      message: 'Ejecutando...',
      timestamp: new Date()
    };
    addTestResult(result);

    try {
      const data = await testFunction();
      addTestResult({
        name: testName,
        status: 'success',
        message: 'Test completado exitosamente',
        details: data,
        timestamp: new Date()
      });
    } catch (error: any) {
      addTestResult({
        name: testName,
        status: 'error',
        message: `Error: ${error?.message || 'Error desconocido'}`,
        details: error,
        timestamp: new Date()
      });
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    // Tests de conexión
    await runContractTest('Verificar Conexión Web3', async () => {
      if (!isConnected) throw new Error('Wallet no conectada');
      return { account, chainId: await provider?.getNetwork() };
    });

    await runContractTest('Verificar Balance KRM', async () => {
      if (!isConnected) throw new Error('Wallet no conectada');
      await loadBalance();
      return { balance: formatTokenAmount(balance) };
    });

    await runContractTest('Verificar Perfil', async () => {
      if (!isConnected) throw new Error('Wallet no conectada');
      await loadProfile();
      return { profile: profile?.name || 'Sin perfil' };
    });

    await runContractTest('Verificar Habilidades', async () => {
      if (!isConnected) throw new Error('Wallet no conectada');
      await loadUserSkills();
      return { skillsCount: userSkills.length };
    });

    await runContractTest('Verificar Registro de Tiempo', async () => {
      if (!isConnected) throw new Error('Wallet no conectada');
      await loadTimeRecords();
      return { recordsCount: timeRecords.length };
    });

    await runContractTest('Verificar Marketplace', async () => {
      if (!isConnected) throw new Error('Wallet no conectada');
      await loadOrders();
      return { ordersCount: userOrders.length, servicesCount: userServices.length };
    });

    setIsRunningTests(false);
  };

  const runSpecificTest = async (testName: string) => {
    switch (testName) {
      case 'web3':
        await runContractTest('Verificar Conexión Web3', async () => {
          if (!isConnected) throw new Error('Wallet no conectada');
          return { account, chainId: await provider?.getNetwork() };
        });
        break;
      case 'krm':
        await runContractTest('Verificar Balance KRM', async () => {
          if (!isConnected) throw new Error('Wallet no conectada');
          await loadBalance();
          return { balance: formatTokenAmount(balance) };
        });
        break;
      case 'profile':
        await runContractTest('Verificar Perfil', async () => {
          if (!isConnected) throw new Error('Wallet no conectada');
          await loadProfile();
          return { profile: profile?.name || 'Sin perfil' };
        });
        break;
      case 'skills':
        await runContractTest('Verificar Habilidades', async () => {
          if (!isConnected) throw new Error('Wallet no conectada');
          await loadUserSkills();
          return { skillsCount: userSkills.length };
        });
        break;
      case 'time':
        await runContractTest('Verificar Registro de Tiempo', async () => {
          if (!isConnected) throw new Error('Wallet no conectada');
          await loadTimeRecords();
          return { recordsCount: timeRecords.length };
        });
        break;
      case 'marketplace':
        await runContractTest('Verificar Marketplace', async () => {
          if (!isConnected) throw new Error('Wallet no conectada');
          await loadOrders();
          return { ordersCount: userOrders.length, servicesCount: userServices.length };
        });
        break;
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" fontSize="small" />;
      case 'error':
        return <Error color="error" fontSize="small" />;
      case 'warning':
        return <Warning color="warning" fontSize="small" />;
      case 'pending':
        return <CircularProgress size={16} />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'pending':
        return 'default';
    }
  };

  if (!isConnected) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          🛠️ Herramientas de Desarrollador
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Por favor, conecta tu wallet para acceder a las herramientas de desarrollador.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🛠️ Herramientas de Desarrollador
      </Typography>

      {/* Estado del Sistema */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Estado del Sistema
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {systemStatus.blockchain ? (
                  <CheckCircle color="success" />
                ) : (
                  <Error color="error" />
                )}
                <Typography variant="body2">
                  Blockchain: {systemStatus.blockchain ? 'Conectado' : 'Desconectado'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {systemStatus.ipfs ? (
                  <CheckCircle color="success" />
                ) : (
                  <Error color="error" />
                )}
                <Typography variant="body2">
                  IPFS: {systemStatus.ipfs ? 'Conectado' : 'Desconectado'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {systemStatus.api ? (
                  <CheckCircle color="success" />
                ) : (
                  <Error color="error" />
                )}
                <Typography variant="body2">
                  API: {systemStatus.api ? 'Conectado' : 'Desconectado'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {systemStatus.frontend ? (
                  <CheckCircle color="success" />
                ) : (
                  <Error color="error" />
                )}
                <Typography variant="body2">
                  Frontend: {systemStatus.frontend ? 'Activo' : 'Inactivo'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Estado de IPFS */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Estado de IPFS
          </Typography>
          <IPFSStatus showDetails={true} />
        </CardContent>
      </Card>

      {/* Controles de Testing */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Testing de Contratos
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Test Específico</InputLabel>
                <Select
                  value={selectedTest}
                  label="Test Específico"
                  onChange={(e) => setSelectedTest(e.target.value)}
                >
                  <MenuItem value="all">Todos los Tests</MenuItem>
                  <MenuItem value="web3">Conexión Web3</MenuItem>
                  <MenuItem value="krm">Balance KRM</MenuItem>
                  <MenuItem value="profile">Perfil</MenuItem>
                  <MenuItem value="skills">Habilidades</MenuItem>
                  <MenuItem value="time">Registro de Tiempo</MenuItem>
                  <MenuItem value="marketplace">Marketplace</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={isRunningTests ? <CircularProgress size={16} /> : <PlayArrow />}
                  onClick={() => selectedTest === 'all' ? runAllTests() : runSpecificTest(selectedTest)}
                  disabled={isRunningTests}
                >
                  {isRunningTests ? 'Ejecutando...' : 'Ejecutar Test'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={checkSystemStatus}
                >
                  Verificar Estado
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Stop />}
                  onClick={clearResults}
                >
                  Limpiar Resultados
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resultados de Tests */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resultados de Tests ({testResults.length})
          </Typography>
          {testResults.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No hay resultados de tests. Ejecuta un test para ver los resultados.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Estado</TableCell>
                    <TableCell>Test</TableCell>
                    <TableCell>Mensaje</TableCell>
                    <TableCell>Detalles</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {getStatusIcon(result.status)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {result.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {result.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {result.details && (
                          <Typography variant="caption" color="textSecondary">
                            {JSON.stringify(result.details, null, 2)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="textSecondary">
                          {result.timestamp.toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DeveloperTools; 