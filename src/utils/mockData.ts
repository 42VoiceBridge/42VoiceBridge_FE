import type {
  User,
  DiagnosisSentence,
  DiagnosisResult,
  PracticeSentence,
  PersonalizationStatus,
  AssistVoiceMessage,
} from '../types';

export const currentUser: User = {
  id: 'user-01',
  name: '김채영',
  email: 'chaeyeong@example.com',
  createdAt: '2026-08-01',
};

// 5 Standard Diagnosis Sentences optimized for dysarthria phoneme testing
export const diagnosisSentences: DiagnosisSentence[] = [
  {
    id: 1,
    text: '오늘 날씨가 참 맑고 화창합니다.',
    targetPhonemes: ['ㄹ', 'ㅎ'],
    difficulty: '쉬움',
    guideTip: '천천히 한 글자씩 또박또박 발음해보세요.',
  },
  {
    id: 2,
    text: '사과와 시원한 수박을 먹어요.',
    targetPhonemes: ['ㅅ', 'ㅂ'],
    difficulty: '쉬움',
    guideTip: '숨을 편안히 쉬며 입술을 가볍게 움직여보세요.',
  },
  {
    id: 3,
    text: '라디오에서 따뜻한 노래가 흘러나와요.',
    targetPhonemes: ['ㄹ', 'ㄷ', 'ㄴ'],
    difficulty: '보통',
    guideTip: '혀끝을 위 잇몸에 부드럽게 대었다 떼어보세요.',
  },
  {
    id: 4,
    text: '조용한 숲속에서 맑은 새소리가 들려요.',
    targetPhonemes: ['ㅈ', 'ㅅ', 'ㄹ'],
    difficulty: '보통',
    guideTip: '입안의 공간을 둥글게 넓히며 소리를 내보세요.',
  },
  {
    id: 5,
    text: '가족과 함께 건강하고 행복한 하루를 보내요.',
    targetPhonemes: ['ㄱ', 'ㅎ', 'ㄹ'],
    difficulty: '도전',
    guideTip: '마지막까지 문장의 끝음을 끝까지 맺어보세요.',
  },
];

export const initialDiagnosisResult: DiagnosisResult = {
  id: 'diag-20260921-1',
  date: '2026.09.21',
  overallScore: 82,
  metrics: {
    accuracy: 82, // 발음 정확도
    fluency: 78,  // 유창도
    clarity: 85,  // 명료도
  },
  weakPhonemes: [
    {
      phoneme: 'ㄹ',
      accuracy: 42,
      errorType: '왜곡',
      description: "혀끝을 잇몸에 부드럽게 튕기는 탄설음 'ㄹ'에서 음절 멈춤이 발생합니다.",
    },
    {
      phoneme: 'ㅅ',
      accuracy: 58,
      errorType: '치환',
      description: "치경마찰음 'ㅅ' 발음 시 공기 흐름이 다소 약해져 'ㄷ' 소리로 변화하는 경향이 있습니다.",
    },
    {
      phoneme: 'ㅈ',
      accuracy: 65,
      errorType: '왜곡',
      description: "파찰음 'ㅈ'의 시작 조음 압력이 다소 낮아 문장 중간에서 흐려집니다.",
    },
  ],
  comment:
    "전체적인 전달력과 음량은 매우 우수합니다! 특히 'ㄹ'과 'ㅅ' 발음 시 혀의 움직임 속도를 약간만 늦추어 맞춤 문장을 연습하시면 90점대 이상으로 향상될 수 있습니다.",
  sentenceCount: 5,
};

export const practiceSentences: PracticeSentence[] = [
  {
    id: 'prac-1',
    text: '라디오를 들어요.',
    targetPhonemes: ['ㄹ', 'ㄷ'],
    category: 'ㄹ 집중 연습',
    difficulty: '쉬움',
    lastScore: 65,
  },
  {
    id: 'prac-2',
    text: '시원한 사이다를 마셔요.',
    targetPhonemes: ['ㅅ', 'ㄷ'],
    category: 'ㅅ 집중 연습',
    difficulty: '쉬움',
    lastScore: 72,
  },
  {
    id: 'prac-3',
    text: '푸른 하늘을 바라보아요.',
    targetPhonemes: ['ㄹ', 'ㅎ'],
    category: 'ㄹ 집중 연습',
    difficulty: '보통',
    lastScore: 68,
  },
  {
    id: 'prac-4',
    text: '새벽 산책을 시작해요.',
    targetPhonemes: ['ㅅ', 'ㅊ'],
    category: 'ㅅ 집중 연습',
    difficulty: '보통',
  },
  {
    id: 'prac-5',
    text: '조용한 찻집에서 친구를 만나요.',
    targetPhonemes: ['ㅈ', 'ㅊ'],
    category: 'ㅈ 집중 연습',
    difficulty: '도전',
  },
  {
    id: 'prac-6',
    text: '달콤한 멜론을 골라요.',
    targetPhonemes: ['ㄹ', 'ㅁ'],
    category: 'ㄹ 집중 연습',
    difficulty: '보통',
  },
];

export const initialPersonalizationStatus: PersonalizationStatus = {
  collectedCount: 35,
  targetCount: 50,
  status: 'training',
  lastTrainedAt: '2026.09.20 14:30',
  standardAccuracy: 48,
  personalizedAccuracy: 92,
};

export const initialHistoryResults: DiagnosisResult[] = [
  initialDiagnosisResult,
  {
    id: 'diag-20260914-1',
    date: '2026.09.14',
    overallScore: 76,
    metrics: { accuracy: 75, fluency: 72, clarity: 80 },
    weakPhonemes: [
      { phoneme: 'ㄹ', accuracy: 38, errorType: '왜곡', description: '탄설음 연결 부자연스러움' },
      { phoneme: 'ㅅ', accuracy: 52, errorType: '치환', description: '치경마찰음 약화' },
    ],
    comment: '문장 속도가 안정화되고 있으며 자신감 있게 발화하고 계십니다.',
    sentenceCount: 5,
  },
  {
    id: 'diag-20260907-1',
    date: '2026.09.07',
    overallScore: 70,
    metrics: { accuracy: 68, fluency: 65, clarity: 76 },
    weakPhonemes: [
      { phoneme: 'ㄹ', accuracy: 32, errorType: '왜곡', description: '음절 탈락' },
      { phoneme: 'ㅅ', accuracy: 48, errorType: '치환', description: '공기 마찰 부족' },
    ],
    comment: '꾸준한 발음 연습을 통해 혀의 긴장도를 풀어주는 단계입니다.',
    sentenceCount: 5,
  },
  {
    id: 'diag-20260830-1',
    date: '2026.08.30',
    overallScore: 63,
    metrics: { accuracy: 61, fluency: 58, clarity: 70 },
    weakPhonemes: [
      { phoneme: 'ㄹ', accuracy: 25, errorType: '왜곡', description: '조음 시작 지연' },
      { phoneme: 'ㅅ', accuracy: 40, errorType: '치환', description: '폐쇄음으로 치환' },
    ],
    comment: '첫 진단 결과입니다. 개인 맞춤 학습을 통해 꾸준한 향상이 기대됩니다.',
    sentenceCount: 5,
  },
];

export const initialVoiceAssistHistory: AssistVoiceMessage[] = [
  {
    id: 'msg-1',
    timestamp: '오후 03:15',
    originalText: '오..느.. 나..씨 조..아..요',
    correctedText: '오늘 날씨가 참 좋습니다.',
    confidence: 94,
  },
  {
    id: 'msg-2',
    timestamp: '오후 03:18',
    originalText: '따..뜻..한 물.. 한.. 잔.. 주..세..요',
    correctedText: '따뜻한 물 한 잔만 부탁드립니다.',
    confidence: 96,
  },
  {
    id: 'msg-3',
    timestamp: '오후 03:22',
    originalText: '벼..ㅇ..원.. 몇..시..에 가..나..요',
    correctedText: '병원에 몇 시에 방문하면 되나요?',
    confidence: 91,
  },
];
