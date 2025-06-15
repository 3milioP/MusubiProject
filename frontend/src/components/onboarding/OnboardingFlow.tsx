import React, { useState } from 'react';
import WelcomeScreen from './WelcomeScreen';
import MetaMaskTutorial from '../tutorial/MetaMaskTutorial';
import MusubiTutorial from '../tutorial/MusubiTutorial';

export type OnboardingStep = 'welcome' | 'metamask' | 'musubi' | 'complete';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  const handleWelcomeGetStarted = () => {
    setCurrentStep('metamask');
  };

  const handleWelcomeSkip = () => {
    setCurrentStep('complete');
    onComplete();
  };

  const handleMetaMaskComplete = () => {
    setCurrentStep('musubi');
  };

  const handleMetaMaskSkip = () => {
    setCurrentStep('complete');
    onComplete();
  };

  const handleMusubiComplete = () => {
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
      default:
        return null;
    }
  };

  return <>{renderCurrentStep()}</>;
};

export default OnboardingFlow;

