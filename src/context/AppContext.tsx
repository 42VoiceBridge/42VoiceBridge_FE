import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  User,
  DiagnosisResult,
  PracticeSentence,
  PersonalizationStatus,
  AssistVoiceMessage,
  FontSizeLevel,
} from '../types';
import {
  currentUser as defaultUser,
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

interface AppContextType {
  user: User | null;
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  login: (email: string, name?: string) => void;
  logout: () => void;
  register: (name: string, email: string) => void;

  // Senior Accessibility Settings
  fontSize: FontSizeLevel;
  setFontSize: (level: FontSizeLevel) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;

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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(defaultUser);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [fontSize, setFontSize] = useState<FontSizeLevel>('normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  const [historyResults, setHistoryResults] = useState<DiagnosisResult[]>(initialHistoryResults);
  const [latestDiagnosis, setLatestDiagnosis] = useState<DiagnosisResult>(initialDiagnosisResult);
  const [practiceList, setPracticeList] = useState<PracticeSentence[]>(defaultPracticeSentences);
  const [personalization, setPersonalization] = useState<PersonalizationStatus>(initialPersonalizationStatus);
  const [assistMessages, setAssistMessages] = useState<AssistVoiceMessage[]>(initialVoiceAssistHistory);

  // Sync data attributes to <html> or <body> for Senior Accessibility
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-high-contrast', String(highContrast));
  }, [fontSize, highContrast]);

  const login = (email: string, name = '홍길동') => {
    setUser({
      id: 'user-01',
      name,
      email,
      createdAt: '2026-08-01',
    });
    setCurrentTab('dashboard');
  };

  const logout = () => {
    setUser(null);
    setCurrentTab('login');
  };

  const register = (name: string, email: string) => {
    setUser({
      id: 'user-' + Date.now(),
      name,
      email,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setCurrentTab('dashboard');
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
        login,
        logout,
        register,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
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
