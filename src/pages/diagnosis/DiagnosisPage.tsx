import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { SeniorButton } from '../../components/common/SeniorButton';
import { TTSButton } from '../../components/common/TTSButton';
import { AudioVisualizer } from '../../components/common/AudioVisualizer';
import { AudioRecorderService } from '../../utils/audioUtils';
import { 
  createDiagnosisSessionApi, 
  uploadDiagnosisRecordingApi,
  getDiagnosisSessionApi,
  getRecordingResultApi
} from '../../api/diagnosis';
import type { 
  DiagnosisSentenceDto,
  DiagnosisRecordingResult,
  DiffHighlight
} from '../../api/diagnosis';
import { FeaturePageHeader } from '../../components/layout/FeaturePageHeader';

type Step = 'intro' | 'recording' | 'analyzing' | 'result';

export const DiagnosisPage: React.FC = () => {
  const { setCurrentTab } = useApp();
  const [step, setStep] = useState<Step>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sentences, setSentences] = useState<DiagnosisSentenceDto[]>([]);
  const [uploading, setUploading] = useState(false);

  // Map of sentenceId -> recordingId
  const [recordingIds, setRecordingIds] = useState<Record<string, string>>({});
  // Final results
  const [actualResults, setActualResults] = useState<DiagnosisRecordingResult[]>([]);

  const recorderRef = useRef<AudioRecorderService | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSentence = sentences[currentIndex];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (recorderRef.current) {
        recorderRef.current.stopRecording().catch(() => {});
      }
    };
  }, []);

  // 1. Intro -> Start
  const handleStartDiagnosis = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    try {
      const res = await createDiagnosisSessionApi(token);
      if (!res.success || !res.data) throw new Error(res.error?.message || '세션 생성 실패');
      
      setSessionId(res.data.sessionId);
      setSentences(res.data.sentences);
      setRecordingIds({});
      setActualResults([]);
      setCurrentIndex(0);
      setStep('recording');
      setHasRecorded(false);
      setRecordedTime(0);
    } catch (err: any) {
      alert(err.message || '진단 세션 생성 중 오류가 발생했습니다.');
    }
  };

  // 2. Start Recording
  const startRecording = async () => {
    recorderRef.current = new AudioRecorderService();
    await recorderRef.current.startRecording();
    setIsRecording(true);
    setHasRecorded(false);
    setRecordedTime(0);

    timerRef.current = setInterval(() => {
      setRecordedTime((prev) => prev + 1);
    }, 1000);
  };

  // 3. Stop Recording
  const stopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (recorderRef.current) {
      try {
        setUploading(true);
        const audioUrl = await recorderRef.current.stopRecording();
        
        const blob = await fetch(audioUrl).then((r) => r.blob());
        
        // Size validation (Max 10MB)
        if (blob.size > 10 * 1024 * 1024) {
          alert('녹음 파일이 너무 커요. 다시 녹음해 주세요.');
          setIsRecording(false);
          setHasRecorded(false);
          setUploading(false);
          return;
        }

        const token = localStorage.getItem('accessToken');
        if (token && sessionId && sentences[currentIndex]) {
          const sentenceId = sentences[currentIndex].sentenceId;
          
          try {
            const uploadRes = await uploadDiagnosisRecordingApi(token, sessionId, sentenceId, blob);
            if (!uploadRes.success || !uploadRes.data) throw new Error(uploadRes.error?.message || '업로드 실패');
            
            // Store the real recordingId
            setRecordingIds(prev => ({
              ...prev,
              [sentenceId]: uploadRes.data!.recordingId
            }));
            
            setIsRecording(false);
            setHasRecorded(true);
          } catch (err: any) {
            // Handle specific errors based on instructions
            if (err.code === 'INVALID_STATE_TRANSITION' || err.message.includes('409')) {
              alert('이미 완료된 진단이거나 현재 업로드할 수 없는 상태입니다.');
            } else if (err.message.includes('401') || err.message.includes('403')) {
              alert('인증이 만료되었습니다. 다시 로그인해주세요.');
            } else if (err.message.includes('400')) {
              alert('올바르지 않은 녹음 파일입니다. 다시 녹음해주세요.');
            } else {
              alert(err.message || '녹음 업로드 중 오류가 발생했습니다.');
            }
            // Failed to upload, reset so user can try again
            setIsRecording(false);
            setHasRecorded(false);
          }
        }
      } catch (err: any) {
        alert(err.message || '녹음 처리 중 오류가 발생했습니다.');
        setIsRecording(false);
        setHasRecorded(false);
      } finally {
        setUploading(false);
      }
    }
  };

  // 4. Next sentence or finish
  const handleNextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setHasRecorded(false);
      setRecordedTime(0);
    } else {
      // Completed all sentences -> Start analyzing
      setStep('analyzing');
      pollSessionStatus();
    }
  };

  // 5. Poll session status
  const pollSessionStatus = async () => {
    if (!sessionId) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = setInterval(async () => {
      try {
        const res = await getDiagnosisSessionApi(token, sessionId);
        if (res.success && res.data) {
          if (res.data.status === 'ANALYZED') {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            fetchResults();
          } else {
            // Check if any sentence is FAILED.
            const failedSentence = res.data.sentences.find(s => s.recordingStatus === 'FAILED');
            if (failedSentence) {
               if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
               alert('일부 녹음의 분석에 실패했습니다. 해당 문장을 다시 녹음해주세요.');
               // Re-route to the failed sentence
               const failedIndex = sentences.findIndex(s => s.sentenceId === failedSentence.sentenceId);
               if (failedIndex !== -1) {
                 setCurrentIndex(failedIndex);
                 setHasRecorded(false);
                 setStep('recording');
               }
            }
          }
        }
      } catch (e: any) {
        // Just log or silently retry, but if it's auth error we should stop
        if (e.message && (e.message.includes('401') || e.message.includes('403'))) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
      }
    }, 2500);
  };

  // 6. Fetch results
  const fetchResults = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token || !sessionId) return;

    try {
      const results: DiagnosisRecordingResult[] = [];
      // Fetch result for each sentence
      for (const s of sentences) {
        const recId = recordingIds[s.sentenceId];
        if (!recId) continue;
        const res = await getRecordingResultApi(token, sessionId, recId);
        if (res.success && res.data) {
           results.push(res.data);
        }
      }
      setActualResults(results);
      setStep('result');

      // Celebration effect
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      alert('결과를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const renderDiffHighlight = (answerText: string, diffHighlights: DiffHighlight[]) => {
    if (!diffHighlights || diffHighlights.length === 0) return <span>{answerText}</span>;
  
    const elements = [];
    let currentPos = 0;
    
    // Sort by position to process sequentially
    const sortedDiffs = [...diffHighlights].sort((a, b) => a.position - b.position);
  
    for (const diff of sortedDiffs) {
      // Add text before the diff
      if (diff.position > currentPos) {
        elements.push(<span key={`text-${currentPos}`}>{answerText.slice(currentPos, diff.position)}</span>);
      }
      
      if (diff.expected && diff.recognized) {
        // Case A: substitution
        elements.push(<span key={`diff-${diff.position}`} style={{ color: 'var(--color-danger)', fontWeight: 'bold', textDecoration: 'underline' }}>{answerText[diff.position]}</span>);
        currentPos = diff.position + 1;
      } else if (diff.expected && !diff.recognized) {
        // Case B: omission
        elements.push(<span key={`diff-${diff.position}`} style={{ color: 'var(--color-muted)', textDecoration: 'line-through' }}>{answerText[diff.position]}</span>);
        currentPos = diff.position + 1;
      } else if (!diff.expected && diff.recognized) {
        // Case C: addition
        elements.push(<span key={`diff-${diff.position}`} style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>[{diff.recognized}]</span>);
        currentPos = diff.position; // don't advance answerText index because expected is null
      }
    }
  
    // Add remaining text
    if (currentPos < answerText.length) {
      elements.push(<span key={`text-${currentPos}`}>{answerText.slice(currentPos)}</span>);
    }
  
    return <>{elements}</>;
  };

  // STAGE 1: INTRO / GUIDE
  if (step === 'intro') {
    return (
      <div className="vb-theme vb-page vb-page--diagnosis responsive-page" style={{ maxWidth: '800px', margin: '30px auto', padding: '0 16px' }}>
        <FeaturePageHeader eyebrow="PRONUNCIATION / SPEECH CARE" title={<>내 발음을,<br /><span>조금 더 이해하기 쉽게.</span></>} description="짧은 문장을 읽으면 발음 상태와 개선점을 확인할 수 있습니다." />
        <div className="responsive-panel vb-function-stage vb-diagnosis-intro"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            padding: '36px 32px',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Mic size={40} />
            </div>
            <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: '12px' }}>
              발음 분석을 시작해볼까요?
            </h1>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)' }}>
              짧은 문장을 편안하게 읽으시면, AI가 발음 상태를 분석해 드립니다.
            </p>
          </div>

          <div className="responsive-panel"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--border-radius-md)',
              padding: '24px',
              marginBottom: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <CheckCircle2 size={28} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 'var(--text-base)', display: 'block' }}>
                  소요 시간: 약 2~3분
                </strong>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  부담 없이 가볍게 읽으실 수 있는 분량입니다.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <CheckCircle2 size={28} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 'var(--text-base)', display: 'block' }}>
                  조용한 환경에서 진행해주세요
                </strong>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  TV나 라디오 소리를 줄이시면 더 정확하게 측정됩니다.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <CheckCircle2 size={28} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 'var(--text-base)', display: 'block' }}>
                  또박또박 천천히 읽어주세요
                </strong>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  빨리 읽으실 필요 없이, 평소 속도대로 편안하게 말씀하세요.
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <TTSButton
              text="발음 분석을 시작합니다. 조용한 곳에서 화면에 나오는 문장을 천천히 또박또박 읽어주세요."
              label="안내 음성 듣기"
              size="large"
            />
            <SeniorButton variant="primary" size="large" onClick={handleStartDiagnosis}>
              분석 시작하기
            </SeniorButton>
          </div>
        </div>
      </div>
    );
  }

  // STAGE 2: RECORDING
  if (step === 'recording' && currentSentence) {
    const totalSentences = sentences.length || 1;
    const progressPercent = Math.round(((currentIndex + 1) / totalSentences) * 100);

    return (
      <div className="vb-theme vb-page vb-page--diagnosis responsive-page" style={{ maxWidth: '840px', margin: '30px auto', padding: '0 16px' }}>
        <FeaturePageHeader eyebrow="PRONUNCIATION / RECORDING" title={<>현재 문장을,<br /><span>편안하게 읽어주세요.</span></>} description="평소 속도로 천천히 읽고, 문장을 마치면 녹음을 완료해주세요." meta={`${String(currentIndex + 1).padStart(2, '0')} / ${String(sentences.length || 1).padStart(2, '0')}`} />
        
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <button className="touch-control"
            onClick={() => setStep('intro')}
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
            }}
          >
            ← 안내로 돌아가기
          </button>
          <div
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 800,
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-light)',
              padding: '6px 16px',
              borderRadius: 'var(--border-radius-full)',
              border: '1.5px solid var(--color-primary-border)',
            }}
          >
            문장 {currentIndex + 1} / {sentences.length}
          </div>
        </div>

        <div
          style={{
            height: '10px',
            backgroundColor: 'var(--color-border)',
            borderRadius: '5px',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: 'var(--color-primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <div className="responsive-panel vb-function-stage vb-diagnosis-recording"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            padding: '36px 30px',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            다음 문장을 소리 내어 또박또박 읽어주세요
          </p>

          <div
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 800,
              color: 'var(--color-text-title)',
              lineHeight: 1.5,
              padding: '24px 20px',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--border-radius-md)',
              border: '2px dashed var(--color-primary-border)',
              marginBottom: '24px',
            }}
          >
            "{currentSentence.text}"
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            <TTSButton text={currentSentence.text} label="문장 소리 듣기" size="large" />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <AudioVisualizer isRecording={isRecording} height={70} />
            <div style={{ marginTop: '12px', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
              {isRecording ? (
                <span style={{ color: 'var(--color-danger)' }}>
                  녹음 중... ({formatTime(recordedTime)})
                </span>
              ) : uploading ? (
                <span style={{ color: 'var(--color-primary)' }}>
                  업로드 중...
                </span>
              ) : hasRecorded ? (
                <span style={{ color: 'var(--color-secondary)' }}>
                  녹음 완료 ({formatTime(recordedTime)})
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-muted)' }}>
                  아래 '녹음 시작' 버튼을 누르고 읽어주세요
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {!isRecording ? (
              <SeniorButton
                variant={hasRecorded ? 'outline' : 'primary'}
                size="huge"
                icon={<Mic size={30} />}
                onClick={startRecording}
                className={!hasRecorded ? 'animate-pulse-record' : ''}
              >
                {hasRecorded ? '다시 녹음하기' : '녹음 시작'}
              </SeniorButton>
            ) : (
              <SeniorButton
                variant="danger"
                size="huge"
                icon={<Square size={28} />}
                onClick={stopRecording}
              >
                녹음 완료
              </SeniorButton>
            )}

            {hasRecorded && !isRecording && (
              <SeniorButton
                variant="primary"
                size="huge"
                icon={<ArrowRight size={28} />}
                onClick={handleNextSentence}
              >
                {currentIndex < sentences.length - 1 ? '다음 문장으로' : '분석 결과 보기'}
              </SeniorButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STAGE 3: ANALYZING
  if (step === 'analyzing') {
    return (
      <div className="vb-theme vb-page vb-page--diagnosis responsive-page" style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '0 16px' }}>
        <FeaturePageHeader eyebrow="PRONUNCIATION / ANALYSIS" title={<>AI가 발음을,<br /><span>분석하고 있어요.</span></>} description="발음 상태를 확인하는 동안 잠시만 기다려주세요." />
        <div className="responsive-panel vb-function-stage vb-analysis-stage"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            padding: '48px 32px',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            className="animate-spin-slow"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '6px solid var(--color-primary-light)',
              borderTopColor: 'var(--color-primary)',
              margin: '0 auto 24px',
            }}
          />
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '12px' }}>
            음성을 분석하고 있어요...
          </h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            잠시만 기다려주세요!
          </p>
        </div>
      </div>
    );
  }

  // STAGE 4: RESULT REPORT
  if (step === 'result') {
    return (
      <div className="vb-theme vb-page vb-page--diagnosis responsive-page" style={{ maxWidth: '960px', margin: '30px auto', padding: '0 16px 60px' }}>
        <FeaturePageHeader eyebrow="PRONUNCIATION / REPORT" title={<>오늘의 발음,<br /><span>이렇게 들렸습니다.</span></>} description="문장별 발화를 바탕으로 발음의 차이를 확인해보세요." />
        
        <div className="responsive-panel vb-diagnosis-report"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            padding: '36px',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '28px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                borderRadius: 'var(--border-radius-full)',
                backgroundColor: 'var(--color-secondary-light)',
                color: 'var(--color-secondary)',
                fontWeight: 800,
                fontSize: 'var(--text-sm)',
                marginBottom: '12px',
              }}
            >
              <Sparkles size={18} /> 분석 완료
            </span>
            <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: '8px' }}>
              발음 분석 결과
            </h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
              문장별로 원래 문장과 인식된 발음의 차이를 표시했습니다.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
            {actualResults.map((res, idx) => (
              <div key={idx} style={{ padding: '24px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600 }}>원래 문장</h3>
                  <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-title)' }}>
                    {renderDiffHighlight(res.answerText, res.diffHighlights)}
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600 }}>인식된 발음</h3>
                  {res.recognizedText === "" || res.recognizedText === null ? (
                    <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-danger)', fontWeight: 600 }}>
                      목소리가 잘 들리지 않았어요. 다시 녹음해 주세요.
                    </p>
                  ) : (
                    <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-body)' }}>
                      {res.recognizedText}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <SeniorButton
              variant="outline"
              size="large"
              icon={<RotateCcw size={22} />}
              onClick={() => setStep('intro')}
            >
              다시 진단하기
            </SeniorButton>

            <SeniorButton
              variant="outline"
              size="large"
              icon={<ArrowRight size={22} />}
              onClick={() => setCurrentTab('practice')}
            >
              추천 연습 문장 보기
            </SeniorButton>

            <SeniorButton
              variant="primary"
              size="large"
              icon={<ArrowRight size={22} />}
              onClick={() => setCurrentTab('dashboard')}
            >
              홈으로 가기
            </SeniorButton>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
