interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage = ({ message, className = '' }: ErrorMessageProps) => (
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
    }}
  >
    {message}
  </div>
);
