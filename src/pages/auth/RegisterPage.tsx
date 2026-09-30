import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { signupApi } from '../../api/auth';

export const RegisterPage: React.FC = () => {
  const { login, setCurrentTab } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('모든 필수 항목을 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg('비밀번호가 서로 일치하지 않습니다.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      await signupApi(email, password, name);
      // 회원가입 성공 시 자동 로그인 후 대시보드로 이동 (기존 Mock UX와 동일)
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vb-theme vb-page" style={{ minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center' }}>
      <div className="vb-editorial-grid" style={{ width: '100%', paddingBlock: '8vh 12vh' }}>
        {/* Left Branding Column */}
        <div className="vb-auth-visual" style={{ paddingBottom: '40px' }}>
          <p className="vb-eyebrow" style={{ color: 'var(--vb-green)', marginBottom: '24px' }}>VOICEBRIDGE / REGISTER</p>
          <div className="vb-display" style={{ fontSize: 'calc(clamp(56px, 8vw, 112px) * var(--vb-display-scale))', marginBottom: '40px' }}>
            <span>YOUR VOICE,</span>
            <span>YOUR WAY<span className="vb-title-dot">.</span></span>
          </div>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--vb-muted)', lineHeight: '1.7', maxWidth: '440px' }}>
            목소리가 달라도 소통은 계속될 수 있도록.<br />
            VoiceBridge가 당신의 편안한 소통을 지원합니다.
          </p>
          
          <div className="vb-slider-art" aria-hidden="true" style={{ marginTop: 'clamp(40px, 8vw, 80px)' }}>
             <svg className="vb-graphic" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M0 60 Q 100 120, 200 60 T 400 60" stroke="var(--vb-line)" strokeWidth="2" fill="none" strokeDasharray="4 6" />
               <path d="M0 60 Q 100 0, 200 60 T 400 60" stroke="var(--vb-green)" strokeWidth="3" fill="none" />
               <circle cx="200" cy="60" r="6" fill="var(--vb-green)" />
             </svg>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="vb-auth-form" style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 500, marginBottom: '48px', letterSpacing: '-0.05em' }}>
            새 계정 만들기
          </h1>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            <div>
              <label htmlFor="reg-name" className="vb-eyebrow" style={{ display: 'block', marginBottom: '16px', color: 'var(--vb-muted)' }}>
                NAME
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름 (닉네임)"
                required
                autoComplete="name"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--vb-line)',
                  padding: '8px 0 16px',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--vb-ink)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  borderRadius: '0'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = 'var(--vb-green)'}
                onBlur={(e) => e.target.style.borderBottomColor = 'var(--vb-line)'}
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="vb-eyebrow" style={{ display: 'block', marginBottom: '16px', color: 'var(--vb-muted)' }}>
                EMAIL
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--vb-line)',
                  padding: '8px 0 16px',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--vb-ink)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  borderRadius: '0'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = 'var(--vb-green)'}
                onBlur={(e) => e.target.style.borderBottomColor = 'var(--vb-line)'}
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="vb-eyebrow" style={{ display: 'block', marginBottom: '16px', color: 'var(--vb-muted)' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  required
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--vb-line)',
                    padding: '8px 48px 16px 0',
                    fontSize: 'var(--text-lg)',
                    color: 'var(--vb-ink)',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    borderRadius: '0'
                  }}
                  onFocus={(e) => e.target.style.borderBottomColor = 'var(--vb-green)'}
                  onBlur={(e) => e.target.style.borderBottomColor = 'var(--vb-line)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--vb-muted)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                  }}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reg-password-confirm" className="vb-eyebrow" style={{ display: 'block', marginBottom: '16px', color: 'var(--vb-muted)' }}>
                CONFIRM PASSWORD
              </label>
              <input
                id="reg-password-confirm"
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 재입력"
                required
                autoComplete="new-password"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--vb-line)',
                  padding: '8px 0 16px',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--vb-ink)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  borderRadius: '0'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = 'var(--vb-green)'}
                onBlur={(e) => e.target.style.borderBottomColor = 'var(--vb-line)'}
              />
            </div>

            {errorMsg && (
              <div style={{ color: '#d32f2f', fontSize: 'var(--text-sm)', fontWeight: 500, marginTop: '-12px' }}>
                {errorMsg}
              </div>
            )}

            <button className="vb-button" type="submit" disabled={isLoading} style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}>
              {isLoading ? '가입 중...' : '회원가입 완료하기'}
              {!isLoading && <ArrowRight size={20} />}
            </button>
          </form>

          <div style={{ marginTop: '56px', paddingTop: '36px', borderTop: '1px solid var(--vb-line)', display: 'flex', gap: '20px', fontSize: 'var(--text-base)', alignItems: 'center' }}>
            <span className="vb-muted">이미 계정이 있으신가요?</span>
            <button 
              type="button" 
              className="vb-text-link" 
              onClick={() => setCurrentTab('login')}
              style={{ minHeight: 'auto', padding: 0 }}
            >
              로그인하기<ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
