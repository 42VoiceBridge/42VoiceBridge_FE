import { API_BASE_URL } from './config';
import { authFetch } from './auth';

export interface PhraseItem {
  phraseId: string;
  text: string;
  custom: boolean;
}

export interface PhraseCategoryGroup {
  category: string;
  label: string;
  phrases: PhraseItem[];
}

export interface PhraseListResponse {
  success: boolean;
  data?: {
    categories: PhraseCategoryGroup[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface AddPhrasePayload {
  category: string;
  text: string;
}

export interface AddPhraseResponse {
  success: boolean;
  data?: {
    phraseId: string;
    category: string;
    text: string;
    custom: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface SpeakPhraseResponse {
  success: boolean;
  data?: {
    phraseId: string;
    audioUrl: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export class PhraseApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'PhraseApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * 자주 쓰는 문구 목록 조회 (GET /api/v1/phrases)
 */
export const getPhrasesApi = async (accessToken: string): Promise<PhraseListResponse> => {
  const response = await authFetch(`${API_BASE_URL}/api/v1/phrases`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || '문구 목록을 불러오지 못했습니다.';
    throw new PhraseApiError(message, response.status, errorData?.error?.code);
  }

  return response.json();
};

/**
 * 문구 추가 (POST /api/v1/phrases)
 */
export const addPhraseApi = async (
  accessToken: string,
  payload: AddPhrasePayload
): Promise<AddPhraseResponse> => {
  const response = await authFetch(`${API_BASE_URL}/api/v1/phrases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || '문구 추가 중 오류가 발생했습니다.';
    throw new PhraseApiError(message, response.status, errorData?.error?.code);
  }

  return response.json();
};

/**
 * 문구 삭제 (DELETE /api/v1/phrases/{phraseId})
 * 204 No Content 응답은 JSON 파싱 없이 성공 처리
 */
export const deletePhraseApi = async (
  accessToken: string,
  phraseId: string
): Promise<void> => {
  const response = await authFetch(`${API_BASE_URL}/api/v1/phrases/${phraseId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || '문구를 삭제하지 못했습니다.';
    throw new PhraseApiError(message, response.status, errorData?.error?.code);
  }

  // 204 No Content: do not parse JSON
};

/**
 * 문구 말하기 (POST /api/v1/phrases/{phraseId}/speak)
 * 동기 API - 즉시 audioUrl 반환 (폴링 없음)
 */
export const speakPhraseApi = async (
  accessToken: string,
  phraseId: string
): Promise<SpeakPhraseResponse> => {
  const response = await authFetch(`${API_BASE_URL}/api/v1/phrases/${phraseId}/speak`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let message = errorData?.error?.message;
    if (response.status === 503 || errorData?.error?.code === 'TTS_UNAVAILABLE') {
      message = '잠시 후 다시 눌러 주세요.';
    } else if (!message) {
      message = '음성 생성 요청에 실패했습니다.';
    }
    throw new PhraseApiError(message, response.status, errorData?.error?.code);
  }

  return response.json();
};
