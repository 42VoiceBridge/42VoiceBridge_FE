import { API_BASE_URL } from './config';

export interface PersonalizationModelResponse {
  hasPersonalizedModel: boolean;
  modelVersion: string | null;
  trainedAt: string | null;
  trainingRecordingCount: number;
}

export interface PersonalizationModelApiResponse {
  success: boolean;
  data?: PersonalizationModelResponse;
  error?: {
    code: string;
    message: string;
  };
}

export const getPersonalizationModelApi = async (
  accessToken: string
): Promise<PersonalizationModelApiResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/personalization/model`, {
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
    throw new Error('개인화 모델 정보를 불러오는 중 오류가 발생했습니다.');
  }

  return response.json();
};
