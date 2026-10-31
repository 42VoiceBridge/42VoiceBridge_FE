import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { signupApi } from '../../api/auth';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { BrandDialog } from '../../components/common/BrandDialog';
import { termsOfServiceText } from '../../content/terms';
import { privacyPolicyText } from '../../content/privacy';

export const RegisterPage: React.FC = () => {
  const { setCurrentTab } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [termsModal, setTermsModal] = useState<'terms' | 'privacy' | null>(null);

  const handleAgreeAllChange = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    if (errorMsg) setErrorMsg('');
  };

  const handleAgreeTermsChange = (checked: boolean) => {
    setAgreeTerms(checked);
    setAgreeAll(checked && agreePrivacy);
    if (errorMsg) setErrorMsg('');
  };

  const handleAgreePrivacyChange = (checked: boolean) => {
    setAgreePrivacy(checked);
    setAgreeAll(checked && agreeTerms);
    if (errorMsg) setErrorMsg('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newFieldErrors: {
      name?: string;
      email?: string;
      password?: string;
      passwordConfirm?: string;
    } = {};

    if (!name.trim()) {
      newFieldErrors.name = '성명을 입력해주세요.';
    }
    if (!email.trim()) {
      newFieldErrors.email = '이메일 주소를 입력해주세요.';
    } else if (!emailRegex.test(email.trim())) {
      newFieldErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }
    if (!password) {
      newFieldErrors.password = '비밀번호를 입력해주세요.';
    } else if (password.length < 8) {
      newFieldErrors.password = '비밀번호는 8자 이상 입력해주세요.';
    }
    if (!passwordConfirm) {
      newFieldErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    } else if (password !== passwordConfirm) {
      newFieldErrors.passwordConfirm = '비밀번호가 서로 일치하지 않습니다.';
    }

    setFieldErrors(newFieldErrors);

    if (Object.keys(newFieldErrors).length > 0) {
      setErrorMsg('');
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setErrorMsg('필수 약관에 모두 동의해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setFieldErrors({});
    try {
      await signupApi(email, password, name);
      // 회원가입 성공 시 자동 로그인하지 않고 로그인 화면으로 이동
      sessionStorage.setItem('signupSuccess', 'true');
      setCurrentTab('login');
    } catch (err: any) {
      const errorMessage = typeof err?.message === 'string' ? err.message : '';
      const normalizedMessage = errorMessage.toLowerCase();
      let msg = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

      if (
        normalizedMessage.includes('duplicate_email') ||
        normalizedMessage.includes('email_already') ||
        normalizedMessage.includes('duplicate email') ||
        normalizedMessage.includes('email already') ||
        ((errorMessage.includes('이메일') || normalizedMessage.includes('email')) &&
          (errorMessage.includes('중복') || errorMessage.includes('이미') || errorMessage.includes('사용 중')))
      ) {
        msg = '이미 사용 중인 이메일입니다.';
      } else if (errorMessage.includes('크기가 8에서') || errorMessage.includes('2147483647')) {
        msg = '비밀번호는 8자 이상 입력해주세요.';
      }
      setErrorMsg(msg);
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
            <span>YOUR WAY</span>
          </div>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--vb-muted)', lineHeight: '1.7', maxWidth: '440px' }}>
            목소리가 달라도 소통은 계속될 수 있도록<br />
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
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 500, marginBottom: '12px', letterSpacing: '-0.05em' }}>
            새 계정 만들기
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--vb-muted)', marginBottom: '28px', lineHeight: 1.5 }}>
            <span style={{ color: '#e53e3e', fontWeight: 700, marginRight: '4px' }} aria-hidden="true">*</span>
            표시는 필수 입력 항목입니다.
          </p>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            <div>
              <label htmlFor="reg-name" className="vb-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', color: 'var(--vb-muted)' }}>
                <span>NAME</span>
                <span style={{ color: '#e53e3e', fontWeight: 700 }} aria-hidden="true">*</span>
                <span className="sr-only">(필수 입력)</span>
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="성명"
                required
                autoComplete="name"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${fieldErrors.name ? '#d84c3e' : 'var(--vb-line)'}`,
                  padding: '8px 0 16px',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--vb-ink)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  borderRadius: '0'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = 'var(--vb-green)'}
                onBlur={(e) => e.target.style.borderBottomColor = fieldErrors.name ? '#d84c3e' : 'var(--vb-line)'}
              />
              {fieldErrors.name && (
                <p role="alert" style={{ fontSize: 'var(--text-xs)', color: '#d84c3e', marginTop: '6px', fontWeight: 500 }}>
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="vb-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', color: 'var(--vb-muted)' }}>
                <span>EMAIL</span>
                <span style={{ color: '#e53e3e', fontWeight: 700 }} aria-hidden="true">*</span>
                <span className="sr-only">(필수 입력)</span>
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="이메일 주소"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${fieldErrors.email ? '#d84c3e' : 'var(--vb-line)'}`,
                  padding: '8px 0 16px',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--vb-ink)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  borderRadius: '0'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = 'var(--vb-green)'}
                onBlur={(e) => e.target.style.borderBottomColor = fieldErrors.email ? '#d84c3e' : 'var(--vb-line)'}
              />
              {fieldErrors.email && (
                <p role="alert" style={{ fontSize: 'var(--text-xs)', color: '#d84c3e', marginTop: '6px', fontWeight: 500 }}>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password" className="vb-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', color: 'var(--vb-muted)' }}>
                <span>PASSWORD</span>
                <span style={{ color: '#e53e3e', fontWeight: 700 }} aria-hidden="true">*</span>
                <span className="sr-only">(필수 입력)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="비밀번호"
                  required
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${fieldErrors.password ? '#d84c3e' : 'var(--vb-line)'}`,
                    padding: '8px 48px 16px 0',
                    fontSize: 'var(--text-lg)',
                    color: 'var(--vb-ink)',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    borderRadius: '0'
                  }}
                  onFocus={(e) => e.target.style.borderBottomColor = 'var(--vb-green)'}
                  onBlur={(e) => e.target.style.borderBottomColor = fieldErrors.password ? '#d84c3e' : 'var(--vb-line)'}
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
              {fieldErrors.password && (
                <p role="alert" style={{ fontSize: 'var(--text-xs)', color: '#d84c3e', marginTop: '6px', fontWeight: 500 }}>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password-confirm" className="vb-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', color: 'var(--vb-muted)' }}>
                <span>CONFIRM PASSWORD</span>
                <span style={{ color: '#e53e3e', fontWeight: 700 }} aria-hidden="true">*</span>
                <span className="sr-only">(필수 입력)</span>
              </label>
              <input
                id="reg-password-confirm"
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  if (fieldErrors.passwordConfirm) setFieldErrors((prev) => ({ ...prev, passwordConfirm: undefined }));
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="비밀번호 재입력"
                required
                autoComplete="new-password"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${fieldErrors.passwordConfirm ? '#d84c3e' : 'var(--vb-line)'}`,
                  padding: '8px 0 16px',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--vb-ink)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  borderRadius: '0'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = 'var(--vb-green)'}
                onBlur={(e) => e.target.style.borderBottomColor = fieldErrors.passwordConfirm ? '#d84c3e' : 'var(--vb-line)'}
              />
              {fieldErrors.passwordConfirm && (
                <p role="alert" style={{ fontSize: 'var(--text-xs)', color: '#d84c3e', marginTop: '6px', fontWeight: 500 }}>
                  {fieldErrors.passwordConfirm}
                </p>
              )}
            </div>

            {/* Terms of Service Section */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                padding: '20px 24px',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: '8px',
                border: '1px solid var(--vb-line)',
              }}
            >
              {/* Agree All Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  paddingBottom: '14px',
                  borderBottom: '1px solid var(--vb-line)',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  id="agree-all"
                  checked={agreeAll}
                  onChange={(e) => handleAgreeAllChange(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: 'var(--vb-green)',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--vb-ink)' }}>
                  약관 전체 동의
                </span>
              </label>

              {/* Item 1: Service Terms */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    flex: 1,
                  }}
                >
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreeTerms}
                    onChange={(e) => handleAgreeTermsChange(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--vb-green)',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--vb-ink)' }}>
                    <strong style={{ color: 'var(--vb-green)', marginRight: '6px' }}>[필수]</strong>
                    서비스 이용약관 동의
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setTermsModal('terms')}
                  className="vb-text-link"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--vb-muted)',
                    textDecoration: 'underline',
                    padding: 0,
                    minHeight: 'auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  자세히 보기
                </button>
              </div>

              {/* Item 2: Privacy Policy */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    flex: 1,
                  }}
                >
                  <input
                    type="checkbox"
                    id="agree-privacy"
                    checked={agreePrivacy}
                    onChange={(e) => handleAgreePrivacyChange(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--vb-green)',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--vb-ink)' }}>
                    <strong style={{ color: 'var(--vb-green)', marginRight: '6px' }}>[필수]</strong>
                    개인정보 수집·이용 동의
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setTermsModal('privacy')}
                  className="vb-text-link"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--vb-muted)',
                    textDecoration: 'underline',
                    padding: 0,
                    minHeight: 'auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  자세히 보기
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{ marginTop: '-12px' }}>
                <ErrorMessage
                  message={errorMsg}
                  autoDismiss={true}
                  duration={4000}
                  onDismiss={() => setErrorMsg('')}
                />
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

      {termsModal && (
        <BrandDialog
          label={termsModal === 'terms' ? '서비스 이용약관' : '개인정보처리방침'}
          className="vb-legal-dialog"
          onClose={() => setTermsModal(null)}
        >
          <div className="vb-legal-panel">
            <div className="vb-drawer-top">
              <span className="vb-eyebrow">LEGAL / DOCUMENT</span>
              <button
                className="vb-icon-button"
                type="button"
                aria-label="안내 닫기"
                onClick={() => setTermsModal(null)}
              >
                <X size={24} />
              </button>
            </div>
            <p className="vb-eyebrow">{termsModal === 'terms' ? 'TERMS OF SERVICE' : 'PRIVACY POLICY'}</p>
            <h2>{termsModal === 'terms' ? '서비스 이용약관' : '개인정보처리방침'}</h2>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: 'var(--text-sm)', color: 'var(--vb-ink)' }}>
              {termsModal === 'terms' ? termsOfServiceText : privacyPolicyText}
            </div>
            <button
              className="vb-button"
              style={{ marginTop: '28px' }}
              type="button"
              onClick={() => setTermsModal(null)}
            >
              확인
            </button>
          </div>
        </BrandDialog>
      )}
    </div>
  );
};
