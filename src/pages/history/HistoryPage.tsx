import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Mic,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';

export const HistoryPage: React.FC = () => {
  const { historyResults, user, setCurrentTab } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(historyResults[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '30px auto', padding: '0 16px 60px' }}>
      {/* User Summary Profile Card */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '28px 32px',
          borderRadius: 'var(--border-radius-lg)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={34} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: 'var(--text-2xl)' }}>{user?.name || '김채영'}님의 발음 기록실</h1>
            </div>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
              가입일: {user?.createdAt || '2026.08.01'} | 총 {historyResults.length}회 진단 완료
            </p>
          </div>
        </div>

        <SeniorButton
          variant="primary"
          size="normal"
          icon={<Mic size={20} />}
          onClick={() => setCurrentTab('diagnosis')}
        >
          새 발음 진단하기
        </SeniorButton>
      </div>

      {/* Score Progress Trend (성장 그래프) */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '30px',
          borderRadius: 'var(--border-radius-lg)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <TrendingUp size={26} color="var(--color-primary)" />
          <h2 style={{ fontSize: 'var(--text-2xl)' }}>발음 정확도 향상 추이</h2>
        </div>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '28px' }}>
          첫 진단(63점) 대비 현재 <strong>+19점</strong> 대폭 향상되었습니다! 꾸준한 연습의 결과입니다.
        </p>

        {/* Visual Bar Chart */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            height: '220px',
            padding: '16px 8px 30px',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--border-radius-md)',
            position: 'relative',
          }}
        >
          {historyResults
            .slice()
            .reverse()
            .map((item, index) => {
              const heightPercent = Math.round((item.overallScore / 100) * 160);
              const isLatest = index === historyResults.length - 1;

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    width: '64px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 900,
                      color: isLatest ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    {item.overallScore}점
                  </span>
                  <div
                    style={{
                      width: '42px',
                      height: `${heightPercent}px`,
                      borderRadius: '8px 8px 0 0',
                      backgroundColor: isLatest ? 'var(--color-primary)' : 'var(--color-border)',
                      boxShadow: isLatest ? 'var(--shadow-md)' : 'none',
                      transition: 'height 0.4s ease',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      whiteSpace: 'nowrap',
                      position: 'absolute',
                      bottom: '8px',
                    }}
                  >
                    {item.date.slice(5)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* History Inspection List */}
      <div>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={24} color="var(--color-secondary)" />
          <span>회차별 진단 상세 기록</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {historyResults.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderRadius: 'var(--border-radius-lg)',
                  border: '2px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                }}
              >
                {/* Header Row (Clickable) */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  style={{
                    padding: '24px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 900,
                        color: 'var(--color-primary)',
                      }}
                    >
                      {item.overallScore}점
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text-title)' }}>
                        {item.date} 진단 리포트
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        취약 음소: {item.weakPhonemes.map((w) => `'${w.phoneme}' (${w.accuracy}%)`).join(', ')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                      {isExpanded ? '접기' : '상세보기'}
                    </span>
                    {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: '24px 28px', borderTop: '2px solid var(--color-border)' }}>
                    {/* Metrics Breakdown */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '16px',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>발음 정확도</span>
                        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-primary)' }}>
                          {item.metrics.accuracy}%
                        </div>
                      </div>
                      <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>유창도</span>
                        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-secondary)' }}>
                          {item.metrics.fluency}%
                        </div>
                      </div>
                      <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>소리 명료도</span>
                        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: '#0284c7' }}>
                          {item.metrics.clarity}%
                        </div>
                      </div>
                    </div>

                    {/* Specialist Comment */}
                    <div
                      style={{
                        padding: '16px 20px',
                        backgroundColor: 'var(--color-primary-light)',
                        borderRadius: 'var(--border-radius-md)',
                        border: '1.5px solid var(--color-primary-border)',
                      }}
                    >
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                        💬 당시 언어분석 피드백
                      </div>
                      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-body)', lineHeight: 1.6 }}>
                        {item.comment}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
