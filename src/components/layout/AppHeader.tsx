import React from 'react';
import { Activity, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NavTab } from '../../context/AppContext';
import { AccessibilityBar } from '../common/AccessibilityBar';

export const AppHeader: React.FC = () => {
  const { user, currentTab, setCurrentTab, logout } = useApp();

  const navItems: { id: NavTab; label: string; iconLabel: string }[] = [
    { id: 'dashboard', label: '홈', iconLabel: '🏠' },
    { id: 'personalization', label: 'AI 학습', iconLabel: '🧠' },
    { id: 'diagnosis', label: '발음 관리', iconLabel: '🎤' },
    { id: 'history', label: '기록', iconLabel: '📜' },
    { id: 'settings', label: '설정', iconLabel: '⚙️' },
  ];

  return (
    <header className="bg-surface backdrop-blur-xl sticky top-0 z-10 border-b border-border shadow-sm">
      {/* Top Banner Row */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Service Title & Logo */}
        <div
          onClick={() => setCurrentTab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <Activity size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-primary)' }}>
                VoiceBridge
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-secondary-light)',
                  color: 'var(--color-secondary)',
                  fontWeight: 700,
                  border: '1px solid var(--color-secondary-border)',
                }}
              >
                AI 보조
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              AI 구음장애 보조 서비스
            </p>
          </div>
        </div>

        {/* Accessibility Bar & User Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <AccessibilityBar />

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--border-radius-full)',
                  border: '1.5px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  <UserIcon size={18} />
                </div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-title)' }}>
                  {user.name}님
                </span>
              </div>
              <button
                onClick={logout}
                title="로그아웃"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'transparent',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <LogOut size={16} />
                <span>로그아웃</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentTab('login')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                borderRadius: 'var(--border-radius-md)',
              }}
            >
              <LogIn size={18} />
              <span>로그인하기</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      {user && (
        <nav
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            borderTop: '1px solid var(--color-border)',
            overflowX: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              display: 'flex',
              padding: '4px 16px',
              gap: '8px',
            }}
          >
            {navItems.map((item) => {
              const isActive = currentTab === item.id || (item.id === 'diagnosis' && currentTab === 'practice');
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    fontSize: 'var(--text-base)',
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    backgroundColor: isActive ? 'var(--color-bg-surface)' : 'transparent',
                    borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                    borderRadius: '8px 8px 0 0',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{item.iconLabel}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};
