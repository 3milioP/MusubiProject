import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  Grid,
  Paper,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { BugReport, ExpandMore, Warning, CheckCircle } from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { useDebug } from '../hooks/useDebug';
import { useNavigationDebug } from '../hooks/useNavigationDebug';
import { CONTRACT_ADDRESSES } from '../config';
import { useKRMToken } from '../hooks/useContracts';
import { useAccountChange } from '../hooks/useAccountChange';
import { ethers } from 'ethers';

const Debug: React.FC = () => {
  const { 
    isConnected, 
    account, 
    chainId, 
    provider, 
    signer, 
    connecting, 
    error, 
    connectWallet, 
    disconnectWallet 
  } = useWeb3();
  
  const { balance, loading: balanceLoading, loadBalance } = useKRMToken();
  const { 
    currentAccount: hookAccount, 
    accountHistory, 
    changeCount, 
    lastChangeTime, 
    isListening,
    clearHistory 
  } = useAccountChange();
  
  const { debugState } = useDebug();
  const { debugState: navDebugState, logNavigation, logError, clearErrors } = useNavigationDebug();
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);
  const [metamaskInfo, setMetamaskInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [navigationLog, setNavigationLog] = useState<string[]>([]);
  const [walletEvents, setWalletEvents] = useState<string[]>([]);

  // Monitorear eventos de navegación
  useEffect(() => {
    const logNavigationEvent = (event: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setNavigationLog(prev => [`[${timestamp}] ${event}`, ...prev.slice(0, 19)]);
    };

    // Log cuando cambia la conexión
    logNavigationEvent(`Estado de conexión: ${isConnected ? 'Conectado' : 'Desconectado'}`);
  }, [isConnected]);

  // Monitorear eventos de wallet
  useEffect(() => {
    const logWalletEvent = (event: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setWalletEvents(prev => [`[${timestamp}] ${event}`, ...prev.slice(0, 19)]);
    };

    if (isConnected) {
      logWalletEvent(`Wallet conectada: ${account}`);
      logWalletEvent(`Chain ID: ${chainId}`);
    } else {
      logWalletEvent('Wallet desconectada');
    }
  }, [isConnected, account, chainId]);

  // Función para obtener información detallada de MetaMask
  const getMetaMaskInfo = async () => {
    if (typeof window.ethereum === 'undefined') {
      setMetamaskInfo({ error: 'MetaMask no está instalado' });
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const isUnlocked = await (window.ethereum as any)._metamask?.isUnlocked?.() || 'unknown';
      
      setMetamaskInfo({
        accounts,
        chainId: parseInt(chainId, 16),
        isUnlocked,
        isMetaMask: window.ethereum.isMetaMask,
        networkVersion: (window.ethereum as any).networkVersion,
        selectedAddress: (window.ethereum as any).selectedAddress,
        isConnected: (window.ethereum as any).isConnected?.() || 'unknown'
      });
    } catch (error: any) {
      setMetamaskInfo({ error: error.message });
    }
  };

  // Función para probar contratos
  const testContracts = async () => {
    setTesting(true);
    setTestResults({});

    try {
      console.log('🧪 Iniciando tests de contratos...');
      
      if (!isConnected || !provider || !account) {
        throw new Error('Wallet no conectada');
      }

      const results: any = {};

      // Test 1: Verificar conexión básica
      results.connection = {
        status: 'success',
        message: `Conectado a cuenta ${account} en chain ${chainId}`
      };

      // Test 2: Verificar balance ETH
      try {
        const ethBalance = await provider.getBalance(account);
        results.ethBalance = {
          status: 'success',
          message: `Balance ETH: ${ethers.formatEther(ethBalance)} ETH`
        };
      } catch (error: any) {
        results.ethBalance = {
          status: 'error',
          message: `Error obteniendo balance ETH: ${error.message}`
        };
      }

      // Test 3: Verificar balance KRM
      try {
        await loadBalance();
        results.krmBalance = {
          status: 'success',
          message: `Balance KRM: ${balance} KRM`
        };
      } catch (error: any) {
        results.krmBalance = {
          status: 'error',
          message: `Error obteniendo balance KRM: ${error.message}`
        };
      }

      // Test 4: Verificar red correcta
      if (chainId === 31337) {
        results.network = {
          status: 'success',
          message: 'Conectado a red Musubi Local (Chain ID: 31337)'
        };
      } else {
        results.network = {
          status: 'error',
          message: `Red incorrecta. Esperado: 31337, Actual: ${chainId}`
        };
      }

      // Test 5: Verificar provider y signer
      if (provider && signer) {
        results.provider = {
          status: 'success',
          message: 'Provider y signer disponibles'
        };
      } else {
        results.provider = {
          status: 'error',
          message: 'Provider o signer no disponibles'
        };
      }

      setTestResults(results);
      console.log('✅ Tests completados:', results);

    } catch (error: any) {
      console.error('❌ Error en tests:', error);
      setTestResults({
        error: {
          status: 'error',
          message: `Error general: ${error.message}`
        }
      });
    } finally {
      setTesting(false);
    }
  };

  // Cargar información de MetaMask al montar el componente
  useEffect(() => {
    getMetaMaskInfo();
    
    // Actualizar información cada 5 segundos
    const interval = setInterval(getMetaMaskInfo, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Actualizar información cuando cambie la cuenta
  useEffect(() => {
    getMetaMaskInfo();
  }, [account]);

  const clearLogs = () => {
    setNavigationLog([]);
    setWalletEvents([]);
    clearErrors();
  };

  const simulateNavigation = () => {
    logNavigation('Página de Prueba');
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        <BugReport sx={{ mr: 1, verticalAlign: 'middle' }} />
        Diagnóstico de Blockchain
      </Typography>

      {/* Estado de Debug */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Estado de Debug:</strong> Loading={loading.toString()}, 
          Conectado={isConnected.toString()}, 
          Test={testResults ? 'Completado' : 'Pendiente'}
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Estado de Web3 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado de Web3 Context
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Conexión"
                    secondary={isConnected ? 'Conectado' : 'Desconectado'}
                  />
                  <Chip 
                    label={isConnected ? 'Conectado' : 'Desconectado'} 
                    color={isConnected ? 'success' : 'error'} 
                    size="small" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Cuenta"
                    secondary={account || 'No conectada'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Chain ID"
                    secondary={chainId || 'No disponible'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="MetaMask"
                    secondary={typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' ? 'Instalado' : 'No instalado'}
                  />
                  <Chip 
                    label={typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' ? 'Instalado' : 'No instalado'} 
                    color={typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' ? 'success' : 'error'} 
                    size="small" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Estado Loading"
                    secondary={loading ? 'Cargando...' : 'Listo'}
                  />
                  <Chip 
                    label={loading ? 'Cargando' : 'Listo'} 
                    color={loading ? 'warning' : 'success'} 
                    size="small" 
                  />
                </ListItem>
              </List>
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={connectWallet}
                  disabled={isConnected}
                  sx={{ mr: 1 }}
                >
                  Conectar Wallet
                </Button>
                <Button
                  variant="outlined"
                  onClick={disconnectWallet}
                  disabled={!isConnected}
                >
                  Desconectar
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Estado Detallado de Debug */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado Detallado de Debug
              </Typography>
              <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Web3 State:
                </Typography>
                <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(debugState.web3State, null, 2)}
                </pre>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Hooks State:
                </Typography>
                <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(debugState.hooksState, null, 2)}
                </pre>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Última actualización:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {debugState.lastUpdate.toLocaleTimeString()}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Debug de Navegación */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🧭 Debug de Navegación
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Estado de Navegación:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Última navegación"
                        secondary={navDebugState.lastNavigation}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Contador de navegaciones"
                        secondary={navDebugState.navigationCount}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Wallet conectada desde"
                        secondary={navDebugState.walletConnectedAt ? navDebugState.walletConnectedAt.toLocaleTimeString() : 'No conectada'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Tiempo de renderizado"
                        secondary={`${navDebugState.performance.renderTime.toFixed(2)}ms`}
                      />
                    </ListItem>
                  </List>
                  <Button
                    variant="outlined"
                    onClick={simulateNavigation}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Simular Navegación
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Errores de Navegación:
                  </Typography>
                  <Paper sx={{ p: 2, maxHeight: 150, overflow: 'auto', bgcolor: 'grey.50' }}>
                    {navDebugState.errors.length > 0 ? (
                      navDebugState.errors.map((error, index) => (
                        <Typography key={index} variant="body2" color="error" fontFamily="monospace" sx={{ mb: 0.5 }}>
                          {error}
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay errores de navegación
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Logs de Navegación y Wallet */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                📊 Logs de Navegación y Wallet
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    🧭 Logs de Navegación:
                  </Typography>
                  <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50' }}>
                    {navigationLog.length > 0 ? (
                      navigationLog.map((log, index) => (
                        <Typography key={index} variant="body2" fontFamily="monospace" sx={{ mb: 0.5 }}>
                          {log}
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay logs de navegación
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    🦊 Eventos de Wallet:
                  </Typography>
                  <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50' }}>
                    {walletEvents.length > 0 ? (
                      walletEvents.map((event, index) => (
                        <Typography key={index} variant="body2" fontFamily="monospace" sx={{ mb: 0.5 }}>
                          {event}
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay eventos de wallet
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={clearLogs} size="small">
                  Limpiar Logs
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Tests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tests de Comunicación
              </Typography>
              
              <Button
                variant="contained"
                onClick={testContracts}
                disabled={testing || !isConnected}
                sx={{ mb: 2, mr: 2 }}
              >
                {testing ? 'PROBANDO...' : 'Probar Contratos'}
              </Button>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Error:
                  </Typography>
                  <Typography variant="body2">
                    {error}
                  </Typography>
                </Alert>
              )}

              {testResults && (
                <Box>
                  <Alert 
                    severity="success"
                    sx={{ mb: 2 }}
                  >
                    Test completado exitosamente
                  </Alert>

                  <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Resultados:
                    </Typography>
                    <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Información de Direcciones */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Direcciones de Contratos
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(CONTRACT_ADDRESSES).map(([name, address]) => (
                  <Grid item xs={12} md={6} key={name}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="primary">
                        {name}
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {String(address)}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Información de MetaMask */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🦊 Información de MetaMask
              </Typography>
              <Button
                variant="outlined"
                onClick={getMetaMaskInfo}
                className="refresh-btn"
              >
                🔄 Actualizar
              </Button>
              
              {metamaskInfo.error ? (
                <div className="error-message">{metamaskInfo.error}</div>
              ) : (
                <div className="status-grid">
                  <div className="status-item">
                    <strong>Cuentas:</strong> 
                    <span className="mono">
                      {metamaskInfo.accounts?.length || 0} cuenta(s)
                    </span>
                  </div>
                  <div className="status-item">
                    <strong>Chain ID:</strong> 
                    <span className={metamaskInfo.chainId === 31337 ? 'success' : 'error'}>
                      {metamaskInfo.chainId || 'No disponible'}
                    </span>
                  </div>
                  <div className="status-item">
                    <strong>Desbloqueado:</strong> 
                    <span className={metamaskInfo.isUnlocked ? 'success' : 'error'}>
                      {metamaskInfo.isUnlocked ? '✅ Sí' : '❌ No'}
                    </span>
                  </div>
                  <div className="status-item">
                    <strong>Es MetaMask:</strong> 
                    <span className={metamaskInfo.isMetaMask ? 'success' : 'error'}>
                      {metamaskInfo.isMetaMask ? '✅ Sí' : '❌ No'}
                    </span>
                  </div>
                  <div className="status-item">
                    <strong>Cuenta Seleccionada:</strong> 
                    <span className="mono">{metamaskInfo.selectedAddress || 'Ninguna'}</span>
                  </div>
                  <div className="status-item">
                    <strong>Conectado:</strong> 
                    <span className={metamaskInfo.isConnected ? 'success' : 'error'}>
                      {metamaskInfo.isConnected ? '✅ Sí' : '❌ No'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Balance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💰 Balance
              </Typography>
              <div className="status-grid">
                <div className="status-item">
                  <strong>Balance KRM:</strong> 
                  <span className="mono">
                    {balanceLoading ? '⏳ Cargando...' : `${balance} KRM`}
                  </span>
                </div>
              </div>
              <Button
                variant="outlined"
                onClick={loadBalance}
                disabled={balanceLoading}
                className="refresh-btn"
              >
                🔄 Recargar Balance
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Hook de Cambio de Cuenta */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔄 Hook de Cambio de Cuenta
              </Typography>
              <div className="status-grid">
                <div className="status-item">
                  <strong>Cuenta del Hook:</strong> 
                  <span className="mono">{hookAccount || 'Ninguna'}</span>
                </div>
                <div className="status-item">
                  <strong>Escuchando:</strong> 
                  <span className={isListening ? 'success' : 'error'}>
                    {isListening ? '✅ Sí' : '❌ No'}
                  </span>
                </div>
                <div className="status-item">
                  <strong>Cambios Detectados:</strong> 
                  <span className="mono">{changeCount}</span>
                </div>
                <div className="status-item">
                  <strong>Último Cambio:</strong> 
                  <span className="mono">
                    {lastChangeTime ? lastChangeTime.toLocaleString() : 'Nunca'}
                  </span>
                </div>
              </div>
              
              {accountHistory.length > 0 && (
                <div style={{ marginTop: 15 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Historial de Cambios:
                  </Typography>
                  <List dense>
                    {accountHistory.slice(-5).map((entry, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={entry} 
                          primaryTypographyProps={{ fontSize: '0.8rem' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    variant="outlined"
                    onClick={clearHistory}
                    size="small"
                  >
                    🧹 Limpiar Historial
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Debug; 