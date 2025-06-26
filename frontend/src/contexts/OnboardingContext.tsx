import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  showOnboarding: boolean;
  hasSeenWelcome: boolean;
  hasRegisteredProfile: boolean;
  currentWallet: string | null;
  isCheckingProfile: boolean;
}

interface OnboardingContextType extends OnboardingState {
  completeOnboarding: () => void;
  showOnboardingFlow: () => void;
  hideOnboardingFlow: () => void;
  markWelcomeSeen: () => void;
  markProfileRegistered: () => void;
  resetOnboarding: () => void;
  goToProfileRegistration: () => void;
  initialStep: string | null;
  setInitialStep: (step: string | null) => void;
  setCurrentWallet: (wallet: string | null) => void;
  checkProfileInBlockchain: (walletAddress: string) => Promise<boolean>;
  setIsCheckingProfile: (checking: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = 'musubi_onboarding_state';

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>({
    hasCompletedOnboarding: false,
    showOnboarding: false,
    hasSeenWelcome: false,
    hasRegisteredProfile: false,
    currentWallet: null,
    isCheckingProfile: false
  });

  const [initialStep, setInitialStep] = useState<string | null>(null);

  // Cargar estado desde localStorage al inicializar
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // No cargar currentWallet desde localStorage para evitar conflictos
        setState(prev => ({
          ...parsedState,
          currentWallet: null,
          isCheckingProfile: false
        }));
      } catch (error) {
        console.error('Error parsing onboarding state:', error);
      }
    } else {
      // Si es la primera vez, mostrar onboarding
      setState(prev => ({ ...prev, showOnboarding: true }));
    }
  }, []);

  // Efecto para verificar perfil existente cuando cambie la wallet
  useEffect(() => {
    console.log('🔍 OnboardingContext - Estado actual:', {
      currentWallet: state.currentWallet,
      hasRegisteredProfile: state.hasRegisteredProfile,
      showOnboarding: state.showOnboarding,
      hasCompletedOnboarding: state.hasCompletedOnboarding
    });

    const checkExistingProfile = async () => {
      if (state.currentWallet && !state.hasRegisteredProfile) {
        try {
          console.log('🔍 Verificando perfil para wallet:', state.currentWallet);
          // Consultar la API Musubi directamente
          const res = await fetch(`http://localhost:5003/api/users/wallet/${state.currentWallet}`);
          console.log('🔍 Respuesta de la API:', res.status, res.statusText);
          
          if (res.ok) {
            const data = await res.json();
            console.log('🔍 Datos de la API:', data);
            if (data && data.success && data.user) {
              console.log('✅ Perfil encontrado en API, marcando como registrado');
              markProfileRegistered();
              return;
            } else {
              console.log('❌ No se encontró perfil en la API');
            }
          } else {
            console.log('❌ Error en la API:', res.status);
          }
        } catch (error) {
          console.log('⚠️ Error verificando perfil en API:', error);
        }
      } else {
        console.log('🔍 No verificando perfil porque:', {
          tieneWallet: !!state.currentWallet,
          yaRegistrado: state.hasRegisteredProfile
        });
      }
    };
    checkExistingProfile();
  }, [state.currentWallet, state.hasRegisteredProfile]);

  // Guardar estado en localStorage cuando cambie (excluyendo currentWallet)
  useEffect(() => {
    const stateToSave = {
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      showOnboarding: state.showOnboarding,
      hasSeenWelcome: state.hasSeenWelcome,
      hasRegisteredProfile: state.hasRegisteredProfile
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [state.hasCompletedOnboarding, state.showOnboarding, state.hasSeenWelcome, state.hasRegisteredProfile]);

  // Efecto para escuchar eventos personalizados
  useEffect(() => {
    const handleResetOnboarding = () => {
      console.log('🔄 Evento resetOnboarding recibido, limpiando estado...');
      resetOnboarding();
    };

    const handleShowNotification = (event: CustomEvent) => {
      console.log('📢 Evento showNotification recibido:', event.detail);
      // Aquí podríamos mostrar la notificación si tuviéramos acceso al contexto de notificaciones
    };

    // Escuchar eventos personalizados
    window.addEventListener('resetOnboarding', handleResetOnboarding);
    window.addEventListener('showNotification', handleShowNotification as EventListener);

    return () => {
      window.removeEventListener('resetOnboarding', handleResetOnboarding);
      window.removeEventListener('showNotification', handleShowNotification as EventListener);
    };
  }, []);

  const completeOnboarding = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      showOnboarding: false,
      hasSeenWelcome: true
    }));
  }, []);

  const showOnboardingFlow = useCallback(() => {
    setState(prev => ({ ...prev, showOnboarding: true }));
  }, []);

  const hideOnboardingFlow = useCallback(() => {
    setState(prev => ({ ...prev, showOnboarding: false }));
  }, []);

  const markWelcomeSeen = useCallback(() => {
    setState(prev => ({ ...prev, hasSeenWelcome: true }));
  }, []);

  const markProfileRegistered = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      hasRegisteredProfile: true,
      hasCompletedOnboarding: true,
      showOnboarding: false
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasCompletedOnboarding: false,
      showOnboarding: true,
      hasSeenWelcome: false,
      hasRegisteredProfile: false,
      currentWallet: null,
      isCheckingProfile: false
    }));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const goToProfileRegistration = useCallback(() => {
    setInitialStep('profile');
    setState(prev => ({ 
      ...prev, 
      showOnboarding: true, 
      hasCompletedOnboarding: false 
    }));
  }, []);

  const setCurrentWallet = useCallback((wallet: string | null) => {
    setState(prev => ({ ...prev, currentWallet: wallet }));
    // Verificar automáticamente si la wallet tiene perfil
    if (wallet && !state.hasRegisteredProfile) {
      fetch(`http://localhost:5003/api/users/wallet/${wallet}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.user) {
            console.log('✅ Perfil encontrado en API (setCurrentWallet), marcando como registrado');
            markProfileRegistered();
          }
        })
        .catch(error => {
          console.log('⚠️ Error verificando perfil en API (setCurrentWallet):', error);
        });
    }
  }, [state.hasRegisteredProfile, markProfileRegistered]);

  const setIsCheckingProfile = useCallback((checking: boolean) => {
    setState(prev => ({ ...prev, isCheckingProfile: checking }));
  }, []);

  // Función para verificar si un perfil existe en la blockchain
  const checkProfileInBlockchain = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      setIsCheckingProfile(true);
      console.log('🔍 Iniciando verificación de perfil para:', walletAddress);
      
      // Crear una promesa con timeout
      const verificationPromise = (async () => {
        // Importación dinámica para evitar dependencias circulares
        console.log('📦 Importando ProfileRegistryIPFSService...');
        const { ProfileRegistryIPFSService } = await import('../services/contracts');
        
        console.log('🔧 Creando ProfileRegistryIPFSService...');
        const service = new ProfileRegistryIPFSService();
        console.log('🔧 Service creado correctamente');
        
        // Verificar si la dirección tiene un perfil registrado en la API
        console.log('🔍 Llamando a service.getProfileFromIPFS...');
        const profile = await service.getProfileFromIPFS(walletAddress);
        console.log('🔍 Respuesta de getProfileFromIPFS:', profile);
        
        const profileExists = profile !== null;
        
        console.log(`🔍 Verificando perfil para ${walletAddress}:`, profileExists);
        console.log('🔍 Datos del perfil:', profile);
        
        return profileExists;
      })();

      // Timeout de 15 segundos
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout: La verificación de perfil tardó más de 15 segundos'));
        }, 15000);
      });

      const result = await Promise.race([verificationPromise, timeoutPromise]);
      return result;
      
    } catch (error: any) {
      console.error('❌ Error verificando perfil en blockchain:', error);
      console.error('❌ Stack trace:', error.stack);
      return false;
    } finally {
      console.log('🔍 Finalizando verificación de perfil');
      setIsCheckingProfile(false);
    }
  }, [setIsCheckingProfile]);

  const value: OnboardingContextType = {
    ...state,
    completeOnboarding,
    showOnboardingFlow,
    hideOnboardingFlow,
    markWelcomeSeen,
    markProfileRegistered,
    resetOnboarding,
    goToProfileRegistration,
    initialStep,
    setInitialStep,
    setCurrentWallet,
    checkProfileInBlockchain,
    setIsCheckingProfile
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default OnboardingContext;

