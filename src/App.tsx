import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/layout/AppHeader';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DiagnosisPage } from './pages/diagnosis/DiagnosisPage';
import { PracticePage } from './pages/practice/PracticePage';
import { PersonalizationPage } from './pages/personalization/PersonalizationPage';
import { VoiceAssistPage } from './pages/assist/VoiceAssistPage';
import { HistoryPage } from './pages/history/HistoryPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AppFooter } from './components/layout/AppFooter';

const AppContent: React.FC = () => {
  const { currentTab, user } = useApp();

  const renderCurrentPage = () => {
    // If not logged in, show auth screens
    if (!user) {
      if (currentTab === 'register') {
        return <RegisterPage />;
      }
      return <LoginPage />;
    }

    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'diagnosis':
        return <DiagnosisPage />;
      case 'practice':
        return <PracticePage />;
      case 'personalization':
        return <PersonalizationPage />;
      case 'assist':
        return <VoiceAssistPage />;
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

      {user && <AppFooter />}
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
