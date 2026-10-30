import React, { useEffect, useRef } from 'react';
import { LogIn, X } from 'lucide-react';
import { BrandDialog } from './BrandDialog';
import { SeniorButton } from './SeniorButton';

interface LoginPromptDialogProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const LoginPromptDialog: React.FC<LoginPromptDialogProps> = ({ onClose, onConfirm }) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrandDialog label="로그인 필요 안내" className="vb-auth-prompt-dialog" onClose={onClose}>
      <div
        className="responsive-panel vb-auth-prompt-panel"
        role="document"
        style={{
          width: 'min(440px, calc(100vw - 32px))',
          backgroundColor: 'var(--color-bg-surface, #ffffff)',
          borderRadius: 'var(--border-radius-lg, 16px)',
          border: '2px solid var(--color-border, #E0DDD6)',
          boxShadow: 'var(--shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))',
          padding: '36px 28px 28px',
          textAlign: 'center',
          position: 'relative',
          margin: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="안내 닫기"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted, #6B6965)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={22} />
        </button>

        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light, #DCE9E1)',
            color: 'var(--color-primary, #7FA893)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <LogIn size={28} strokeWidth={2} />
        </div>

        <h2
          id="auth-prompt-title"
          style={{
            fontSize: 'var(--text-2xl, 1.5rem)',
            fontWeight: 800,
            color: 'var(--color-text-title, #30302E)',
            marginBottom: '12px',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
          }}
        >
          로그인이 필요한 기능이에요
        </h2>

        <p
          id="auth-prompt-desc"
          style={{
            fontSize: 'var(--text-base, 1rem)',
            color: 'var(--color-text-muted, #6B6965)',
            lineHeight: 1.6,
            marginBottom: '28px',
            wordBreak: 'keep-all',
          }}
        >
          이 기능을 이용하려면 로그인이 필요해요. 로그인 후 이용하시겠어요?
        </p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <SeniorButton
            variant="outline"
            size="normal"
            onClick={onClose}
            style={{
              flex: 1,
              minHeight: '48px',
              fontSize: 'var(--text-base)',
              fontWeight: 700,
            }}
          >
            취소
          </SeniorButton>
          <SeniorButton
            ref={confirmBtnRef}
            variant="primary"
            size="normal"
            onClick={onConfirm}
            style={{
              flex: 1,
              minHeight: '48px',
              fontSize: 'var(--text-base)',
              fontWeight: 700,
            }}
          >
            로그인하기
          </SeniorButton>
        </div>
      </div>
    </BrandDialog>
  );
};
