import React from 'react';
import {
  Mic,
  BookOpen,
  Cpu,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Award,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';

export const DashboardPage: React.FC = () => {
  const { user, latestDiagnosis, historyResults, setCurrentTab } = useApp();

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Warm Senior Greeting Header with Hero Illustration */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '32px',
          borderRadius: 'var(--border-radius-lg)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'center',
          gap: '28px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontWeight: 800,
              fontSize: 'var(--text-xs)',
              marginBottom: '12px',
            }}
          >
            <span>🎙️ VoiceBridge 케어 센터</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>👋</span>
            <h1 style={{ fontSize: 'var(--text-3xl)', color: 'var(--color-text-title)' }}>
              안녕하세요, <span style={{ color: 'var(--color-primary)' }}>{user?.name || '김채영'}</span>님!
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
            오늘도 <strong>VoiceBridge</strong>와 함께 편안한 마음으로 또박또박 대화해 볼까요?
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <SeniorButton
              variant="primary"
              size="large"
              icon={<Mic size={24} />}
              onClick={() => setCurrentTab('diagnosis')}
            >
              오늘의 발음 진단 시작
            </SeniorButton>
            <SeniorButton
              variant="outline"
              size="large"
              icon={<MessageSquare size={22} />}
              onClick={() => setCurrentTab('assist')}
            >
              대화 보조 켜기
            </SeniorButton>
          </div>
        </div>

        {/* Hero Visual Asset */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img
            src="/voicebridge_hero.jpg"
            alt="VoiceBridge AI Speech Therapy & Voice Care"
            style={{
              width: '100%',
              maxWidth: '440px',
              height: 'auto',
              borderRadius: 'var(--border-radius-md)',
              border: '2px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>

      {/* Today's Status Banner (Score & Weak Phonemes) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* Left Card: Score & Metrics */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            padding: '28px',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          {/* Circular Score Gauge */}
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'conic-gradient(var(--color-primary) 0% 82%, var(--color-bg-subtle) 82% 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '92px',
                height: '92px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1 }}>
                {latestDiagnosis.overallScore}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                발음 정확도
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Award size={22} color="var(--color-primary)" />
              <h2 style={{ fontSize: 'var(--text-xl)' }}>최근 발음 평가</h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
              지난 진단보다 <strong>+6점</strong> 향상되었어요!
            </p>

            {/* Quick Metrics Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '2px' }}>
                  <span>발음 정확도</span>
                  <span>{latestDiagnosis.metrics.accuracy}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${latestDiagnosis.metrics.accuracy}%`, height: '100%', backgroundColor: 'var(--color-primary)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '2px' }}>
                  <span>소리 명료도</span>
                  <span>{latestDiagnosis.metrics.clarity}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${latestDiagnosis.metrics.clarity}%`, height: '100%', backgroundColor: 'var(--color-secondary)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Focus Phonemes (Weak Phonemes) */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            padding: '28px',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={22} color="var(--color-accent)" />
                <h2 style={{ fontSize: 'var(--text-xl)' }}>집중 연습 음소</h2>
              </div>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  backgroundColor: 'var(--color-accent-light)',
                  color: 'var(--color-accent)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-accent-border)',
                }}
              >
                주의 필요
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              AI 분석 결과, 아래 발음을 집중적으로 연습하면 훨씬 선명해집니다.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {latestDiagnosis.weakPhonemes.map((wp) => (
                <div
                  key={wp.phoneme}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    backgroundColor: 'var(--color-accent-light)',
                    border: '2px solid var(--color-accent-border)',
                    borderRadius: 'var(--border-radius-md)',
                  }}
                >
                  <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--color-accent)' }}>
                    {wp.phoneme}
                  </span>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-title)' }}>
                      정확도 {wp.accuracy}%
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                      {wp.errorType} 현상
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SeniorButton
            variant="outline"
            size="normal"
            icon={<ArrowRight size={20} />}
            onClick={() => setCurrentTab('practice')}
            style={{ alignSelf: 'flex-start' }}
          >
            맞춤 문장 연습하러 가기
          </SeniorButton>
        </div>
      </div>

      {/* 4 Key Core Feature Cards */}
      <div style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>주요 기능 바로가기</span>
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Card 1: Diagnosis */}
          <div
            onClick={() => setCurrentTab('diagnosis')}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              padding: '24px',
              borderRadius: 'var(--border-radius-lg)',
              border: '2px solid var(--color-primary-border)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Mic size={30} />
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '8px' }}>발음 진단</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
                5개의 문장을 천천히 소리 내어 읽고 현재 발음 상태를 검사합니다.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>
              <span>지금 시작하기</span>
              <ChevronRight size={20} />
            </div>
          </div>

          {/* Card 2: Practice */}
          <div
            onClick={() => setCurrentTab('practice')}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              padding: '24px',
              borderRadius: 'var(--border-radius-lg)',
              border: '2px solid var(--color-secondary-border)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--color-secondary-light)',
                  color: 'var(--color-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <BookOpen size={30} />
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '8px' }}>추천 문장</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
                나의 취약 발음(ㄹ, ㅅ)에 맞춘 추천 문장을 하나씩 반복 연습합니다.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--color-secondary)', fontSize: 'var(--text-base)' }}>
              <span>연습하기</span>
              <ChevronRight size={20} />
            </div>
          </div>

          {/* Card 3: Personalization */}
          <div
            onClick={() => setCurrentTab('personalization')}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              padding: '24px',
              borderRadius: 'var(--border-radius-lg)',
              border: '2px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Cpu size={30} />
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '8px' }}>개인화 학습</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
                나의 목소리 데이터를 학습시켜 전용 AI 음성 인식 모델을 만듭니다.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>
              <span>학습 현황 보기</span>
              <ChevronRight size={20} />
            </div>
          </div>

          {/* Card 4: Voice Assist */}
          <div
            onClick={() => setCurrentTab('assist')}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              padding: '24px',
              borderRadius: 'var(--border-radius-lg)',
              border: '2px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--color-secondary-light)',
                  color: 'var(--color-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <MessageSquare size={30} />
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '8px' }}>실사용 인식</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
                일상 대화 시 마이크로 말씀하시면 선명한 글자와 음성으로 대신 전합니다.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--color-secondary)', fontSize: 'var(--text-base)' }}>
              <span>대화 시작하기</span>
              <ChevronRight size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent History Preview */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '24px 28px',
          borderRadius: 'var(--border-radius-lg)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={24} color="var(--color-primary)" />
            <h2 style={{ fontSize: 'var(--text-xl)' }}>최근 진단 기록</h2>
          </div>
          <button
            onClick={() => setCurrentTab('history')}
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>전체 이력 보기</span>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {historyResults.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => setCurrentTab('history')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--border-radius-md)',
                cursor: 'pointer',
              }}
            >
              <div>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-text-title)' }}>
                  {item.date} 진단
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginLeft: '12px' }}>
                  취약 음소: {item.weakPhonemes.map(w => w.phoneme).join(', ')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--color-primary)' }}>
                  {item.overallScore}점
                </span>
                <ChevronRight size={20} color="var(--color-text-muted)" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
