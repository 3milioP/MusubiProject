import React, { useState, useEffect } from 'react';
import WelcomeScreen from './WelcomeScreen';
import MetaMaskTutorial from '../tutorial/MetaMaskTutorial';
import MusubiTutorial from '../tutorial/MusubiTutorial';
import MusubiIntroTutorial from '../tutorial/MusubiIntroTutorial';
import ProfileRegistration from './ProfileRegistration';
import { useWeb3 } from '../../contexts/Web3Context';

export type OnboardingStep = 'welcome' | 'intro' | 'metamask' | 'musubi' | 'profile' | 'complete';

interface OnboardingFlowProps {
  onComplete: () => void;
  onExit?: () => void;
  initialStep?: OnboardingStep;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onExit, initialStep }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep || 'welcome');
  const { isConnected, account } = useWeb3();

  // Debug: Monitorear estado de conexión
  useEffect(() => {
    console.log('🔍 OnboardingFlow - Estado de conexión actualizado:', {
      currentStep,
      isConnected,
      account
    });
  }, [currentStep, isConnected, account]);

  const handleWelcomeGetStarted = () => {
    setCurrentStep('intro');
  };

  const handleWelcomeSkip = () => {
    setCurrentStep('profile');
  };

  const handleWelcomeExit = () => {
    onExit?.();
  };

  const handleIntroComplete = () => {
    setCurrentStep('metamask');
  };

  const handleMetaMaskComplete = () => {
    setCurrentStep('musubi');
  };

  const handleMetaMaskSkip = () => {
    setCurrentStep('profile');
  };

  const handleMusubiComplete = () => {
    setCurrentStep('profile');
  };

  const handleProfileComplete = () => {
    setCurrentStep('complete');
    onComplete();
  };

  const handleProfileSkip = () => {
    setCurrentStep('complete');
    onComplete();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomeScreen
            onGetStarted={handleWelcomeGetStarted}
            onSkipTutorial={handleWelcomeSkip}
            onExit={handleWelcomeExit}
          />
        );
      case 'intro':
        return (
          <MusubiIntroTutorial
            onComplete={handleIntroComplete}
          />
        );
      case 'metamask':
        return (
          <MetaMaskTutorial
            onComplete={handleMetaMaskComplete}
            onSkip={handleMetaMaskSkip}
          />
        );
      case 'musubi':
        return (
          <MusubiTutorial
            onComplete={handleMusubiComplete}
          />
        );
      case 'profile':
        return (
          <ProfileRegistration
            onComplete={handleProfileComplete}
            onSkip={handleProfileSkip}
          />
        );
      default:
        return null;
    }
  };

  return <>{renderCurrentStep()}</>;
};

export default OnboardingFlow;

