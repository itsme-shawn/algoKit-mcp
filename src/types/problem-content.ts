/**
 * BOJ 문제 본문 콘텐츠 타입 정의
 *
 * Phase 6 - P6-002: 문제 본문 스크래퍼 구현
 */

/**
 * 문제 예제 (입출력)
 */
export interface ProblemExample {
  /** 예제 입력 */
  input: string;
  /** 예제 출력 */
  output: string;
  /** 예제 설명 (선택사항) */
  note?: string;
}

/**
 * 문제 제한사항 (시간/메모리)
 */
export interface ProblemLimits {
  /** 시간 제한 (예: "2초") */
  timeLimit: string;
  /** 메모리 제한 (예: "128MB") */
  memoryLimit: string;
}

/**
 * 문제 본문 전체 콘텐츠
 */
export interface ProblemContent {
  /** BOJ 문제 번호 */
  problemId: number;
  /** 문제 제목 */
  title: string;
  /** 문제 설명 */
  description: string;
  /** 입력 형식 */
  inputFormat: string;
  /** 출력 형식 */
  outputFormat: string;
  /** 예제 입출력 목록 */
  examples: ProblemExample[];
  /** 시간/메모리 제한 */
  limits: ProblemLimits;
  /** 메타데이터 */
  metadata: {
    /** 가져온 시각 (ISO 8601) */
    fetchedAt: string;
    /** 데이터 출처 */
    source: 'cache' | 'web';
    /** 캐시 만료 시각 (ISO 8601) */
    cacheExpiresAt: string;
  };
}

/**
 * 지원되는 프로그래밍 언어
 */
export type SupportedLanguage = 'python' | 'cpp' | 'javascript' | 'java' | 'go';

/**
 * 코드 제출 정보
 */
export interface CodeSubmission {
  /** BOJ 문제 번호 */
  problemId: number;
  /** 사용자 코드 */
  code: string;
  /** 프로그래밍 언어 */
  language: SupportedLanguage;
  /** 제출 시각 (ISO 8601) */
  submittedAt: string;
}

/**
 * 코드 메타데이터
 */
export interface CodeMetadata {
  /** 프로그래밍 언어 */
  language: SupportedLanguage;
  /** 코드 줄 수 */
  lineCount: number;
  /** 함수 개수 (추정) */
  functionCount: number;
  /** 예상 시간복잡도 (선택사항) */
  estimatedComplexity?: string;
}

/**
 * 코드 분석 프롬프트
 */
export interface AnalysisPrompts {
  /** LLM 시스템 프롬프트 */
  systemPrompt: string;
  /** 분석 요청 프롬프트 */
  userPrompt: string;
}

/**
 * 코드 분석 결과
 */
export interface CodeAnalysisResult {
  /** 문제 정보 */
  problemInfo: ProblemContent;
  /** 코드 메타데이터 */
  codeMetadata: CodeMetadata;
  /** 분석 프롬프트 */
  analysisPrompts: AnalysisPrompts;
  /** 추천 질문 목록 */
  suggestedQuestions: string[];
}

/**
 * 분석 타입
 */
export type AnalysisType = 'full' | 'hint' | 'debug' | 'review';
