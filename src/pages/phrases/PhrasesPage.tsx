import React, { useState, useEffect, useCallback } from 'react';
import {

  Volume2,
  Plus,
  Trash2,
  AlertCircle,
  Info,
  Loader2,
  X,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FeaturePageHeader } from '../../components/layout/FeaturePageHeader';
import { BrandDialog } from '../../components/common/BrandDialog';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { SeniorButton } from '../../components/common/SeniorButton';
import {
  getPhrasesApi,
  addPhraseApi,
  deletePhraseApi,
  speakPhraseApi,
  PhraseApiError,
  type PhraseCategoryGroup,
  type PhraseItem
} from '../../api/phrases';
import { playAudioFromUrl, stopAudioPlayback } from '../../utils/audioUtils';

export const PhrasesPage: React.FC = () => {
  const { user, requireAuth } = useApp();

  const [categories, setCategories] = useState<PhraseCategoryGroup[]>([]);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // 말하기 상태
  const [speakingPhraseId, setSpeakingPhraseId] = useState<string | null>(null);
  const [speakError, setSpeakError] = useState<string | null>(null);

  // 문구 추가 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategoryCode, setNewCategoryCode] = useState<string>('');
  const [newText, setNewText] = useState<string>('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 문구 삭제 상태
  const [deletingPhraseId, setDeletingPhraseId] = useState<string | null>(null);

  // 목록 불러오기
  const loadPhrases = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setPageError(null);
      const res = await getPhrasesApi(token);
      if (res.success && res.data?.categories) {
        setCategories(res.data.categories);
        // 기본 선택 카테고리가 없거나 목록에 없으면 첫 번째 카테고리로 설정
        setSelectedCategoryCode((prev) => {
          if (prev && res.data!.categories.some((c) => c.category === prev)) {
            return prev;
          }
          return res.data!.categories[0]?.category || '';
        });
      }
    } catch (err: unknown) {
      console.error('Failed to load phrases:', err);
      if (err instanceof PhraseApiError && err.status === 401) {
        setPageError('인증이 만료되었습니다. 다시 로그인해주세요.');
      } else {
        setPageError('문구 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhrases();
    return () => {
      stopAudioPlayback();
    };
  }, [loadPhrases, user]);

  // 현재 활성화된 카테고리 데이터
  const currentCategory = categories.find((c) => c.category === selectedCategoryCode);

  // 문구 말하기 핸들러
  const handleSpeak = async (phrase: PhraseItem) => {
    if (speakingPhraseId) return;

    if (!requireAuth('phrases')) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setSpeakError('로그인이 필요합니다.');
      return;
    }

    setSpeakError(null);
    setSpeakingPhraseId(phrase.phraseId);

    try {
      // 10. 말하기 버튼 클릭마다 speak API를 새로 호출 (폴링 없음)
      const res = await speakPhraseApi(token, phrase.phraseId);
      if (!res.success || !res.data?.audioUrl) {
        throw new Error('음성 URL을 수신하지 못했습니다.');
      }

      // 15, 16. local 환경 Bearer 인증 및 fetch -> Blob URL 재생, 종료/정리 시 revoke
      await playAudioFromUrl(res.data.audioUrl, token);
    } catch (err: unknown) {
      console.error('Speak error:', err);
      if (err instanceof PhraseApiError) {
        if (err.status === 503 || err.code === 'TTS_UNAVAILABLE') {
          setSpeakError('잠시 후 다시 눌러 주세요.');
        } else {
          setSpeakError(err.message || '음성을 재생하지 못했습니다. 다시 시도해주세요.');
        }
      } else if (err instanceof Error) {
        setSpeakError(err.message || '음성을 재생하지 못했습니다. 다시 시도해주세요.');
      } else {
        setSpeakError('음성을 재생하지 못했습니다. 다시 시도해주세요.');
      }
    } finally {
      setSpeakingPhraseId(null);
    }
  };

  // 문구 삭제 핸들러
  const handleDelete = async (phrase: PhraseItem) => {
    if (deletingPhraseId) return;

    if (!window.confirm(`"${phrase.text}" 문구를 삭제하시겠습니까?`)) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setPageError('로그인이 필요합니다.');
      return;
    }

    setDeletingPhraseId(phrase.phraseId);
    setPageError(null);

    try {
      // 7. 204 No Content는 JSON 파싱 없이 성공 처리
      await deletePhraseApi(token, phrase.phraseId);
      // 로컬 상태 즉시 갱신
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          phrases: cat.phrases.filter((p) => p.phraseId !== phrase.phraseId),
        }))
      );
    } catch (err: unknown) {
      console.error('Delete phrase error:', err);
      if (err instanceof PhraseApiError) {
        setPageError(err.message);
      } else {
        setPageError('문구 삭제 중 오류가 발생했습니다.');
      }
    } finally {
      setDeletingPhraseId(null);
    }
  };

  // 문구 추가 모달 열기
  const openAddModal = () => {
    if (!requireAuth('phrases')) {
      return;
    }
    setNewCategoryCode(selectedCategoryCode || categories[0]?.category || 'GREETING');
    setNewText('');
    setAddError(null);
    setIsAddModalOpen(true);
  };

  // 문구 추가 제출 핸들러
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const trimmed = newText.trim();
    if (!trimmed) {
      setAddError('문구를 입력해 주세요.');
      return;
    }
    if (trimmed.length > 100) {
      setAddError('문구는 100자 이하로 입력해 주세요.');
      return;
    }
    if (/[\r\n\t]/.test(newText)) {
      setAddError('줄바꿈이나 탭 문자는 입력할 수 없습니다.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setAddError('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addPhraseApi(token, {
        category: newCategoryCode,
        text: trimmed,
      });

      if (res.success && res.data) {
        setIsAddModalOpen(false);
        setNewText('');
        // 성공 시 목록 재조회 및 추가된 카테고리로 탭 이동
        await loadPhrases();
        setSelectedCategoryCode(newCategoryCode);
      }
    } catch (err: unknown) {
      console.error('Add phrase error:', err);
      // 9. 문구 추가 실패 시 서버의 error.message 표시
      if (err instanceof PhraseApiError) {
        setAddError(err.message);
      } else if (err instanceof Error) {
        setAddError(err.message);
      } else {
        setAddError('문구 추가 중 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDownText = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubmit(e);
    }
  };

  return (
    <div
      className="vb-theme vb-page vb-page--phrases responsive-page"
      style={{ maxWidth: '1040px', margin: '30px auto', padding: '0 16px 60px' }}
    >
      <FeaturePageHeader
        eyebrow="QUICK PHRASES / VOICE OUTPUT"
        title={
          <>
            자주 쓰는 말을,<br />
            <span>버튼 하나로 또렷하게.</span>
          </>
        }
        description="일상에서 자주 사용하는 문구를 카테고리별로 선택해 즉시 또렷한 음성으로 전달합니다."
      />

      {/* 14. 개인정보 및 외부 전송 안내 배너 */}
      <section
        aria-label="안내 및 개인정보 알림"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px 20px',
          backgroundColor: 'var(--color-bg-subtle)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: '24px',
        }}
      >
        <Info size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: 'var(--text-sm)', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
          <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: '2px' }}>
            말하기 기능 이용 안내
          </strong>
          말하기 버튼을 누르면 문구 텍스트가 음성 합성을 위해 <strong>네이버 클라우드 CLOVA Voice로 전송</strong>됩니다.
          안전을 위해 직접 추가하는 문구에는 이름, 연락처, 주소와 같은 민감한 개인정보를 넣지 마세요.
        </div>
      </section>

      {/* 오류 메시지 영역 */}
      {(pageError || speakError) && (
        <div style={{ marginBottom: '20px' }}>
          <ErrorMessage message={speakError || pageError!} />
        </div>
      )}

      {/* 상단 컨트롤: 카테고리 탭 (순서 그대로 유지) & 문구 추가 버튼 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        {/* 4. categories 배열 순서 그대로 표시, 이름은 label로 표시 */}
        <nav
          aria-label="문구 카테고리"
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {categories.map((cat) => {
            const isSelected = cat.category === selectedCategoryCode;
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => {
                  setSelectedCategoryCode(cat.category);
                  setSpeakError(null);
                }}
                className={`vb-button ${isSelected ? '' : 'vb-button--ghost'}`}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: 'var(--text-base)',
                  fontWeight: isSelected ? 700 : 500,
                  border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                  color: isSelected ? '#ffffff' : 'var(--color-text)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{cat.label}</span>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--color-bg-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--color-text-muted)',
                    marginLeft: '4px',
                  }}
                >
                  {cat.phrases.length}
                </span>
              </button>
            );
          })}
        </nav>

        <SeniorButton
          variant="primary"
          size="normal"
          icon={<Plus size={20} />}
          onClick={openAddModal}
        >
          새 문구 추가
        </SeniorButton>
      </div>

      {/* 로딩 상태 */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: 'var(--color-bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--color-border)',
          }}
        >
          <Loader2
            size={36}
            color="var(--color-primary)"
            className="animate-spin"
            style={{ margin: '0 auto 16px' }}
          />
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)' }}>
            문구 목록을 불러오는 중입니다...
          </p>
        </div>
      ) : !user && !localStorage.getItem('accessToken') ? (
        <div
          className="vb-empty-state"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'var(--color-bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--color-border)',
          }}
        >
          <MessageSquare size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '8px' }}>
            로그인 후 나만의 문구를 관리해 보세요
          </h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            기본 문구와 함께 자주 사용하는 문구를 직접 등록해 편리하게 소통할 수 있습니다.
          </p>
          <SeniorButton variant="secondary" onClick={() => requireAuth('phrases')}>
            로그인하러 가기
          </SeniorButton>
        </div>
      ) : !currentCategory || currentCategory.phrases.length === 0 ? (
        /* 5. 문구가 없는 카테고리도 빈 배열로 오므로 빈 상태 UI 표시 */
        <div
          className="vb-empty-state"
          style={{
            textAlign: 'center',
            padding: '70px 20px',
            backgroundColor: 'var(--color-bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px dashed var(--color-border)',
          }}
        >
          <MessageSquare size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '8px' }}>
            '{currentCategory?.label || '선택한 카테고리'}'에 등록된 문구가 없습니다.
          </h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            자주 쓰는 말을 추가해 두면 버튼 하나로 편리하게 전달할 수 있습니다.
          </p>
          <SeniorButton variant="primary" icon={<Plus size={20} />} onClick={openAddModal}>
            이 카테고리에 문구 추가하기
          </SeniorButton>
        </div>
      ) : (
        /* 문구 카드 그리드 목록 */
        <section aria-label={`${currentCategory.label} 문구 목록`}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: '16px',
            }}
          >
            {currentCategory.phrases.map((phrase) => {
              const isSpeakingThis = speakingPhraseId === phrase.phraseId;
              const isDeletingThis = deletingPhraseId === phrase.phraseId;
              const isAnySpeaking = speakingPhraseId !== null;

              return (
                <article
                  key={phrase.phraseId}
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '2px solid var(--color-border)',
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '150px',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative',
                  }}
                >
                  {/* 상단 태그 및 삭제 버튼 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: phrase.custom ? '#EBF5FF' : 'var(--color-bg-subtle)',
                        color: phrase.custom ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        border: phrase.custom ? '1px solid #C3D9FF' : '1px solid var(--color-border)',
                      }}
                    >
                      {phrase.custom ? '내가 추가한 문구' : '기본 문구'}
                    </span>

                    {/* 6. 삭제 버튼은 custom: true인 문구에만 표시 */}
                    {phrase.custom && (
                      <button
                        type="button"
                        aria-label={`문구 "${phrase.text}" 삭제`}
                        disabled={isDeletingThis || isSpeakingThis}
                        onClick={() => handleDelete(phrase)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: isDeletingThis ? 'not-allowed' : 'pointer',
                          color: 'var(--color-text-muted)',
                          padding: '6px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: isDeletingThis ? 0.4 : 1,
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-danger, #d32f2f)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* 문구 본문 */}
                  <p
                    style={{
                      fontSize: 'var(--text-xl)',
                      fontWeight: 600,
                      lineHeight: '1.5',
                      color: 'var(--color-text)',
                      marginBottom: '20px',
                      wordBreak: 'keep-all',
                    }}
                  >
                    “{phrase.text}”
                  </p>

                  {/* 10, 11. 말하기 버튼 (클릭마다 speak 호출, 로딩 표시, 중복 클릭 방지) */}
                  <SeniorButton
                    variant={isSpeakingThis ? 'primary' : 'secondary'}
                    size="large"
                    disabled={isAnySpeaking || isDeletingThis}
                    icon={
                      isSpeakingThis ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <Volume2 size={24} />
                      )
                    }
                    onClick={() => handleSpeak(phrase)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {isSpeakingThis ? '음성 출력 중...' : '말하기'}
                  </SeniorButton>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 8. 문구 추가 다이얼로그 및 입력 안내 */}
      {isAddModalOpen && (
        <BrandDialog
          label="새 문구 추가하기"
          className="vb-dialog-add-phrase"
          onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        >
          <div
            style={{
              padding: '28px',
              backgroundColor: 'var(--color-bg-surface)',
              borderRadius: 'var(--border-radius-lg)',
              maxWidth: '520px',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <div>
                <span className="vb-eyebrow">NEW PHRASE</span>
                <h2 style={{ fontSize: 'var(--text-2xl)', marginTop: '4px' }}>새 문구 추가하기</h2>
              </div>
              <button
                type="button"
                className="vb-icon-button"
                aria-label="닫기"
                disabled={isSubmitting}
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            {/* 8. 문구 추가 화면 필수 안내 사항 */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                padding: '14px 16px',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--color-border)',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: 'var(--text-sm)',
                  marginBottom: '8px',
                  color: 'var(--color-text)',
                }}
              >
                <AlertCircle size={18} color="var(--color-primary)" />
                <span>문구 등록 주의사항</span>
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.7',
                }}
              >
                <li><strong>100자 이하</strong>로 입력해 주세요.</li>
                <li><strong>줄바꿈(Enter) 불가</strong> (한 줄로 작성).</li>
                <li>직접 추가한 문구는 사용자당 <strong>최대 50개</strong>까지 저장 가능합니다.</li>
                <li><strong style={{ color: 'var(--color-danger, #d32f2f)' }}>이름·연락처·주소 등 개인정보는 넣지 마세요.</strong></li>
              </ul>
            </div>

            {/* 9. 문구 추가 실패 시 서버 error.message 표시 */}
            {addError && (
              <div style={{ marginBottom: '18px' }}>
                <ErrorMessage message={addError} />
              </div>
            )}

            <form onSubmit={handleAddSubmit}>
              {/* 카테고리 선택 */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="phrase-category-select"
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  카테고리 선택
                </label>
                <select
                  id="phrase-category-select"
                  value={newCategoryCode}
                  onChange={(e) => setNewCategoryCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 'var(--text-base)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '2px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-surface)',
                    color: 'var(--color-text)',
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.category} value={c.category}>
                      {c.label} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* 문구 텍스트 입력창 */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <label
                    htmlFor="phrase-text-input"
                    style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}
                  >
                    문구 내용
                  </label>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: newText.length > 100 ? 'var(--color-danger, #d32f2f)' : 'var(--color-text-muted)',
                      fontWeight: newText.length > 100 ? 700 : 400,
                    }}
                  >
                    {newText.length} / 100자
                  </span>
                </div>
                <input
                  id="phrase-text-input"
                  type="text"
                  maxLength={100}
                  placeholder="예: 물 좀 가져다주세요."
                  value={newText}
                  onChange={(e) => {
                    // 줄바꿈 필터링
                    const sanitized = e.target.value.replace(/[\r\n\t]/g, '');
                    setNewText(sanitized);
                    setAddError(null);
                  }}
                  onKeyDown={handleKeyDownText}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 'var(--text-lg)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '2px solid var(--color-border)',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--color-bg-surface)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              {/* 버튼 그룹 */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="vb-button vb-button--ghost"
                  disabled={isSubmitting}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  취소
                </button>
                <SeniorButton
                  variant="primary"
                  size="normal"
                  disabled={isSubmitting || !newText.trim()}
                  icon={isSubmitting ? <Loader2 size={20} className="animate-spin" /> : undefined}
                >
                  {isSubmitting ? '추가하는 중...' : '문구 추가하기'}
                </SeniorButton>
              </div>
            </form>
          </div>
        </BrandDialog>
      )}
    </div>
  );
};
