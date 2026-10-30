import React, { useEffect, useState, useRef } from 'react';
import { AudioRecorderService } from '../../utils/audioUtils';

interface AudioVisualizerProps {
  isRecording: boolean;
  barCount?: number;
  height?: number;
  stream?: MediaStream | null;
  analyser?: AnalyserNode | null;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isRecording,
  barCount = 18,
  height = 70,
  stream,
  analyser,
}) => {
  const minBarHeight = 10;
  const maxBarHeight = Math.max(minBarHeight, height - 16);
  const [levels, setLevels] = useState<number[]>(() => new Array(barCount).fill(minBarHeight));
  const localContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // 녹음 중이 아닌 경우 즉시 기본 높이로 복귀 및 내부 리소스 정리
    if (!isRecording) {
      setLevels(new Array(barCount).fill(minBarHeight));
      if (localContextRef.current && localContextRef.current.state !== 'closed') {
        localContextRef.current.close().catch(() => {});
        localContextRef.current = null;
      }
      return;
    }

    let activeAnalyser: AnalyserNode | null = analyser || AudioRecorderService.getActiveAnalyser();
    const activeStream: MediaStream | null = stream || AudioRecorderService.getActiveStream();

    // 전달받은 AnalyserNode가 없지만 MediaStream이 있는 경우 로컬 AnalyserNode 생성
    if (!activeAnalyser && activeStream && activeStream.active) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        localContextRef.current = ctx;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const node = ctx.createAnalyser();
        node.fftSize = 64;
        const source = ctx.createMediaStreamSource(activeStream);
        source.connect(node);
        activeAnalyser = node;
      } catch (err) {
        console.warn('AudioVisualizer 마이크 스트림 연결 실패:', err);
      }
    }

    let animationFrameId: number | null = null;
    let lastUpdateTime = 0;
    const updateIntervalMs = 60; // 0.1s CSS 트랜지션과 어우러지는 부드러운 프레임 레이트

    const updateWaveform = (timestamp: number) => {
      // 렌더링 직후 서비스가 초기화된 경우 대비 재확인
      if (!activeAnalyser) {
        activeAnalyser = AudioRecorderService.getActiveAnalyser();
      }

      if (activeAnalyser && timestamp - lastUpdateTime >= updateIntervalMs) {
        lastUpdateTime = timestamp;
        const bufferLength = activeAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        activeAnalyser.getByteFrequencyData(dataArray);

        // 노이즈 게이트: 마이크 기본 잡음(화이트 노이즈) 이하 입력은 0으로 처리하여 무음 시 파형 정지 유지
        const noiseThreshold = 14;

        const newLevels = Array.from({ length: barCount }, (_, i) => {
          // 대칭 파형 배치: 중앙은 인간 음성의 핵심 주파수 대역, 양 끝은 배음 대역에 반응
          const distanceFromCenter = Math.abs(i - (barCount - 1) / 2);
          const binIndex = Math.min(bufferLength - 1, Math.floor(distanceFromCenter * 2) + 2);
          const rawValue = dataArray[binIndex] || 0;

          if (rawValue <= noiseThreshold) {
            return minBarHeight;
          }

          const normalized = (rawValue - noiseThreshold) / (255 - noiseThreshold);
          const barHeight = minBarHeight + Math.round(normalized * (maxBarHeight - minBarHeight));
          return Math.min(maxBarHeight, Math.max(minBarHeight, barHeight));
        });

        setLevels(newLevels);
      }

      animationFrameId = requestAnimationFrame(updateWaveform);
    };

    animationFrameId = requestAnimationFrame(updateWaveform);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (localContextRef.current && localContextRef.current.state !== 'closed') {
        localContextRef.current.close().catch(() => {});
        localContextRef.current = null;
      }
      setLevels(new Array(barCount).fill(minBarHeight));
    };
  }, [isRecording, barCount, height, stream, analyser, maxBarHeight]);

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
