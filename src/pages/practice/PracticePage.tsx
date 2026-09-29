import React, { useState } from 'react';
import {
  BookOpen,
  Mic,
  Square,
  X,
  Sparkles,
} from 'lucide-react';

import { useApp } from '../../context/AppContext';
import type { PracticeSentence } from '../../types';
import { SeniorButton } from '../../components/common/SeniorButton';
import { TTSButton } from '../../components/common/TTSButton';
import { AudioVisualizer } from '../../components/common/AudioVisualizer';

export const PracticePage: React.FC = () => {
  const { practiceList, setCurrentTab } = useApp();
  const [selectedPhoneme, setSelectedPhoneme] = useState<string>('all');
  const [activeSentence, setActiveSentence] = useState<PracticeSentence | null>(null);

  // Practice Modal State
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [practiceScore, setPracticeScore] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: '전체 문장' },
    { id: 'ㄹ', label: 'ㄹ 집중 연습' },
    { id: 'ㅅ', label: 'ㅅ 집중 연습' },
    { id: 'ㅈ', label: 'ㅈ 집중 연습' },
  ];

  const filteredList = practiceList.filter((item) => {
    if (selectedPhoneme === 'all') return true;
    return item.targetPhonemes.includes(selectedPhoneme);
  });

  const openPracticeModal = (sentence: PracticeSentence) => {
    setActiveSentence(sentence);
    setIsRecording(false);
    setHasRecorded(false);
    setPracticeScore(sentence.lastScore || null);
  };

  const closePracticeModal = () => {
    setActiveSentence(null);
    setIsRecording(false);
    setHasRecorded(false);
    setPracticeScore(null);
  };

  const handleStartPracticeRecord = () => {
    setIsRecording(true);
    setHasRecorded(false);
    setPracticeScore(null);
  };

  const handleStopPracticeRecord = () => {
    setIsRecording(false);
    alert('발음 관리 서버(백엔드) 연동 준비 중입니다.');
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '30px auto', padding: '0 16px 60px' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '28px 32px',
          borderRadius: 'var(--border-radius-lg)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <BookOpen size={30} color="var(--color-secondary)" />
            <h1 style={{ fontSize: 'var(--text-3xl)' }}>추천 문장 연습</h1>
          </div>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
            나의 취약 음소(ㄹ, ㅅ, ㅈ)를 극복하기 위한 맞춤 발음 연습 문장입니다.
          </p>
        </div>

        <SeniorButton
          variant="outline"
          size="normal"
          icon={<Sparkles size={20} />}
          onClick={() => setCurrentTab('personalization')}
        >
          개인화 학습 현황 보기
        </SeniorButton>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          marginBottom: '24px',
          paddingBottom: '6px',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedPhoneme(cat.id)}
            style={{
              padding: '12px 24px',
              fontSize: 'var(--text-base)',
              fontWeight: 800,
              borderRadius: 'var(--border-radius-full)',
              border:
                selectedPhoneme === cat.id
                  ? '2px solid var(--color-secondary)'
                  : '2px solid var(--color-border)',
              backgroundColor:
                selectedPhoneme === cat.id ? 'var(--color-secondary)' : 'var(--color-bg-surface)',
              color: selectedPhoneme === cat.id ? '#ffffff' : 'var(--color-text-body)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: selectedPhoneme === cat.id ? 'var(--shadow-md)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sentences Grid List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredList.map((sentence) => (
          <div
            key={sentence.id}
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
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    padding: '4px 10px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-muted)',
                    borderRadius: '8px',
                  }}
                >
                  {sentence.category}
                </span>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {sentence.targetPhonemes.map((p) => (
                    <span
                      key={p}
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 800,
                        backgroundColor: 'var(--color-accent-light)',
                        color: 'var(--color-accent)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-accent-border)',
                      }}
                    >
                      '{p}' 조음
                    </span>
                  ))}
                </div>

                {sentence.lastScore && (
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 800,
                      color: 'var(--color-secondary)',
                      backgroundColor: 'var(--color-secondary-light)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    최근 {sentence.lastScore}점
                  </span>
                )}
              </div>

              {/* Big Sentence Text */}
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
          </div>
        ))}
      </div>

      {/* PRACTICE MODAL */}
      {activeSentence && (
        <div
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
          <div
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
            <button
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

            <span
              style={{
                display: 'inline-block',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: 'var(--color-secondary)',
                backgroundColor: 'var(--color-secondary-light)',
                padding: '4px 12px',
                borderRadius: '12px',
                marginBottom: '12px',
              }}
            >
              {activeSentence.category}
            </span>

            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
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

            {/* Score Result if evaluated */}
            {practiceScore !== null && (
              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: practiceScore >= 85 ? 'var(--color-secondary-light)' : 'var(--color-primary-light)',
                  border: `2px solid ${practiceScore >= 85 ? 'var(--color-secondary-border)' : 'var(--color-primary-border)'}`,
                  marginBottom: '24px',
                }}
              >
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: 'var(--color-text-title)' }}>
                  발음 일치도: <span style={{ color: practiceScore >= 85 ? 'var(--color-secondary)' : 'var(--color-primary)' }}>{practiceScore}점</span>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {practiceScore >= 85
                    ? '🎉 아주 훌륭합니다! 또렷하게 전달되고 있어요.'
                    : '👍 좋아요! 음절 끝을 조금만 더 힘있게 맺어보세요.'}
                </p>
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
