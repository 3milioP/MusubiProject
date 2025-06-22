import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

export interface DebugState {
  web3State: {
    isConnected: boolean;
    account: string | null;
    chainId: number | null;
    provider: boolean;
    signer: boolean;
  };
  hooksState: {
    krmLoading: boolean;
    profileLoading: boolean;
    skillsLoading: boolean;
    timeLoading: boolean;
    marketplaceLoading: boolean;
  };
  errors: string[];
  lastUpdate: Date;
}

export const useDebug = () => {
  const { isConnected, account, chainId, provider, signer } = useWeb3();
  const [debugState, setDebugState] = useState<DebugState>({
    web3State: {
      isConnected: false,
      account: null,
      chainId: null,
      provider: false,
      signer: false,
    },
    hooksState: {
      krmLoading: false,
      profileLoading: false,
      skillsLoading: false,
      timeLoading: false,
      marketplaceLoading: false,
    },
    errors: [],
    lastUpdate: new Date(),
  });

  const updateDebugState = useCallback(() => {
    setDebugState(prev => ({
      ...prev,
      web3State: {
        isConnected,
        account,
        chainId,
        provider: !!provider,
        signer: !!signer,
      },
      lastUpdate: new Date(),
    }));
  }, [isConnected, account, chainId, provider, signer]);

  // Actualizar estado cada segundo
  useEffect(() => {
    updateDebugState();
    const interval = setInterval(updateDebugState, 1000);
    return () => clearInterval(interval);
  }, [updateDebugState]);

  // Monitorear cambios en el estado de Web3
  useEffect(() => {
    console.log('🔍 Debug - Web3 State Changed:', {
      isConnected,
      account,
      chainId,
      hasProvider: !!provider,
      hasSigner: !!signer,
    });
  }, [isConnected, account, chainId, provider, signer]);

  return {
    debugState,
    updateDebugState,
  };
}; 