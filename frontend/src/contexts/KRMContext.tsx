import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWeb3 } from './Web3Context';
import { KRMTokenService } from '../services/contracts';
import { CONTRACT_ADDRESSES } from '../config';
import { CONTRACT_ABIS } from '../services/abis';
import { ethers } from 'ethers';

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
    console.log('🔍 KRMContext.useEffect - Estado de conexión:', {
      isConnected,
      hasProvider: !!provider,
      account,
      currentBalance: balance
    });
    
    if (isConnected && provider && account) {
      console.log('🔍 KRMContext.useEffect - Ejecutando loadBalance...');
      loadBalance();
      
      // Escuchar eventos de transferencia para actualizar el balance automáticamente
      const krmToken = new ethers.Contract(
        CONTRACT_ADDRESSES.KRMToken,
        CONTRACT_ABIS.KRMToken,
        provider
      );
      
      const handleTransfer = (from: string, to: string, value: any) => {
        if (from.toLowerCase() === account.toLowerCase() || to.toLowerCase() === account.toLowerCase()) {
          console.log('🔄 KRMContext - Evento de transferencia detectado, actualizando balance...');
          console.log('🔄 KRMContext - From:', from, 'To:', to, 'Value:', ethers.formatEther(value));
          setTimeout(() => loadBalance(), 1000); // Esperar 1 segundo para que se confirme la transacción
        }
      };
      
      krmToken.on('Transfer', handleTransfer);
      
      return () => {
        console.log('🔍 KRMContext - Limpiando listener de eventos');
        krmToken.off('Transfer', handleTransfer);
      };
    } else {
      console.log('🔍 KRMContext.useEffect - No hay conexión completa, reseteando balance');
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