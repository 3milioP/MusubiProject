import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWeb3 } from './Web3Context';
import { KRMTokenService } from '../services/contracts';

interface KRMContextType {
  balance: string;
  loading: boolean;
  loadBalance: () => Promise<void>;
}

const KRMContext = createContext<KRMContextType | undefined>(undefined);

interface KRMProviderProps {
  children: ReactNode;
}

export const KRMProvider: React.FC<KRMProviderProps> = ({ children }) => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!isConnected || !provider || !account) {
      console.log('🔍 KRMContext - No hay conexión completa:', {
        isConnected,
        hasProvider: !!provider,
        account
      });
      setBalance('0');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 KRMContext - Cargando balance para cuenta:', account);
      
      const service = new KRMTokenService(provider, signer);
      const balanceValue = await service.getBalance(account);
      console.log('🔍 KRMContext - Balance obtenido:', balanceValue);
      setBalance(balanceValue);
      console.log('✅ KRMContext - Balance cargado:', balanceValue);
    } catch (error) {
      console.error('❌ Error loading KRM balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, signer, account]);

  // Cargar balance cuando cambie la conexión
  useEffect(() => {
    if (isConnected && provider && account) {
      console.log('🔍 KRMContext - Ejecutando loadBalance...');
      loadBalance();
    } else {
      console.log('🔍 KRMContext - No hay conexión completa, reseteando balance');
      setBalance('0');
      setLoading(false);
    }
  }, [isConnected, provider, account, loadBalance]);

  const value: KRMContextType = {
    balance,
    loading,
    loadBalance
  };

  // Log para debuggear el estado del contexto
  console.log('🔍 KRMContext - Estado actual:', {
    balance,
    loading,
    isConnected,
    account,
    hasProvider: !!provider,
    balanceType: typeof balance,
    balanceValue: balance
  });

  return (
    <KRMContext.Provider value={value}>
      {children}
    </KRMContext.Provider>
  );
};

export const useKRM = (): KRMContextType => {
  const context = useContext(KRMContext);
  if (context === undefined) {
    throw new Error('useKRM must be used within a KRMProvider');
  }
  return context;
}; 