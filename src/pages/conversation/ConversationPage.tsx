import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Square,
  RotateCcw,
  Volume2,
  Sparkles,
  Loader2,
  AlertTriangle,
  Send,
  UserCheck,
  Check,
  Info,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FeaturePageHeader } from '../../components/layout/FeaturePageHeader';
import { SeniorButton } from '../../components/common/SeniorButton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { AudioVisualizer } from '../../components/common/AudioVisualizer';
import { BrandDialog } from '../../components/common/BrandDialog';
import {
  AudioRecorderService,
  playAudioFromUrl,
  speakText,
  stopSpeech,
  stopAudioPlayback
} from '../../utils/audioUtils';
import {
  createConversationTurnApi,
  speakCandidateApi,
  AiApiError,
  type ConversationCandidate
} from '../../api/ai';
import { createRecognitionApi, confirmRecognitionApi } from '../../api/recognition';
import { requestTtsApi, getTtsStatusApi } from '../../api/tts';

export interface ChatMessage {
  id: string;
  sender: 'counterpart' | 'me';
  text: string;
  source?: 'ai_candidate' | 'direct_voice' | 'direct_text';
  turnId?: string;
  candidateId?: string;
  audioUrl?: string;
  createdAt: number;
}

export const ConversationPage: React.FC = () => {
  const { requireAuth } = useApp();

  // 대화 메시지 목록 (메모리 상태로만 관리, localStorage/sessionStorage에 저장하지 않음)
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 현재 활성 턴 및 AI 추천 답변 후보
  const [activeTurn, setActiveTurn] = useState<{
    turnId: string;
    heardText: string;
    candidates: ConversationCandidate[];
  } | null>(null);

  // 녹음 상태 ('none' | 'counterpart' | 'me')
  const [recordingTarget, setRecordingTarget] = useState<'none' | 'counterpart' | 'me'>('none');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingLabel, setProcessingLabel] = useState<string>('');

  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // '내가 직접 말하기' 인식 후 확인/수정 카드 상태
  const [directVoiceReview, setDirectVoiceReview] = useState<{
    recognitionId: string;
    text: string;
  } | null>(null);
  const [isConfirmingVoice, setIsConfirmingVoice] = useState<boolean>(false);

  // 직접 텍스트 입력창 상태
  const [directInputText, setDirectInputText] = useState<string>('');

  // 음성 재생 중 상태 (candidateId 또는 messageId)
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // 대화 시작 여부 (첫 진입 시 안내 화면, 시작 버튼 클릭 후 채팅 인터페이스 노출)
  const [isStarted, setIsStarted] = useState<boolean>(false);

  // 대화 초기화 확인 모달 상태
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Refs
  const recorderRef = useRef<AudioRecorderService | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartTimeRef = useRef<number>(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  // 음성 재생 정지 및 Blob URL 즉시 해제
  const stopAndCleanupAudio = useCallback(() => {
    stopSpeech();
    stopAudioPlayback();
    const audio = activeAudioRef.current;

    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute('src');
      activeAudioRef.current = null;
    }

    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }

    setSpeakingId(null);
  }, []);

  // 언마운트 시 정리
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

  // 새 메시지, 추천 답변, 녹음 시작/종료 시 자동 스크롤 (사용자가 이전 대화 위쪽을 읽고 있지 않을 때만)
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 180;
    if (isNearBottom || recordingTarget !== 'none') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, activeTurn, directVoiceReview, isProcessing, recordingTarget]);

  // 1. 녹음 시작 공통 함수 (target: 'counterpart' | 'me')
  const startRecording = async (target: 'counterpart' | 'me') => {
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

    setRecordingTarget(target);
    setRecordSeconds(0);
    recordStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setRecordSeconds((prev) => {
        if (prev >= 27) {
          // 28초 도달 시 30초 초과 방지를 위해 자동 종료
          stopRecordingAndProcess(target);
          return 28;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // 2. 녹음 종료 및 처리
  const stopRecordingAndProcess = async (target: 'counterpart' | 'me') => {
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
      setRecordingTarget('none');
      return;
    }

    if (!recorderRef.current) {
      setRecordingTarget('none');
      return;
    }

    setRecordingTarget('none');
    setIsProcessing(true);
    setRecordError(null);
    setPageError(null);

    if (target === 'counterpart') {
      setProcessingLabel('상대방의 말을 분석하고 답변을 준비하고 있습니다...');
    } else {
      setProcessingLabel('내 음성을 인식하고 문장으로 변환하는 중입니다...');
    }

    const recordingResult = await recorderRef.current.stopRecordingBlob();
    if (!recordingResult || !recordingResult.blob || recordingResult.blob.size === 0) {
      setRecordError('녹음 데이터가 비어 있습니다. 다시 녹음해 주세요.');
      setIsProcessing(false);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setPageError('로그인이 필요합니다.');
      setIsProcessing(false);
      return;
    }

    try {
      if (target === 'counterpart') {
        // 상대방 음성: POST /api/v1/conversation/turns
        const turnData = await createConversationTurnApi(token, recordingResult.blob);

        const newCounterpartMsg: ChatMessage = {
          id: `msg-${Date.now()}-cp`,
          sender: 'counterpart',
          text: turnData.heardText || '(인식된 음성이 없습니다)',
          turnId: turnData.turnId,
          createdAt: Date.now()
        };

        setMessages((prev) => [...prev, newCounterpartMsg]);
        setActiveTurn({
          turnId: turnData.turnId,
          heardText: turnData.heardText,
          candidates: turnData.candidates || []
        });
      } else {
        // 내가 직접 말하기: POST /api/v1/recognitions (기존 실시간 음성인식 API 재사용)
        const res = await createRecognitionApi(token, recordingResult.blob);
        if (res.success && res.data) {
          setDirectVoiceReview({
            recognitionId: res.data.recognitionId,
            text: res.data.recognizedText || ''
          });
        } else {
          throw new Error('음성 인식에 실패했습니다.');
        }
      }
    } catch (err: unknown) {
      console.error('Recording processing error:', err);
      if (err instanceof AiApiError) {
        setPageError(err.message);
      } else if (err instanceof Error) {
        setPageError(err.message);
      } else {
        setPageError('음성을 분석하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsProcessing(false);
      setProcessingLabel('');
    }
  };

  // 녹음 취소
  const cancelRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current) {
      await recorderRef.current.stopRecordingBlob();
    }
    setRecordingTarget('none');
    setRecordSeconds(0);
    setRecordError(null);
  };

  // 3. AI 추천 답변 클릭 -> 내 말풍선 확정 및 음성 출력
  const handleSelectCandidate = async (candidate: ConversationCandidate) => {
    if (!activeTurn) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setPageError('로그인이 필요합니다.');
      return;
    }

    stopAndCleanupAudio();
    const candidateTurnId = activeTurn.turnId;

    const newMeMsg: ChatMessage = {
      id: `msg-${Date.now()}-me`,
      sender: 'me',
      text: candidate.text,
      source: 'ai_candidate',
      turnId: candidateTurnId,
      candidateId: candidate.candidateId,
      createdAt: Date.now()
    };

    // 대화 누적 (기존 대화 유지)
    setMessages((prev) => [...prev, newMeMsg]);
    // 활성 추천 카드 닫기
    setActiveTurn(null);

    // 후보 음성 재생 (POST /api/v1/conversation/turns/{turnId}/candidates/{candidateId}/speak)
    try {
      setSpeakingId(newMeMsg.id);
      const mp3Blob = await speakCandidateApi(token, candidateTurnId, candidate.candidateId);

      const blobUrl = URL.createObjectURL(mp3Blob);
      activeBlobUrlRef.current = blobUrl;

      const audio = new Audio(blobUrl);
      activeAudioRef.current = audio;

      audio.onended = () => {
        stopAndCleanupAudio();
      };
      audio.onerror = () => {
        console.error('audio error', audio.error);
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
        setPageError('추천 답변 음성 재생에 실패했습니다.');
      }
    }
  };

  // 4. '내가 직접 말하기' 확인 및 확정 -> 백엔드 TTS 호출 및 재생
  const handleConfirmDirectVoice = async () => {
    if (!directVoiceReview || !directVoiceReview.text.trim()) {
      setPageError('확정할 문장을 입력해 주세요.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setPageError('로그인이 필요합니다.');
      return;
    }

    setIsConfirmingVoice(true);
    setPageError(null);
    stopAndCleanupAudio();

    const confirmedText = directVoiceReview.text.trim();
    const recognitionId = directVoiceReview.recognitionId;

    try {
      // 1) 문장 확정 API: POST /api/v1/recognitions/{id}/confirm
      const confirmRes = await confirmRecognitionApi(token, recognitionId, confirmedText);
      if (!confirmRes.success || !confirmRes.data) {
        throw new Error('문장 확정에 실패했습니다.');
      }

      const confirmationId = confirmRes.data.confirmationId;

      // 2) TTS 생성 요청: POST /api/v1/tts
      const ttsReqRes = await requestTtsApi(token, {
        confirmationId,
        idempotencyKey: crypto.randomUUID()
      });

      let finalAudioUrl: string | undefined = undefined;

      if (ttsReqRes.success && ttsReqRes.data?.ttsId) {
        const ttsId = ttsReqRes.data.ttsId;
        // TTS 완료 폴링 (최대 10초)
        const startTime = Date.now();
        while (Date.now() - startTime < 10000) {
          await new Promise((r) => setTimeout(r, 800));
          const statusRes = await getTtsStatusApi(token, ttsId);
          if (statusRes.success && statusRes.data) {
            if (statusRes.data.status === 'COMPLETED' && statusRes.data.audioUrl) {
              finalAudioUrl = statusRes.data.audioUrl;
              break;
            } else if (statusRes.data.status === 'FAILED') {
              break;
            }
          }
        }
      }

      const newMeMsg: ChatMessage = {
        id: `msg-${Date.now()}-me`,
        sender: 'me',
        text: confirmedText,
        source: 'direct_voice',
        audioUrl: finalAudioUrl,
        createdAt: Date.now()
      };

      setMessages((prev) => [...prev, newMeMsg]);
      setDirectVoiceReview(null);
      setActiveTurn(null);

      // 음성 재생
      if (finalAudioUrl) {
        setSpeakingId(newMeMsg.id);
        await playAudioFromUrl(finalAudioUrl, token);
        setSpeakingId(null);
      } else {
        // 서버 TTS 지연 또는 미완료 시 기기 음성(Web Speech) 폴백
        setSpeakingId(newMeMsg.id);
        await speakText(confirmedText);
        setSpeakingId(null);
      }
    } catch (err: unknown) {
      console.error('Failed to confirm and speak direct voice:', err);
      if (err instanceof Error) {
        setPageError(err.message);
      } else {
        setPageError('음성을 확정하고 재생하는 데 실패했습니다.');
      }
    } finally {
      setIsConfirmingVoice(false);
      setSpeakingId(null);
    }
  };

  // 5. 직접 텍스트 입력 전송
  const handleSendDirectText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = directInputText.trim();
    if (!textToSend) return;

    stopAndCleanupAudio();

    const newMeMsg: ChatMessage = {
      id: `msg-${Date.now()}-me`,
      sender: 'me',
      text: textToSend,
      source: 'direct_text',
      createdAt: Date.now()
    };

    setMessages((prev) => [...prev, newMeMsg]);
    setDirectInputText('');
    setActiveTurn(null);

    // 텍스트를 기기 음성(Web Speech API)으로 읽어주기
    setSpeakingId(newMeMsg.id);
    await speakText(textToSend);
    setSpeakingId(null);
  };

  // 6. 메시지 소리 다시 듣기 핸들러
  const handleReplayMessage = async (msg: ChatMessage) => {
    if (speakingId === msg.id) {
      stopAndCleanupAudio();
      return;
    }

    const token = localStorage.getItem('accessToken');
    stopAndCleanupAudio();
    setSpeakingId(msg.id);

    try {
      if (msg.source === 'ai_candidate' && msg.turnId && msg.candidateId && token) {
        const mp3Blob = await speakCandidateApi(token, msg.turnId, msg.candidateId);
        const blobUrl = URL.createObjectURL(mp3Blob);
        activeBlobUrlRef.current = blobUrl;

        const audio = new Audio(blobUrl);
        activeAudioRef.current = audio;

        audio.onended = () => {
          stopAndCleanupAudio();
        };
        audio.onerror = () => {
          console.error('audio error', audio.error);
          stopAndCleanupAudio();
          setPageError('음성을 재생하는 중 오류가 발생했습니다.');
        };
        await audio.play();
      } else if (msg.audioUrl && token) {
        await playAudioFromUrl(msg.audioUrl, token);
        setSpeakingId(null);
      } else {
        await speakText(msg.text);
        setSpeakingId(null);
      }
    } catch (err) {
      console.error('Replay failed:', err);
      stopAndCleanupAudio();
      setPageError('음성을 재생하지 못했습니다.');
    }
  };

  // 7. 대화 초기화 (프론트엔드 React 상태 비우기)
  const handleResetConversation = () => {
    stopAndCleanupAudio();
    setMessages([]);
    setActiveTurn(null);
    setDirectVoiceReview(null);
    setDirectInputText('');
    setPageError(null);
    setRecordError(null);
    setShowResetModal(false);
  };

  return (
    <div className="vb-theme vb-page responsive-page" style={{ maxWidth: '960px', margin: '30px auto', padding: '0 16px 80px' }}>
      {/* 상단 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <FeaturePageHeader
          eyebrow="AI CONVERSATION / CHAT"
          title={<>이어지는 대화,<br /><span>자연스럽게 소통하세요</span></>}
          description="상대방의 말을 듣고 AI 추천 답변 또는 직접 말하기로 끊김 없이 대화를 주고받습니다."
        />

        {isStarted && messages.length > 0 && (
          <SeniorButton
            variant="outline"
            size="normal"
            icon={<RotateCcw size={18} />}
            onClick={() => setShowResetModal(true)}
            style={{ marginTop: '16px' }}
          >
            새 대화 시작
          </SeniorButton>
        )}
      </div>

      {/* 오류 메시지 배너 */}
      {pageError && (
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          <ErrorMessage message={pageError} onDismiss={() => setPageError(null)} />
        </div>
      )}
      {recordError && (
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          <ErrorMessage message={recordError} onDismiss={() => setRecordError(null)} />
        </div>
      )}

      {/* 3. 첫 진입 시 이용 안내 시작 화면 / 시작 후 연속 채팅형 대화 인터페이스 */}
      {!isStarted ? (
        <section
          className="responsive-panel"
          style={{
            backgroundColor: 'var(--color-bg-surface, #ffffff)',
            borderRadius: 'var(--border-radius-lg, 16px)',
            border: '2px solid var(--color-border, #E5E7EB)',
            padding: 'clamp(28px, 4vw, 36px) clamp(20px, 3.5vw, 30px)',
            boxShadow: 'var(--shadow-sm)',
            marginTop: 'clamp(28px, 4vw, 40px)',
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
                <strong>녹음 시작:</strong> 상대방이 말할 때 녹음 버튼을 누르면 최대 30초 동안 음성을 듣습니다.
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

          {/* 시작 버튼: 클릭 시 자동 녹음하지 않고 채팅 인터페이스로 전환 */}
          <SeniorButton
            variant="primary"
            size="large"
            icon={<Sparkles size={22} />}
            onClick={() => {
              if (requireAuth('conversation')) {
                setIsStarted(true);
              }
            }}
            style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
          >
            AI 대화 시작하기
          </SeniorButton>
        </section>
      ) : (
        <>
          {/* 안내 및 동의 알림 배너 */}
          <aside
            role="region"
            aria-label="서비스 이용 유의사항"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '8px',
              backgroundColor: '#f3f6f3',
              border: '1px solid #d8e2d7',
              color: '#264233',
              fontSize: 'var(--text-sm)',
              lineHeight: 1.5,
              marginTop: '16px',
              marginBottom: '20px'
            }}
          >
            <Info size={20} color="#28523e" style={{ flexShrink: 0 }} />
            <span>
              <strong>안내:</strong> 상대방의 음성을 녹음하기 전에는 녹음 및 서비스 이용 사실을 미리 알리고 동의를 구해 주세요. 민감한 개인정보는 입력하거나 녹음하지 않는 것을 권장합니다.
            </span>
          </aside>

      {/* 중앙: 대화 채팅 영역 */}
      <main className="vb-chat-view" aria-label="AI 대화 메시지 목록">
        <div
          ref={chatScrollRef}
          className="vb-chat-stream"
          tabIndex={0}
          role="log"
          aria-live="polite"
        >
          {messages.length === 0 && recordingTarget === 'none' && !isProcessing && !directVoiceReview && (
            <div
              style={{
                margin: 'auto',
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--vb-muted)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#eef3ec',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--vb-green)'
                }}
              >
                <Mic size={32} />
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--vb-ink)', marginBottom: '8px' }}>
                대화를 시작해 보세요
              </h3>
              <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto' }}>
                아래 <strong>[상대방 말 듣기]</strong>를 눌러 상대방의 음성을 녹음하면,<br />
                AI가 답변을 추천하고 말풍선 형태로 대화가 이어집니다.
              </p>
            </div>
          )}

          {/* 누적된 대화 메시지들 */}
          {messages.map((msg) => {
            const isCounterpart = msg.sender === 'counterpart';
            const isSpeakingThis = speakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`vb-chat-row ${isCounterpart ? 'vb-chat-row--counterpart' : 'vb-chat-row--me'}`}
              >
                <div
                  className={`vb-chat-bubble ${isCounterpart ? 'vb-chat-bubble--counterpart' : 'vb-chat-bubble--me'}`}
                >
                  {/* 말한 사람 라벨 & 보조 태그 */}
                  <div className="vb-chat-sender-label">
                    <span>{isCounterpart ? '상대방' : '나'}</span>
                    {!isCounterpart && msg.source && (
                      <span className="vb-chat-tag">
                        {msg.source === 'ai_candidate' && 'AI 추천'}
                        {msg.source === 'direct_voice' && '직접 말하기'}
                        {msg.source === 'direct_text' && '직접 입력'}
                      </span>
                    )}
                  </div>

                  {/* 메시지 내용 */}
                  <p className="vb-chat-text">{msg.text}</p>

                  {/* 음성 다시 듣기 버튼 */}
                  <div style={{ display: 'flex', justifyContent: isCounterpart ? 'flex-start' : 'flex-end', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleReplayMessage(msg)}
                      aria-label={`${isCounterpart ? '상대방' : '내'} 메시지 다시 듣기`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: isCounterpart ? '#dce7dc' : 'rgba(255, 255, 255, 0.22)',
                        border: 'none',
                        color: isCounterpart ? '#1f382b' : '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'opacity 0.15s ease'
                      }}
                    >
                      <Volume2 size={14} />
                      <span>{isSpeakingThis ? '재생 중...' : '다시 듣기'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 녹음 중 상태 (중앙 대화 영역 내부 표시) */}
          {recordingTarget !== 'none' && (
            <section
              aria-label="음성 녹음 진행 중"
              style={{
                width: '100%',
                maxWidth: messages.length === 0 ? '540px' : '100%',
                margin: messages.length === 0 ? 'auto' : '4px 0 0',
                backgroundColor: '#ffffff',
                border: '2px solid var(--vb-green, #28523e)',
                borderRadius: '14px',
                padding: 'clamp(20px, 3.5vw, 28px)',
                boxShadow: '0 4px 16px rgba(40, 82, 62, 0.08)',
                boxSizing: 'border-box',
                animation: 'vb-message-appear 0.2s ease-out',
              }}
            >
              {/* 상단: 빨간 녹음 표시 + 안내 문구 + 경과/최대 시간 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#dc2626',
                      boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.16)',
                      animation: 'pulse 1s infinite',
                      flexShrink: 0,
                    }}
                  />
                  <strong style={{ fontSize: 'var(--text-lg)', color: 'var(--vb-ink, #1a2721)', fontWeight: 700 }}>
                    {recordingTarget === 'counterpart' ? '상대방의 말을 듣고 있어요' : '내 목소리를 듣고 있어요'}
                  </strong>
                </div>

                <span
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    color: 'var(--vb-ink, #1a2721)',
                    backgroundColor: '#f3f6f2',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    border: '1px solid #d8e2d7',
                  }}
                >
                  {recordSeconds}초 / 28초
                </span>
              </div>

              {/* 중앙: 녹음 파형 시각화 */}
              <div style={{ marginBottom: '16px' }}>
                <AudioVisualizer isRecording={true} height={60} />
              </div>

              {/* 하단: 안내 문구 및 취소 / 녹음 완료 버튼 */}
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--vb-muted, #4b5563)',
                  textAlign: 'center',
                  margin: '0 0 18px',
                  lineHeight: 1.5,
                }}
              >
                말씀이 끝나면 녹음 완료를 눌러 주세요
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <SeniorButton
                  type="button"
                  variant="outline"
                  size="normal"
                  onClick={cancelRecording}
                >
                  취소
                </SeniorButton>
                <SeniorButton
                  type="button"
                  variant="primary"
                  size="normal"
                  icon={<Square size={18} />}
                  onClick={() => stopRecordingAndProcess(recordingTarget)}
                >
                  녹음 완료
                </SeniorButton>
              </div>
            </section>
          )}

          {/* 녹음 완료 후 처리 중 로딩 상태 */}
          {isProcessing && (
            messages.length === 0 ? (
              <div
                style={{
                  margin: 'auto',
                  textAlign: 'center',
                  padding: '40px 24px',
                  maxWidth: '460px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#eef3ec',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Loader2 size={28} className="animate-spin" color="var(--vb-green)" />
                </div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-lg)',
                    color: 'var(--vb-ink)',
                    marginBottom: '6px',
                  }}
                >
                  {processingLabel}
                </strong>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--vb-muted)' }}>
                  잠시만 기다려 주세요.
                </span>
              </div>
            ) : (
              <div className="vb-chat-row vb-chat-row--counterpart">
                <div className="vb-chat-bubble vb-chat-bubble--counterpart" style={{ opacity: 0.9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={18} className="animate-spin" color="var(--vb-green)" />
                    <span style={{ fontSize: 'var(--text-base)', color: '#273b30' }}>
                      {processingLabel}
                    </span>
                  </div>
                </div>
              </div>
            )
          )}

          {/* AI 추천 답변 선택 카드 영역 */}
          {activeTurn && activeTurn.candidates && activeTurn.candidates.length > 0 && !isProcessing && (
            <section
              className="vb-candidate-deck"
              aria-label="AI 추천 답변 선택"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Sparkles size={18} color="var(--vb-green)" />
                <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: '#132b1f' }}>
                  AI 추천 답변 (선택하면 상대방에게 소리로 전달됩니다)
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeTurn.candidates.map((cand, idx) => (
                  <button
                    key={cand.candidateId}
                    type="button"
                    className="vb-candidate-btn"
                    onClick={() => handleSelectCandidate(cand)}
                  >
                    <span>
                      <strong style={{ color: 'var(--vb-green)', marginRight: '8px' }}>{idx + 1}.</strong>
                      {cand.text}
                    </span>
                    <Volume2 size={18} color="var(--vb-green)" style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 추천 답변 0개 안내 */}
          {activeTurn && activeTurn.candidates && activeTurn.candidates.length === 0 && !isProcessing && (
            <div
              style={{
                backgroundColor: '#f3f6f2',
                border: '1px dashed #cbd8cb',
                borderRadius: '8px',
                padding: '14px 18px',
                fontSize: 'var(--text-sm)',
                color: '#344b3e'
              }}
            >
              생성된 AI 추천 답변이 없습니다. 아래 <strong>[내가 직접 말하기]</strong> 또는 텍스트 입력으로 답변을 전달해 보세요.
            </div>
          )}

          {/* '내가 직접 말하기' 인식 결과 확인/수정 카드 */}
          {directVoiceReview && (
            <section
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #2b5a8f',
                borderRadius: '12px',
                padding: '18px 20px',
                boxShadow: '0 4px 14px rgba(43, 90, 143, 0.12)',
                animation: 'vb-message-appear 0.25s ease-out'
              }}
              aria-label="인식된 내 음성 확인 및 수정"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <UserCheck size={20} color="#2b5a8f" />
                <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: '#1a3250' }}>
                  인식된 내용을 확인해 주세요
                </h4>
              </div>

              <p style={{ fontSize: 'var(--text-sm)', color: '#4b5563', marginBottom: '12px' }}>
                필요하다면 문장을 수정한 뒤 <strong>[전달 및 음성 재생]</strong>을 눌러주세요.
              </p>

              <textarea
                value={directVoiceReview.text}
                onChange={(e) => setDirectVoiceReview({ ...directVoiceReview, text: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #93c5fd',
                  fontSize: 'var(--text-base)',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  marginBottom: '14px',
                  fontFamily: 'inherit'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                <SeniorButton
                  variant="outline"
                  size="normal"
                  onClick={() => setDirectVoiceReview(null)}
                  disabled={isConfirmingVoice}
                >
                  취소
                </SeniorButton>
                <SeniorButton
                  variant="outline"
                  size="normal"
                  icon={<RotateCcw size={16} />}
                  onClick={() => {
                    setDirectVoiceReview(null);
                    startRecording('me');
                  }}
                  disabled={isConfirmingVoice}
                >
                  다시 녹음
                </SeniorButton>
                <SeniorButton
                  variant="primary"
                  size="normal"
                  icon={isConfirmingVoice ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  onClick={handleConfirmDirectVoice}
                  disabled={isConfirmingVoice || !directVoiceReview.text.trim()}
                >
                  {isConfirmingVoice ? '음성 변환 중...' : '전달 및 음성 재생'}
                </SeniorButton>
              </div>
            </section>
          )}
        </div>

        {/* 하단 입력 및 제어 도크 */}
        <div className="vb-chat-dock">
          {/* 음성 녹음 버튼 2종 */}
          <div className="vb-chat-actions">
            <SeniorButton
              variant="primary"
              size="large"
              icon={<Mic size={22} />}
              onClick={() => startRecording('counterpart')}
              disabled={recordingTarget !== 'none' || isProcessing || isConfirmingVoice}
              style={{ fontWeight: 700 }}
            >
              상대방 말 듣기
            </SeniorButton>

            <SeniorButton
              variant="outline"
              size="large"
              icon={<Mic size={22} />}
              onClick={() => startRecording('me')}
              disabled={recordingTarget !== 'none' || isProcessing || isConfirmingVoice}
              style={{
                fontWeight: 600,
                backgroundColor: '#ffffff',
                borderColor: 'var(--vb-green)',
                color: 'var(--vb-green)'
              }}
            >
              내가 직접 말하기
            </SeniorButton>
          </div>

          {/* 직접 텍스트 입력창 */}
          <form
            onSubmit={handleSendDirectText}
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={directInputText}
              onChange={(e) => setDirectInputText(e.target.value)}
              placeholder="직접 문장을 입력하여 전달할 수도 있습니다"
              disabled={recordingTarget !== 'none' || isProcessing}
              style={{
                flex: 1,
                minHeight: '48px',
                padding: '10px 16px',
                fontSize: 'var(--text-base)',
                borderRadius: '8px',
                border: '1.5px solid var(--vb-line)',
                backgroundColor: '#ffffff',
                color: 'var(--vb-ink)',
                outline: 'none'
              }}
            />
            <SeniorButton
              type="submit"
              variant="secondary"
              size="normal"
              icon={<Send size={18} />}
              disabled={!directInputText.trim() || recordingTarget !== 'none' || isProcessing}
              style={{ minHeight: '48px' }}
            >
              전송
            </SeniorButton>
          </form>
        </div>
      </main>
      </>
      )}

      {/* 새 대화 시작 확인 모달 */}
      {showResetModal && (
        <BrandDialog
          label="새 대화 시작 확인"
          className="vb-dialog-add-phrase"
          onClose={() => setShowResetModal(false)}
        >
          <div
            className="vb-modal-panel"
            style={{
              maxWidth: '440px',
              padding: '28px 24px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
              margin: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b91c1c'
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, color: '#1a2721' }}>
                새 대화 시작
              </h3>
            </div>

            <p style={{ fontSize: 'var(--text-base)', color: '#374151', lineHeight: 1.6, marginBottom: '22px' }}>
              현재 대화 내용을 지우고 새로운 대화를 시작하시겠어요? 화면의 대화 기록이 초기화됩니다.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <SeniorButton
                type="button"
                variant="outline"
                size="normal"
                onClick={() => setShowResetModal(false)}
              >
                취소
              </SeniorButton>
              <SeniorButton
                type="button"
                variant="danger"
                size="normal"
                icon={<RotateCcw size={16} />}
                onClick={handleResetConversation}
              >
                새 대화 시작
              </SeniorButton>
            </div>
          </div>
        </BrandDialog>
      )}
    </div>
  );
};
