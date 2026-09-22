import React, { useState } from 'react';
import {
  Cpu,
  PlusCircle,
  TrendingUp,
  RefreshCw,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';

export const PersonalizationPage: React.FC = () => {
  const { personalization, addVoiceSample, triggerModelTraining, user } = useApp();
  const [isTraining, setIsTraining] = useState(false);

  const progressPercent = Math.round(
    (personalization.collectedCount / personalization.targetCount) * 100
  );

  const handleTrainClick = () => {
    setIsTraining(true);
    triggerModelTraining();
    setTimeout(() => {
      setIsTraining(false);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 2500);
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '30px auto', padding: '0 16px 60px' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '28px 32px',
          borderRadius: 'var(--border-radius-lg)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
          >
            <Cpu size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)' }}>AI 개인화 모델 학습</h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
              {user?.name || '홍길동'}님의 고유한 발성 패턴을 학습하여 인식 정확도를 비약적으로 높입니다.
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Dashboard Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Card 1: Data Collection Status */}
        <div
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
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary-light)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                }}
              >
                {progressPercent}% 달성
              </span>
            </div>

            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              진단 및 문장 연습 시 녹음된 음성이 개인 맞춤 데이터로 안전하게 축적됩니다.
            </p>

            {/* Progress Bar */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                <span>현재 수집량</span>
                <span>
                  {personalization.collectedCount} / {personalization.targetCount} 문장
                </span>
              </div>
              <div
                style={{
                  height: '14px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: '7px',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-primary)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              💡 50문장 이상 모이면 전용 모델의 인식 정확도가 95% 이상으로 최적화됩니다.
            </p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <SeniorButton
              variant="outline"
              size="normal"
              fullWidth
              icon={<PlusCircle size={20} />}
              onClick={addVoiceSample}
            >
              녹음 음성 샘플 1개 추가하기
            </SeniorButton>
          </div>
        </div>

        {/* Card 2: AI Model Status */}
        <div
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
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 800,
                  color: isTraining ? 'var(--color-warning)' : 'var(--color-secondary)',
                  backgroundColor: isTraining ? '#fef3c7' : 'var(--color-secondary-light)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: `1px solid ${isTraining ? '#f59e0b' : 'var(--color-secondary-border)'}`,
                }}
              >
                {isTraining ? '학습 진행 중...' : '최신 버전 적용됨'}
              </span>
            </div>

            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              최근 학습 일시: <strong>{personalization.lastTrainedAt || '2026.09.20 14:30'}</strong>
            </p>

            {/* Model Info Box */}
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
                  {user?.name || '홍길동'}님 전용 V2.4 모델
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                혀끝 조음 및 호흡 부족 구간 보정 알고리즘이 성공적으로 반영되어 있습니다.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <SeniorButton
              variant="secondary"
              size="normal"
              fullWidth
              icon={<RefreshCw size={20} className={isTraining ? 'animate-spin-slow' : ''} />}
              onClick={handleTrainClick}
              disabled={isTraining}
            >
              {isTraining ? 'AI 모델 튜닝 중...' : '지금 AI 모델 재학습하기'}
            </SeniorButton>
          </div>
        </div>
      </div>

      {/* Accuracy Comparison Banner (일반 모델 vs 맞춤형 모델 비교) */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '32px',
          borderRadius: 'var(--border-radius-lg)',
          border: '2px solid var(--color-secondary-border)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <TrendingUp size={26} color="var(--color-secondary)" />
          <h2 style={{ fontSize: 'var(--text-2xl)' }}>
            개인 맞춤 모델 적용 효과 비교
          </h2>
        </div>

        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '28px' }}>
          구음장애 환자의 특수 조음 발음 시, 일반 범용 AI 모델 대비 개인화 모델의 인식 성공률 차이입니다.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
          }}
        >
          {/* General Model */}
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--border-radius-md)',
              border: '1.5px solid var(--color-border)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              일반 음성 인식 모델 (기존)
            </span>
            <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--color-text-muted)', margin: '12px 0' }}>
              {personalization.standardAccuracy}%
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              발음 왜곡 발생 시 오인식 빈번
            </p>
          </div>

          {/* Personalized Model */}
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--color-secondary-light)',
              borderRadius: 'var(--border-radius-md)',
              border: '2px solid var(--color-secondary)',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-secondary)' }}>
              🌟 {user?.name || '홍길동'}님 전용 맞춤 모델
            </span>
            <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--color-secondary)', margin: '12px 0' }}>
              {personalization.personalizedAccuracy}%
            </div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-secondary)' }}>
              +44% 인식률 향상 (일상 대화 원활)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
