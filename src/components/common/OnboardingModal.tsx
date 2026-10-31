import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MessageSquare, Sparkles, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';
import { SeniorButton } from './SeniorButton';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepData {
  step: number;
  title: string;
  badge: string;
  description: string;
  subDescription: string;
  icon: React.ReactNode;
}

const STEPS: StepData[] = [
  {
    step: 1,
    title: '말하면 듣고 대신 읽어줘요',
    badge: '실시간 말하기',
    description: '마이크로 편하게 말하면 AI가 또렷한 글자와 목소리로 전합니다.',
    subDescription: '발음이 서툴러도 괜찮아요. 끝까지 귀 기울여 듣고 깨끗한 음성으로 전달해 드립니다.',
    icon: <Mic size={44} strokeWidth={1.5} color="var(--vb-green, #28523e)" />,
  },
  {
    step: 2,
    title: '자주 하는 말을 바로 전달해요',
    badge: '자주 쓰는 문구',
    description: '인사, 일상, 병원 등 자주 쓰는 문구를 미리 담아 두세요.',
    subDescription: '버튼 한 번만 누르면 매번 말할 필요 없이 언제든 바로 소리로 들려줍니다.',
    icon: <MessageSquare size={44} strokeWidth={1.5} color="var(--vb-green, #28523e)" />,
  },
  {
    step: 3,
    title: 'AI 대화로 자연스럽게 소통하기',
    badge: 'AI 대화',
    description: '상대방의 말을 녹음하면 AI가 내용을 글로 보여주고 알맞은 답변을 추천합니다. 추천 문장을 선택하거나 직접 말해서 음성으로 전달할 수 있습니다.',
    subDescription: '1. 상대방 말 듣기 버튼을 눌러 녹음합니다. → 2. 인식된 내용을 확인합니다. → 3. AI 추천 답변을 선택하거나 직접 말합니다. (※ 상대방 음성 녹음 시 미리 동의를 구해야 합니다.)',
    icon: <Sparkles size={44} strokeWidth={1.5} color="var(--vb-green, #28523e)" />,
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleCompleteOrSkip = useCallback(() => {
    localStorage.setItem('vb_onboarding_completed', 'true');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // 다이얼로그 내부 첫 포커스 가능한 요소로 포커스 이동
      setTimeout(() => {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        }
      }, 50);

      // ESC 키 입력 시 닫기
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCompleteOrSkip();
        } else if (e.key === 'Tab') {
          // Focus trap
          if (!modalRef.current) return;
          const focusables = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (previousActiveElement.current && previousActiveElement.current.isConnected) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, handleCompleteOrSkip]);

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleCompleteOrSkip();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(12, 24, 17, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        ref={modalRef}
        className="vb-onboarding-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--border-radius-lg, 16px)',
          border: '1px solid var(--vb-line, #CBD2C8)',
          boxShadow: '0 20px 48px rgba(12, 24, 17, 0.22)',
          maxWidth: '520px',
          width: '100%',
          padding: '32px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* 상단: 서비스명 & 닫기(건너뛰기) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-xs, 12px)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--color-primary, #2A5A38)',
            }}
          >
            VOICEBRIDGE · 이용 방법 안내
          </span>
          <button
            type="button"
            onClick={handleCompleteOrSkip}
            aria-label="안내 건너뛰고 닫기"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted, #757575)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* 단계 인디케이터 점 3개 */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '28px',
          }}
          aria-label={`총 ${STEPS.length}단계 중 ${currentStep.step}단계`}
        >
          {STEPS.map((s, idx) => (
            <div
              key={s.step}
              style={{
                flex: 1,
                height: '5px',
                borderRadius: '999px',
                backgroundColor:
                  idx === currentStepIndex
                    ? 'var(--color-primary, #2A5A38)'
                    : idx < currentStepIndex
                    ? 'var(--color-primary-light, #8AAB8F)'
                    : 'var(--color-border, #E0E0E0)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* 카드 중심: 정돈된 라인 아이콘 (배경 박스, 테두리, 그림자 제거) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px auto 20px',
          }}
          aria-hidden="true"
        >
          {currentStep.icon}
        </div>

        {/* 카드 텍스트 내용 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* STEP 표시: 테두리/배경 없는 에디토리얼 텍스트 레이블 (메인 화면 '01 — SPEAK' 스타일) */}
          <p
            className="vb-eyebrow"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: 'var(--vb-green, #28523e)',
              margin: '0 auto 12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em' }}>
              STEP 0{currentStep.step}
            </span>
            <span style={{ opacity: 0.6 }} aria-hidden="true">—</span>
            <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em' }}>
              {currentStep.badge}
            </span>
          </p>
          <h2
            id="onboarding-step-title"
            style={{
              fontSize: 'var(--text-2xl, 24px)',
              fontWeight: 750,
              lineHeight: '1.4',
              color: 'var(--color-text, #1E232A)',
              margin: '0 0 12px 0',
              wordBreak: 'keep-all',
            }}
          >
            {currentStep.title}
          </h2>
          <p
            style={{
              fontSize: 'var(--text-base, 16px)',
              fontWeight: 600,
              color: 'var(--color-text, #2A332F)',
              lineHeight: '1.6',
              margin: '0 0 8px 0',
              wordBreak: 'keep-all',
            }}
          >
            {currentStep.description}
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm, 14px)',
              color: 'var(--color-text-muted, #666666)',
              lineHeight: '1.6',
              margin: 0,
              wordBreak: 'keep-all',
            }}
          >
            {currentStep.subDescription}
          </p>
        </div>

        {/* 하단 컨트롤 버튼 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: 'auto',
          }}
        >
          {currentStepIndex > 0 ? (
            <SeniorButton
              variant="outline"
              size="normal"
              icon={<ArrowLeft size={18} />}
              onClick={handlePrev}
            >
              이전
            </SeniorButton>
          ) : (
            <button
              type="button"
              className="vb-text-link"
              onClick={handleCompleteOrSkip}
              style={{
                fontSize: 'var(--text-sm, 14px)',
                color: 'var(--color-text-muted, #757575)',
                border: 'none',
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              건너뛰기
            </button>
          )}

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            {currentStepIndex > 0 && !isLastStep && (
              <button
                type="button"
                className="vb-text-link"
                onClick={handleCompleteOrSkip}
                style={{
                  fontSize: 'var(--text-sm, 14px)',
                  color: 'var(--color-text-muted, #757575)',
                  border: 'none',
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                건너뛰기
              </button>
            )}

            <SeniorButton
              variant="primary"
              size="normal"
              icon={isLastStep ? <Check size={20} /> : <ArrowRight size={20} />}
              onClick={handleNext}
            >
              {isLastStep ? '말이음 시작하기' : '다음'}
            </SeniorButton>
          </div>
        </div>
      </div>
    </div>
  );
};
