import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Volume2,
  Copy,
  Check,
  Maximize2,
  X,
  Sparkles,
} from 'lucide-react';
import { isConversationModeEnabled } from '../../utils/featureFlags';
import { SeniorButton } from '../../components/common/SeniorButton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { AudioVisualizer } from '../../components/common/AudioVisualizer';
import { speakText, AudioRecorderService, playAudioFromUrl, stopAudioPlayback } from '../../utils/audioUtils';

import { createRecognitionApi, getRecognitionsApi, confirmRecognitionApi } from '../../api/recognition';
import type { RecognitionResponse } from '../../api/recognition';
import { requestTtsApi, getTtsStatusApi } from '../../api/tts';
import { FeaturePageHeader } from '../../components/layout/FeaturePageHeader';
import { useApp } from '../../context/AppContext';

export const VoiceAssistPage: React.FC = () => {
  const { requireAuth, setCurrentTab, voiceDataVersion } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bigViewText, setBigViewText] = useState<string | null>(null);
  const [bigViewRecognitionId, setBigViewRecognitionId] = useState<string | null>(null);
  const [recentRecognitions, setRecentRecognitions] = useState<RecognitionResponse[]>([]);
  const [activeRecognitionId, setActiveRecognitionId] = useState<string | null>(null);
  const [editableText, setEditableText] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [conversationError, setConversationError] = useState<string | null>(null);
  
  type ConfirmedData = { confirmationId: string; confirmedText: string };
  const [confirmedRecognitions, setConfirmedRecognitions] = useState<Record<string, ConfirmedData>>({});
  
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const ttsGenerationRef = useRef(0);
  
  const recorderRef = useRef<AudioRecorderService | null>(null);

  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bigViewText) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        modalRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }, 0);
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setBigViewText(null);
          setBigViewRecognitionId(null);
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
  }, [bigViewText]);

  const fetchRecent = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setRecentRecognitions([]);
      setConfirmedRecognitions({});
      setActiveRecognitionId(null);
      setEditableText('');
      return;
    }
    try {
      const res = await getRecognitionsApi(token, 0, 10);
      if (res.success && res.data) {
        setRecentRecognitions(res.data.content);
      }
    } catch (err) {
      console.error('Failed to load recent recognitions:', err);
      setConversationError('최근 대화 기록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    setRecentRecognitions([]);
    setConfirmedRecognitions({});
    setActiveRecognitionId(null);
    setEditableText('');
    fetchRecent();
    return () => {
      ttsGenerationRef.current++;
      stopAudioPlayback();
      if (recorderRef.current) {
        recorderRef.current.stopRecording().catch(() => {});
      }
    };
  }, [voiceDataVersion]);

  const handleStartAssistRecord = async () => {
    setRecordingError(null);
    if (!requireAuth('assist')) {
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setRecordingError('로그인이 필요합니다.');
      return;
    }

    try {
      recorderRef.current = new AudioRecorderService();
      const started = await recorderRef.current.startRecording();
      if (started) {
        setIsRecording(true);
      } else {
        setRecordingError('마이크 사용 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      }
    } catch (e) {
      console.error('Failed to start microphone:', e);
      setRecordingError('음성을 녹음하지 못했습니다. 다시 시도해주세요.');
    }
  };

  const handleStopAssistRecord = async () => {
    if (!recorderRef.current) return;
    
    setIsRecording(false);
    setIsProcessing(true);
    setRecordingError(null);
    
    try {
      const audioUrl = await recorderRef.current.stopRecording();
      if (!audioUrl) {
        setRecordingError('녹음된 음성이 없습니다. 다시 시도해주세요.');
        setIsProcessing(false);
        return;
      }
      
      const blob = await fetch(audioUrl).then(r => r.blob());
      if (blob.size === 0) {
        setRecordingError('녹음된 음성이 없습니다. 다시 시도해주세요.');
        setIsProcessing(false);
        return;
      }
      if (blob.size > 10 * 1024 * 1024) {
        setRecordingError('녹음 파일이 너무 큽니다. 짧게 녹음한 후 다시 시도해주세요.');
        setIsProcessing(false);
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('인증이 필요합니다.');
      
      const res = await createRecognitionApi(token, blob);
      if (res.success && res.data) {
        setActiveRecognitionId(res.data.recognitionId);
        setEditableText(res.data.recognizedText || '');
        await fetchRecent();
      }
    } catch (err: any) {
      console.error('Recognition failed:', err);
      if (err.code === 'STT_UNAVAILABLE' || err.status === 503) {
        setRecordingError(err.message || '음성 인식 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
      } else if (err.code === 'TOO_MANY_REQUESTS' || err.status === 429) {
        setRecordingError(err.message || '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
        setRecordingError('인증이 만료되었습니다. 다시 로그인해주세요.');
      } else if (err.message && err.message.includes('400')) {
        setRecordingError(err.message || '올바르지 않은 녹음 파일입니다. 다시 말씀해주세요.');
      } else if (err.message) {
        setRecordingError(err.message);
      } else {
        setRecordingError('음성을 변환하지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async (recognitionId: string) => {
    setConversationError(null);
    const textToConfirm = editableText.trim();
    if (!textToConfirm) {
      setConversationError('확정할 텍스트를 입력해주세요.');
      return;
    }
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setConversationError('로그인이 필요합니다.');
      return;
    }

    setIsConfirming(true);
    try {
      const res = await confirmRecognitionApi(token, recognitionId, textToConfirm);
      if (res.success && res.data) {
        setConfirmedRecognitions(prev => ({
          ...prev,
          [recognitionId]: {
            confirmationId: res.data!.confirmationId,
            confirmedText: res.data!.confirmedText
          }
        }));
      }
    } catch (err: any) {
      console.error('Failed to confirm recognition:', err);
      setConversationError('문장을 확정하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakAloud = async (recognitionId: string) => {
    if (speakingId) return;
    setConversationError(null);

    const confirmed = confirmedRecognitions[recognitionId];
    if (!confirmed || !confirmed.confirmationId) {
      return;
    }

    const requestGeneration = ++ttsGenerationRef.current;
    const textToSpeak = confirmed.confirmedText;

    setSpeakingId(recognitionId);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('인증이 필요합니다.');

      const reqPayload = {
        confirmationId: confirmed.confirmationId,
        idempotencyKey: crypto.randomUUID()
      };
      const reqRes = await requestTtsApi(token, reqPayload);
      if (requestGeneration !== ttsGenerationRef.current) return;
      if (!reqRes.success || !reqRes.data) throw new Error('TTS 요청 실패');

      const ttsId = reqRes.data.ttsId;
      
      let audioUrl: string | null = null;
      let attempts = 0;
      const maxAttempts = 15;
      
      while (attempts < maxAttempts) {
        const statusRes = await getTtsStatusApi(token, ttsId);
        if (requestGeneration !== ttsGenerationRef.current) return;
        
        if (statusRes.success && statusRes.data) {
          if (statusRes.data.status === 'COMPLETED') {
            audioUrl = statusRes.data.audioUrl;
            break;
          } else if (statusRes.data.status === 'FAILED') {
            throw new Error('TTS_FAILED');
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (requestGeneration !== ttsGenerationRef.current) return;
        attempts++;
      }

      if (!audioUrl) {
        throw new Error('TTS 대기 시간 초과 또는 URL 없음');
      }

      // 15, 16. local 환경 Bearer 인증 및 fetch -> Blob URL 재생, 종료/정리 시 revoke
      await playAudioFromUrl(audioUrl, token);
      
    } catch (err: any) {
      if (requestGeneration !== ttsGenerationRef.current) return;
      
      const is503 = err.code === 'TTS_UNAVAILABLE' || err.status === 503 || err.code === '503';
      const is429 = err.code === 'TOO_MANY_REQUESTS' || err.status === 429 || err.code === '429';

      if (is503) {
        setConversationError(err.message || '잠시 후 다시 눌러 주세요.');
      } else if (is429) {
        setConversationError(err.message || '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else if (err.message && err.message !== 'TTS_FAILED' && !err.message.includes('TTS 대기 시간 초과')) {
        setConversationError(err.message);
      } else if (err.message === 'TTS_FAILED') {
        setConversationError('음성을 생성하지 못했습니다. 다시 시도해주세요.');
      } else {
        console.warn('Backend TTS failed, falling back to Browser SpeechSynthesis', err);
        try {
          await speakText(textToSpeak, 0.9);
        } catch (fallbackError) {
          console.error('Browser speech fallback failed:', fallbackError);
          setConversationError('음성을 재생하지 못했습니다. 다시 시도해주세요.');
        }
      }
    } finally {
      if (requestGeneration === ttsGenerationRef.current) {
        setSpeakingId(null);
      }
    }
  };

  return (
    <div className="vb-theme vb-page vb-page--assist responsive-page" style={{ maxWidth: '1040px', margin: '30px auto', padding: '0 16px 60px' }}>
      <FeaturePageHeader eyebrow="VOICE ASSIST / COMMUNICATION" title={<>당신의 말을,<br /><span>더 선명하게</span></>} description="당신의 목소리를 듣고, 이해하기 쉬운 문장과 음성으로 전달합니다." />

      {/* AI 대화 모드 바로가기 (기능 플래그 켜진 경우에만 노출) */}
      {isConversationModeEnabled() && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            backgroundColor: 'rgba(46,79,62,0.06)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid rgba(46,79,62,0.2)',
            marginTop: 'clamp(28px, 4vw, 40px)',
            marginBottom: 'clamp(28px, 4vw, 40px)',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="var(--color-primary)" />
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
              상대방의 말을 듣고 AI 추천 답변으로 대화하고 싶으신가요?
            </span>
          </div>
          <SeniorButton
            variant="outline"
            size="normal"
            onClick={() => setCurrentTab('conversation')}
            style={{ fontWeight: 700 }}
          >
            AI 대화 시작하기
          </SeniorButton>
        </div>
      )}

      {/* Main Microphone Interaction Box */}
      <div className="responsive-panel vb-function-stage vb-microphone-stage"
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
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '12px' }} aria-live="polite">
          {isProcessing ? 'AI가 음성을 인식하고 있어요...' : isRecording ? '말씀을 듣고 있어요...' : '마이크를 켜고 편안하게 말씀하세요'}
        </h2>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          {isProcessing
            ? '잠시만 기다려주세요.'
            : isRecording
            ? '다 말씀하신 후 아래 [말씀 완료] 버튼을 눌러주세요.'
            : '예: "따뜻한 물 한 잔만 부탁드립니다."'}
        </p>

        <div style={{ maxWidth: '480px', margin: '0 auto 28px' }}>
          <AudioVisualizer isRecording={isRecording} height={76} />
        </div>

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
          음성 변환 및 AI 처리를 위해 입력된 음성 데이터는 네이버 클라우드 등 외부 서비스로 안전하게 전송될 수 있습니다.
        </p>

        {recordingError && (
          <div style={{ maxWidth: '640px', margin: '0 auto 24px', textAlign: 'left' }}>
            <ErrorMessage
              message={recordingError}
              autoDismiss={true}
              duration={4000}
              onDismiss={() => setRecordingError(null)}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {!isRecording && !isProcessing ? (
            <SeniorButton
              variant="primary"
              size="huge"
              icon={<Mic size={32} />}
              onClick={handleStartAssistRecord}
              className="animate-pulse-record"
            >
              말씀 시작하기 (마이크 켜기)
            </SeniorButton>
          ) : isRecording ? (
            <SeniorButton
              variant="danger"
              size="huge"
              icon={<Square size={28} />}
              onClick={handleStopAssistRecord}
            >
              말씀 완료 (AI 보정하기)
            </SeniorButton>
          ) : (
             <SeniorButton
               variant="outline"
               size="huge"
               disabled
             >
               처리 중입니다...
             </SeniorButton>
          )}
        </div>
      </div>

      {/* Conversation Feed */}
      <div className="vb-page-section vb-conversation-section">
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>RECENT CONVERSATIONS</span>
          <span>실시간 대화 변환 내역</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {conversationError && (
            <ErrorMessage
              message={conversationError}
              autoDismiss={true}
              duration={4000}
              onDismiss={() => setConversationError(null)}
            />
          )}
          {recentRecognitions.map((msg) => (
            <article className="responsive-panel vb-conversation-row"
              key={msg.recognitionId}
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
                  {msg.createdAt && !Number.isNaN(new Date(msg.createdAt).getTime())
                    ? new Date(msg.createdAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
                    : '방금 전'}
                </span>
              </div>

              {/* Recognized Content & Converted Output */}
              <div style={{ marginBottom: '16px' }}>
                {confirmedRecognitions[msg.recognitionId]?.confirmedText &&
                  msg.recognizedText &&
                  msg.recognizedText.trim() !== '' &&
                  confirmedRecognitions[msg.recognitionId].confirmedText !== msg.recognizedText && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                        인식된 내용
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--text-base)',
                          color: 'var(--color-text-muted)',
                          padding: '8px 14px',
                          backgroundColor: 'var(--color-bg-subtle)',
                          borderRadius: '8px',
                        }}
                      >
                        {msg.recognizedText}
                      </div>
                    </div>
                  )}

                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 800, marginBottom: '4px' }}>
                  변환된 문장
                </div>
                {msg.recognitionId === activeRecognitionId && !confirmedRecognitions[msg.recognitionId] ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                      value={editableText}
                      onChange={(e) => setEditableText(e.target.value)}
                      disabled={isConfirming}
                      style={{
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 900,
                        color: 'var(--color-text-title)',
                        lineHeight: 1.4,
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid var(--color-primary-border)',
                        backgroundColor: 'var(--color-bg-surface)',
                        resize: 'vertical',
                        minHeight: '80px',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <SeniorButton
                        variant="primary"
                        size="normal"
                        icon={<Check size={20} />}
                        onClick={() => handleConfirm(msg.recognitionId)}
                        disabled={isConfirming}
                      >
                        {isConfirming ? '확정 중...' : '문장 확정하기'}
                      </SeniorButton>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 900,
                        color: 'var(--color-text-title)',
                        lineHeight: 1.4,
                      }}
                    >
                      "{confirmedRecognitions[msg.recognitionId] ? confirmedRecognitions[msg.recognitionId].confirmedText : msg.recognizedText}"
                    </div>
                    {confirmedRecognitions[msg.recognitionId] && (
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'bold', padding: '6px 10px', backgroundColor: 'var(--color-primary-light)', borderRadius: '6px' }}>
                        확정 완료
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons for Elderly User */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <SeniorButton
                  variant="secondary"
                  size="normal"
                  icon={<Volume2 size={20} />}
                  onClick={() => handleSpeakAloud(msg.recognitionId)}
                  disabled={!confirmedRecognitions[msg.recognitionId]}
                >
                  {speakingId === msg.recognitionId ? '들려주는 중...' : '상대방에게 또렷하게 들려주기'}
                </SeniorButton>

                <SeniorButton
                  variant="outline"
                  size="normal"
                  icon={<Maximize2 size={20} />}
                  onClick={() => {
                    setBigViewText(confirmedRecognitions[msg.recognitionId] ? confirmedRecognitions[msg.recognitionId].confirmedText : msg.recognizedText);
                    setBigViewRecognitionId(msg.recognitionId);
                  }}
                >
                  화면 가득 크게 보여주기
                </SeniorButton>

                <SeniorButton
                  variant="ghost"
                  size="normal"
                  icon={copiedId === msg.recognitionId ? <Check size={20} color="var(--color-secondary)" /> : <Copy size={20} />}
                  onClick={() => handleCopy(msg.recognitionId, confirmedRecognitions[msg.recognitionId] ? confirmedRecognitions[msg.recognitionId].confirmedText : msg.recognizedText)}
                >
                  {copiedId === msg.recognitionId ? '복사됨!' : '글자 복사'}
                </SeniorButton>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* FULLSCREEN / BIG TEXT MODAL FOR SENIORS & PARTNERS */}
      {bigViewText && (
        <div className="responsive-panel speech-overlay"
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="대화 문장 크게 보기"
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
              onClick={() => {
                setBigViewText(null);
                setBigViewRecognitionId(null);
              }}
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
            <div className="speech-text"
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

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexDirection: 'column', alignItems: 'center' }}>
            <SeniorButton
              variant="secondary"
              size="large"
              icon={<Volume2 size={24} />}
              onClick={() => {
                if (bigViewRecognitionId) {
                  handleSpeakAloud(bigViewRecognitionId);
                }
              }}
              disabled={!bigViewRecognitionId || !confirmedRecognitions[bigViewRecognitionId]}
            >
              {speakingId === bigViewRecognitionId ? '듣는 중...' : '소리로 읽어주기'}
            </SeniorButton>
            {(!bigViewRecognitionId || !confirmedRecognitions[bigViewRecognitionId]) && (
              <span style={{ fontSize: 'var(--text-sm)', color: '#94a3b8' }}>문장을 확정하면 음성으로 들려줄 수 있어요.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
