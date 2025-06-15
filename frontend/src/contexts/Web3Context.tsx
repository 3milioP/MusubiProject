// Contexto de Web3 para manejo de wallet y conexión blockchain
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Web3State } from '../types';
import { isMetaMaskInstalled, getMetaMaskProvider, parseTransactionError } from '../utils/blockchain';

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
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, connecting: true, error: null };
    
    case 'CONNECT_SUCCESS':
      return {
        ...state,
        isConnected: true,
        account: action.payload.account,
        chainId: action.payload.chainId,
        provider: action.payload.provider,
        signer: action.payload.signer,
        connecting: false,
        error: null
      };
    
    case 'CONNECT_ERROR':
      return {
        ...state,
        isConnected: false,
        account: null,
        chainId: null,
        provider: null,
        signer: null,
        connecting: false,
        error: action.payload
      };
    
    case 'DISCONNECT':
      return {
        ...initialState
      };
    
    case 'ACCOUNT_CHANGED':
      return {
        ...state,
        account: action.payload,
        isConnected: !!action.payload
      };
    
    case 'CHAIN_CHANGED':
      return {
        ...state,
        chainId: action.payload
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Contexto
interface Web3ContextType extends Web3State {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  clearError: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Provider del contexto
interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(web3Reducer, initialState);

  // Función para conectar wallet
  const connectWallet = async (): Promise<void> => {
    if (!isMetaMaskInstalled()) {
      dispatch({ type: 'CONNECT_ERROR', payload: 'MetaMask no está instalado. Por favor, instálalo para continuar.' });
      return;
    }

    dispatch({ type: 'CONNECT_START' });

    try {
      const provider = getMetaMaskProvider();
      
      // Solicitar acceso a las cuentas
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
      
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      dispatch({
        type: 'CONNECT_SUCCESS',
        payload: { account, chainId, provider, signer }
      });

      // Guardar en localStorage
      localStorage.setItem('musubi_wallet_connected', 'true');

    } catch (error: any) {
      const errorMessage = parseTransactionError(error);
      dispatch({ type: 'CONNECT_ERROR', payload: errorMessage });
    }
  };

  // Función para desconectar wallet
  const disconnectWallet = (): void => {
    dispatch({ type: 'DISCONNECT' });
    localStorage.removeItem('musubi_wallet_connected');
  };

  // Función para limpiar errores
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Efecto para manejar cambios de cuenta
  useEffect(() => {
    if (!isMetaMaskInstalled() || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        dispatch({ type: 'ACCOUNT_CHANGED', payload: accounts[0] });
      }
    };

    const handleChainChanged = (chainId: string) => {
      dispatch({ type: 'CHAIN_CHANGED', payload: parseInt(chainId, 16) });
    };

    // Agregar listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Cleanup
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Efecto para reconectar automáticamente
  useEffect(() => {
    const wasConnected = localStorage.getItem('musubi_wallet_connected');
    
    if (wasConnected && isMetaMaskInstalled() && window.ethereum) {
      // Intentar reconectar automáticamente
      const autoConnect = async () => {
        try {
          const provider = getMetaMaskProvider();
          const accounts = await window.ethereum!.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const account = await signer.getAddress();
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);

            dispatch({
              type: 'CONNECT_SUCCESS',
              payload: { account, chainId, provider, signer }
            });
          } else {
            localStorage.removeItem('musubi_wallet_connected');
          }
        } catch (error) {
          localStorage.removeItem('musubi_wallet_connected');
        }
      };

      autoConnect();
    }
  }, []);

  const value: Web3ContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    clearError
  };

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
  return context;
};

