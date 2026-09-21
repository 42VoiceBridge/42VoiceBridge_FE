import React, { useState } from 'react';
import {
  Mic,
  Square,
  Volume2,
  Copy,
  Check,
  Maximize2,
  X,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';
import { AudioVisualizer } from '../../components/common/AudioVisualizer';
import { speakText } from '../../utils/audioUtils';

export const VoiceAssistPage: React.FC = () => {
  const { assistMessages, addAssistMessage } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bigViewText, setBigViewText] = useState<string | null>(null);

  // Simulated live demo examples
  const demoSamples = [
    { original: '따..듯..한 물.. 한.. 잔.. 주..세..요', corrected: '따뜻한 물 한 잔만 부탁드립니다.', confidence: 96 },
    { original: '약..국.. 이.. 어..디..에 있..나..요', corrected: '가까운 약국이 어디에 있나요?', confidence: 94 },
    { original: '오..느.. 날..씨.. 조..아..요', corrected: '오늘 날씨가 참 좋습니다.', confidence: 97 },
    { original: '도..와.. 주..셔..서 감..사..합..니..다', corrected: '도와주셔서 정말 감사합니다.', confidence: 98 },
  ];

  const handleStartAssistRecord = () => {
    setIsRecording(true);
  };

  const handleStopAssistRecord = () => {
    setIsRecording(false);
    // Pick a realistic sample to simulate personal model inference
    const sample = demoSamples[Math.floor(Math.random() * demoSamples.length)];
    addAssistMessage(sample.original, sample.corrected, sample.confidence);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakAloud = (text: string) => {
    speakText(text, 0.9);
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
              backgroundColor: 'var(--color-secondary-light)',
              color: 'var(--color-secondary)',
            }}
          >
            <MessageSquare size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)' }}>실사용 음성 인식 대화 보조</h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
              발음이 뭉개지거나 힘이 들더라도 AI가 문맥을 파악해 또렷한 문장과 소리로 대신 전합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Main Microphone Interaction Box */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '36px 30px',
          borderRadius: 'var(--border-radius-lg)',
          border: '2px solid var(--color-primary-border)',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center',
          marginBottom: '36px',
        }}
      >
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '12px' }}>
          {isRecording ? '말씀을 듣고 있어요...' : '마이크를 켜고 편안하게 말씀하세요'}
        </h2>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          {isRecording
            ? '다 말씀하신 후 아래 [말씀 완료] 버튼을 눌러주세요.'
            : '예: "따뜻한 물 한 잔만 부탁드립니다."'}
        </p>

        <div style={{ maxWidth: '480px', margin: '0 auto 28px' }}>
          <AudioVisualizer isRecording={isRecording} height={76} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {!isRecording ? (
            <SeniorButton
              variant="primary"
              size="huge"
              icon={<Mic size={32} />}
              onClick={handleStartAssistRecord}
              className="animate-pulse-record"
            >
              말씀 시작하기 (마이크 켜기)
            </SeniorButton>
          ) : (
            <SeniorButton
              variant="danger"
              size="huge"
              icon={<Square size={28} />}
              onClick={handleStopAssistRecord}
            >
              말씀 완료 (AI 보정하기)
            </SeniorButton>
          )}
        </div>
      </div>

      {/* Conversation Feed */}
      <div>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={24} color="var(--color-secondary)" />
          <span>실시간 대화 변환 내역</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {assistMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                padding: '24px 28px',
                borderRadius: 'var(--border-radius-lg)',
                border: '2px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {msg.timestamp}
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 800,
                    color: 'var(--color-secondary)',
                    backgroundColor: 'var(--color-secondary-light)',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    border: '1px solid var(--color-secondary-border)',
                  }}
                >
                  개인 모델 정확도 {msg.confidence}%
                </span>
              </div>

              {/* Original Dysarthria Speech vs Corrected Output */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  입력 발음 (구음장애 패턴):
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic',
                    padding: '8px 14px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: '8px',
                    marginBottom: '12px',
                  }}
                >
                  "{msg.originalText}"
                </div>

                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 800, marginBottom: '4px' }}>
                  AI 보정 의사소통 문장:
                </div>
                {/* Big Readability Text for Elderly & Conversational Partner */}
                <div
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 900,
                    color: 'var(--color-text-title)',
                    lineHeight: 1.4,
                  }}
                >
                  "{msg.correctedText}"
                </div>
              </div>

              {/* Action Buttons for Elderly User */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <SeniorButton
                  variant="secondary"
                  size="normal"
                  icon={<Volume2 size={20} />}
                  onClick={() => handleSpeakAloud(msg.correctedText)}
                >
                  상대방에게 또렷하게 들려주기
                </SeniorButton>

                <SeniorButton
                  variant="outline"
                  size="normal"
                  icon={<Maximize2 size={20} />}
                  onClick={() => setBigViewText(msg.correctedText)}
                >
                  화면 가득 크게 보여주기
                </SeniorButton>

                <SeniorButton
                  variant="ghost"
                  size="normal"
                  icon={copiedId === msg.id ? <Check size={20} color="var(--color-secondary)" /> : <Copy size={20} />}
                  onClick={() => handleCopy(msg.id, msg.correctedText)}
                >
                  {copiedId === msg.id ? '복사됨!' : '글자 복사'}
                </SeniorButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FULLSCREEN / BIG TEXT MODAL FOR SENIORS & PARTNERS */}
      {bigViewText && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '40px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setBigViewText(null)}
              style={{
                color: '#ffffff',
                backgroundColor: 'rgba(255,255,255,0.15)',
                padding: '12px 20px',
                borderRadius: 'var(--border-radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
              }}
            >
              <X size={24} />
              <span>화면 닫기</span>
            </button>
          </div>

          <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
            <p style={{ fontSize: 'var(--text-lg)', color: '#94a3b8', marginBottom: '24px' }}>
              대화 상대방에게 이 화면을 보여주세요
            </p>
            <div
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.8rem)',
                fontWeight: 900,
                lineHeight: 1.4,
                wordBreak: 'keep-all',
                color: '#38bdf8',
              }}
            >
              "{bigViewText}"
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <SeniorButton
              variant="secondary"
              size="large"
              icon={<Volume2 size={24} />}
              onClick={() => handleSpeakAloud(bigViewText)}
            >
              소리로 읽어주기
            </SeniorButton>
          </div>
        </div>
      )}
    </div>
  );
};
