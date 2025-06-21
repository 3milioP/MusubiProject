import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Web3ContextType {
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
  balance: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

// Datos hardcodeados para testing
const MOCK_ACCOUNT = '0x742d35Cc6634C0532925a3b8D4C9db96590e4CAF';
const MOCK_BALANCE = '1250.75';
const MOCK_CHAIN_ID = 31337;

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true); // Siempre conectado para testing
  const [account, setAccount] = useState<string | null>(MOCK_ACCOUNT);
  const [chainId, setChainId] = useState<number | null>(MOCK_CHAIN_ID);
  const [balance, setBalance] = useState(MOCK_BALANCE);

  const connectWallet = async () => {
    // Simular conexión exitosa
    setIsConnected(true);
    setAccount(MOCK_ACCOUNT);
    setChainId(MOCK_CHAIN_ID);
    setBalance(MOCK_BALANCE);
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount(null);
    setChainId(null);
    setBalance('0');
  };

  const switchNetwork = async (targetChainId: number) => {
    // Simular cambio de red exitoso
    setChainId(targetChainId);
  };

  const value: Web3ContextType = {
    isConnected,
    account,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

