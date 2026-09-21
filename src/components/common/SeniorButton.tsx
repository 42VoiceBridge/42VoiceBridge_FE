import React from 'react';

interface SeniorButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'ghost';
  size?: 'normal' | 'large' | 'huge';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const SeniorButton: React.FC<SeniorButtonProps> = ({
  variant = 'primary',
  size = 'normal',
  fullWidth = false,
  icon,
  children,
  className = '',
  style,
  disabled,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          border: '2px solid var(--color-primary)',
          boxShadow: 'var(--shadow-md)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-secondary)',
          color: '#ffffff',
          border: '2px solid var(--color-secondary)',
          boxShadow: 'var(--shadow-md)',
        };
      case 'accent':
        return {
          backgroundColor: 'var(--color-accent)',
          color: '#ffffff',
          border: '2px solid var(--color-accent)',
          boxShadow: 'var(--shadow-md)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-danger)',
          color: '#ffffff',
          border: '2px solid var(--color-danger)',
          boxShadow: 'var(--shadow-md)',
        };
      case 'outline':
        return {
          backgroundColor: 'var(--color-bg-surface)',
          color: 'var(--color-primary)',
          border: '2px solid var(--color-primary)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-text-body)',
          border: '2px solid transparent',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'normal':
        return {
          minHeight: 'var(--min-button-height)',
          padding: '12px 24px',
          fontSize: 'var(--text-base)',
        };
      case 'large':
        return {
          minHeight: '64px',
          padding: '16px 32px',
          fontSize: 'var(--text-lg)',
        };
      case 'huge':
        return {
          minHeight: '76px',
          padding: '20px 36px',
          fontSize: 'var(--text-xl)',
        };
      default:
        return {};
    }
  };

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontWeight: 700,
        borderRadius: 'var(--border-radius-md)',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all var(--transition-fast)',
        userSelect: 'none',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      disabled={disabled}
      className={`senior-btn ${className}`}
      {...props}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
