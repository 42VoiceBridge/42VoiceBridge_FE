import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Square,
  RotateCcw,
  Volume2,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FeaturePageHeader } from '../../components/layout/FeaturePageHeader';
import { SeniorButton } from '../../components/common/SeniorButton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { AudioVisualizer } from '../../components/common/AudioVisualizer';
import { AudioRecorderService } from '../../utils/audioUtils';
import {
  createConversationTurnApi,
  speakCandidateApi,
  AiApiError,
  type ConversationCandidate
} from '../../api/ai';

type ConversationStep = 'consent' | 'recording' | 'processing' | 'results';

export const ConversationPage: React.FC = () => {
  const { requireAuth, setCurrentTab } = useApp();

  const [step, setStep] = useState<ConversationStep>('consent');
  const [hasConsented, setHasConsented] = useState<boolean>(false);

  // 녹음 관련 상태
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [recordError, setRecordError] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorderService | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartTimeRef = useRef<number>(0);

  // 대화 턴 및 결과 상태 (메모리 보관, localStorage 저장 안 함)
  const [turnId, setTurnId] = useState<string | null>(null);
  const [heardText, setHeardText] = useState<string>('');
  const [candidates, setCandidates] = useState<ConversationCandidate[]>([]);
  const [speakingCandidateId, setSpeakingCandidateId] = useState<string | null>(null);

  // 재생 중인 오디오 인스턴스 및 Blob URL 관리 (사용 후 즉시 해제)
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  // 전역 알림 오류
  const [pageError, setPageError] = useState<string | null>(null);

  // 재생 중단 및 Blob URL 해제 헬퍼
  const stopAndCleanupAudio = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = '';
      activeAudioRef.current = null;
    }
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setSpeakingCandidateId(null);
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopAndCleanupAudio();
      if (recorderRef.current) {
        recorderRef.current.stopRecordingBlob().catch(() => {});
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stopAndCleanupAudio]);

  // 1단계: 동의 및 녹음 시작
  const handleStartRecording = async () => {
    if (!requireAuth('conversation')) {
      return;
    }

    setPageError(null);
    setRecordError(null);
    stopAndCleanupAudio();

    const recorder = new AudioRecorderService();
    recorderRef.current = recorder;

    const started = await recorder.startRecording();
    if (!started) {
      setRecordError('마이크 권한을 허용할 수 없거나 마이크가 연결되어 있지 않습니다. 브라우저 설정을 확인해 주세요.');
      return;
    }

    setHasConsented(true);
    setStep('recording');
    setRecordSeconds(0);
    recordStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setRecordSeconds((prev) => {
        if (prev >= 27) {
          // 28초 도달 시 여유 있게 자동 종료 (BE 30초 초과 400 AUDIO_TOO_LONG 방지)
          handleStopRecording();
          return 28;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // 2단계: 녹음 중단 및 분석 시작
  const handleStopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const durationMs = Date.now() - recordStartTimeRef.current;
    if (durationMs < 400) {
      if (recorderRef.current) {
        await recorderRef.current.stopRecordingBlob();
      }
      setRecordError('녹음 시간이 너무 짧습니다. 1초 이상 말씀해 주세요.');
      setStep('consent');
      return;
    }

    if (!recorderRef.current) {
      setStep('consent');
      return;
    }

    setStep('processing');
    setRecordError(null);
    setPageError(null);

    const recordingResult = await recorderRef.current.stopRecordingBlob();
    if (!recordingResult || !recordingResult.blob || recordingResult.blob.size === 0) {
      setRecordError('녹음 데이터가 비어 있습니다. 다시 녹음해 주세요.');
      setStep('consent');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setPageError('로그인이 필요합니다.');
      setStep('consent');
      return;
    }

    try {
      // POST /api/v1/conversation/turns 연동
      const turnData = await createConversationTurnApi(token, recordingResult.blob);

      setTurnId(turnData.turnId);
      setHeardText(turnData.heardText || '(인식된 음성이 없습니다)');
      setCandidates(turnData.candidates || []);
      setStep('results');
    } catch (err: unknown) {
      console.error('Failed to create conversation turn:', err);
      if (err instanceof AiApiError) {
        setPageError(err.message);
      } else if (err instanceof Error) {
        setPageError(err.message);
      } else {
        setPageError('상대방 음성을 분석하지 못했습니다. 다시 시도해 주세요.');
      }
      setStep('results');
    }
  };

  // 녹음 취소
  const handleCancelRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current) {
      await recorderRef.current.stopRecordingBlob();
    }
    setStep('consent');
    setRecordSeconds(0);
    setRecordError(null);
  };

  // 3단계: 답변 후보 클릭 및 음성 재생
  const handleSpeakCandidate = async (candidate: ConversationCandidate) => {
    if (!turnId) {
      setPageError('대화 세션 정보가 없습니다. 다시 녹음해 주세요.');
      return;
    }

    // 이미 같은 후보 재생 중이면 중단
    if (speakingCandidateId === candidate.candidateId) {
      stopAndCleanupAudio();
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setPageError('로그인이 필요합니다.');
      return;
    }

    stopAndCleanupAudio();
    setSpeakingCandidateId(candidate.candidateId);
    setPageError(null);

    try {
      // POST /api/v1/conversation/turns/{turnId}/candidates/{candidateId}/speak 연동
      const mp3Blob = await speakCandidateApi(token, turnId, candidate.candidateId);

      // Blob URL 생성 및 재생 (사용 후 바로 revoke)
      const blobUrl = URL.createObjectURL(mp3Blob);
      activeBlobUrlRef.current = blobUrl;

      const audio = new Audio(blobUrl);
      activeAudioRef.current = audio;

      audio.onended = () => {
        stopAndCleanupAudio();
      };

      audio.onerror = () => {
        stopAndCleanupAudio();
        setPageError('음성을 재생하는 중 오류가 발생했습니다.');
      };

      await audio.play();
    } catch (err: unknown) {
      console.error('Failed to speak candidate:', err);
      stopAndCleanupAudio();
      if (err instanceof AiApiError) {
        setPageError(err.message);
      } else if (err instanceof Error) {
        setPageError(err.message);
      } else {
        setPageError('음성 생성 요청에 실패했습니다.');
      }
    }
  };

  // 다시 녹음하기
  const handleRestartTurn = () => {
    stopAndCleanupAudio();
    setTurnId(null);
    setHeardText('');
    setCandidates([]);
    setPageError(null);
    setRecordError(null);
    handleStartRecording();
  };

  return (
    <div
      className="vb-theme vb-page responsive-page conversation-page"
      style={{ maxWidth: '840px', margin: '30px auto', padding: '0 16px 80px' }}
    >
      <FeaturePageHeader
        eyebrow="AI ASSIST / CONVERSATION"
        title={
          <>
            상대방의 말을 듣고,<br />
            <span>AI 추천 답변으로 편하게 대화하세요.</span>
          </>
        }
        description="상대방의 음성을 텍스트로 확인하고, 알맞은 답변을 선택하면 대신 자연스러운 목소리로 대답합니다."
      />

      {/* 오류 메시지 배너 */}
      {(pageError || recordError) && (
        <div style={{ marginBottom: '24px' }}>
          <ErrorMessage message={(pageError || recordError) || ''} />
        </div>
      )}

      {/* STEP 1: 안내 및 동의 화면 */}
      {step === 'consent' && (
        <section
          className="responsive-panel"
          style={{
            backgroundColor: 'var(--color-bg-surface, #ffffff)',
            borderRadius: 'var(--border-radius-lg, 16px)',
            border: '2px solid var(--color-border, #E5E7EB)',
            padding: '36px 30px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'rgba(46,79,62,0.1)',
              color: 'var(--color-primary, #2E4F3E)',
              fontSize: 'var(--text-sm, 14px)',
              fontWeight: 700,
              marginBottom: '18px',
            }}
          >
            <Sparkles size={18} />
            <span>대화 모드 이용 안내</span>
          </div>

          <h2
            style={{
              fontSize: 'var(--text-2xl, 24px)',
              fontWeight: 800,
              margin: '0 0 16px',
              lineHeight: 1.35,
            }}
          >
            대화 상대방의 목소리를 녹음해 소통을 돕습니다
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              marginBottom: '28px',
              fontSize: 'var(--text-lg, 18px)',
              color: 'var(--color-text, #111111)',
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary, #2E4F3E)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                1
              </span>
              <span>
                <strong>녹음 시작:</strong> 상대방이 말할 때 녹음 버튼을 누르면 최대 28초 동안 음성을 듣습니다.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary, #2E4F3E)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                2
              </span>
              <span>
                <strong>텍스트 및 추천 답변 확인:</strong> 들은 말을 큰 글씨로 확인하고, AI가 제안하는 알맞은 답변을 확인합니다.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary, #2E4F3E)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                3
              </span>
              <span>
                <strong>음성으로 대답:</strong> 원하는 답변 카드를 누르면 말이음이 대신 소리 내어 말해 줍니다.
              </span>
            </div>
          </div>

          {/* 개인정보 및 상대방 녹음 동의 고지 */}
          <div
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '18px 20px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
                fontSize: 'var(--text-base, 16px)',
                color: '#1F2937',
                marginBottom: '8px',
              }}
            >
              <ShieldAlert size={20} color="#DC2626" />
              <span>상대방 음성 녹음 및 개인정보 보호 안내</span>
            </div>
            <p
              style={{
                fontSize: 'var(--text-sm, 14px)',
                color: '#4B5563',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              본 기능은 원활한 대화 보조를 위해 대화 상대방의 음성을 녹음합니다. 녹음된 음성과 텍스트는
              음성인식(네이버 클라우드) 및 AI 답변 추천(Anthropic)을 위해 외부 서비스로 전송되며,
              <strong>서버나 브라우저 저장소에 영구 저장되지 않고 대화 완료 시 즉시 삭제</strong>됩니다.
              원활하고 안전한 소통을 위해 <strong>상대방에게 사전 동의를 구한 후</strong> 이용해 주세요.
            </p>
          </div>

          {/* 시작 버튼 */}
          <SeniorButton
            variant="primary"
            size="large"
            icon={<Mic size={24} />}
            onClick={handleStartRecording}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {hasConsented ? '상대방 음성 녹음 시작하기' : '동의하고 녹음 시작하기'}
          </SeniorButton>
        </section>
      )}

      {/* STEP 2: 녹음 중 화면 */}
      {step === 'recording' && (
        <section
          className="responsive-panel"
          style={{
            backgroundColor: 'var(--color-bg-surface, #ffffff)',
            borderRadius: 'var(--border-radius-lg, 16px)',
            border: '2px solid var(--color-primary, #2E4F3E)',
            padding: '40px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              fontSize: 'var(--text-base, 16px)',
              fontWeight: 700,
              marginBottom: '20px',
              animation: 'pulse 1.5s infinite',
            }}
          >
            <Radio size={20} className="animate-spin" />
            <span>상대방의 말을 듣고 있어요</span>
          </div>

          <h2
            style={{
              fontSize: 'var(--text-3xl, 30px)',
              fontWeight: 800,
              margin: '0 0 12px',
              color: 'var(--color-text, #111111)',
            }}
          >
            {Math.max(0, 28 - recordSeconds)}초 남음
          </h2>
          <p
            style={{
              fontSize: 'var(--text-base, 16px)',
              color: 'var(--color-text-muted, #6B7280)',
              margin: '0 0 28px',
            }}
          >
            상대방이 말씀을 마치면 아래 [녹음 완료] 버튼을 눌러주세요.
          </p>

          {/* 진행 바 */}
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              height: '8px',
              backgroundColor: '#E5E7EB',
              borderRadius: '4px',
              margin: '0 auto 28px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(recordSeconds / 28) * 100}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary, #2E4F3E)',
                transition: 'width 1s linear',
              }}
            />
          </div>

          {/* 파형 애니메이션 */}
          <div style={{ marginBottom: '36px' }}>
            <AudioVisualizer
              isRecording={true}
              analyser={recorderRef.current?.getAnalyser()}
              stream={recorderRef.current?.getStream()}
              height={80}
            />
          </div>

          {/* 액션 버튼 */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <SeniorButton
              variant="outline"
              size="large"
              onClick={handleCancelRecording}
              style={{ minWidth: '130px' }}
            >
              취소
            </SeniorButton>
            <SeniorButton
              variant="primary"
              size="large"
              icon={<Square size={20} />}
              onClick={handleStopRecording}
              style={{ minWidth: '180px', backgroundColor: '#DC2626', borderColor: '#DC2626' }}
            >
              녹음 완료
            </SeniorButton>
          </div>
        </section>
      )}

      {/* STEP 3: 처리 중 화면 */}
      {step === 'processing' && (
        <section
          className="responsive-panel"
          style={{
            backgroundColor: 'var(--color-bg-surface, #ffffff)',
            borderRadius: 'var(--border-radius-lg, 16px)',
            border: '2px solid var(--color-border, #E5E7EB)',
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <Loader2
            size={48}
            color="var(--color-primary, #2E4F3E)"
            className="animate-spin"
            style={{ margin: '0 auto 24px' }}
          />
          <h2 style={{ fontSize: 'var(--text-2xl, 24px)', fontWeight: 800, margin: '0 0 10px' }}>
            상대방의 말을 분석하고 있어요
          </h2>
          <p style={{ fontSize: 'var(--text-lg, 18px)', color: 'var(--color-text-muted, #6B7280)' }}>
            음성을 텍스트로 바꾸고 알맞은 답변을 준비하는 중입니다...
          </p>
        </section>
      )}

      {/* STEP 4: 들은 말 및 답변 후보 결과 화면 */}
      {step === 'results' && (
        <div>
          {/* 들은 말 표시 카드 */}
          <section
            className="responsive-panel"
            style={{
              backgroundColor: 'var(--color-bg-surface, #ffffff)',
              borderRadius: 'var(--border-radius-lg, 16px)',
              border: '2px solid var(--color-border, #E5E7EB)',
              padding: '24px 28px',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-sm, 14px)',
                  fontWeight: 700,
                  color: 'var(--color-text-muted, #6B7280)',
                  letterSpacing: '0.04em',
                }}
              >
                상대방이 하신 말씀 (인식 결과)
              </span>
              <button
                type="button"
                onClick={handleRestartTurn}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-primary, #2E4F3E)',
                  fontSize: 'var(--text-sm, 14px)',
                  fontWeight: 700,
                }}
              >
                <RotateCcw size={16} />
                <span>잘못 들었나요? 다시 녹음</span>
              </button>
            </div>

            <div
              style={{
                fontSize: 'var(--text-2xl, 24px)',
                fontWeight: 800,
                color: 'var(--color-text, #111111)',
                lineHeight: 1.4,
                padding: '16px 20px',
                backgroundColor: 'var(--color-bg-subtle, #F9FAFB)',
                borderRadius: '10px',
                borderLeft: '4px solid var(--color-primary, #2E4F3E)',
              }}
            >
              "{heardText}"
            </div>
          </section>

          {/* AI 추천 답변 목록 */}
          <section
            className="responsive-panel"
            style={{
              backgroundColor: 'var(--color-bg-surface, #ffffff)',
              borderRadius: 'var(--border-radius-lg, 16px)',
              border: '2px solid var(--color-border, #E5E7EB)',
              padding: '28px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--color-primary, #2E4F3E)" />
                <h3 style={{ fontSize: 'var(--text-xl, 20px)', fontWeight: 800, margin: 0 }}>
                  추천 답변 선택하기
                </h3>
              </div>
              <span style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--color-text-muted, #6B7280)' }}>
                답변을 누르면 소리 내어 전달합니다
              </span>
            </div>

            {candidates.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--color-text-muted, #6B7280)',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                }}
              >
                <AlertTriangle size={32} style={{ margin: '0 auto 12px', color: '#D97706' }} />
                <p style={{ fontSize: 'var(--text-lg, 18px)', fontWeight: 700, margin: '0 0 6px' }}>
                  추천 답변을 생성하지 못했습니다
                </p>
                <p style={{ fontSize: 'var(--text-sm, 14px)', margin: '0 0 16px' }}>
                  상대방의 말이 명확하지 않았거나 서비스 일시적 지연일 수 있습니다.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <SeniorButton variant="primary" size="normal" onClick={handleRestartTurn}>
                    다시 녹음하기
                  </SeniorButton>
                  <SeniorButton
                    variant="outline"
                    size="normal"
                    onClick={() => setCurrentTab('phrases')}
                  >
                    문구함에서 고르기
                  </SeniorButton>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {candidates.map((cand) => {
                  const isPlaying = speakingCandidateId === cand.candidateId;
                  return (
                    <button
                      key={cand.candidateId}
                      type="button"
                      onClick={() => handleSpeakCandidate(cand)}
                      style={{
                        textAlign: 'left',
                        padding: '20px 24px',
                        borderRadius: '12px',
                        border: isPlaying
                          ? '2px solid var(--color-primary, #2E4F3E)'
                          : '2px solid var(--color-border, #E5E7EB)',
                        backgroundColor: isPlaying ? 'rgba(46,79,62,0.08)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--text-xl, 20px)',
                          fontWeight: 700,
                          color: isPlaying
                            ? 'var(--color-primary, #2E4F3E)'
                            : 'var(--color-text, #111111)',
                          lineHeight: 1.4,
                          flex: 1,
                        }}
                      >
                        {cand.text}
                      </span>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          backgroundColor: isPlaying
                            ? 'var(--color-primary, #2E4F3E)'
                            : 'var(--color-bg-subtle, #F3F4F6)',
                          color: isPlaying ? '#ffffff' : 'var(--color-primary, #2E4F3E)',
                          fontWeight: 700,
                          fontSize: 'var(--text-base, 16px)',
                          flexShrink: 0,
                        }}
                      >
                        {isPlaying ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>말하는 중...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={18} />
                            <span>말하기</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* 대체 흐름 안내 영역 (재녹음, 문구함, 기존 실시간 대화) */}
          <section
            style={{
              display: 'flex',
              gap: '14px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <SeniorButton
              variant="primary"
              size="large"
              icon={<RotateCcw size={20} />}
              onClick={handleRestartTurn}
              style={{ flex: 1, minWidth: '180px' }}
            >
              다시 녹음하기
            </SeniorButton>

            <SeniorButton
              variant="outline"
              size="large"
              icon={<MessageSquare size={20} />}
              onClick={() => setCurrentTab('phrases')}
              style={{ flex: 1, minWidth: '180px' }}
            >
              자주 쓰는 문구함으로
            </SeniorButton>

            <SeniorButton
              variant="outline"
              size="large"
              icon={<Mic size={20} />}
              onClick={() => setCurrentTab('assist')}
              style={{ flex: 1, minWidth: '180px' }}
            >
              직접 말하기(실시간 대화)
            </SeniorButton>
          </section>
        </div>
      )}
    </div>
  );
};
