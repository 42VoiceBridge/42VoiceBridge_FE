/**
 * VoiceBridge AI Feature Flags
 *
 * Rules:
 * - Default: OFF (all AI entry points and menus are hidden)
 * - Production: Controlled strictly by environment variables (VITE_ENABLE_AI_FEATURES, etc.)
 * - Dev preview: In development mode, query parameters (?ai=true, ?suggestion=true, ?conversation=true)
 *   or developer settings toggles can enable features without modifying production builds.
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
      sessionStorage.removeItem(STORAGE_KEY_SUGGESTION);
      sessionStorage.removeItem(STORAGE_KEY_CONVERSATION);
    }

    const suggestionParam = params.get('suggestion');
    if (suggestionParam === 'true' || suggestionParam === '1') {
      sessionStorage.setItem(STORAGE_KEY_SUGGESTION, 'true');
    } else if (suggestionParam === 'false' || suggestionParam === '0') {
      sessionStorage.removeItem(STORAGE_KEY_SUGGESTION);
    }

    const conversationParam = params.get('conversation');
    if (conversationParam === 'true' || conversationParam === '1') {
      sessionStorage.setItem(STORAGE_KEY_CONVERSATION, 'true');
    } else if (conversationParam === 'false' || conversationParam === '0') {
      sessionStorage.removeItem(STORAGE_KEY_CONVERSATION);
    }
  } catch {
    // Non-browser environment
  }
}

/**
 * AI 문장 추천 기능 활성화 여부
 */
export const isPhraseSuggestionEnabled = (): boolean => {
  if (import.meta.env.VITE_ENABLE_PHRASE_SUGGESTION === 'true') return true;
  if (import.meta.env.VITE_ENABLE_AI_FEATURES === 'true') return true;
  if (import.meta.env.DEV) {
    return sessionStorage.getItem(STORAGE_KEY_SUGGESTION) === 'true';
  }
  return false;
};

/**
 * AI 대화 모드 기능 활성화 여부
 */
export const isConversationModeEnabled = (): boolean => {
  if (import.meta.env.VITE_ENABLE_CONVERSATION_MODE === 'true') return true;
  if (import.meta.env.VITE_ENABLE_AI_FEATURES === 'true') return true;
  if (import.meta.env.DEV) {
    return sessionStorage.getItem(STORAGE_KEY_CONVERSATION) === 'true';
  }
  return false;
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
  if (enabled) {
    sessionStorage.setItem(key, 'true');
  } else {
    sessionStorage.removeItem(key);
  }
  window.dispatchEvent(new CustomEvent('vb:feature-flags-changed'));
};
