import React, { useState } from 'react';
import {
  Mic,
  BrainCircuit,
  Activity,
  ArrowRight,
  BookOpen,
  Volume2,
  Square,
  Sparkles,
  Maximize2,
  Copy,
  Check,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';
import { AudioVisualizer } from '../../components/common/AudioVisualizer';
import { speakText } from '../../utils/audioUtils';

export const DashboardPage: React.FC = () => {
  const { user, assistMessages, setCurrentTab } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bigViewText, setBigViewText] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);



  const handleStartAssistRecord = () => {
    alert('말해서 전달하기 기능은 현재 백엔드 연동 준비 중입니다.');
  };

  const handleStopAssistRecord = () => {
    setIsRecording(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakAloud = async (text: string) => {
    if (speakingId) return;
    try {
      await speakText(text, 0.9);
    } catch (error: any) {
      console.error('TTS error:', error);
      alert('음성 재생 기능 준비 중입니다.');
    } finally {
      setSpeakingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '32px 16px 60px' }}>
      
      {/* 1. 최우선 기능 — 말해서 전달하기 (핵심 CTA) */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: 'var(--text-3xl)', color: 'var(--color-text-title)', fontWeight: 800 }}>
            안녕하세요, <span style={{ color: 'var(--color-primary)' }}>{user?.name}</span>님!
          </h2>
        </div>
        
        <div
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            padding: '48px 32px',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--color-primary)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Background decorative glow */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, var(--color-primary-light) 0%, rgba(255,255,255,0) 70%)',
            opacity: 0.5,
            zIndex: 0,
            pointerEvents: 'none'
          }}></div>

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', width: '100%' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: '16px', color: 'var(--color-text-title)' }}>
              말해서 전달하기
            </h1>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
              내 말을 AI가 알아듣기 쉽게 <strong>선명한 글자와 음성으로</strong> 변환해 드립니다.
            </p>

            {/* Microphone Interaction Box within Hero */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              padding: '32px', 
              borderRadius: 'var(--border-radius-lg)', 
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--color-border)',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '12px' }}>
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
                    icon={<Mic size={36} />}
                    onClick={handleStartAssistRecord}
                    className="animate-pulse-record"
                    style={{ fontSize: 'var(--text-2xl)', padding: '24px 48px', borderRadius: '40px' }}
                  >
                    말하기 시작
                  </SeniorButton>
                ) : (
                  <SeniorButton
                    variant="danger"
                    size="huge"
                    icon={<Square size={28} />}
                    onClick={handleStopAssistRecord}
                    style={{ fontSize: 'var(--text-2xl)', padding: '24px 48px', borderRadius: '40px' }}
                  >
                    말씀 완료 (AI 변환하기)
                  </SeniorButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conversation Feed - Appears if there are messages */}
      {assistMessages.length > 0 && (
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={24} color="var(--color-secondary)" />
            <span>최근 대화 변환 결과</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {assistMessages.slice(0, 2).map((msg) => (
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

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 800, marginBottom: '4px' }}>
                    AI 변환 문장:
                  </div>
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

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                  <SeniorButton
                    variant="secondary"
                    size="normal"
                    icon={<Volume2 size={20} />}
                    onClick={() => handleSpeakAloud(msg.correctedText)}
                  >
                    {speakingId === msg.id ? '듣는 중...' : '또렷하게 들려주기'}
                  </SeniorButton>

                  <SeniorButton
                    variant="outline"
                    size="normal"
                    icon={<Maximize2 size={20} />}
                    onClick={() => setBigViewText(msg.correctedText)}
                  >
                    화면 가득 보여주기
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
        </section>
      )}

      {/* 2. 두 번째 핵심 기능 — AI 개인화 학습 */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <BrainCircuit size={28} color="var(--color-secondary)" />
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-title)' }}>
            나의 AI 학습
          </h2>
        </div>
        
        <div
          onClick={() => setCurrentTab('personalization')}
          className="card-interactive"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            padding: '32px',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--color-secondary-border)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
            alignItems: 'center'
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: '12px' }}>
              AI가 내 목소리에 맞춰 똑똑해지고 있어요!
            </h3>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              내 목소리를 자주 들려줄수록, AI가 나의 발음을 더 정확하게 이해합니다.
            </p>
            <SeniorButton variant="secondary" size="normal" icon={<ArrowRight size={20} />}>
              학습 현황 보러가기
            </SeniorButton>
          </div>
          
          <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: '24px', borderRadius: 'var(--border-radius-md)', textAlign: 'center' }}>
             <p style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-muted)' }}>
               개인화 학습 상세 데이터는 <br/> [나의 AI 학습] 페이지에서 제공됩니다.
             </p>
          </div>
        </div>
      </section>

      {/* 3. 부가 기능 (발음 관리, 기록) */}
      <section>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-title)', marginBottom: '16px' }}>
          추가 기능
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          
          <div
            onClick={() => setCurrentTab('diagnosis')}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              padding: '24px',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div style={{ padding: '12px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: '12px' }}>
              <Activity size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>발음 관리 (진단/연습)</h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '4px' }}>나의 발음 정확도를 확인합니다.</p>
            </div>
          </div>

          <div
            onClick={() => setCurrentTab('history')}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              padding: '24px',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-title)', borderRadius: '12px' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>이용 기록</h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '4px' }}>과거 대화 및 학습 기록을 봅니다.</p>
            </div>
          </div>

        </div>
      </section>

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
              {speakingId === 'big-view' ? '듣는 중...' : '소리로 읽어주기'}
            </SeniorButton>
          </div>
        </div>
      )}
    </div>
  );
};
