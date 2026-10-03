import { API_BASE_URL } from './config';
import { authFetch } from './auth';

export interface RecognitionResponse {
  recognitionId: string;
  recognizedText: string;
  modelUsed: string;
  confidence: number | null;
}

export interface RecognitionHistoryResponse {
  success: boolean;
  data?: {
    content: RecognitionResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface RecognitionDetailResponse {
  success: boolean;
  data?: RecognitionResponse;
  error?: {
    code: string;
    message: string;
  };
}

export const getRecognitionsApi = async (
  accessToken: string,
  page: number = 0,
  size: number = 20
): Promise<RecognitionHistoryResponse> => {
  const response = await authFetch(
    `${API_BASE_URL}/api/v1/recognitions?page=${page}&size=${size}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData?.error?.message) {
      throw new Error(errorData.error.message);
    }
    throw new Error('인식 기록 목록을 불러오는 중 오류가 발생했습니다.');
  }

  return response.json();
};

export const getRecognitionApi = async (
  accessToken: string,
  recognitionId: string
): Promise<RecognitionDetailResponse> => {
  const response = await authFetch(`${API_BASE_URL}/api/v1/recognitions/${recognitionId}`, {
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
    throw new Error('인식 상세 기록을 불러오는 중 오류가 발생했습니다.');
  }

  return response.json();
};

export const createRecognitionApi = async (
  accessToken: string,
  audioBlob: Blob
): Promise<RecognitionDetailResponse> => {
  const formData = new FormData();
  formData.append('audioFile', audioBlob, 'voice-assist.webm');

  const response = await authFetch(`${API_BASE_URL}/api/v1/recognitions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData?.error?.message) {
      const err: any = new Error(errorData.error.message);
      err.code = errorData.error.code || response.status.toString();
      throw err;
    }
    const err: any = new Error('음성 인식 처리 중 오류가 발생했습니다.');
    err.code = response.status.toString();
    throw err;
  }

  return response.json();
};

export interface ConfirmationResponse {
  confirmationId: string;
  confirmedText: string;
  confirmedAt: string;
}

export interface ConfirmationDetailResponse {
  success: boolean;
  data?: ConfirmationResponse;
  error?: {
    code: string;
    message: string;
  };
}

export const confirmRecognitionApi = async (
  accessToken: string,
  recognitionId: string,
  confirmedText: string
): Promise<ConfirmationDetailResponse> => {
  const response = await authFetch(`${API_BASE_URL}/api/v1/recognitions/${recognitionId}/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmedText }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData?.error?.message) {
      throw new Error(errorData.error.message);
    }
    if (response.status === 400) throw new Error('잘못된 요청입니다. 빈 텍스트는 확정할 수 없습니다.');
    if (response.status === 401 || response.status === 403) throw new Error('인증이 만료되었습니다.');
    if (response.status === 404) throw new Error('해당 인식 기록을 찾을 수 없거나 접근 권한이 없습니다.');
    throw new Error('텍스트 확정 중 오류가 발생했습니다.');
  }

  return response.json();
};
