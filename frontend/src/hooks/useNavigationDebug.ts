import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

export interface NavigationDebugState {
  isConnected: boolean;
  lastNavigation: string;
  navigationCount: number;
  walletConnectedAt: Date | null;
  errors: string[];
  performance: {
    navigationTime: number;
    renderTime: number;
  };
}

export const useNavigationDebug = () => {
  const { isConnected, account, chainId } = useWeb3();
  const [debugState, setDebugState] = useState<NavigationDebugState>({
    isConnected: false,
    lastNavigation: 'Inicial',
    navigationCount: 0,
    walletConnectedAt: null,
    errors: [],
    performance: {
      navigationTime: 0,
      renderTime: 0
    }
  });

  const logNavigation = useCallback((page: string) => {
    const startTime = performance.now();
    
    setDebugState(prev => {
      const newState = {
        ...prev,
        lastNavigation: page,
        navigationCount: prev.navigationCount + 1,
        performance: {
          ...prev.performance,
          navigationTime: startTime
        }
      };

      // Log en consola
      console.log(`🧭 Navegación a: ${page}`, {
        isConnected: newState.isConnected,
        account: account,
        chainId: chainId,
        navigationCount: newState.navigationCount
      });

      return newState;
    });

    // Medir tiempo de renderizado
    setTimeout(() => {
      const endTime = performance.now();
      setDebugState(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          renderTime: endTime - prev.performance.navigationTime
        }
      }));
    }, 100);
  }, [isConnected, account, chainId]);

  const logError = useCallback((error: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const errorWithTimestamp = `[${timestamp}] ${error}`;
    
    setDebugState(prev => ({
      ...prev,
      errors: [errorWithTimestamp, ...prev.errors.slice(0, 9)] // Mantener solo los últimos 10 errores
    }));

    console.error(`❌ Error de navegación: ${error}`);
  }, []);

  // Monitorear cambios en la conexión de wallet
  useEffect(() => {
    if (isConnected && !debugState.walletConnectedAt) {
      setDebugState(prev => ({
        ...prev,
        isConnected: true,
        walletConnectedAt: new Date()
      }));
      console.log('🦊 Wallet conectada - Monitoreando navegación...');
    } else if (!isConnected && debugState.walletConnectedAt) {
      setDebugState(prev => ({
        ...prev,
        isConnected: false,
        walletConnectedAt: null
      }));
      console.log('🔌 Wallet desconectada');
    }
  }, [isConnected, debugState.walletConnectedAt]);

  // Monitorear cambios de cuenta
  useEffect(() => {
    if (isConnected && account) {
      console.log('👤 Cuenta activa:', account);
    }
  }, [isConnected, account]);

  // Monitorear cambios de chain
  useEffect(() => {
    if (isConnected && chainId) {
      console.log('🔗 Chain activa:', chainId);
    }
  }, [isConnected, chainId]);

  // Detectar problemas de rendimiento
  useEffect(() => {
    if (debugState.performance.renderTime > 1000) {
      logError(`Renderizado lento: ${debugState.performance.renderTime.toFixed(2)}ms`);
    }
  }, [debugState.performance.renderTime, logError]);

  return {
    debugState,
    logNavigation,
    logError,
    clearErrors: () => setDebugState(prev => ({ ...prev, errors: [] }))
  };
}; 