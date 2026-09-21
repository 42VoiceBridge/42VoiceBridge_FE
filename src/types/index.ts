// Core types for 42VoiceBridge AI Voice Assistant

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export type DiagnosisStatus = 'ready' | 'recording' | 'analyzing' | 'completed';

export interface DiagnosisSentence {
  id: number;
  text: string;
  targetPhonemes: string[]; // e.g. ['ㄹ', 'ㅅ']
  difficulty: '쉬움' | '보통' | '도전';
  guideTip: string;
}

export interface WeakPhoneme {
  phoneme: string; // e.g. 'ㄹ'
  accuracy: number; // percentage, e.g. 42
  errorType: '왜곡' | '생략' | '치환';
  description: string;
}

export interface DiagnosisResult {
  id: string;
  date: string;
  overallScore: number;
  metrics: {
    accuracy: number; // 발음 정확도
    fluency: number;  // 유창도
    clarity: number;  // 명료도/발음 속도
  };
  weakPhonemes: WeakPhoneme[];
  comment: string;
  sentenceCount: number;
}

export interface PracticeSentence {
  id: string;
  text: string;
  targetPhonemes: string[];
  category: string;
  recordedAudioUrl?: string;
  lastScore?: number;
  difficulty: '쉬움' | '보통' | '도전';
}

export interface PersonalizationStatus {
  collectedCount: number;
  targetCount: number;
  status: 'idle' | 'collecting' | 'training' | 'completed';
  lastTrainedAt?: string;
  standardAccuracy: number; // e.g. 45%
  personalizedAccuracy: number; // e.g. 91%
}

export interface AssistVoiceMessage {
  id: string;
  timestamp: string;
  originalText: string;
  correctedText: string;
  confidence: number;
}

export type FontSizeLevel = 'normal' | 'large' | 'xlarge';
