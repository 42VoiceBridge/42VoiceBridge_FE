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
        className="vb-auth-prompt-panel"
        role="document"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--color-bg-surface, #FFFFFF)',
          borderRadius: 'var(--border-radius-lg, 16px)',
          border: '2px solid var(--color-border, #E0E0E0)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.22)',
          padding: '32px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          margin: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="안내 닫기"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted, #757575)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={22} />
        </button>

        {/* 아이콘: 온보딩 모달 규칙 (연한 원형 배경 제거, 순수 라인 아이콘, 딥그린) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px auto 20px',
          }}
          aria-hidden="true"
        >
          <LogIn size={44} strokeWidth={1.5} color="var(--vb-green, #28523e)" />
        </div>

        {/* 제목 */}
        <h2
          id="auth-prompt-title"
          style={{
            fontSize: 'var(--text-2xl, 24px)',
            fontWeight: 750,
            lineHeight: 1.4,
            color: 'var(--color-text, #1E232A)',
            margin: '0 0 10px 0',
            wordBreak: 'keep-all',
          }}
        >
          로그인이 필요한 기능이에요
        </h2>

        {/* 간결한 설명 문구 */}
        <p
          id="auth-prompt-desc"
          style={{
            fontSize: 'var(--text-base, 16px)',
            fontWeight: 500,
            color: 'var(--color-text-muted, #666666)',
            lineHeight: 1.6,
            margin: '0 0 28px 0',
            wordBreak: 'keep-all',
          }}
        >
          로그인하면 이 기능을 이용할 수 있어요.
        </p>

        {/* 하단 버튼: 취소(아웃라인) & 로그인하기(세이지그린 배경) */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
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
              fontSize: 'var(--text-base, 16px)',
              fontWeight: 700,
              boxShadow: 'none',
              borderRadius: '8px',
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
              fontSize: 'var(--text-base, 16px)',
              fontWeight: 700,
              boxShadow: 'none',
              borderRadius: '8px',
            }}
          >
            로그인하기
          </SeniorButton>
        </div>
      </div>
    </BrandDialog>
  );
};
