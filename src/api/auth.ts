import { API_BASE_URL } from './config';

export interface LoginResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: string;
}

export const loginApi = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
      throw new Error('로그인 처리 중 서버 오류가 발생했습니다.');
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    throw new Error(error.message || '네트워크 오류로 로그인 서버에 연결할 수 없습니다.');
  }
};

export interface SignupResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

export const signupApi = async (email: string, password: string, nickname: string): Promise<SignupResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, nickname }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData?.error?.message) {
        throw new Error(errorData.error.message);
      }
      throw new Error('회원가입 처리 중 서버 오류가 발생했습니다.');
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    throw new Error(error.message || '네트워크 오류로 회원가입 서버에 연결할 수 없습니다.');
  }
};

export const kakaoLoginApi = async (authorizationCode: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/kakao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authorizationCode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData?.error?.message) {
        throw new Error(errorData.error.message);
      }
      throw new Error('카카오 로그인 처리 중 서버 오류가 발생했습니다.');
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    throw new Error(error.message || '네트워크 오류로 서버에 연결할 수 없습니다.');
  }
};

export const refreshApi = async (refreshToken: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData?.error?.message) {
      throw new Error(errorData.error.message);
    }
    throw new Error('토큰 갱신 중 서버 오류가 발생했습니다.');
  }

  return response.json();
};

let isRefreshing = false;
type Subscriber = (token: string | null) => void;
let refreshSubscribers: Subscriber[] = [];

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = localStorage.getItem('accessToken');
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return response;
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshSubscribers.push((newToken: string | null) => {
          if (newToken) {
            headers.set('Authorization', `Bearer ${newToken}`);
            resolve(fetch(url, { ...options, headers }));
          } else {
            resolve(response);
          }
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshRes = await refreshApi(refreshToken);
      if (refreshRes.success && refreshRes.data) {
        token = refreshRes.data.accessToken;
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshRes.data.refreshToken);
        
        onRefreshed(token);
        
        headers.set('Authorization', `Bearer ${token}`);
        response = await fetch(url, { ...options, headers });
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      onRefreshed(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('loginProvider');
      window.dispatchEvent(new Event('auth:logout'));
    } finally {
      isRefreshing = false;
    }
  }

  return response;
};

export class AuthApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.code = code;
  }
}

export interface UserProfile {
  userId: string;
  email: string | null;
  nickname: string;
  provider?: 'LOCAL' | 'KAKAO';
}

export interface GetMeResponse {
  success: boolean;
  data?: UserProfile;
  error?: {
    code: string;
    message: string;
  };
}

export const getMeApi = async (_accessToken: string): Promise<GetMeResponse> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
      const errorData = await response.json().catch(() => ({}));
      if (errorData?.error?.message) {
        throw new Error(errorData.error.message);
      }
      throw new Error('사용자 정보 조회 중 서버 오류가 발생했습니다.');
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    throw new Error(error.message || '네트워크 오류로 서버에 연결할 수 없습니다.');
  }
};

/**
 * 회원 탈퇴 (POST /api/v1/users/me/withdraw)
 * - 이메일 회원(LOCAL): { password: "현재 비밀번호" } 전송
 * - 카카오 회원(KAKAO): 요청 본문 없음
 * - 성공 응답: HTTP 204 No Content (response.json() 호출 금지)
 */
export const withdrawApi = async (
  provider: 'LOCAL' | 'KAKAO',
  password?: string
): Promise<void> => {
  const isLocal = provider === 'LOCAL';
  const headers: Record<string, string> = {};
  let body: string | undefined = undefined;

  if (isLocal) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({ password: password ?? '' });
  }

  let response: Response;
  try {
    response = await authFetch(`${API_BASE_URL}/api/v1/users/me/withdraw`, {
      method: 'POST',
      headers,
      body,
    });
  } catch {
    throw new AuthApiError(
      '네트워크 오류로 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      0,
      'NETWORK_ERROR'
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const code: string | undefined = errorData?.error?.code;
    const serverMessage: string | undefined = errorData?.error?.message;

    if (response.status === 401 || code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN') {
      throw new AuthApiError(
        serverMessage || '인증이 만료되었습니다. 다시 로그인해 주세요.',
        401,
        code || 'UNAUTHORIZED'
      );
    }

    if (code === 'PASSWORD_MISMATCH') {
      throw new AuthApiError(
        serverMessage || '현재 비밀번호가 일치하지 않습니다. 비밀번호를 다시 확인해 주세요.',
        response.status,
        'PASSWORD_MISMATCH'
      );
    }

    if (code === 'VALIDATION_FAILED' || response.status === 400) {
      throw new AuthApiError(
        serverMessage || '입력한 내용을 다시 확인해 주세요.',
        response.status,
        code || 'VALIDATION_FAILED'
      );
    }

    throw new AuthApiError(
      serverMessage || '회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      response.status,
      code
    );
  }

  // 204 No Content: 응답 본문이 없으므로 response.json()을 호출하지 않음
};

/**
 * 음성 데이터 초기화 (DELETE /api/v1/users/me/voice-data)
 * - 요청 본문 없음
 * - 성공 응답: HTTP 204 No Content (response.json() 호출 금지)
 */
export const deleteVoiceDataApi = async (): Promise<void> => {
  let response: Response;
  try {
    response = await authFetch(`${API_BASE_URL}/api/v1/users/me/voice-data`, {
      method: 'DELETE',
    });
  } catch {
    throw new AuthApiError(
      '네트워크 오류로 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      0,
      'NETWORK_ERROR'
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const code: string | undefined = errorData?.error?.code;
    const serverMessage: string | undefined = errorData?.error?.message;

    if (response.status === 401 || code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN') {
      throw new AuthApiError(
        serverMessage || '인증이 만료되었습니다. 다시 로그인해 주세요.',
        401,
        code || 'UNAUTHORIZED'
      );
    }

    throw new AuthApiError(
      serverMessage || '음성 데이터 초기화 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      response.status,
      code
    );
  }

  // 204 No Content: 응답 본문이 없으므로 response.json()을 호출하지 않음
};
