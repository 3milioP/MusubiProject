import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Web3State } from '../types';
import { isMetaMaskInstalled, getMetaMaskProvider, parseTransactionError } from '../utils/blockchain';
import { debugWeb3State, validateWeb3Connection } from '../utils/debugWeb3';

// Estado inicial
const initialState: Web3State = {
  isConnected: false,
  account: null,
  chainId: null,
  provider: null,
  signer: null,
  connecting: false,
  error: null
};

console.log('🔍 Web3Context - Estado inicial configurado:', initialState);

// Tipos de acciones
type Web3Action =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; payload: { account: string; chainId: number; provider: any; signer: any } }
  | { type: 'CONNECT_ERROR'; payload: string }
  | { type: 'DISCONNECT' }
  | { type: 'ACCOUNT_CHANGED'; payload: string }
  | { type: 'CHAIN_CHANGED'; payload: number }
  | { type: 'CLEAR_ERROR' };

// Reducer
const web3Reducer = (state: Web3State, action: Web3Action): Web3State => {
  console.log('🔍 Web3Reducer - Action:', action.type, action);
  console.log('🔍 Web3Reducer - Estado anterior:', state);
  
  let newState: Web3State;
  
  switch (action.type) {
    case 'CONNECT_START':
      console.log('🔄 Iniciando conexión...');
      newState = { ...state, connecting: true, error: null };
      break;
    
    case 'CONNECT_SUCCESS':
      console.log('✅ Conexión exitosa:', action.payload);
      console.log('🔍 Estado anterior:', state);
      
      // Validar que provider y signer son válidos antes de marcar como conectado
      if (!action.payload.provider || !action.payload.signer) {
        console.error('❌ CONNECT_SUCCESS con provider o signer inválidos:', {
          hasProvider: !!action.payload.provider,
          hasSigner: !!action.payload.signer
        });
        newState = {
          ...state,
          isConnected: false,
          account: null,
          chainId: null,
          provider: null,
          signer: null,
          connecting: false,
          error: 'Error: Provider o signer inválidos'
        };
      } else {
        newState = {
          ...state,
          isConnected: true,
          account: action.payload.account,
          chainId: action.payload.chainId,
          provider: action.payload.provider,
          signer: action.payload.signer,
          connecting: false,
          error: null
        };
      }
      console.log('🔍 Nuevo estado:', newState);
      break;
    
    case 'CONNECT_ERROR':
      console.log('❌ Error de conexión:', action.payload);
      newState = {
        ...state,
        isConnected: false,
        account: null,
        chainId: null,
        provider: null,
        signer: null,
        connecting: false,
        error: action.payload
      };
      break;
    
    case 'DISCONNECT':
      console.log('🔌 Desconectando wallet...');
      newState = {
        ...initialState
      };
      break;
    
    case 'ACCOUNT_CHANGED':
      console.log('👤 Cuenta cambiada:', action.payload);
      // NO permitir ACCOUNT_CHANGED sin provider y signer
      if (!state.provider || !state.signer) {
        console.warn('⚠️ ACCOUNT_CHANGED ignorado - no hay provider/signer');
        newState = state;
      } else {
        newState = {
          ...state,
          account: action.payload,
          isConnected: !!action.payload
        };
      }
      break;
    
    case 'CHAIN_CHANGED':
      console.log('🔗 Chain cambiada:', action.payload);
      newState = {
        ...state,
        chainId: action.payload
      };
      break;
    
    case 'CLEAR_ERROR':
      console.log('🧹 Limpiando error...');
      newState = {
        ...state,
        error: null
      };
      break;
    
    default:
      newState = state;
  }
  
  // Validación final: asegurar que isConnected solo sea true si provider y signer son válidos
  if (newState.isConnected && (!newState.provider || !newState.signer)) {
    console.error('❌ Estado inconsistente detectado - corrigiendo:', {
      isConnected: newState.isConnected,
      hasProvider: !!newState.provider,
      hasSigner: !!newState.signer
    });
    newState = {
      ...newState,
      isConnected: false,
      error: 'Estado de conexión inconsistente - reconectando...'
    };
  }
  
  console.log('🔍 Web3Reducer - Nuevo estado:', newState);
  return newState;
};

// Contexto
interface Web3ContextType extends Web3State {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  clearError: () => void;
  clearInconsistentState: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Provider del contexto
interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(web3Reducer, initialState);

  console.log('🔍 Web3Provider - Renderizado con estado:', state);

  // Función para conectar wallet
  const connectWallet = async (): Promise<void> => {
    console.log('🔗 Iniciando conexión de wallet...');
    
    if (!isMetaMaskInstalled()) {
      console.error('❌ MetaMask no está instalado');
      dispatch({ type: 'CONNECT_ERROR', payload: 'MetaMask no está instalado. Por favor, instálalo para continuar.' });
      return;
    }

    dispatch({ type: 'CONNECT_START' });

    try {
      console.log('📡 Obteniendo provider...');
      const provider = getMetaMaskProvider();
      
      if (!provider) {
        throw new Error('No se pudo obtener el provider de MetaMask');
      }
      
      // Solicitar acceso a las cuentas con timeout
      if (window.ethereum) {
        console.log('🔐 Solicitando acceso a cuentas...');
        
        // Crear una promesa con timeout
        const accountsPromise = window.ethereum.request({ method: 'eth_requestAccounts' });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: MetaMask no respondió en 10 segundos')), 10000)
        );
        
        const accounts = await Promise.race([accountsPromise, timeoutPromise]);
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No se obtuvieron cuentas de MetaMask');
        }
      }
      
      console.log('✍️ Obteniendo signer...');
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Validar que todos los datos son válidos
      if (!provider || !signer || !account) {
        throw new Error('No se pudo obtener provider/signer/account de MetaMask');
      }

      console.log('✅ Datos obtenidos:', { account, chainId, hasProvider: !!provider, hasSigner: !!signer });

      dispatch({
        type: 'CONNECT_SUCCESS',
        payload: { account, chainId, provider, signer }
      });

      // Guardar en localStorage
      localStorage.setItem('musubi_wallet_connected', 'true');
      console.log('💾 Estado guardado en localStorage');

    } catch (error: any) {
      console.error('❌ Error durante la conexión:', error);
      const errorMessage = parseTransactionError(error);
      dispatch({ type: 'CONNECT_ERROR', payload: errorMessage });
    }
  };

  // Función para desconectar wallet
  const disconnectWallet = (): void => {
    console.log('🔌 Desconectando wallet...');
    dispatch({ type: 'DISCONNECT' });
    localStorage.removeItem('musubi_wallet_connected');
  };

  // Función para limpiar errores
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Función para limpiar estado inconsistente
  const clearInconsistentState = (): void => {
    console.log('🧹 Limpiando estado inconsistente...');
    dispatch({ type: 'DISCONNECT' });
    localStorage.removeItem('musubi_wallet_connected');
  };

  // Efecto para detectar y corregir estados inconsistentes
  useEffect(() => {
    if (state.isConnected && (!state.provider || !state.signer)) {
      console.error('❌ Estado inconsistente detectado en useEffect:', {
        isConnected: state.isConnected,
        hasProvider: !!state.provider,
        hasSigner: !!state.signer,
        account: state.account
      });
      clearInconsistentState();
    }
  }, [state.isConnected, state.provider, state.signer]);

  // Efecto para manejar cambios de cuenta
  useEffect(() => {
    console.log('🔍 Configurando listeners de MetaMask...');
    
    // Solo agregar listeners si MetaMask está disponible
    if (!isMetaMaskInstalled() || !window.ethereum) {
      console.log('⚠️ MetaMask no disponible para listeners');
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('👤 Accounts changed event triggered:', accounts);
      if (accounts.length === 0) {
        console.log('🔌 No accounts, disconnecting...');
        disconnectWallet();
      } else {
        console.log('🔄 Switching to account:', accounts[0]);
        
        // NO hacer dispatch ACCOUNT_CHANGED aquí
        // Actualizar el provider y signer para la nueva cuenta
        (async () => {
          try {
            const provider = getMetaMaskProvider();
            const signer = await provider.getSigner();
            const account = await signer.getAddress();
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);

            // Validar que todos los datos son válidos
            if (!provider || !signer || !account) {
              console.error('❌ Datos inválidos al cambiar cuenta');
              disconnectWallet();
              return;
            }

            console.log('🔄 Actualizando provider/signer para nueva cuenta');
            dispatch({
              type: 'CONNECT_SUCCESS',
              payload: { account, chainId, provider, signer }
            });
          } catch (error) {
            console.error('❌ Error actualizando provider para nueva cuenta:', error);
            disconnectWallet();
          }
        })();
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log('🔗 Chain changed event triggered:', chainId);
      const chainIdDecimal = parseInt(chainId, 16);
      console.log('🔄 Switching to chain ID:', chainIdDecimal);
      dispatch({ type: 'CHAIN_CHANGED', payload: chainIdDecimal });
      
      // Recargar la página si cambia la red (para evitar problemas de compatibilidad)
      if (chainIdDecimal !== 31337) {
        console.log('⚠️ Red incorrecta detectada, recargando página...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Agregar listeners solo si están disponibles
    try {
      console.log('📡 Adding MetaMask listeners...');
      
      // Remover listeners existentes para evitar duplicados
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      console.log('✅ Listeners de MetaMask configurados');
      
      // Verificar estado actual
      window.ethereum.request({ method: 'eth_accounts' }).then(async (accounts: string[]) => {
        console.log('📊 Current accounts from MetaMask:', accounts);
        if (accounts.length > 0) {
          console.log('🔄 Setting initial account:', accounts[0]);
          
          // Validar que tenemos provider y signer antes de marcar como conectado
          try {
            const provider = getMetaMaskProvider();
            const signer = await provider.getSigner();
            const account = await signer.getAddress();
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);

            // Validar que todos los datos son válidos
            if (!provider || !signer || !account) {
              console.error('❌ Datos inválidos al verificar estado inicial');
              return;
            }

            dispatch({
              type: 'CONNECT_SUCCESS',
              payload: { account, chainId, provider, signer }
            });
          } catch (error) {
            console.error('❌ Error verificando estado inicial:', error);
          }
        }
      }).catch((error: any) => {
        console.error('❌ Error getting current accounts:', error);
      });
      
    } catch (error) {
      // Silenciar errores de listeners si MetaMask no está completamente disponible
      console.error('❌ Error setting up MetaMask listeners:', error);
    }

    // Cleanup
    return () => {
      try {
        if (window.ethereum?.removeListener) {
          console.log('🧹 Removing MetaMask listeners...');
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          console.log('✅ Listeners de MetaMask removidos');
        }
      } catch (error) {
        // Silenciar errores de cleanup
        console.error('❌ Error removing MetaMask listeners:', error);
      }
    };
  }, []);

  // Efecto para auto-conectar
  useEffect(() => {
    console.log('🔄 Verificando auto-conexión...');
    const wasConnected = localStorage.getItem('musubi_wallet_connected');
    
    // Solo intentar auto-conectar si MetaMask está disponible
    if (wasConnected && isMetaMaskInstalled() && window.ethereum) {
      console.log('🔄 Intentando auto-conexión...');
      // Intentar reconectar automáticamente
      const autoConnect = async () => {
        try {
          const provider = getMetaMaskProvider();
          
          if (!provider) {
            console.error('❌ No se pudo obtener provider en auto-conexión');
            localStorage.removeItem('musubi_wallet_connected');
            return;
          }
          
          // Crear una promesa con timeout para eth_accounts
          const accountsPromise = window.ethereum!.request({ method: 'eth_accounts' });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: MetaMask no respondió en 5 segundos')), 5000)
          );
          
          const accounts = await Promise.race([accountsPromise, timeoutPromise]);
          
          if (accounts && accounts.length > 0) {
            console.log('✅ Auto-conexión exitosa');
            const signer = await provider.getSigner();
            const account = await signer.getAddress();
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);

            // Validar que todos los datos son válidos
            if (!provider || !signer || !account) {
              console.error('❌ Datos inválidos en auto-conexión');
              localStorage.removeItem('musubi_wallet_connected');
              return;
            }

            dispatch({
              type: 'CONNECT_SUCCESS',
              payload: { account, chainId, provider, signer }
            });
          } else {
            console.log('❌ No hay cuentas disponibles para auto-conexión');
            localStorage.removeItem('musubi_wallet_connected');
          }
        } catch (error) {
          // Silenciar errores de auto-conexión
          localStorage.removeItem('musubi_wallet_connected');
          console.debug('Auto-connect failed:', error);
        }
      };

      autoConnect();
    } else {
      console.log('⏭️ Auto-conexión no necesaria');
    }
  }, []);

  // Log del estado actual
  useEffect(() => {
    debugWeb3State(state, 'Web3Provider');
  }, [state]);

  const value: Web3ContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    clearError,
    clearInconsistentState
  };

  console.log('🔍 Web3Provider - Valor del contexto:', value);

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Hook para usar el contexto
export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 debe ser usado dentro de un Web3Provider');
  }
  
  console.log('🔍 useWeb3 - Hook llamado con contexto:', {
    isConnected: context.isConnected,
    account: context.account,
    hasProvider: !!context.provider,
    hasSigner: !!context.signer
  });
  
  return context;
};

