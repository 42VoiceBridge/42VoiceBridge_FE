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

      {/* Accessible Footer with Senior Helpline */}
      <footer
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderTop: '2px solid var(--color-border)',
          padding: '28px 24px',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-primary)' }}>
              VoiceBridge (AI 구음장애 보조 서비스)
            </span>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              안정적인 의사소통과 선명한 발음을 위한 인공지능 음성 케어 솔루션
            </p>
          </div>

          <div
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
            }}
          >
            ☎️ 이용 지원 문의 및 상담: <span style={{ color: 'var(--color-primary)' }}>1588-4200</span>
          </div>
        </div>
      </footer>
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
