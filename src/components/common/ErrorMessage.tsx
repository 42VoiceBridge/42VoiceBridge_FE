import React, { useState, useEffect, useRef } from 'react';

export interface ErrorMessageProps {
  message: string;
  className?: string;
  autoDismiss?: boolean;
  duration?: number;
  onDismiss?: () => void;
  style?: React.CSSProperties;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = '',
  autoDismiss = false,
  duration = 4000,
  onDismiss,
  style,
}) => {
  const [prevMessage, setPrevMessage] = useState(message);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Prop 변경 시 상태 재설정 (React 공식 패턴: Adjusting state during render)
  if (prevMessage !== message) {
    setPrevMessage(message);
    setIsFading(false);
    setIsDismissed(false);
  }

  useEffect(() => {
    if (!autoDismiss || !message) {
      return;
    }

    // 모든 오류 알림창은 오류 종류와 관계없이 4초 후 페이드아웃
    const displayDuration = duration;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    const timer = setTimeout(() => {
      if (prefersReducedMotion) {
        setIsDismissed(true);
        onDismissRef.current?.();
      } else {
        setIsFading(true);
        fadeTimer = setTimeout(() => {
          setIsDismissed(true);
          onDismissRef.current?.();
        }, 400); // 약 0.4초간 페이드아웃
      }
    }, displayDuration);

    return () => {
      clearTimeout(timer);
      if (fadeTimer) {
        clearTimeout(fadeTimer);
      }
    };
  }, [message, autoDismiss, duration]);

  if (isDismissed || !message) {
    return null;
  }

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className={className}
      role="alert"
      aria-live="polite"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: 'rgba(224, 108, 75, 0.08)',
        border: '1px solid rgba(224, 108, 75, 0.3)',
        color: '#d84c3e',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        padding: '12px 16px',
        borderRadius: '8px',
        lineHeight: 1.5,
        opacity: isFading ? 0 : 1,
        transition: prefersReducedMotion ? 'none' : 'opacity 0.4s ease',
        ...style,
      }}
    >
      {message}
    </div>
  );
};
