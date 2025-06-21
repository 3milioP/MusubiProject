import React, { useState } from 'react';
import WelcomeScreen from './WelcomeScreen';
import MetaMaskTutorial from '../tutorial/MetaMaskTutorial';
import MusubiTutorial from '../tutorial/MusubiTutorial';
import MusubiIntroTutorial from '../tutorial/MusubiIntroTutorial';

export type OnboardingStep = 'welcome' | 'intro' | 'metamask' | 'musubi' | 'complete';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  const handleWelcomeGetStarted = () => {
    setCurrentStep('intro');
  };

  const handleWelcomeSkip = () => {
    setCurrentStep('complete');
    onComplete();
  };

  const handleIntroComplete = () => {
    setCurrentStep('metamask');
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
      default:
        return null;
    }
  };

  return <>{renderCurrentStep()}</>;
};

export default OnboardingFlow;

