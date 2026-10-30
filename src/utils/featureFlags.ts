/**
 * VoiceBridge AI Feature Flags
 *
 * Rules:
 * - Default: ON (AI entry points and menus are visible by default in production and development)
 * - Can be explicitly turned off via environment variables (e.g. VITE_ENABLE_AI_FEATURES=false)
 * - Dev preview: Can be toggled in DEV settings or via query parameter (?ai=false / ?ai=true)
 */

const STORAGE_KEY_SUGGESTION = 'vb_dev_feature_suggestion';
const STORAGE_KEY_CONVERSATION = 'vb_dev_feature_conversation';

// URL 파라미터 감지 및 세션 동기화 (개발 환경 지원)
if (typeof window !== 'undefined') {
  try {
    const params = new URLSearchParams(window.location.search);
    const aiParam = params.get('ai');
    if (aiParam === 'true' || aiParam === '1') {
      sessionStorage.setItem(STORAGE_KEY_SUGGESTION, 'true');
      sessionStorage.setItem(STORAGE_KEY_CONVERSATION, 'true');
    } else if (aiParam === 'false' || aiParam === '0') {
      sessionStorage.setItem(STORAGE_KEY_SUGGESTION, 'false');
      sessionStorage.setItem(STORAGE_KEY_CONVERSATION, 'false');
    }

    const suggestionParam = params.get('suggestion');
    if (suggestionParam === 'true' || suggestionParam === '1') {
      sessionStorage.setItem(STORAGE_KEY_SUGGESTION, 'true');
    } else if (suggestionParam === 'false' || suggestionParam === '0') {
      sessionStorage.setItem(STORAGE_KEY_SUGGESTION, 'false');
    }

    const conversationParam = params.get('conversation');
    if (conversationParam === 'true' || conversationParam === '1') {
      sessionStorage.setItem(STORAGE_KEY_CONVERSATION, 'true');
    } else if (conversationParam === 'false' || conversationParam === '0') {
      sessionStorage.setItem(STORAGE_KEY_CONVERSATION, 'false');
    }
  } catch {
    // Non-browser environment
  }
}

/**
 * AI 문장 추천 기능 활성화 여부 (기본값: true)
 */
export const isPhraseSuggestionEnabled = (): boolean => {
  if (import.meta.env.VITE_ENABLE_PHRASE_SUGGESTION === 'false') return false;
  if (import.meta.env.VITE_ENABLE_AI_FEATURES === 'false') return false;
  if (import.meta.env.DEV && sessionStorage.getItem(STORAGE_KEY_SUGGESTION) === 'false') {
    return false;
  }
  return true;
};

/**
 * AI 대화 모드 기능 활성화 여부 (기본값: true)
 */
export const isConversationModeEnabled = (): boolean => {
  if (import.meta.env.VITE_ENABLE_CONVERSATION_MODE === 'false') return false;
  if (import.meta.env.VITE_ENABLE_AI_FEATURES === 'false') return false;
  if (import.meta.env.DEV && sessionStorage.getItem(STORAGE_KEY_CONVERSATION) === 'false') {
    return false;
  }
  return true;
};

/**
 * 개발 환경 전용 기능 플래그 변경
 */
export const setDevFeatureFlag = (
  feature: 'suggestion' | 'conversation',
  enabled: boolean
): void => {
  if (!import.meta.env.DEV) return;
  const key =
    feature === 'suggestion' ? STORAGE_KEY_SUGGESTION : STORAGE_KEY_CONVERSATION;
  sessionStorage.setItem(key, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('vb:feature-flags-changed'));
};
