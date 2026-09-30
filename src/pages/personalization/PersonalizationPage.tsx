import React, { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw, Award } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';
import type { PersonalizationModelResponse } from '../../api/personalization';
import { getPersonalizationModelApi } from '../../api/personalization';
import { FeaturePageHeader } from '../../components/layout/FeaturePageHeader';

export const PersonalizationPage: React.FC = () => {
  const { user } = useApp();
  const [model, setModel] = useState<PersonalizationModelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModel = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      try {
        const res = await getPersonalizationModelApi(token);
        if (res.success && res.data) {
          setModel(res.data);
        } else {
          throw new Error(res.error?.message || '개인화 모델 정보를 불러오지 못했습니다.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchModel();
  }, []);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="vb-theme vb-page vb-page--personalization responsive-page" style={{ maxWidth: '1040px', margin: '30px auto', padding: '0 16px 60px' }}>
      <FeaturePageHeader eyebrow="PERSONALIZATION / YOUR AI" title={<>YOUR VOICE,<br /><span>YOUR AI.</span></>} description={`${user?.name || '사용자'}님의 발화 패턴을 학습해, 사용할수록 목소리를 더 잘 이해합니다.`} />
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          데이터를 불러오는 중입니다...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-danger)' }}>
          {error}
        </div>
      ) : model && (
        <>
          {/* 2-Column Dashboard Cards */}
          <div className="responsive-grid vb-data-columns"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              marginBottom: '32px',
            }}
          >
            {/* Card 1: Data Collection Status */}
            <section className="responsive-panel vb-data-block"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                padding: '30px',
                borderRadius: 'var(--border-radius-lg)',
                border: '2px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: 'var(--text-xl)' }}>목소리 데이터 수집</h2>
                </div>

                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                  진단 및 문장 연습 시 녹음된 음성이 개인 맞춤 데이터로 안전하게 축적됩니다.
                </p>

                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--border-radius-md)',
                    marginBottom: '12px',
                  }}
                >
                  <strong style={{ fontSize: 'var(--text-lg)' }}>
                    학습에 사용된 녹음: {model.trainingRecordingCount}개
                  </strong>
                </div>

                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  충분한 녹음 데이터가 모이면 전용 모델의 인식 정확도가 최적화됩니다.
                </p>
              </div>

              <div style={{ marginTop: '24px' }}>
                <SeniorButton
                  variant="outline"
                  size="normal"
                  fullWidth
                  icon={<PlusCircle size={20} />}
                  onClick={() => {}}
                  disabled={true}
                >
                  샘플 수집 기능 준비 중
                </SeniorButton>
              </div>
            </section>

            {/* Card 2: AI Model Status */}
            <section className="responsive-panel vb-data-block"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                padding: '30px',
                borderRadius: 'var(--border-radius-lg)',
                border: '2px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: 'var(--text-xl)' }}>전용 AI 모델 상태</h2>
                </div>

                {model.hasPersonalizedModel ? (
                  <>
                    {model.trainedAt && (
                      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                        최근 학습 일시: <strong>{formatDate(model.trainedAt)}</strong>
                      </p>
                    )}
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--color-bg-subtle)',
                        borderRadius: 'var(--border-radius-md)',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Award size={20} color="var(--color-secondary)" />
                        <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-text-title)' }}>
                          전용 모델 (버전: {model.modelVersion})
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                        고유한 발성 패턴이 성공적으로 반영되어 있습니다.
                      </p>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      padding: '24px 16px',
                      backgroundColor: 'var(--color-bg-subtle)',
                      borderRadius: 'var(--border-radius-md)',
                      marginBottom: '16px',
                      textAlign: 'center'
                    }}
                  >
                    <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
                      아직 학습된 개인화 모델이 없습니다.
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '24px' }}>
                <SeniorButton
                  variant="secondary"
                  size="normal"
                  fullWidth
                  icon={<RefreshCw size={20} />}
                  onClick={() => {}}
                  disabled={true}
                >
                  학습 기능 준비 중
                </SeniorButton>
              </div>
            </section>
          </div>

          {/* Accuracy Comparison Banner */}
          <section className="responsive-panel vb-data-feature"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              padding: '32px',
              borderRadius: 'var(--border-radius-lg)',
              border: '2px solid var(--color-secondary-border)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: 'var(--text-2xl)' }}>
                개인 맞춤 모델 적용 효과 비교
              </h2>
            </div>

            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '28px' }}>
              구음장애 환자의 특수 조음 발음 시, 일반 범용 AI 모델 대비 개인화 모델의 인식 성공률 차이입니다.
            </p>

            <div className="responsive-panel"
              style={{
                padding: '30px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--border-radius-md)',
                border: '1.5px solid var(--color-border)',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                개인화 모델 성능 비교 데이터는 아직 제공되지 않습니다.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
