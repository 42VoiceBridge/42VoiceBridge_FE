import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  User,
  DiagnosisResult,
  PracticeSentence,
  PersonalizationStatus,
  AssistVoiceMessage,
  FontSizeLevel,
} from '../types';
import {
  initialDiagnosisResult,
  initialHistoryResults,
  practiceSentences as defaultPracticeSentences,
  initialPersonalizationStatus,
  initialVoiceAssistHistory,
} from '../utils/mockData';

export type NavTab =
  | 'dashboard'
  | 'diagnosis'
  | 'practice'
  | 'personalization'
  | 'assist'
  | 'history'
  | 'login'
  | 'register'
  | 'personal'
  | 'settings';

const VALID_TABS: NavTab[] = [
  'dashboard',
  'diagnosis',
  'practice',
  'personalization',
  'assist',
  'history',
  'login',
  'register',
  'personal',
  'settings'
];

interface AppContextType {
  user: User | null;
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  goBack: () => void;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;

  // Senior Accessibility Settings
  fontSize: FontSizeLevel;
  setFontSize: (level: FontSizeLevel) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  autoTtsPlayback: boolean;
  setAutoTtsPlayback: (val: boolean) => void;
  speechRate: number;
  setSpeechRate: (val: number) => void;

  // Diagnosis & History
  latestDiagnosis: DiagnosisResult;
  historyResults: DiagnosisResult[];
  addDiagnosisResult: (result: DiagnosisResult) => void;

  // Practice
  practiceList: PracticeSentence[];
  updatePracticeScore: (id: string, score: number) => void;

  // Personalization
  personalization: PersonalizationStatus;
  addVoiceSample: () => void;
  triggerModelTraining: () => void;

  // Realtime Voice Assist
  assistMessages: AssistVoiceMessage[];
  addAssistMessage: (original: string, corrected: string, confidence: number) => void;
}

import { loginApi, getMeApi } from '../api/auth';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTabState] = useState<NavTab>(() => {
    const savedTab = sessionStorage.getItem('currentTab') as NavTab;
    return savedTab && VALID_TABS.includes(savedTab) ? savedTab : 'login';
  });

  const setCurrentTab = useCallback((tab: NavTab) => {
    setCurrentTabState(tab);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

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

  const [historyResults, setHistoryResults] = useState<DiagnosisResult[]>(initialHistoryResults);
  const [latestDiagnosis, setLatestDiagnosis] = useState<DiagnosisResult>(initialDiagnosisResult);
  const [practiceList, setPracticeList] = useState<PracticeSentence[]>(defaultPracticeSentences);
  const [personalization, setPersonalization] = useState<PersonalizationStatus>(initialPersonalizationStatus);
  const [assistMessages, setAssistMessages] = useState<AssistVoiceMessage[]>(initialVoiceAssistHistory);

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

  // Restore login state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedEmail = localStorage.getItem('userEmail');
    if (token && savedEmail) {
      if (token === 'mock-token') {
        setUser({
          id: 'user-01',
          name: '홍길동',
          email: savedEmail,
          createdAt: '2026-08-01',
        });
        if (currentTab === 'login' || currentTab === 'register') {
          setCurrentTab('dashboard');
        }
      } else {
        getMeApi(token)
          .then(res => {
            if (res.success && res.data) {
              setUser({
                id: res.data.userId,
                name: res.data.nickname,
                email: res.data.email,
                createdAt: new Date().toISOString().split('T')[0],
              });
              if (currentTab === 'login' || currentTab === 'register') {
                setCurrentTab('dashboard');
              }
            }
          })
          .catch(err => {
            console.error('Failed to restore user session:', err);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userEmail');
            setUser(null);
            setCurrentTab('login');
          });
      }
    }
  }, []);

  const login = async (email: string, password?: string) => {
    if (password) {
      // Real API login
      const res = await loginApi(email, password);
      if (res.success && res.data) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('userEmail', email);
        
        const profileRes = await getMeApi(res.data.accessToken);
        if (profileRes.success && profileRes.data) {
          setUser({
            id: profileRes.data.userId,
            name: profileRes.data.nickname,
            email: profileRes.data.email,
            createdAt: new Date().toISOString().split('T')[0],
          });
          setCurrentTab('dashboard');
        }
      }
    } else {
      // Mock / Demo login fallback (e.g. 체험하기)
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('userEmail', email);
      setUser({
        id: 'user-01',
        name: '홍길동',
        email,
        createdAt: '2026-08-01',
      });
      setCurrentTab('dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('currentTab');
    setUser(null);
    setCurrentTab('login');
  };

  const addDiagnosisResult = (result: DiagnosisResult) => {
    setLatestDiagnosis(result);
    setHistoryResults(prev => [result, ...prev]);
  };

  const updatePracticeScore = (id: string, score: number) => {
    setPracticeList(prev =>
      prev.map(item => (item.id === id ? { ...item, lastScore: score } : item))
    );
  };

  const addVoiceSample = () => {
    setPersonalization(prev => {
      const nextCount = Math.min(prev.targetCount, prev.collectedCount + 1);
      const isComplete = nextCount >= prev.targetCount;
      return {
        ...prev,
        collectedCount: nextCount,
        status: isComplete ? 'training' : 'collecting',
        personalizedAccuracy: isComplete ? 95 : prev.personalizedAccuracy,
      };
    });
  };

  const triggerModelTraining = () => {
    setPersonalization(prev => ({
      ...prev,
      status: 'training',
    }));

    setTimeout(() => {
      setPersonalization(prev => ({
        ...prev,
        status: 'completed',
        lastTrainedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        personalizedAccuracy: 96,
      }));
    }, 2500);
  };

  const addAssistMessage = (originalText: string, correctedText: string, confidence: number) => {
    const newMessage: AssistVoiceMessage = {
      id: 'msg-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      originalText,
      correctedText,
      confidence,
    };
    setAssistMessages(prev => [newMessage, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        currentTab,
        setCurrentTab,
        goBack,
        login,
        logout,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        autoTtsPlayback,
        setAutoTtsPlayback,
        speechRate,
        setSpeechRate,
        latestDiagnosis,
        historyResults,
        addDiagnosisResult,
        practiceList,
        updatePracticeScore,
        personalization,
        addVoiceSample,
        triggerModelTraining,
        assistMessages,
        addAssistMessage,
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
