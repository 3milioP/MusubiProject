import React, { useState } from 'react';
import WelcomeScreen from './WelcomeScreen';
import MetaMaskTutorial from '../tutorial/MetaMaskTutorial';
import MusubiTutorial from '../tutorial/MusubiTutorial';
import MusubiIntroTutorial from '../tutorial/MusubiIntroTutorial';
import ProfileRegistration from './ProfileRegistration';

export type OnboardingStep = 'welcome' | 'intro' | 'metamask' | 'musubi' | 'profile' | 'complete';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  const handleWelcomeGetStarted = () => {
    setCurrentStep('intro');
  };

  const handleWelcomeSkip = () => {
    setCurrentStep('profile');
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

