import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  User,
  FontSizeLevel,
} from '../types';

import { isConversationModeEnabled } from '../utils/featureFlags';

export type NavTab =
  | 'dashboard'
  | 'assist'
  | 'phrases'
  | 'conversation'
  | 'history'
  | 'login'
  | 'register'
  | 'settings'
  | 'diagnosis'
  | 'practice'
  | 'personalization'
  | 'personal';

// 실제 활성화되어 화면/메뉴에서 이동 가능한 탭 목록 반환
export const getValidTabs = (): NavTab[] => {
  const tabs: NavTab[] = [
    'dashboard',
    'assist',
    'phrases',
    'history',
    'login',
    'register',
    'settings',
  ];
  if (isConversationModeEnabled()) {
    tabs.splice(3, 0, 'conversation');
  }
  return tabs;
};



interface AppContextType {
  user: User | null;
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  requireAuth: (targetTab?: NavTab) => boolean;
  isAuthModalOpen: boolean;
  closeAuthModal: () => void;
  confirmAuthModal: () => void;
  goBack: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithKakao: () => Promise<void>;
  logout: () => void;
  completeWithdrawal: () => void;
  voiceDataVersion: number;
  notifyVoiceDataCleared: () => void;

  // Senior Accessibility Settings
  fontSize: FontSizeLevel;
  setFontSize: (level: FontSizeLevel) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  autoTtsPlayback: boolean;
  setAutoTtsPlayback: (val: boolean) => void;
  speechRate: number;
  setSpeechRate: (val: number) => void;

  // Onboarding
  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
}

import { loginApi, getMeApi, kakaoLoginApi } from '../api/auth';

const resolveUserProvider = (
  apiProvider?: 'LOCAL' | 'KAKAO',
  fallbackLoginProvider?: 'kakao' | 'email' | null,
  email?: string | null
): { provider: 'LOCAL' | 'KAKAO'; loginProvider: 'kakao' | 'email' } => {
  if (apiProvider === 'KAKAO') {
    return { provider: 'KAKAO', loginProvider: 'kakao' };
  }
  if (apiProvider === 'LOCAL') {
    return { provider: 'LOCAL', loginProvider: 'email' };
  }
  if (fallbackLoginProvider === 'kakao') {
    return { provider: 'KAKAO', loginProvider: 'kakao' };
  }
  if (fallbackLoginProvider === 'email') {
    return { provider: 'LOCAL', loginProvider: 'email' };
  }
  const isKakaoFallback = !email || email.includes('kakao');
  return isKakaoFallback
    ? { provider: 'KAKAO', loginProvider: 'kakao' }
    : { provider: 'LOCAL', loginProvider: 'email' };
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [voiceDataVersion, setVoiceDataVersion] = useState<number>(0);

  const notifyVoiceDataCleared = useCallback(() => {
    setVoiceDataVersion((v) => v + 1);
    window.dispatchEvent(new Event('voicebridge:voice-data-cleared'));
  }, []);
  const [currentTab, setCurrentTabState] = useState<NavTab>(() => {
    if (window.location.pathname === '/auth/kakao/callback') {
      return 'login';
    }
    const savedTab = sessionStorage.getItem('currentTab') as NavTab;
    if (!localStorage.getItem('accessToken') && (savedTab === 'login' || savedTab === 'register')) {
      const hasRedirect = sessionStorage.getItem('redirectTab');
      if (!hasRedirect) {
        return 'dashboard';
      }
    }
    return savedTab && getValidTabs().includes(savedTab) ? savedTab : 'dashboard';
  });

  const setCurrentTab = useCallback((tab: NavTab) => {
    const targetTab = getValidTabs().includes(tab) ? tab : 'dashboard';
    setCurrentTabState(targetTab);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const resolveRedirectTab = useCallback((): NavTab => {
    const target = sessionStorage.getItem('redirectTab') as NavTab;
    sessionStorage.removeItem('redirectTab');
    if (target && getValidTabs().includes(target) && target !== 'login' && target !== 'register') {
      return target;
    }
    return 'dashboard';
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAuthTarget, setPendingAuthTarget] = useState<NavTab | null>(null);

  const requireAuth = useCallback((targetTab?: NavTab): boolean => {
    if (user || localStorage.getItem('accessToken')) {
      return true;
    }
    const target = targetTab || (currentTab !== 'login' && currentTab !== 'register' ? currentTab : 'dashboard');
    setPendingAuthTarget(target);
    setIsAuthModalOpen(true);
    return false;
  }, [user, currentTab]);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setPendingAuthTarget(null);
  }, []);

  const confirmAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    const target = pendingAuthTarget || (currentTab !== 'login' && currentTab !== 'register' ? currentTab : 'dashboard');
    sessionStorage.setItem('redirectTab', target);
    setPendingAuthTarget(null);
    setCurrentTab('login');
  }, [pendingAuthTarget, currentTab, setCurrentTab]);

  const goBack = useCallback(() => {
    setCurrentTabState('dashboard');
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);
  
  const [fontSize, setFontSize] = useState<FontSizeLevel>(() => (localStorage.getItem('fontSize') as FontSizeLevel) || 'normal');
  const [highContrast, setHighContrast] = useState<boolean>(() => localStorage.getItem('highContrast') === 'true');
  const [autoTtsPlayback, setAutoTtsPlayback] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoTtsPlayback');
    return saved !== null ? saved === 'true' : true;
  });
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = localStorage.getItem('speechRate');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const openOnboarding = useCallback(() => {
    setIsOnboardingOpen(true);
  }, []);
  const closeOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
  }, []);
  // Sync currentTab
  useEffect(() => {
    sessionStorage.setItem('currentTab', currentTab);
  }, [currentTab]);

  // Sync settings and data attributes
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('highContrast', String(highContrast));
    localStorage.setItem('autoTtsPlayback', String(autoTtsPlayback));
    localStorage.setItem('speechRate', String(speechRate));

    document.documentElement.setAttribute('data-font-size', fontSize);
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    document.documentElement.setAttribute('data-high-contrast', String(highContrast));
  }, [fontSize, highContrast, autoTtsPlayback, speechRate]);

  // Handle Kakao OAuth Callback
  useEffect(() => {
    const handleKakaoCallback = async () => {
      if (window.location.pathname === '/auth/kakao/callback') {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        // Clean up URL immediately to prevent StrictMode double execution
        window.history.replaceState({}, document.title, '/');

        if (error) {
          const message = '카카오 로그인 중 오류가 발생하거나 취소되었습니다.';
          sessionStorage.setItem('kakaoLoginError', message);
          setCurrentTab('login');
          window.dispatchEvent(new CustomEvent('auth:kakao-error', { detail: message }));
          return;
        }

        if (code) {
          try {
            const res = await kakaoLoginApi(code);
            if (res.success && res.data) {
              localStorage.setItem('accessToken', res.data.accessToken);
              localStorage.setItem('refreshToken', res.data.refreshToken);
              
              const profileRes = await getMeApi(res.data.accessToken);
              if (profileRes.success && profileRes.data) {
                if (profileRes.data.email) {
                  localStorage.setItem('userEmail', profileRes.data.email);
                } else {
                  localStorage.removeItem('userEmail');
                }
                const { provider, loginProvider } = resolveUserProvider(
                  profileRes.data.provider,
                  'kakao',
                  profileRes.data.email
                );
                localStorage.setItem('loginProvider', loginProvider);
                setUser({
                  id: profileRes.data.userId,
                  name: profileRes.data.nickname,
                  email: profileRes.data.email ?? '',
                  createdAt: new Date().toISOString().split('T')[0],
                  loginProvider,
                  provider,
                });
                const target = resolveRedirectTab();
                setCurrentTab(target);
              } else {
                throw new Error('사용자 정보를 가져오는데 실패했습니다.');
              }
            } else {
              throw new Error('VoiceBridge 로그인에 실패했습니다.');
            }
          } catch (err: any) {
            console.error('Kakao login callback failed:', err);
            const message = '카카오 로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            sessionStorage.setItem('kakaoLoginError', message);
            setCurrentTab('login');
            window.dispatchEvent(new CustomEvent('auth:kakao-error', { detail: message }));
          }
        }
      }
    };

    handleKakaoCallback();
  }, [setCurrentTab, resolveRedirectTab]);

  // Restore login state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      getMeApi(token)
          .then(res => {
            if (res.success && res.data) {
              const savedProvider = localStorage.getItem('loginProvider') as 'kakao' | 'email' | null;
              const { provider, loginProvider } = resolveUserProvider(
                res.data.provider,
                savedProvider,
                res.data.email
              );
              localStorage.setItem('loginProvider', loginProvider);
              setUser({
                id: res.data.userId,
                name: res.data.nickname,
                email: res.data.email ?? '',
                createdAt: new Date().toISOString().split('T')[0],
                loginProvider,
                provider,
              });
              if (currentTab === 'login' || currentTab === 'register') {
                const target = resolveRedirectTab();
                setCurrentTab(target);
              }
            }
          })
        .catch(err => {
          console.error('Failed to restore user session:', err);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('loginProvider');
          sessionStorage.removeItem('redirectTab');
          setUser(null);
          if (currentTab === 'login' || currentTab === 'register') {
            setCurrentTab('dashboard');
          }
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Real API login
    const res = await loginApi(email, password);
      if (res.success && res.data) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('loginProvider', 'email');
        
        const profileRes = await getMeApi(res.data.accessToken);
        if (profileRes.success && profileRes.data) {
          const { provider, loginProvider } = resolveUserProvider(
            profileRes.data.provider,
            'email',
            profileRes.data.email
          );
          localStorage.setItem('loginProvider', loginProvider);
          setUser({
            id: profileRes.data.userId,
            name: profileRes.data.nickname,
            email: profileRes.data.email ?? '',
            createdAt: new Date().toISOString().split('T')[0],
            loginProvider,
            provider,
          });
          const target = resolveRedirectTab();
          setCurrentTab(target);
        }
      }
  };

  const loginWithKakao = async () => {
    const kakao = (window as any).Kakao;
    if (!kakao) {
      throw new Error('카카오 SDK가 로드되지 않았습니다.');
    }

    if (!kakao.isInitialized()) {
      const key = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
      if (!key) {
        throw new Error('카카오 JavaScript Key가 설정되지 않았습니다.');
      }
      kakao.init(key);
    }

    kakao.Auth.authorize({
      redirectUri: `${window.location.origin}/auth/kakao/callback`
    });
  };

  const clearUserSession = useCallback((targetTab: NavTab = 'dashboard') => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginProvider');
    sessionStorage.removeItem('currentTab');
    sessionStorage.removeItem('redirectTab');
    setIsAuthModalOpen(false);
    setPendingAuthTarget(null);
    setUser(null);
    notifyVoiceDataCleared();
    setCurrentTab(targetTab);
  }, [setCurrentTab, notifyVoiceDataCleared]);

  const logout = useCallback(() => {
    clearUserSession('dashboard');
  }, [clearUserSession]);

  const completeWithdrawal = useCallback(() => {
    clearUserSession('login');
  }, [clearUserSession]);

  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);




  return (
    <AppContext.Provider
      value={{
        user,
        currentTab,
        setCurrentTab,
        requireAuth,
        isAuthModalOpen,
        closeAuthModal,
        confirmAuthModal,
        goBack,
        login,
        loginWithKakao,
        logout,
        completeWithdrawal,
        voiceDataVersion,
        notifyVoiceDataCleared,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        autoTtsPlayback,
        setAutoTtsPlayback,
        speechRate,
        setSpeechRate,
        isOnboardingOpen,
        openOnboarding,
        closeOnboarding,
      }}
    >

      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
