import React from 'react';
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

const AppContent: React.FC = () => {
  const { currentTab, isAuthModalOpen, closeAuthModal, confirmAuthModal } = useApp();

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
      <AppHeader />
      <main style={{ flex: 1 }}>{renderCurrentPage()}</main>
      <AppFooter />
      {isAuthModalOpen && (
        <LoginPromptDialog
          onClose={closeAuthModal}
          onConfirm={confirmAuthModal}
        />
      )}
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
