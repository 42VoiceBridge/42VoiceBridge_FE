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

export interface UserProfile {
  userId: string;
  email: string | null;
  nickname: string;
}

export interface GetMeResponse {
  success: boolean;
  data?: UserProfile;
  error?: {
    code: string;
    message: string;
  };
}

export const getMeApi = async (accessToken: string): Promise<GetMeResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
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
