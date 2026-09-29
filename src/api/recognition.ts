const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface RecognitionResponse {
  recognitionId: string;
  recognizedText: string;
  modelUsed: string;
  confidence: number;
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
  const response = await fetch(
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
  const response = await fetch(`${API_BASE_URL}/api/v1/recognitions/${recognitionId}`, {
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
