import React from 'react';
import { Volume2, Monitor, User, Shield, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';
import { FeaturePageHeader } from '../../components/layout/FeaturePageHeader';

export const SettingsPage: React.FC = () => {
  const { 
    user, 
    fontSize, 
    setFontSize, 
    highContrast, 
    setHighContrast,
    autoTtsPlayback,
    setAutoTtsPlayback,
    speechRate,
    setSpeechRate,
    logout 
  } = useApp();

  return (
    <div className="vb-theme vb-page vb-page--settings responsive-page settings-page" style={{ maxWidth: '800px', margin: '30px auto', padding: '0 16px 60px' }}>
      <FeaturePageHeader eyebrow="SETTINGS / PREFERENCES" title={<>나에게 맞게,<br /><span>VoiceBridge를 조정하세요.</span></>} description="음성, 화면, 계정과 데이터 설정을 한곳에서 관리합니다." />
      <div className="vb-settings-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 1. 음성 설정 */}
        <section className="responsive-panel vb-settings-section" style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '24px 32px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{ fontSize: 'var(--text-xl)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Volume2 size={24} color="var(--color-primary)" />
            <span>음성 설정</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <div>
                <strong style={{ fontSize: 'var(--text-lg)', display: 'block' }}>AI 변환 음성 자동 출력</strong>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>변환 완료 시 자동으로 소리를 냅니다.</span>
              </div>
              <input 
                type="checkbox" 
                checked={autoTtsPlayback} 
                onChange={(e) => setAutoTtsPlayback(e.target.checked)} 
                style={{ width: '24px', height: '24px' }} 
              />
            </label>
            
            <div>
              <strong style={{ fontSize: 'var(--text-lg)', display: 'block', marginBottom: '8px' }}>음성 출력 속도</strong>
              <div className="settings-options" style={{ display: 'flex', gap: '12px' }}>
                <SeniorButton 
                  variant={speechRate === 0.75 ? "primary" : "outline"} 
                  size="normal"
                  onClick={() => setSpeechRate(0.75)}
                >
                  느리게
                </SeniorButton>
                <SeniorButton 
                  variant={speechRate === 1.0 ? "primary" : "outline"} 
                  size="normal"
                  onClick={() => setSpeechRate(1.0)}
                >
                  보통
                </SeniorButton>
                <SeniorButton 
                  variant={speechRate === 1.25 ? "primary" : "outline"} 
                  size="normal"
                  onClick={() => setSpeechRate(1.25)}
                >
                  빠르게
                </SeniorButton>
              </div>
            </div>
          </div>
        </section>

        {/* 2. 화면/접근성 */}
        <section className="responsive-panel vb-settings-section" style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '24px 32px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{ fontSize: 'var(--text-xl)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Monitor size={24} color="var(--color-primary)" />
            <span>화면 및 접근성</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <strong style={{ fontSize: 'var(--text-lg)', display: 'block', marginBottom: '8px' }}>글자 크기 조절</strong>
              <div className="settings-options" style={{ display: 'flex', gap: '12px' }}>
                <SeniorButton variant={fontSize === 'normal' ? 'primary' : 'outline'} size="normal" onClick={() => setFontSize('normal')}>보통</SeniorButton>
                <SeniorButton variant={fontSize === 'large' ? 'primary' : 'outline'} size="normal" onClick={() => setFontSize('large')}>크게</SeniorButton>
                <SeniorButton variant={fontSize === 'xlarge' ? 'primary' : 'outline'} size="normal" onClick={() => setFontSize('xlarge')}>아주 크게</SeniorButton>
              </div>
            </div>
            
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', cursor: 'pointer' }}>
              <div>
                <strong style={{ fontSize: 'var(--text-lg)', display: 'block' }}>고대비 모드 (색약 보정)</strong>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>화면의 색상 대비를 뚜렷하게 만듭니다.</span>
              </div>
              <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} style={{ width: '24px', height: '24px' }} />
            </label>
          </div>
        </section>

        {/* 3. 계정 설정 */}
        <section className="responsive-panel vb-settings-section" style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '24px 32px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{ fontSize: 'var(--text-xl)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={24} color="var(--color-primary)" />
            <span>계정 관리</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
              <strong style={{ fontSize: 'var(--text-lg)', display: 'block' }}>프로필 정보</strong>
              <div style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                이름: {user?.name || '정보 없음'} <br/>
                이메일: {user?.email || '정보 없음'}
              </div>
            </div>
            <div className="settings-options" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <SeniorButton variant="outline" size="normal" icon={<LogOut size={20} />} onClick={logout}>로그아웃</SeniorButton>
              <SeniorButton variant="ghost" size="normal" disabled={true} style={{ color: 'var(--color-text-muted)' }}>회원 탈퇴 (기능 준비 중)</SeniorButton>
            </div>
          </div>
        </section>

        {/* 4. 개인정보/데이터 */}
        <section className="responsive-panel vb-settings-section" style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '24px 32px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{ fontSize: 'var(--text-xl)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={24} color="var(--color-primary)" />
            <span>개인정보 및 음성 데이터</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <strong style={{ fontSize: 'var(--text-lg)', display: 'block' }}>음성 데이터 초기화</strong>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                서버에 저장된 모든 음성 학습 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
              </p>
              <SeniorButton variant="secondary" size="normal" disabled={true}>음성 데이터 삭제 (기능 준비 중)</SeniorButton>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
