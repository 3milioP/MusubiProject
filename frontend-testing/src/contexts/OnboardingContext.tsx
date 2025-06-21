import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  showOnboarding: boolean;
  hasSeenWelcome: boolean;
}

interface OnboardingContextType extends OnboardingState {
  completeOnboarding: () => void;
  showOnboardingFlow: () => void;
  hideOnboardingFlow: () => void;
  markWelcomeSeen: () => void;
  resetOnboarding: () => void;
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
    hasSeenWelcome: false
  });

  // Cargar estado desde localStorage al inicializar
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setState(parsedState);
      } catch (error) {
        console.error('Error parsing onboarding state:', error);
      }
    } else {
      // Si es la primera vez, mostrar onboarding
      setState(prev => ({ ...prev, showOnboarding: true }));
    }
  }, []);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const completeOnboarding = () => {
    setState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      showOnboarding: false,
      hasSeenWelcome: true
    }));
  };

  const showOnboardingFlow = () => {
    setState(prev => ({ ...prev, showOnboarding: true }));
  };

  const hideOnboardingFlow = () => {
    setState(prev => ({ ...prev, showOnboarding: false }));
  };

  const markWelcomeSeen = () => {
    setState(prev => ({ ...prev, hasSeenWelcome: true }));
  };

  const resetOnboarding = () => {
    setState({
      hasCompletedOnboarding: false,
      showOnboarding: true,
      hasSeenWelcome: false
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: OnboardingContextType = {
    ...state,
    completeOnboarding,
    showOnboardingFlow,
    hideOnboardingFlow,
    markWelcomeSeen,
    resetOnboarding
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

