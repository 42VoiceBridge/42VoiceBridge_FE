import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Volume2,
  Check,
  Edit3,
  Loader2,
  HelpCircle,
  Save,
  ArrowRight
} from 'lucide-react';
import { BrandDialog } from '../../components/common/BrandDialog';
import { SeniorButton } from '../../components/common/SeniorButton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getPhraseSuggestionsApi, AiApiError } from '../../api/ai';
import { addPhraseApi, speakPhraseApi, PhraseApiError } from '../../api/phrases';
import { playAudioFromUrl } from '../../utils/audioUtils';

interface PhraseSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhraseAdded: () => void;
  defaultCategoryCode?: string;
  categoryOptions: Array<{ category: string; label: string }>;
}

export const PhraseSuggestionModal: React.FC<PhraseSuggestionModalProps> = ({
  isOpen,
  onClose,
  onPhraseAdded,
  defaultCategoryCode,
  categoryOptions,
}) => {
  const [inputText, setInputText] = useState('');
  const [inputCategory, setInputCategory] = useState(defaultCategoryCode || 'DAILY');

  // 추천 결과 상태
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState('');
  const [targetCategory, setTargetCategory] = useState(defaultCategoryCode || 'DAILY');

  // 오류 상태
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canDirectSave, setCanDirectSave] = useState(false);

  // 저장 및 음성 재생 진행 상태
  const [isSaving, setIsSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  // AI 추천 요청
  const handleRequestSuggestions = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) {
      setErrorMessage('추천받을 문장이나 단어를 입력해 주세요.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setErrorMessage('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setCanDirectSave(false);
    setCandidates([]);
    setSelectedCandidateIndex(null);
    setEditedText('');

    try {
      const results = await getPhraseSuggestionsApi(token, {
        text: trimmed,
        category: inputCategory || undefined,
      });

      if (!results || results.length === 0) {
        setErrorMessage('생성된 추천 문장이 없습니다. 다른 표현으로 입력해 보세요.');
        setCanDirectSave(true);
      } else {
        setCandidates(results);
        setSelectedCandidateIndex(0);
        setEditedText(results[0]);
        setTargetCategory(inputCategory || 'DAILY');
      }
    } catch (err: unknown) {
      console.error('Failed to get phrase suggestions:', err);
      if (err instanceof AiApiError) {
        setErrorMessage(err.message);
        if (!err.isFeatureDisabled) {
          setCanDirectSave(true);
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
        setCanDirectSave(true);
      } else {
        setErrorMessage('AI 추천 중 오류가 발생했습니다.');
        setCanDirectSave(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 후보 선택
  const handleSelectCandidate = (index: number) => {
    setSelectedCandidateIndex(index);
    setEditedText(candidates[index]);
  };

  // 문구 저장 공통 로직
  const executeSavePhrase = async (): Promise<{ phraseId: string; text: string } | null> => {
    const textToSave = editedText.trim() || inputText.trim();
    if (!textToSave) {
      setErrorMessage('저장할 문구를 입력해 주세요.');
      return null;
    }

    if (textToSave.length > 100) {
      setErrorMessage('문구는 100자 이하로 입력해 주세요.');
      return null;
    }

    if (/[\r\n\t]/.test(textToSave)) {
      setErrorMessage('줄바꿈이나 탭 문자는 포함할 수 없습니다.');
      return null;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setErrorMessage('로그인이 필요합니다.');
      return null;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const res = await addPhraseApi(token, {
        category: targetCategory,
        text: textToSave,
      });

      if (res.success && res.data) {
        const phraseId = res.data.id || res.data.phraseId || '';
        return { phraseId, text: res.data.text };
      }
      throw new Error('문구 저장 응답이 올바르지 않습니다.');
    } catch (err: unknown) {
      console.error('Failed to add phrase:', err);
      if (err instanceof PhraseApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('문구 저장에 실패했습니다.');
      }
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // 문구 저장 핸들러
  const handleSaveOnly = async () => {
    const result = await executeSavePhrase();
    if (result) {
      setSaveSuccess(true);
      onPhraseAdded();
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  // 문구 저장 후 바로 음성 재생
  const handleSaveAndSpeak = async () => {
    const result = await executeSavePhrase();
    if (!result) return;

    onPhraseAdded();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      onClose();
      return;
    }

    setIsSpeaking(true);
    try {
      const speakRes = await speakPhraseApi(token, result.phraseId);
      if (speakRes.success && speakRes.data?.audioUrl) {
        await playAudioFromUrl(speakRes.data.audioUrl, token);
      }
    } catch (err) {
      console.error('Failed to speak phrase:', err);
    } finally {
      setIsSpeaking(false);
      onClose();
    }
  };

  // 503/오류 시 직접 저장 모드로 전환
  const handleSwitchToDirectSave = () => {
    setCandidates([inputText.trim()]);
    setSelectedCandidateIndex(0);
    setEditedText(inputText.trim());
    setTargetCategory(inputCategory || 'DAILY');
    setCanDirectSave(false);
    setErrorMessage(null);
  };

  return (
    <BrandDialog label="AI 문장 추천 및 저장" className="vb-suggestion-dialog" onClose={onClose}>
      <div
        className="vb-drawer vb-suggestion-modal"
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: 'var(--color-bg-surface, #ffffff)',
          color: 'var(--color-text, #111111)',
          borderRadius: 'var(--border-radius-lg, 16px)',
          padding: '28px 24px',
          boxSizing: 'border-box',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* 모달 상단 헤더 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            borderBottom: '1px solid var(--color-border, #E5E7EB)',
            paddingBottom: '16px',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: 'var(--text-xs, 12px)',
                letterSpacing: '0.08em',
                fontWeight: 700,
                color: 'var(--color-primary, #2E4F3E)',
                marginBottom: '4px',
              }}
            >
              <Sparkles size={16} />
              <span>AI PHRASE ASSISTANT</span>
            </div>
            <h2
              style={{
                fontSize: 'var(--text-2xl, 24px)',
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              AI 문장 추천
            </h2>
            <p
              style={{
                fontSize: 'var(--text-sm, 14px)',
                color: 'var(--color-text-muted, #6B7280)',
                margin: '4px 0 0',
              }}
            >
              상황이나 짧은 단어를 입력하면, 알맞은 자연스러운 문장을 추천해 드립니다.
            </p>
          </div>
          <button
            type="button"
            className="vb-icon-button"
            aria-label="닫기"
            onClick={onClose}
            disabled={isSaving || isSpeaking}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--color-text-muted, #6B7280)',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 오류 알림 */}
        {errorMessage && (
          <div style={{ marginBottom: '16px' }}>
            <ErrorMessage message={errorMessage} />
          </div>
        )}

        {/* 1단계: 입력 폼 */}
        <form onSubmit={handleRequestSuggestions} style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="ai-suggestion-input"
              style={{
                display: 'block',
                fontSize: 'var(--text-base, 16px)',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              어떤 말을 하고 싶으신가요?
            </label>
            <textarea
              id="ai-suggestion-input"
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="예: 물, 병원 접수, 식사 주문, 감사 인사 등"
              disabled={isLoading || isSaving}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '8px',
                border: '2px solid var(--color-border, #D1D5DB)',
                fontSize: 'var(--text-lg, 18px)',
                lineHeight: 1.5,
                boxSizing: 'border-box',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* 카테고리 힌트 선택 */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: 'var(--text-sm, 14px)', fontWeight: 600 }}>상황 카테고리:</span>
            <select
              value={inputCategory}
              onChange={(e) => setInputCategory(e.target.value)}
              disabled={isLoading || isSaving}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border, #D1D5DB)',
                fontSize: 'var(--text-base, 16px)',
                backgroundColor: 'var(--color-bg-surface, #ffffff)',
                cursor: 'pointer',
              }}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.category} value={opt.category}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 외부 AI 전송 안내 */}
          <div
            style={{
              backgroundColor: '#F3F4F6',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: 'var(--text-xs, 13px)',
              color: '#4B5563',
              lineHeight: 1.5,
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
            }}
          >
            <HelpCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#6B7280' }} />
            <div>
              <strong>개인정보 및 외부 서비스 전송 안내:</strong> 입력한 내용은 문장 추천을 위해
              Anthropic 등 외부 AI 서비스로 전송되며, 서버 로그에 저장되지 않습니다. 이름,
              주민등록번호 등 민감한 정보는 입력하지 마세요.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <SeniorButton
              type="submit"
              variant="primary"
              size="normal"
              disabled={isLoading || !inputText.trim() || isSaving}
              icon={isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              style={{ flex: 1 }}
            >
              {isLoading ? '추천 문장 생성 중...' : 'AI 추천 받기'}
            </SeniorButton>

            {canDirectSave && (
              <SeniorButton
                type="button"
                variant="outline"
                size="normal"
                onClick={handleSwitchToDirectSave}
                icon={<ArrowRight size={18} />}
              >
                직접 문구로 저장
              </SeniorButton>
            )}
          </div>
        </form>

        {/* 2단계: 추천 후보 목록 & 수정 & 저장 */}
        {candidates.length > 0 && (
          <div
            style={{
              borderTop: '2px solid var(--color-border, #E5E7EB)',
              paddingTop: '20px',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--text-lg, 18px)',
                fontWeight: 700,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>추천된 문장 후보</span>
              <span
                style={{
                  fontSize: 'var(--text-xs, 12px)',
                  color: 'var(--color-primary, #2E4F3E)',
                  backgroundColor: 'rgba(46,79,62,0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {candidates.length}개
              </span>
            </h3>

            {/* 후보 리스트 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {candidates.map((cand, idx) => {
                const isSelected = selectedCandidateIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectCandidate(idx)}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '2px solid var(--color-primary, #2E4F3E)'
                        : '1px solid var(--color-border, #D1D5DB)',
                      backgroundColor: isSelected ? 'rgba(46,79,62,0.06)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--text-lg, 18px)',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--color-primary, #2E4F3E)' : 'var(--color-text, #111111)',
                        lineHeight: 1.4,
                      }}
                    >
                      {cand}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          backgroundColor: 'var(--color-primary, #2E4F3E)',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={16} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 선택 문장 수정 및 저장 설정 */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-subtle, #F9FAFB)',
                padding: '18px',
                borderRadius: '12px',
                border: '1px solid var(--color-border, #E5E7EB)',
                marginBottom: '20px',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <label
                  htmlFor="ai-edit-phrase"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: 'var(--text-sm, 14px)',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: 'var(--color-text, #111111)',
                  }}
                >
                  <Edit3 size={16} />
                  <span>선택한 문장 확인 및 수정:</span>
                </label>
                <input
                  id="ai-edit-phrase"
                  type="text"
                  value={editedText}
                  maxLength={100}
                  onChange={(e) => setEditedText(e.target.value)}
                  disabled={isSaving || isSpeaking}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '2px solid var(--color-border, #D1D5DB)',
                    fontSize: 'var(--text-lg, 18px)',
                    fontWeight: 600,
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: 'var(--text-xs, 12px)',
                    color: editedText.length > 90 ? '#DC2626' : '#6B7280',
                    marginTop: '4px',
                  }}
                >
                  {editedText.length} / 100자
                </div>
              </div>

              {/* 저장할 카테고리 지정 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <label
                  htmlFor="ai-target-category"
                  style={{ fontSize: 'var(--text-sm, 14px)', fontWeight: 700 }}
                >
                  저장할 카테고리:
                </label>
                <select
                  id="ai-target-category"
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  disabled={isSaving || isSpeaking}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #D1D5DB)',
                    fontSize: 'var(--text-base, 16px)',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.category} value={opt.category}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 저장 성공 피드백 */}
            {saveSuccess && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Check size={20} />
                <span>문구가 성공적으로 저장되었습니다!</span>
              </div>
            )}

            {/* 저장 및 말하기 액션 버튼 */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <SeniorButton
                type="button"
                variant="primary"
                size="large"
                onClick={handleSaveOnly}
                disabled={isSaving || isSpeaking || !editedText.trim()}
                icon={isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                style={{ flex: 1, minWidth: '160px' }}
              >
                {isSaving ? '저장하는 중...' : '문구함에 저장하기'}
              </SeniorButton>

              <SeniorButton
                type="button"
                variant="outline"
                size="large"
                onClick={handleSaveAndSpeak}
                disabled={isSaving || isSpeaking || !editedText.trim()}
                icon={isSpeaking ? <Loader2 size={20} className="animate-spin" /> : <Volume2 size={20} />}
                style={{ flex: 1, minWidth: '180px' }}
              >
                {isSpeaking ? '음성 재생 중...' : '저장하고 바로 말하기'}
              </SeniorButton>
            </div>
          </div>
        )}
      </div>
    </BrandDialog>
  );
};
