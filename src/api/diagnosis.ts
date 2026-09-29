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
    status: string;
  };
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
  // Ensure the file has an extension/name so backend doesn't complain
  formData.append('file', audioBlob, 'recording.webm');

  const response = await fetch(`${API_BASE_URL}/api/v1/diagnosis-sessions/${sessionId}/recordings?sentenceId=${sentenceId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Note: Do NOT set Content-Type to multipart/form-data manually. 
      // The browser will automatically set it with the correct boundary.
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData?.error?.message) {
      throw new Error(errorData.error.message);
    }
    throw new Error('녹음 업로드 중 오류가 발생했습니다.');
  }

  return response.json();
};
