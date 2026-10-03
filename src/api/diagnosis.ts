const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface DiagnosisSentenceDto {
  sentenceId: string;
  text: string;
}

export interface StartDiagnosisSessionResponse {
  success: boolean;
  data?: {
    sessionId: string;
    status: string;
    sentences: DiagnosisSentenceDto[];
    createdAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface UploadRecordingResponse {
  success: boolean;
  data?: {
    recordingId: string;
    sentenceId: string;
    status: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface DiffHighlight {
  position: number;
  expected: string | null;
  recognized: string | null;
}

export interface DiagnosisRecordingResult {
  status: string;
  recognizedText: string | null;
  answerText: string;
  confidence: number | null;
  diffHighlights: DiffHighlight[];
}

export interface DiagnosisSessionDetail {
  sessionId: string;
  status: string;
  sentences: {
    sentenceId: string;
    text: string;
    recordingStatus: string | null;
  }[];
}

export interface GetDiagnosisSessionResponse {
  success: boolean;
  data?: DiagnosisSessionDetail;
  error?: {
    code: string;
    message: string;
  };
}

export interface GetRecordingResultResponse {
  success: boolean;
  data?: DiagnosisRecordingResult;
  error?: {
    code: string;
    message: string;
  };
}

export const createDiagnosisSessionApi = async (accessToken: string): Promise<StartDiagnosisSessionResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/diagnosis-sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData?.error?.message) {
      throw new Error(errorData.error.message);
    }
    throw new Error('진단 세션 생성 중 오류가 발생했습니다.');
  }

  return response.json();
};

export const uploadDiagnosisRecordingApi = async (
  accessToken: string,
  sessionId: string,
  sentenceId: string,
  audioBlob: Blob
): Promise<UploadRecordingResponse> => {
  const formData = new FormData();
  formData.append('sentenceId', sentenceId);
  formData.append('audioFile', audioBlob, 'recording.webm');

  const response = await fetch(`${API_BASE_URL}/api/v1/diagnosis-sessions/${sessionId}/recordings`, {
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
      err.code = errorData.error.code;
      throw err;
    }
    const err: any = new Error('녹음 업로드 중 오류가 발생했습니다.');
    err.code = response.status.toString();
    throw err;
  }

  return response.json();
};

export const getDiagnosisSessionApi = async (
  accessToken: string,
  sessionId: string
): Promise<GetDiagnosisSessionResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/diagnosis-sessions/${sessionId}`, {
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
    throw new Error('세션 상태 조회 중 오류가 발생했습니다.');
  }

  return response.json();
};

export const getRecordingResultApi = async (
  accessToken: string,
  sessionId: string,
  recordingId: string
): Promise<GetRecordingResultResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/diagnosis-sessions/${sessionId}/recordings/${recordingId}/result`, {
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
    throw new Error('녹음 결과 조회 중 오류가 발생했습니다.');
  }

  return response.json();
};

export interface TokenDto {
  token: string;
  position: 'INITIAL' | 'MEDIAL' | 'FINAL';
  errors: number;
  sampleCount: number;
  errorRate: number | null;
  status: 'OK' | 'INSUFFICIENT_DATA';
}

export interface JamoErrorStatsResponse {
  metricVersion: string;
  minSupport: number;
  sessionsUsed: number;
  pairsUsed: number;
  tokens: TokenDto[];
}

export interface GetJamoErrorStatsResponse {
  success: boolean;
  data?: JamoErrorStatsResponse;
  error?: {
    code: string;
    message: string;
  };
}

export const getJamoErrorStatsApi = async (
  accessToken: string
): Promise<GetJamoErrorStatsResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me/jamo-error-stats`, {
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
    throw new Error('자모 오류 통계 조회 중 오류가 발생했습니다.');
  }

  return response.json();
};

