import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Mic,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';
import type { RecognitionResponse } from '../../api/recognition';
import { getRecognitionsApi, getRecognitionApi } from '../../api/recognition';
import { FeaturePageHeader } from '../../components/layout/FeaturePageHeader';
import { ErrorMessage } from '../../components/common/ErrorMessage';

export const HistoryPage: React.FC = () => {
  const { user, setCurrentTab } = useApp();
  
  const [recognitions, setRecognitions] = useState<RecognitionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Record<string, RecognitionResponse>>({});
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      try {
        setError(null);
        const res = await getRecognitionsApi(token, 0, 20);
        if (res.success && res.data) {
          setRecognitions(res.data.content);
        } else {
          throw new Error(res.error?.message || '기록을 불러오지 못했습니다.');
        }
      } catch (err) {
        console.error('Failed to load recognition history:', err);
        setError('기록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setDetailError(null);
    
    if (!detailData[id]) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await getRecognitionApi(token, id);
          if (res.success && res.data) {
            setDetailData(prev => ({ ...prev, [id]: res.data! }));
          }
        } catch (err) {
          console.error(err);
          setDetailError('기록 상세 내용을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    }
  };

  return (
    <div className="vb-theme vb-page vb-page--history responsive-page" style={{ maxWidth: '1040px', margin: '30px auto', padding: '0 16px 60px' }}>
      <FeaturePageHeader eyebrow="HISTORY / YOUR RECORDS" title={<>나의 대화와,<br /><span>목소리의 기록.</span></>} description="실제 음성 인식 결과와 인식 신뢰도의 흐름을 확인합니다." meta={`TOTAL ${recognitions.length}`} />
      {/* User Summary Profile Card */}
      <div className="responsive-panel vb-history-summary"
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
        <div>
          <p className="vb-eyebrow" style={{ marginBottom: '8px' }}>RECOGNITION ARCHIVE</p>
          <h2 style={{ fontSize: 'var(--text-2xl)' }}>{user?.name || '사용자'}님의 음성 인식 기록</h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
            총 {recognitions.length}건의 기록이 있습니다.
          </p>
        </div>

        <SeniorButton
          variant="primary"
          size="normal"
          icon={<Mic size={20} />}
          onClick={() => setCurrentTab('dashboard')}
        >
          말해서 전달하기 가기
        </SeniorButton>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          기록을 불러오는 중입니다...
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : recognitions.length === 0 ? (
        <div className="vb-empty-state" style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--border-radius-lg)', border: '2px solid var(--color-border)' }}>
          <Mic size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '8px' }}>아직 기록이 없습니다.</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>말해서 전달하기를 사용하면 기록이 여기에 표시됩니다.</p>
        </div>
      ) : (
        <>
          {/* Score Progress Trend */}
          <section className="responsive-panel vb-history-trend"
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
              <h2 style={{ fontSize: 'var(--text-2xl)' }}>인식 신뢰도 추이</h2>
            </div>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '28px' }}>
              최근 기록된 음성 인식의 신뢰도(0~100점) 변화를 보여줍니다.
            </p>

            <div className="history-chart"
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
              {recognitions
                .slice(0, 10)
                .reverse()
                .map((item, index, arr) => {
                  const score = item.confidence !== null ? Math.round(item.confidence * 100) : null;
                  const heightPercent = score !== null ? Math.round((score / 100) * 160) : 0;
                  const isLatest = index === arr.length - 1;

                  return (
                    <div className="history-bar"
                      key={item.recognitionId}
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
                        {score !== null ? `${score}점` : '-'}
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
                    </div>
                  );
                })}
            </div>
          </section>

          {/* History Inspection List */}
          <section className="vb-page-section vb-history-list">
            <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={24} color="var(--color-secondary)" />
              <span>음성 인식 상세 기록</span>
            </h2>

            {detailError && <div style={{ marginBottom: '16px' }}><ErrorMessage message={detailError} /></div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recognitions.map((item) => {
                const isExpanded = expandedId === item.recognitionId;
                const score = item.confidence !== null ? Math.round(item.confidence * 100) : null;

                return (
                  <article className="vb-history-row"
                    key={item.recognitionId}
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderRadius: 'var(--border-radius-lg)',
                      border: '2px solid var(--color-border)',
                      boxShadow: 'var(--shadow-sm)',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="responsive-panel history-summary"
                      onClick={() => toggleExpand(item.recognitionId)}
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
                          {score !== null ? `${score}점` : 'N/A'}
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text-title)' }}>
                            {item.recognizedText.length > 20 ? item.recognizedText.substring(0, 20) + '...' : item.recognizedText}
                          </div>
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            사용 모델: {item.modelUsed === 'PERSONALIZED' ? '개인화 모델' : '기본 인식 모델'}
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

                    {isExpanded && (
                      <div className="responsive-panel" style={{ padding: '24px 28px', borderTop: '2px solid var(--color-border)' }}>
                        <div
                          style={{
                            padding: '16px 20px',
                            backgroundColor: 'var(--color-primary-light)',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1.5px solid var(--color-primary-border)',
                          }}
                        >
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                            인식된 전체 텍스트
                          </div>
                          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-body)', lineHeight: 1.6 }}>
                            {detailData[item.recognitionId] ? detailData[item.recognitionId].recognizedText : item.recognizedText}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
