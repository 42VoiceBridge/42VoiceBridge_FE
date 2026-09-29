const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
  const response = await fetch(`${API_BASE_URL}/api/v1/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData?.error?.message) {
      throw new Error(errorData.error.message);
    }
    throw new Error('TTS 요청 중 서버 오류가 발생했습니다.');
  }

  return response.json();
};

export const getTtsStatusApi = async (
  accessToken: string,
  ttsId: string
): Promise<TtsStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/tts/${ttsId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData?.error?.message) {
      throw new Error(errorData.error.message);
    }
    throw new Error('TTS 상태 조회 중 서버 오류가 발생했습니다.');
  }

  return response.json();
};
