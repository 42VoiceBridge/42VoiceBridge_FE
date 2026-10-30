import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, MessageSquare, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';
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
    title: '말하면 글자로 바뀌어요',
    badge: '음성 인식',
    description: '마이크 버튼을 누르고 편안하게 말씀해 보세요.',
    subDescription: '발음이 서툴러도 괜찮아요. AI가 말을 끝까지 듣고 또렷한 글자로 적어 드립니다.',
    icon: <Mic size={44} strokeWidth={1.5} color="var(--vb-green, #28523e)" />,
  },
  {
    step: 2,
    title: '글자를 대신 읽어줘요',
    badge: '음성 출력',
    description: '적힌 글자가 맞는지 확인하고 원하는 대로 고칠 수 있어요.',
    subDescription: '[소리로 읽어주기] 버튼을 누르면 상대방에게 깨끗한 목소리로 전해집니다.',
    icon: <Volume2 size={44} strokeWidth={1.5} color="var(--vb-green, #28523e)" />,
  },
  {
    step: 3,
    title: '자주 쓰는 문구를 바로 말해요',
    badge: '자주 쓰는 문구',
    description: '인사, 일상, 병원 등 자주 하는 말을 미리 담아 두세요.',
    subDescription: '버튼 하나만 누르면 매번 말할 필요 없이 언제든 바로 소리로 전달됩니다.',
    icon: <MessageSquare size={44} strokeWidth={1.5} color="var(--vb-green, #28523e)" />,
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

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
  }, [isOpen]);

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

  const handleCompleteOrSkip = () => {
    localStorage.setItem('vb_onboarding_completed', 'true');
    onClose();
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
          backgroundColor: 'var(--color-bg-surface, #FFFFFF)',
          borderRadius: 'var(--border-radius-lg, 16px)',
          border: '2px solid var(--color-border, #E0E0E0)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.22)',
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
          aria-label={`총 3단계 중 ${currentStep.step}단계`}
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
