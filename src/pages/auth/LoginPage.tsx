import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login, loginWithKakao, setCurrentTab } = useApp();
  const [email, setEmail] = useState('chaeyeong@example.com');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginWithKakao();
    } catch (err: any) {
      setErrorMsg(err.message || '카카오 로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    await login('chaeyeong@example.com');
  };

  return (
    <div className="vb-theme vb-page" style={{ minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center' }}>
      <div className="vb-editorial-grid" style={{ width: '100%', paddingBlock: '8vh 12vh' }}>
        {/* Left Branding Column */}
        <div className="vb-auth-visual" style={{ paddingBottom: '40px' }}>
          <p className="vb-eyebrow" style={{ color: 'var(--vb-green)', marginBottom: '24px' }}>VOICEBRIDGE / LOGIN</p>
          <div className="vb-display" style={{ fontSize: 'calc(clamp(56px, 8vw, 112px) * var(--vb-display-scale))', marginBottom: '40px' }}>
            <span>EVERY VOICE</span>
            <span>DESERVES TO</span>
            <span>BE HEARD<span className="vb-title-dot">.</span></span>
          </div>
          
          <div className="vb-slider-art" aria-hidden="true" style={{ marginTop: 'clamp(40px, 8vw, 80px)' }}>
             <svg className="vb-graphic" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M0 60 Q 100 0, 200 60 T 400 60" stroke="var(--vb-line)" strokeWidth="2" fill="none" />
               <path d="M0 60 Q 100 120, 200 60 T 400 60" stroke="var(--vb-green)" strokeWidth="3" fill="none" />
               <circle cx="200" cy="60" r="8" fill="var(--vb-green)" />
               <circle cx="100" cy="30" r="4" fill="var(--vb-line)" />
               <circle cx="300" cy="90" r="4" fill="var(--vb-line)" />
             </svg>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="vb-auth-form" style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 500, marginBottom: '48px', letterSpacing: '-0.05em' }}>
            다시 만나서 반가워요.
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            <div>
              <label htmlFor="login-email" className="vb-eyebrow" style={{ display: 'block', marginBottom: '16px', color: 'var(--vb-muted)' }}>
                EMAIL
              </label>
              <input
                id="login-email"
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
              <label htmlFor="login-password" className="vb-eyebrow" style={{ display: 'block', marginBottom: '16px', color: 'var(--vb-muted)' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  required
                  autoComplete="current-password"
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

            {errorMsg && (
              <div style={{ color: '#d32f2f', fontSize: 'var(--text-sm)', fontWeight: 500, marginTop: '-12px' }}>
                {errorMsg}
              </div>
            )}

            <button className="vb-button" type="submit" disabled={isLoading} style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}>
              {isLoading ? '로그인 중...' : '로그인'}
              {!isLoading && <ArrowRight size={20} />}
            </button>
            
            <button 
              type="button" 
              onClick={handleKakaoLogin}
              disabled={isLoading} 
              style={{ 
                marginTop: '12px', 
                width: '100%', 
                justifyContent: 'center',
                backgroundColor: '#FEE500',
                color: 'rgba(0,0,0,0.85)',
                border: 'none',
                height: '56px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'opacity 0.2s ease',
                gap: '8px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M9 2C4.029 2 0 4.935 0 8.556C0 10.871 1.55 12.898 3.905 14.072C3.766 14.542 3.197 16.438 3.149 16.634C3.149 16.634 3.109 16.85 3.256 16.892C3.404 16.933 3.6 16.786 3.6 16.786C3.99 16.516 6.811 14.567 7.227 14.288C7.799 14.382 8.391 14.432 9 14.432C13.971 14.432 18 11.497 18 7.876C18 4.255 13.971 2 9 2Z" fill="rgba(0,0,0,0.85)"/>
              </svg>
              카카오로 시작하기
            </button>
          </form>

          <div style={{ marginTop: '56px', paddingTop: '36px', borderTop: '1px solid var(--vb-line)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: 'var(--text-base)' }}>
              <span className="vb-muted">처음이신가요?</span>
              <button 
                type="button" 
                className="vb-text-link" 
                onClick={() => setCurrentTab('register')}
                style={{ minHeight: 'auto', padding: 0 }}
              >
                회원가입<ArrowRight size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: 'var(--text-base)' }}>
              <span className="vb-muted">테스트 계정으로</span>
              <button 
                type="button" 
                className="vb-text-link" 
                onClick={handleDemoLogin}
                style={{ minHeight: 'auto', padding: 0 }}
              >
                체험하기<Sparkles size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
