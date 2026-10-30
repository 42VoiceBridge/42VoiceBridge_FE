import { API_BASE_URL } from './config';
import { authFetch } from './auth';

export class AiApiError extends Error {
  status: number;
  code?: string;
  isFeatureDisabled: boolean;

  constructor(message: string, status: number, code?: string, isFeatureDisabled = false) {
    super(message);
    this.name = 'AiApiError';
    this.status = status;
    this.code = code;
    this.isFeatureDisabled = isFeatureDisabled;
  }
}

export interface SuggestPhrasesPayload {
  text: string;
  category?: string;
}

export interface SuggestPhrasesResponse {
  success: boolean;
  data?: {
    candidates?: string[] | Array<{ text: string }>;
    suggestions?: string[] | Array<{ text: string }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 1. AI 문장 추천 (POST /api/v1/phrases/suggestions)
 */
export const getPhraseSuggestionsApi = async (
  accessToken: string,
  payload: SuggestPhrasesPayload
): Promise<string[]> => {
  const response = await authFetch(`${API_BASE_URL}/api/v1/phrases/suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      text: payload.text,
      prompt: payload.text,
      category: payload.category || undefined,
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new AiApiError(
        '서버에서 AI 문장 추천 기능이 비활성화되어 있습니다.',
        404,
        'AI_FEATURE_DISABLED',
        true
      );
    }

    const errorData = await response.json().catch(() => ({}));
    let message = errorData?.error?.message;
    const code = errorData?.error?.code;

    if (!message) {
      if (response.status === 409 || code === 'DUPLICATE_PHRASE' || code === 'PHRASE_DUPLICATED' || code === 'PHRASE_LIMIT_EXCEEDED') {
        if (code === 'DUPLICATE_PHRASE' || code === 'PHRASE_DUPLICATED') {
          message = '이미 등록된 문구입니다.';
        } else if (code === 'PHRASE_LIMIT_EXCEEDED') {
          message = '문구는 최대 100개까지 등록할 수 있습니다.';
        } else {
          message = '이미 등록된 문구이거나 최대 문구 개수(100개)를 초과했습니다.';
        }
      } else if (response.status === 429 || code === 'TOO_MANY_REQUESTS') {
        message = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
      } else if (response.status === 503 || code === 'SUGGESTION_UNAVAILABLE') {
        message = 'AI 문장 추천 서비스를 일시적으로 사용할 수 없습니다.';
      } else {
        message = '문장 추천을 가져오는 중 오류가 발생했습니다.';
      }
    }

    throw new AiApiError(message, response.status, code, false);
  }

  const result: SuggestPhrasesResponse = await response.json();
  const rawList = result.data?.candidates ?? result.data?.suggestions ?? [];

  const candidates: string[] = rawList
    .map((item: string | { text: string }) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item.text === 'string') return item.text.trim();
      return '';
    })
    .filter((s: string) => s.length > 0);

  return candidates;
};

export interface ConversationCandidate {
  candidateId: string;
  text: string;
}

export interface ConversationTurnData {
  turnId: string;
  heardText: string;
  candidates: ConversationCandidate[];
}

export interface ConversationTurnResponse {
  success: boolean;
  data?: {
    turnId: string;
    heardText: string;
    candidates: Array<{
      candidateId?: string;
      id?: string;
      text: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 2. AI 대화 모드 턴 생성 (POST /api/v1/conversation/turns)
 * 상대방 음성을 multipart/form-data로 전송하고 들은 말(heardText)과 답변 후보(candidates)를 수신합니다.
 */
export const createConversationTurnApi = async (
  accessToken: string,
  audioBlob: Blob
): Promise<ConversationTurnData> => {
  const formData = new FormData();
  formData.append('audioFile', audioBlob, 'conversation-counterpart.webm');

  const response = await authFetch(`${API_BASE_URL}/api/v1/conversation/turns`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new AiApiError(
        '서버에서 AI 대화 모드 기능이 비활성화되어 있습니다.',
        404,
        'AI_FEATURE_DISABLED',
        true
      );
    }

    const errorData = await response.json().catch(() => ({}));
    let message = errorData?.error?.message;
    const code = errorData?.error?.code;

    if (!message) {
      if (response.status === 400) {
        message = '녹음 파일 형식이 올바르지 않거나 너무 짧습니다. 다시 말씀해 주세요.';
      } else if (response.status === 429 || code === 'TOO_MANY_REQUESTS') {
        message = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
      } else if (response.status === 503 || code === 'STT_UNAVAILABLE') {
        message = '음성 인식 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.';
      } else {
        message = '대화 분석 중 오류가 발생했습니다.';
      }
    }

    throw new AiApiError(message, response.status, code, false);
  }

  const result: ConversationTurnResponse = await response.json();
  if (!result.data) {
    throw new AiApiError('대화 분석 데이터를 수신하지 못했습니다.', response.status);
  }

  const normalizedCandidates: ConversationCandidate[] = (result.data.candidates || []).map(
    (c, idx) => ({
      candidateId: c.candidateId || c.id || String(idx),
      text: c.text || '',
    })
  );

  return {
    turnId: result.data.turnId,
    heardText: result.data.heardText || '',
    candidates: normalizedCandidates,
  };
};

/**
 * 3. AI 대화 모드 답변 음성 재생 (POST /api/v1/conversation/turns/{turnId}/candidates/{candidateId}/speak)
 * 선택한 후보의 합성 음성을 수신합니다.
 * - 응답은 바이너리 MP3 Blob이거나 audioUrl JSON일 수 있습니다.
 * - 반환된 Blob은 호출 측에서 URL.createObjectURL로 재생 후 즉시 URL.revokeObjectURL로 해제해야 합니다.
 * - 만료된 턴/없는 후보는 404를 반환하며, 이는 '기능 비활성화 404'가 아닌 '만료된 세션'으로 처리합니다.
 */
export const speakCandidateApi = async (
  accessToken: string,
  turnId: string,
  candidateId: string
): Promise<Blob> => {
  const url = `${API_BASE_URL}/api/v1/conversation/turns/${encodeURIComponent(turnId)}/candidates/${encodeURIComponent(candidateId)}/speak`;

  const response = await authFetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new AiApiError(
        '대화 세션이 만료되었거나 존재하지 않는 항목입니다. 다시 녹음해 주세요.',
        404,
        'TURN_EXPIRED_OR_NOT_FOUND',
        false // Not a disabled feature, but session expiration
      );
    }

    const errorData = await response.json().catch(() => ({}));
    let message = errorData?.error?.message;
    const code = errorData?.error?.code;

    if (!message) {
      if (response.status === 429 || code === 'TOO_MANY_REQUESTS') {
        message = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
      } else if (response.status === 503 || code === 'TTS_UNAVAILABLE') {
        message = '음성 합성 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 눌러 주세요.';
      } else {
        message = '음성 생성 요청에 실패했습니다.';
      }
    }

    throw new AiApiError(message, response.status, code, false);
  }

  const contentType = response.headers.get('content-type') || '';

  // JSON 응답인 경우 (예: audioUrl 제공)
  if (contentType.includes('application/json')) {
    const json = await response.json();
    const audioUrl = json.data?.audioUrl;
    if (audioUrl) {
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) {
        throw new AiApiError('오디오 파일을 불러오지 못했습니다.', audioRes.status);
      }
      return audioRes.blob();
    }
  }

  // 바이너리 오디오 스트림 응답
  return response.blob();
};
