import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';

export const LoginPage: React.FC = () => {
  const { login, setCurrentTab } = useApp();
  const [email, setEmail] = useState('chaeyeong@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    login(email, '김채영');
  };

  const handleDemoLogin = () => {
    login('chaeyeong@example.com', '김채영');
  };

  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '40px auto',
        padding: '36px 28px',
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '2px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            marginBottom: '16px',
          }}
        >
          <LogIn size={36} />
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-text-title)', marginBottom: '8px' }}>
          AI 구음장애 보조 서비스
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
          더 명확하고 편안한 발음을 위해 로그인해주세요.
        </p>
      </div>

      {/* Quick Demo Login Banner for easy testing & senior convenience */}
      <div
        style={{
          backgroundColor: 'var(--color-secondary-light)',
          border: '2px dashed var(--color-secondary-border)',
          borderRadius: 'var(--border-radius-md)',
          padding: '16px',
          marginBottom: '28px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '10px' }}>
          💡 복잡한 입력 없이 즉시 체험해보세요!
        </p>
        <SeniorButton
          variant="secondary"
          size="normal"
          fullWidth
          icon={<Sparkles size={20} />}
          onClick={handleDemoLogin}
        >
          김채영님(체험 계정)으로 바로 시작
        </SeniorButton>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label
            htmlFor="login-email"
            style={{
              display: 'block',
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              marginBottom: '8px',
              color: 'var(--color-text-title)',
            }}
          >
            아이디 (이메일)
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력해주세요"
            required
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            style={{
              display: 'block',
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              marginBottom: '8px',
              color: 'var(--color-text-title)',
            }}
          >
            비밀번호
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
              required
              style={{ paddingRight: '56px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                padding: '8px',
              }}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>
          </div>
        </div>

        <SeniorButton type="submit" variant="primary" size="large" fullWidth style={{ marginTop: '8px' }}>
          로그인
        </SeniorButton>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginRight: '8px' }}>
            아직 회원이 아니신가요?
          </span>
          <button
            type="button"
            onClick={() => setCurrentTab('register')}
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 800,
              color: 'var(--color-primary)',
              textDecoration: 'underline',
            }}
          >
            회원가입하기
          </button>
        </div>
      </form>
    </div>
  );
};
