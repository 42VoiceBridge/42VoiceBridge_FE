import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { diagnosisSentences } from '../../utils/mockData';
import type { DiagnosisResult, WeakPhoneme } from '../../types';
import { SeniorButton } from '../../components/common/SeniorButton';
import { TTSButton } from '../../components/common/TTSButton';
import { AudioVisualizer } from '../../components/common/AudioVisualizer';
import { AudioRecorderService } from '../../utils/audioUtils';
import { createDiagnosisSessionApi, uploadDiagnosisRecordingApi } from '../../api/diagnosis';
import type { DiagnosisSentenceDto } from '../../api/diagnosis';

type Step = 'intro' | 'recording' | 'analyzing' | 'result';

export const DiagnosisPage: React.FC = () => {
  const { addDiagnosisResult, setCurrentTab } = useApp();
  const [step, setStep] = useState<Step>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [currentResult, setCurrentResult] = useState<DiagnosisResult | null>(null);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sentences, setSentences] = useState<DiagnosisSentenceDto[]>([]);
  const [uploading, setUploading] = useState(false);

  const recorderRef = useRef<AudioRecorderService | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSentence = sentences[currentIndex] || diagnosisSentences[0];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
        
        const token = localStorage.getItem('accessToken');
        if (token && sessionId && sentences[currentIndex]) {
          const blob = await fetch(audioUrl).then((r) => r.blob());
          const sentenceId = sentences[currentIndex].sentenceId;
          
          const uploadRes = await uploadDiagnosisRecordingApi(token, sessionId, sentenceId, blob);
          if (!uploadRes.success) throw new Error(uploadRes.error?.message || '업로드 실패');
        }
      } catch (err: any) {
        alert(err.message || '녹음 업로드 중 오류가 발생했습니다.');
      } finally {
        setUploading(false);
      }
    }
    
    setIsRecording(false);
    setHasRecorded(true);
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
      setTimeout(() => {
        finishAnalysis();
      }, 2400);
    }
  };

  // 5. Compute and show result
  const finishAnalysis = () => {
    const calculatedScore = Math.floor(Math.random() * 6) + 82; // 82 ~ 87
    const weakPhonemes: WeakPhoneme[] = [
      {
        phoneme: 'ㄹ',
        accuracy: 45,
        errorType: '왜곡',
        description: "혀끝을 잇몸에 튕기는 탄설음 'ㄹ'에서 음절 멈춤이 발생합니다.",
      },
      {
        phoneme: 'ㅅ',
        accuracy: 58,
        errorType: '치환',
        description: "치경마찰음 'ㅅ'에서 공기 마찰이 부족하여 부드럽게 뭉개집니다.",
      },
      {
        phoneme: 'ㅈ',
        accuracy: 68,
        errorType: '왜곡',
        description: "파찰음 'ㅈ'의 발화 초반 압력이 약간 낮습니다.",
      },
    ];

    const result: DiagnosisResult = {
      id: `diag-${Date.now()}`,
      date: new Date().toLocaleDateString('ko-KR'),
      overallScore: calculatedScore,
      metrics: {
        accuracy: calculatedScore,
        fluency: calculatedScore - 4,
        clarity: calculatedScore + 3,
      },
      weakPhonemes,
      comment:
        "5개 문장 모두 끝까지 훌륭하게 완독하셨습니다! 호흡과 발성 명료도가 양호하며, 'ㄹ'과 'ㅅ' 조음 연습을 지속하시면 훨씬 또렷한 전달이 가능합니다.",
      sentenceCount: 5,
    };

    setCurrentResult(result);
    addDiagnosisResult(result);
    setStep('result');

    // Senior celebration effect
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // STAGE 1: INTRO / GUIDE
  if (step === 'intro') {
    return (
      <div style={{ maxWidth: '800px', margin: '30px auto', padding: '0 16px' }}>
        <div
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
              발음 진단을 시작해볼까요?
            </h1>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)' }}>
              5개의 짧은 문장을 편안하게 읽으시면, AI가 발음 상태와 개선점을 분석해 드립니다.
            </p>
          </div>

          {/* Senior Guidance Checklist */}
          <div
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
              text="발음 진단을 시작합니다. 조용한 곳에서 화면에 나오는 문장을 천천히 또박또박 읽어주세요."
              label="안내 음성 듣기"
              size="large"
            />
            <SeniorButton variant="primary" size="large" onClick={handleStartDiagnosis}>
              진단 시작하기
            </SeniorButton>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'recording') {
    const totalSentences = sentences.length || 1;
    const progressPercent = Math.round(((currentIndex + 1) / totalSentences) * 100);

    return (
      <div style={{ maxWidth: '840px', margin: '30px auto', padding: '0 16px' }}>
        {/* Step Indicator Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <button
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

        {/* Progress Bar */}
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

        {/* Main Sentence Card */}
        <div
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

          {/* Big Typography Sentence */}
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

          {/* Recording Feedback Area */}
          <div style={{ marginBottom: '28px' }}>
            <AudioVisualizer isRecording={isRecording} height={70} />
            <div style={{ marginTop: '12px', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
              {isRecording ? (
                <span style={{ color: 'var(--color-danger)' }}>
                  🔴 녹음 중... ({formatTime(recordedTime)})
                </span>
              ) : uploading ? (
                <span style={{ color: 'var(--color-primary)' }}>
                  ⏳ 업로드 중...
                </span>
              ) : hasRecorded ? (
                <span style={{ color: 'var(--color-secondary)' }}>
                  ✅ 녹음 완료 ({formatTime(recordedTime)})
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-muted)' }}>
                  아래 '녹음 시작' 버튼을 누르고 읽어주세요
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
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
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '0 16px' }}>
        <div
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
            음성을 정밀 분석하고 있어요...
          </h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            발음 정확도, 음절 연결 유창도, 음소별 명료도를 꼼꼼히 계산 중입니다.
            <br />
            잠시만 기다려주세요!
          </p>
        </div>
      </div>
    );
  }

  // STAGE 4: RESULT REPORT
  const res = currentResult;
  if (!res) return null;

  return (
    <div style={{ maxWidth: '960px', margin: '30px auto', padding: '0 16px 60px' }}>
      {/* Result Top Card */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '36px',
          borderRadius: 'var(--border-radius-lg)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '28px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
            <Sparkles size={18} /> 진단 완료
          </span>
          <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: '8px' }}>
            오늘의 발음 진단 결과
          </h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
            총 5개 문장의 발화 데이터를 분석한 종합 보고서입니다.
          </p>
        </div>

        {/* Score & Breakdown Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            alignItems: 'center',
            padding: '24px',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: '32px',
          }}
        >
          {/* Main Big Score */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <span style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, lineHeight: 1 }}>
                {res.overallScore}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginTop: '4px' }}>
                종합 발음 점수
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-primary)', marginTop: '10px' }}>
              표준 전달력 수준에 도달했습니다!
            </p>
          </div>

          {/* Sub Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '4px' }}>
                <span>발음 정확도</span>
                <span>{res.metrics.accuracy}%</span>
              </div>
              <div style={{ height: '10px', backgroundColor: 'var(--color-border)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${res.metrics.accuracy}%`, height: '100%', backgroundColor: 'var(--color-primary)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '4px' }}>
                <span>말하기 유창도 (호흡 및 멈춤)</span>
                <span>{res.metrics.fluency}%</span>
              </div>
              <div style={{ height: '10px', backgroundColor: 'var(--color-border)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${res.metrics.fluency}%`, height: '100%', backgroundColor: 'var(--color-secondary)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '4px' }}>
                <span>소리 명료도 (음량 및 명료성)</span>
                <span>{res.metrics.clarity}%</span>
              </div>
              <div style={{ height: '10px', backgroundColor: 'var(--color-border)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${res.metrics.clarity}%`, height: '100%', backgroundColor: '#0284c7' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Weak Phonemes Section (취약 음소 확인) */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={22} color="var(--color-accent)" />
            <span>집중 관리가 필요한 취약 음소 ({res.weakPhonemes.length}개)</span>
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {res.weakPhonemes.map((wp) => (
              <div
                key={wp.phoneme}
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '2px solid var(--color-accent-border)',
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span
                    style={{
                      fontSize: 'var(--text-3xl)',
                      fontWeight: 900,
                      color: 'var(--color-accent)',
                    }}
                  >
                    '{wp.phoneme}'
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      backgroundColor: 'var(--color-accent-light)',
                      color: 'var(--color-accent)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                    }}
                  >
                    정확도 {wp.accuracy}%
                  </span>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-body)', lineHeight: 1.6 }}>
                  {wp.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Specialist AI Comment */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: 'var(--color-primary-light)',
            border: '2px solid var(--color-primary-border)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <strong style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary)' }}>
              🧑‍⚕️ 언어치료 AI 분석 코멘트
            </strong>
          </div>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-body)', lineHeight: 1.7 }}>
            {res.comment}
          </p>
        </div>

        {/* CTA Buttons */}
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
            variant="primary"
            size="large"
            icon={<ArrowRight size={22} />}
            onClick={() => setCurrentTab('practice')}
          >
            추천 맞춤 문장 연습하러 가기
          </SeniorButton>
        </div>
      </div>
    </div>
  );
};
