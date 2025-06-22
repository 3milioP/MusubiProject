import { useEffect, useRef, useState } from 'react';

interface AccountChangeHook {
  currentAccount: string | null;
  accountHistory: string[];
  changeCount: number;
  lastChangeTime: Date | null;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearHistory: () => void;
}

export const useAccountChange = (): AccountChangeHook => {
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [accountHistory, setAccountHistory] = useState<string[]>([]);
  const [changeCount, setChangeCount] = useState(0);
  const [lastChangeTime, setLastChangeTime] = useState<Date | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const listenersRef = useRef<{
    accountsChanged?: (accounts: string[]) => void;
    chainChanged?: (chainId: string) => void;
  }>({});

  const handleAccountsChanged = (accounts: string[]) => {
    console.log('👤 useAccountChange - Accounts changed:', accounts);
    
    const newAccount = accounts[0] || null;
    const timestamp = new Date();
    
    if (newAccount !== currentAccount) {
      setCurrentAccount(newAccount);
      setChangeCount(prev => prev + 1);
      setLastChangeTime(timestamp);
      
      if (newAccount) {
        setAccountHistory(prev => [...prev, `${timestamp.toISOString()}: ${newAccount}`]);
      }
      
      console.log('🔄 useAccountChange - Account updated:', {
        previous: currentAccount,
        current: newAccount,
        changeCount: changeCount + 1,
        timestamp
      });
    }
  };

  const handleChainChanged = (chainId: string) => {
    const chainIdDecimal = parseInt(chainId, 16);
    console.log('🔗 useAccountChange - Chain changed:', chainIdDecimal);
    
    // Recargar la página si cambia a una red incorrecta
    if (chainIdDecimal !== 31337) {
      console.log('⚠️ useAccountChange - Wrong network detected, reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const startListening = () => {
    if (typeof window.ethereum === 'undefined') {
      console.error('❌ useAccountChange - MetaMask not available');
      return;
    }

    if (isListening) {
      console.log('⚠️ useAccountChange - Already listening');
      return;
    }

    try {
      console.log('📡 useAccountChange - Starting listeners...');
      
      // Remover listeners existentes si los hay
      if (listenersRef.current.accountsChanged && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', listenersRef.current.accountsChanged);
      }
      if (listenersRef.current.chainChanged && window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', listenersRef.current.chainChanged);
      }
      
      // Configurar nuevos listeners
      listenersRef.current.accountsChanged = handleAccountsChanged;
      listenersRef.current.chainChanged = handleChainChanged;
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      setIsListening(true);
      console.log('✅ useAccountChange - Listeners started');
      
      // Obtener cuenta actual
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          console.log('✅ useAccountChange - Initial account set:', accounts[0]);
        }
      }).catch((error: any) => {
        console.error('❌ useAccountChange - Error getting initial accounts:', error);
      });
      
    } catch (error) {
      console.error('❌ useAccountChange - Error starting listeners:', error);
    }
  };

  const stopListening = () => {
    if (!isListening) {
      return;
    }

    try {
      console.log('🛑 useAccountChange - Stopping listeners...');
      
      if (window.ethereum?.removeListener) {
        if (listenersRef.current.accountsChanged) {
          window.ethereum.removeListener('accountsChanged', listenersRef.current.accountsChanged);
        }
        if (listenersRef.current.chainChanged) {
          window.ethereum.removeListener('chainChanged', listenersRef.current.chainChanged);
        }
      }
      
      listenersRef.current = {};
      setIsListening(false);
      console.log('✅ useAccountChange - Listeners stopped');
      
    } catch (error) {
      console.error('❌ useAccountChange - Error stopping listeners:', error);
    }
  };

  const clearHistory = () => {
    setAccountHistory([]);
    setChangeCount(0);
    setLastChangeTime(null);
    console.log('🧹 useAccountChange - History cleared');
  };

  // Iniciar listeners automáticamente cuando el componente se monta
  useEffect(() => {
    startListening();
    
    // Cleanup cuando el componente se desmonta
    return () => {
      stopListening();
    };
  }, []);

  return {
    currentAccount,
    accountHistory,
    changeCount,
    lastChangeTime,
    isListening,
    startListening,
    stopListening,
    clearHistory
  };
}; 