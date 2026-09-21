import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakText, stopSpeech } from '../../utils/audioUtils';

interface TTSButtonProps {
  text: string;
  label?: string;
  size?: 'normal' | 'large';
  rate?: number;
}

export const TTSButton: React.FC<TTSButtonProps> = ({
  text,
  label = '소리로 듣기',
  size = 'normal',
  rate = 0.85,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    try {
      await speakText(text, rate);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <button
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
  );
};
