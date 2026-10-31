import React, { useState } from 'react';
import { Volume2, Monitor, Shield, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { deleteVoiceDataApi, AuthApiError } from '../../api/auth';
import { BrandDialog } from '../../components/common/BrandDialog';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { SeniorButton } from '../../components/common/SeniorButton';
import { FeaturePageHeader } from '../../components/layout/FeaturePageHeader';
import {
  isPhraseSuggestionEnabled,
  isConversationModeEnabled,
  setDevFeatureFlag,
} from '../../utils/featureFlags';

export const SettingsPage: React.FC = () => {
  const [, setDevUpdateTick] = useState(0);
  const { 
    fontSize, 
    setFontSize, 
    highContrast, 
    setHighContrast,
    autoTtsPlayback,
    setAutoTtsPlayback,
    speechRate,
    setSpeechRate,
    requireAuth,
    notifyVoiceDataCleared,
  } = useApp();

  const [showVoiceResetModal, setShowVoiceResetModal] = useState(false);
  const [isDeletingVoiceData, setIsDeletingVoiceData] = useState(false);
  const [voiceResetError, setVoiceResetError] = useState<string | null>(null);
  const [voiceResetSuccess, setVoiceResetSuccess] = useState<string | null>(null);

  const handleOpenVoiceResetModal = () => {
    setVoiceResetError(null);
    setVoiceResetSuccess(null);
    if (!requireAuth('settings')) {
      return;
    }
    setShowVoiceResetModal(true);
  };

  const handleCloseVoiceResetModal = () => {
    if (isDeletingVoiceData) return;
    setShowVoiceResetModal(false);
    setVoiceResetError(null);
  };

  const handleConfirmDeleteVoiceData = async () => {
    if (isDeletingVoiceData) return;

    setIsDeletingVoiceData(true);
    setVoiceResetError(null);
    setVoiceResetSuccess(null);

    try {
      await deleteVoiceDataApi();
      notifyVoiceDataCleared();
      setShowVoiceResetModal(false);
      setVoiceResetSuccess('음성 데이터가 삭제되었습니다.');
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        setVoiceResetError(err.message);
      } else if (err instanceof Error) {
        setVoiceResetError(err.message || '음성 데이터 초기화 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      } else {
        setVoiceResetError('음성 데이터 초기화 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsDeletingVoiceData(false);
    }
  };

  return (
    <div className="vb-theme vb-page vb-page--settings responsive-page settings-page" style={{ maxWidth: '800px', margin: '30px auto', padding: '0 16px 60px' }}>
      <FeaturePageHeader eyebrow="SETTINGS / PREFERENCES" title={<>나에게 맞게,<br /><span>VoiceBridge를 조정하세요</span></>} description="음성, 화면, 개인정보와 데이터 설정을 한곳에서 관리합니다." />
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

        {/* 3. 음성 데이터 관리 */}
        <section className="responsive-panel vb-settings-section" style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '24px 32px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{ fontSize: 'var(--text-xl)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Shield size={24} color="var(--color-primary)" />
            <span>음성 데이터 관리</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.6 }}>
              저장된 음성인식 기록과 관련 음성 파일을 삭제할 수 있습니다.
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              계정과 직접 추가한 자주 쓰는 문구, 접근성 설정은 유지됩니다. (AI 대화 모드의 임시 대화 데이터는 최대 10분 후 자동 만료됩니다.)
            </p>

            {voiceResetSuccess && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#eef4ed',
                  border: '1px solid #d3e2d1',
                  color: '#1a3c2c',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={20} color="#28523e" style={{ flexShrink: 0 }} />
                <span>{voiceResetSuccess}</span>
              </div>
            )}

            {!showVoiceResetModal && voiceResetError && (
              <ErrorMessage
                message={voiceResetError}
                onDismiss={() => setVoiceResetError(null)}
              />
            )}

            <div style={{ paddingTop: '4px' }}>
              <button
                type="button"
                onClick={handleOpenVoiceResetModal}
                disabled={isDeletingVoiceData}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  color: '#991b1b',
                  backgroundColor: '#fcf8f7',
                  border: '1.5px solid #e2c5c2',
                  borderRadius: '8px',
                  cursor: isDeletingVoiceData ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isDeletingVoiceData) {
                    e.currentTarget.style.backgroundColor = '#f9ecea';
                    e.currentTarget.style.borderColor = '#d4a39e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeletingVoiceData) {
                    e.currentTarget.style.backgroundColor = '#fcf8f7';
                    e.currentTarget.style.borderColor = '#e2c5c2';
                  }
                }}
              >
                <span>음성 데이터 초기화</span>
              </button>
            </div>
          </div>
        </section>

        {/* 5. 개발 환경 전용 AI 기능 미리보기 제어판 (DEV 모드에서만 표시) */}
        {import.meta.env.DEV && (
          <section className="responsive-panel vb-settings-section" style={{
            backgroundColor: 'var(--color-bg-surface)',
            padding: '24px 32px',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px dashed var(--color-primary)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: 'var(--text-xl)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={24} color="var(--color-primary)" />
              <span>개발자 도구 (AI 기능 테스트)</span>
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '18px' }}>
              신규 AI 기능의 UI 및 연동 흐름을 테스트하기 위한 개발 환경 전용 제어판입니다. (운영 빌드에서는 자동 제외됩니다)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
                <div>
                  <strong style={{ fontSize: 'var(--text-base)', display: 'block' }}>1. AI 문장 추천 기능 (자주 쓰는 문구)</strong>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>자주 쓰는 문구 화면에서 [AI 문장 추천] 버튼 및 추천 모달을 활성화합니다.</span>
                </div>
                <input
                  type="checkbox"
                  checked={isPhraseSuggestionEnabled()}
                  onChange={(e) => {
                    setDevFeatureFlag('suggestion', e.target.checked);
                    setDevUpdateTick((t) => t + 1);
                  }}
                  style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                />
              </label>

              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
                <div>
                  <strong style={{ fontSize: 'var(--text-base)', display: 'block' }}>2. AI 대화 기능</strong>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>메뉴 및 화면에 [AI 대화] (상대방 음성 녹음·AI 추천 답변)를 활성화합니다.</span>
                </div>
                <input
                  type="checkbox"
                  checked={isConversationModeEnabled()}
                  onChange={(e) => {
                    setDevFeatureFlag('conversation', e.target.checked);
                    setDevUpdateTick((t) => t + 1);
                  }}
                  style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                />
              </label>

              <div style={{ fontSize: 'var(--text-xs)', color: '#4B5563', backgroundColor: '#F3F4F6', padding: '12px 16px', borderRadius: '8px', lineHeight: 1.5 }}>
                💡 <strong>URL 파라미터 안내:</strong> 주소창에 <code>?ai=true</code>를 입력해 접속하면 두 기능이 즉시 활성화됩니다.
              </div>
            </div>
          </section>
        )}

      </div>

      {/* 음성 데이터 초기화 확인 모달 */}
      {showVoiceResetModal && (
        <BrandDialog
          label="음성 데이터 삭제 확인"
          className="vb-dialog-add-phrase"
          onClose={handleCloseVoiceResetModal}
        >
          <div
            className="vb-modal-panel"
            style={{
              width: 'min(580px, calc(100vw - 32px))',
              maxWidth: '580px',
              padding: 'clamp(24px, 4vw, 32px) clamp(20px, 4vw, 28px)',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
              margin: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b91c1c',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, color: '#1a2721' }}>
                저장된 음성 데이터를 삭제할까요?
              </h3>
            </div>

            <p
              style={{
                fontSize: 'var(--text-base)',
                color: '#374151',
                lineHeight: 1.6,
                marginBottom: '12px',
                wordBreak: 'keep-all',
              }}
            >
              음성인식 기록, 확인한 문장, 생성된 음성 파일이 삭제됩니다.
            </p>

            <div
              style={{
                backgroundColor: '#f8faf8',
                border: '1px solid var(--vb-line, #e2e8e0)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: 'var(--text-sm)',
                color: '#4b5563',
                lineHeight: 1.55,
                marginBottom: voiceResetError ? '16px' : '24px',
              }}
            >
              계정과 직접 추가한 자주 쓰는 문구는 삭제되지 않습니다.
            </div>

            {voiceResetError && (
              <div style={{ marginBottom: '20px' }}>
                <ErrorMessage
                  message={voiceResetError}
                  onDismiss={() => setVoiceResetError(null)}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <SeniorButton
                type="button"
                variant="outline"
                size="normal"
                disabled={isDeletingVoiceData}
                onClick={handleCloseVoiceResetModal}
              >
                취소
              </SeniorButton>
              <SeniorButton
                type="button"
                variant="danger"
                size="normal"
                disabled={isDeletingVoiceData}
                onClick={handleConfirmDeleteVoiceData}
              >
                {isDeletingVoiceData ? '삭제 중...' : '음성 데이터 삭제'}
              </SeniorButton>
            </div>
          </div>
        </BrandDialog>
      )}
    </div>
  );
};
