import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mic,
  Square,
  X,
  RefreshCw
} from 'lucide-react';

import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';
import { TTSButton } from '../../components/common/TTSButton';
import { AudioVisualizer } from '../../components/common/AudioVisualizer';
import { FeaturePageHeader } from '../../components/layout/FeaturePageHeader';
import { getRecommendationsApi } from '../../api/recommendation';
import type { RecommendationSentence } from '../../api/recommendation';
import { ErrorMessage } from '../../components/common/ErrorMessage';

export const PracticePage: React.FC = () => {
  const { setCurrentTab } = useApp();
  
  const [sentences, setSentences] = useState<RecommendationSentence[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSentence, setActiveSentence] = useState<RecommendationSentence | null>(null);

  // Practice Modal State
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);

  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);



  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      
      const res = await getRecommendationsApi(token, 10);
      if (res.success && res.data && res.data.sentences) {
        if (res.data.sentences.length === 0) {
          setError('추천받을 문장이 없습니다. 나중에 다시 시도해주세요.');
        } else {
          setSentences(res.data.sentences);
        }
      } else {
        throw new Error('응답 형식이 올바르지 않습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('추천 문장을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    loadRecommendations();
  }, [loadRecommendations]);

  const openPracticeModal = (sentence: RecommendationSentence) => {
    setActiveSentence(sentence);
    setIsRecording(false);
    setHasRecorded(false);
    setPracticeError(null);
  };

  const closePracticeModal = () => {
    setActiveSentence(null);
    setIsRecording(false);
    setHasRecorded(false);
    setPracticeError(null);
  };

  useEffect(() => {
    if (activeSentence) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        modalRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }, 0);
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closePracticeModal();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (previousFocusRef.current && previousFocusRef.current.isConnected) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [activeSentence]);

  const handleStartPracticeRecord = () => {
    setPracticeError(null);
    setIsRecording(true);
    setHasRecorded(false);
  };

  const handleStopPracticeRecord = () => {
    setIsRecording(false);
    setPracticeError('현재 녹음 평가 기능을 준비하고 있습니다.');
  };

  return (
    <div className="vb-theme vb-page vb-page--practice responsive-page" style={{ maxWidth: '1040px', margin: '30px auto', padding: '0 16px 60px' }}>
      <FeaturePageHeader eyebrow="PRACTICE / SPEECH CARE" title={<>문장을 천천히,<br /><span>나의 목소리로.</span></>} description="문장을 듣고, 읽고, 반복해서 연습합니다." />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', margin: 0, fontWeight: 800 }}>추천 연습 문장</h2>
        <SeniorButton
          variant="outline"
          size="normal"
          icon={<RefreshCw size={18} className={loading ? "spin-animation" : ""} />}
          onClick={loadRecommendations}
          disabled={loading}
        >
          {loading ? '불러오는 중...' : '새 문장 불러오기'}
        </SeniorButton>
      </div>

      {error ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <ErrorMessage message={error} />
          <div>
            <SeniorButton variant="primary" onClick={loadRecommendations}>다시 시도</SeniorButton>
            {error.includes('로그인') && (
              <SeniorButton variant="secondary" onClick={() => setCurrentTab('login')} style={{ marginLeft: '12px' }}>로그인하러 가기</SeniorButton>
            )}
          </div>
        </div>
      ) : loading && sentences.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          추천 문장을 불러오는 중입니다...
        </div>
      ) : (
        <div className="vb-practice-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sentences.map((sentence) => (
            <article className="responsive-panel vb-practice-row"
              key={sentence.promptId}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                padding: '24px 28px',
                borderRadius: 'var(--border-radius-lg)',
                border: '2px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div className="practice-copy" style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-title)' }}>
                  {sentence.text}
                </div>
              </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <TTSButton text={sentence.text} label="듣기" size="normal" />
              <SeniorButton
                variant="secondary"
                size="normal"
                icon={<Mic size={20} />}
                onClick={() => openPracticeModal(sentence)}
              >
                연습하기
              </SeniorButton>
            </div>
          </article>
          ))}
        </div>
      )}

      {/* PRACTICE MODAL */}
      {activeSentence && (
        <div className="practice-overlay"
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="practice-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div className="responsive-panel practice-dialog vb-practice-dialog"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              width: '100%',
              maxWidth: '680px',
              borderRadius: 'var(--border-radius-lg)',
              padding: '36px',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            {/* Close Button */}
            <button className="touch-control"
              onClick={closePracticeModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                padding: '8px',
                borderRadius: '50%',
                color: 'var(--color-text-muted)',
              }}
              aria-label="닫기"
            >
              <X size={26} />
            </button>

            <p id="practice-dialog-title" style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '16px', marginTop: '16px' }}>
              문장을 또박또박 발음해보세요.
            </p>

            {/* Modal Big Sentence */}
            <div
              style={{
                fontSize: 'var(--text-3xl)',
                fontWeight: 800,
                color: 'var(--color-text-title)',
                padding: '24px 16px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--border-radius-md)',
                marginBottom: '20px',
                border: '2px solid var(--color-secondary-border)',
              }}
            >
              "{activeSentence.text}"
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <TTSButton text={activeSentence.text} label="표준 발음 듣기" size="large" />
            </div>

            {/* Audio Visualizer */}
            <div style={{ marginBottom: '24px' }}>
              <AudioVisualizer isRecording={isRecording} height={70} />
            </div>

            {practiceError && (
              <div style={{ marginBottom: '24px' }}>
                <ErrorMessage message={practiceError} />
              </div>
            )}



            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {!isRecording ? (
                <SeniorButton
                  variant="secondary"
                  size="large"
                  icon={<Mic size={26} />}
                  onClick={handleStartPracticeRecord}
                >
                  {hasRecorded ? '다시 녹음하기' : '녹음 시작'}
                </SeniorButton>
              ) : (
                <SeniorButton
                  variant="danger"
                  size="large"
                  icon={<Square size={24} />}
                  onClick={handleStopPracticeRecord}
                >
                  녹음 완료 및 평가
                </SeniorButton>
              )}

              <SeniorButton variant="outline" size="large" onClick={closePracticeModal}>
                연습 마치기
              </SeniorButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
