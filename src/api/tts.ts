import { API_BASE_URL } from './config';
import { authFetch } from './auth';

export interface RequestTtsPayload {
  confirmationId: string;
  idempotencyKey: string;
}

export interface TtsRequestResponse {
  success: boolean;
  data?: {
    ttsId: string;
    status: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface TtsStatusResponse {
  success: boolean;
  data?: {
    ttsId: string;
    status: string;
    audioUrl: string | null;
  };
  error?: {
    code: string;
    message: string;
  };
}

export const requestTtsApi = async (
  accessToken: string,
  payload: RequestTtsPayload
): Promise<TtsRequestResponse> => {
  const response = await authFetch(`${API_BASE_URL}/api/v1/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errMsg = errorData?.error?.message;
    if (!errMsg) {
      if (response.status === 503 || errorData?.error?.code === 'TTS_UNAVAILABLE') {
        errMsg = '잠시 후 다시 눌러 주세요.';
      } else if (response.status === 429 || errorData?.error?.code === 'TOO_MANY_REQUESTS') {
        errMsg = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      } else {
        errMsg = 'TTS 요청 중 서버 오류가 발생했습니다.';
      }
    }
    const err: any = new Error(errMsg);
    err.code = errorData?.error?.code || response.status.toString();
    err.status = response.status;
    throw err;
  }

  return response.json();
};

export const getTtsStatusApi = async (
  accessToken: string,
  ttsId: string
): Promise<TtsStatusResponse> => {
  const response = await authFetch(`${API_BASE_URL}/api/v1/tts/${ttsId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errMsg = errorData?.error?.message;
    if (!errMsg) {
      if (response.status === 503 || errorData?.error?.code === 'TTS_UNAVAILABLE') {
        errMsg = '잠시 후 다시 눌러 주세요.';
      } else if (response.status === 429 || errorData?.error?.code === 'TOO_MANY_REQUESTS') {
        errMsg = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      } else {
        errMsg = 'TTS 상태 조회 중 서버 오류가 발생했습니다.';
      }
    }
    const err: any = new Error(errMsg);
    err.code = errorData?.error?.code || response.status.toString();
    err.status = response.status;
    throw err;
  }

  return response.json();
};
