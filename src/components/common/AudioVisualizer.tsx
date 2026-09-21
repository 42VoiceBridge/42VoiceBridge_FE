import React, { useEffect, useState } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
  barCount?: number;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isRecording,
  barCount = 18,
  height = 70,
}) => {
  const [levels, setLevels] = useState<number[]>(new Array(barCount).fill(12));

  useEffect(() => {
    if (!isRecording) {
      setLevels(new Array(barCount).fill(10));
      return;
    }

    const interval = setInterval(() => {
      setLevels(
        Array.from({ length: barCount }, () => {
          // Generate organic sound wave variations
          return Math.floor(Math.random() * (height - 18)) + 14;
        })
      );
    }, 90);

    return () => clearInterval(interval);
  }, [isRecording, barCount, height]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        height: `${height}px`,
        padding: '8px 16px',
        borderRadius: 'var(--border-radius-md)',
        backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.06)' : 'var(--color-bg-subtle)',
        border: isRecording ? '2px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--color-border)',
        transition: 'all var(--transition-fast)',
      }}
      aria-label={isRecording ? '마이크 음성 인식 중' : '음성 대기 중'}
    >
      {levels.map((barHeight, idx) => (
        <div
          key={idx}
          style={{
            width: '6px',
            height: `${barHeight}px`,
            borderRadius: '4px',
            backgroundColor: isRecording ? 'var(--color-danger)' : 'var(--color-border)',
            transition: 'height 0.1s ease, background-color 0.2s ease',
          }}
        />
      ))}
    </div>
  );
};
