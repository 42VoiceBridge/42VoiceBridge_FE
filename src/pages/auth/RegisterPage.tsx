import React, { useState } from 'react';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';

export const RegisterPage: React.FC = () => {
  const { register, setCurrentTab } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('모든 필수 항목을 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg('비밀번호가 서로 일치하지 않습니다.');
      return;
    }
    register(name, email);
  };

  return (
    <div
      style={{
        maxWidth: '540px',
        margin: '30px auto',
        padding: '36px 28px',
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '2px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <button
        onClick={() => setCurrentTab('login')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: 'var(--text-base)',
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          marginBottom: '20px',
        }}
      >
        <ArrowLeft size={20} />
        <span>로그인으로 돌아가기</span>
      </button>

      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-secondary-light)',
            color: 'var(--color-secondary)',
            marginBottom: '12px',
          }}
        >
          <UserPlus size={36} />
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-text-title)', marginBottom: '8px' }}>
          새 계정 만들기
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
          간단한 정보만 입력하시면 바로 서비스를 이용하실 수 있습니다.
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '2px solid #ef4444',
            borderRadius: 'var(--border-radius-md)',
            fontWeight: 700,
            marginBottom: '20px',
            fontSize: 'var(--text-sm)',
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label
            htmlFor="reg-name"
            style={{ display: 'block', fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '8px' }}
          >
            성함 (이름)
          </label>
          <input
            id="reg-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 홍길동"
            required
          />
        </div>

        <div>
          <label
            htmlFor="reg-email"
            style={{ display: 'block', fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '8px' }}
          >
            아이디 (이메일)
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="예: user@example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="reg-password"
            style={{ display: 'block', fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '8px' }}
          >
            비밀번호
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력해주세요"
            required
          />
        </div>

        <div>
          <label
            htmlFor="reg-password-confirm"
            style={{ display: 'block', fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '8px' }}
          >
            비밀번호 확인
          </label>
          <input
            id="reg-password-confirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호를 한 번 더 입력해주세요"
            required
          />
        </div>

        <SeniorButton type="submit" variant="secondary" size="large" fullWidth style={{ marginTop: '12px' }}>
          회원가입 완료하기
        </SeniorButton>
      </form>
    </div>
  );
};
