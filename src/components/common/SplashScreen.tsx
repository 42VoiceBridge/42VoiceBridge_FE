import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // prefers-reduced-motion 환경 체크
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = mediaQuery.matches;

    if (prefersReducedMotion) {
      sessionStorage.setItem('vb_splash_viewed', 'true');
      onComplete();
      return;
    }

    // 마운트 직후 부드러운 페이드 인
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 30);

    // 1.5초 후 부드러운 페이드 아웃 시작 -> 0.5초 페이드 아웃 -> 2.0초 후 완료
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1500);

    const completeTimer = setTimeout(() => {
      sessionStorage.setItem('vb_splash_viewed', 'true');
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="VoiceBridge 시작 중"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'var(--vb-paper, #f6f7f2)',
        color: 'var(--vb-ink, #202e27)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 60px)',
        opacity: isFadingOut ? 0 : isVisible ? 1 : 0,
        transition: isFadingOut
          ? 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
          : 'opacity 0.4s ease-out',
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '920px',
          width: '100%',
        }}
      >
        {/* 헤더 로고 굵기 대비(VOICE: 750 / BRIDGE: 450)와 메인 화면 비대칭 리듬 구도를 결합한 타이포그래피 */}
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            margin: '0 auto 36px',
          }}
        >
          <h1
            style={{
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 'clamp(52px, 12vw, 132px)',
              lineHeight: 0.86,
              letterSpacing: '-0.075em',
              color: 'var(--vb-green, #28523e)',
              margin: 0,
              userSelect: 'none',
              textAlign: 'left',
            }}
            aria-label="VOICE BRIDGE."
          >
            <span
              style={{
                display: 'block',
                fontWeight: 750,
                letterSpacing: '-0.065em',
              }}
            >
              VOICE
            </span>
            <span
              style={{
                display: 'block',
                fontWeight: 450,
                letterSpacing: '-0.075em',
                paddingLeft: '0.22em',
              }}
            >
              BRIDGE<span style={{ color: 'var(--vb-ink, #202e27)' }}>.</span>
            </span>
          </h1>
        </div>

        {/* 타이틀 아래 짧은 슬로건 문구 */}
        <p
          style={{
            fontSize: 'clamp(16px, 2.2vw, 21px)',
            fontWeight: 600,
            lineHeight: 1.6,
            letterSpacing: '-0.03em',
            color: 'var(--vb-ink, #202e27)',
            textAlign: 'center',
            margin: 0,
            wordBreak: 'keep-all',
          }}
        >
          말이 조금 달라도, 소통은 자연스럽게 이어지도록.
        </p>
      </div>
    </div>
  );
};
