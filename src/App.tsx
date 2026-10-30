import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/layout/AppHeader';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { VoiceAssistPage } from './pages/assist/VoiceAssistPage';
import { PhrasesPage } from './pages/phrases/PhrasesPage';
import { HistoryPage } from './pages/history/HistoryPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AppFooter } from './components/layout/AppFooter';
import { LoginPromptDialog } from './components/common/LoginPromptDialog';
import { SplashScreen } from './components/common/SplashScreen';
import { OnboardingModal } from './components/common/OnboardingModal';

const AppContent: React.FC = () => {
  const {
    currentTab,
    isAuthModalOpen,
    closeAuthModal,
    confirmAuthModal,
    isOnboardingOpen,
    openOnboarding,
    closeOnboarding,
  } = useApp();

  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem('vb_splash_viewed') !== 'true';
  });

  useEffect(() => {
    if (!showSplash) {
      if (localStorage.getItem('vb_onboarding_completed') !== 'true') {
        openOnboarding();
      }
    }
  }, [showSplash, openOnboarding]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (localStorage.getItem('vb_onboarding_completed') !== 'true') {
      openOnboarding();
    }
  };

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'assist':
        return <VoiceAssistPage />;
      case 'phrases':
        return <PhrasesPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <AppHeader />
      <main style={{ flex: 1 }}>{renderCurrentPage()}</main>
      <AppFooter />
      {isAuthModalOpen && (
        <LoginPromptDialog
          onClose={closeAuthModal}
          onConfirm={confirmAuthModal}
        />
      )}
      <OnboardingModal
        isOpen={isOnboardingOpen && !showSplash}
        onClose={closeOnboarding}
      />
    </div>
  );
};


export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
