import { API_BASE_URL } from './config';
import { authFetch } from './auth';

export interface RecommendationSentence {
  promptId: string;
  text: string;
}

export interface RecommendationResponse {
  success: boolean;
  data?: {
    sentences: RecommendationSentence[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export const getRecommendationsApi = async (
  accessToken: string,
  count?: number
): Promise<RecommendationResponse> => {
  const payload = count !== undefined ? { count } : {};

  const response = await authFetch(`${API_BASE_URL}/api/v1/users/me/recommendations`, {
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
    throw new Error('추천 문장을 불러오는 중 서버 오류가 발생했습니다.');
  }

  return response.json();
};
