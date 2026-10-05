import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakText as fallbackSpeakText, stopSpeech } from '../../utils/audioUtils';
import { useApp } from '../../context/AppContext';
import { ErrorMessage } from './ErrorMessage';

interface TTSButtonProps {
  text: string;
  label?: string;
  size?: 'normal' | 'large';
}

export const TTSButton: React.FC<TTSButtonProps> = ({
  text,
  label = '소리로 듣기',
  size = 'normal',
}) => {
  const { speechRate } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    setError(null);
    
    // 백엔드 Recognition 및 Confirmation API 구현 전까지 
    // 실제 백엔드 TTS API 호출을 차단하고 브라우저 기본 TTS로 Fallback 합니다.
    // 기존에 존재하던 crypto.randomUUID() 가짜 confirmationId 생성 코드를 제거했습니다.
    try {
      await fallbackSpeakText(text, speechRate);
    } catch (error: any) {
      console.error('TTS error:', error);
      setError('음성을 재생하지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px', maxWidth: '100%' }}>
      <button className="tts-button"
      onClick={handleSpeak}
      title="문장을 또박또박 소리로 들려드립니다"
      aria-label={`${text} 소리로 듣기`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: size === 'large' ? '12px 20px' : '8px 16px',
        fontSize: size === 'large' ? 'var(--text-base)' : 'var(--text-sm)',
        fontWeight: 700,
        backgroundColor: isPlaying ? 'var(--color-secondary)' : 'var(--color-secondary-light)',
        color: isPlaying ? '#ffffff' : 'var(--color-secondary)',
        border: '2px solid var(--color-secondary)',
        borderRadius: 'var(--border-radius-full)',
        boxShadow: isPlaying ? '0 0 0 4px rgba(0, 135, 108, 0.2)' : 'var(--shadow-sm)',
        transition: 'all var(--transition-fast)',
        cursor: 'pointer',
      }}
      >
        {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
        <span>{isPlaying ? '듣는 중...' : label}</span>
      </button>
      {error && <ErrorMessage message={error} />}
    </div>
  );
};
