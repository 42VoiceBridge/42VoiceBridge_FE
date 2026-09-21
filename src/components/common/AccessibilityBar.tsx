import React from 'react';
import { Type, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { FontSizeLevel } from '../../types';

export const AccessibilityBar: React.FC = () => {
  const { fontSize, setFontSize, highContrast, setHighContrast } = useApp();

  const fontOptions: { level: FontSizeLevel; label: string }[] = [
    { level: 'normal', label: '보통' },
    { level: 'large', label: '크게' },
    { level: 'xlarge', label: '아주 크게' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '6px 14px',
        backgroundColor: 'var(--color-bg-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--border-radius-full)',
        boxShadow: 'var(--shadow-sm)',
      }}
      aria-label="글자 크기 및 고대비 보기 설정"
    >
      {/* Font Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Type size={18} color="var(--color-text-muted)" />
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)' }}>
          글자:
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {fontOptions.map((opt) => (
            <button
              key={opt.level}
              onClick={() => setFontSize(opt.level)}
              aria-pressed={fontSize === opt.level}
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--border-radius-full)',
                border: fontSize === opt.level ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: fontSize === opt.level ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                color: fontSize === opt.level ? '#ffffff' : 'var(--color-text-body)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--color-border)' }} />

      {/* High Contrast Toggle */}
      <button
        onClick={() => setHighContrast(!highContrast)}
        aria-pressed={highContrast}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 'var(--border-radius-full)',
          border: highContrast ? '1.5px solid var(--color-warning)' : '1px solid var(--color-border)',
          backgroundColor: highContrast ? 'var(--color-warning)' : 'var(--color-bg-subtle)',
          color: highContrast ? '#ffffff' : 'var(--color-text-body)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        title="선명하게 보기(고대비 모드)를 켜거나 끕니다"
      >
        <Eye size={16} />
        <span>{highContrast ? '고대비 켬' : '고대비'}</span>
      </button>
    </div>
  );
};
