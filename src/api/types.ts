/**
 * solved.ac API 응답 타입 정의
 */

/**
 * 문제 태그의 표시명
 */
export interface TagDisplayName {
  language: string;
  name: string;
  short?: string;
}

/**
 * 문제 태그
 */
export interface Tag {
  key: string;
  displayNames: TagDisplayName[];
  problemCount?: number;
}

/**
 * 백준 문제 정보
 */
export interface Problem {
  problemId: number;
  titleKo: string;
  titles?: Array<{ language: string; title: string }>;
  level: number;
  tags: Tag[];
  acceptedUserCount: number;
  averageTries: number;
  isSolvable?: boolean;
  isPartial?: boolean;
}

/**
 * 문제 검색 결과
 */
export interface SearchResult {
  count: number;
  items: Problem[];
  page?: number;
}

/**
 * 문제 검색 파라미터
 */
export interface SearchParams {
  query?: string;
  level_min?: number;
  level_max?: number;
  tag?: string;
  sort?: 'level' | 'id' | 'average_try';
  direction?: 'asc' | 'desc';
  page?: number;
}

/**
 * API 에러 응답
 */
export interface APIError {
  statusCode: number;
  message: string;
  error?: string;
}

/**
 * Problem 타입 가드
 */
export function isProblem(obj: unknown): obj is Problem {
  if (typeof obj !== 'object' || obj === null) return false;

  const p = obj as Partial<Problem>;

  return (
    typeof p.problemId === 'number' &&
    typeof p.titleKo === 'string' &&
    typeof p.level === 'number' &&
    Array.isArray(p.tags) &&
    typeof p.acceptedUserCount === 'number' &&
    typeof p.averageTries === 'number'
  );
}

/**
 * Tag 타입 가드
 */
export function isTag(obj: unknown): obj is Tag {
  if (typeof obj !== 'object' || obj === null) return false;

  const t = obj as Partial<Tag>;

  return (
    typeof t.key === 'string' &&
    Array.isArray(t.displayNames) &&
    t.displayNames.every(
      (dn: unknown) =>
        typeof dn === 'object' &&
        dn !== null &&
        'language' in dn &&
        'name' in dn
    )
  );
}

/**
 * API 에러 클래스
 */
export class SolvedAcAPIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'SolvedAcAPIError';
  }
}

/**
 * 문제를 찾을 수 없음
 */
export class ProblemNotFoundError extends SolvedAcAPIError {
  constructor(problemId: number) {
    super(404, `Problem ${problemId} not found`);
    this.name = 'ProblemNotFoundError';
  }
}

/**
 * 타임아웃 에러
 */
export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * 네트워크 에러
 */
export class NetworkError extends Error {
  constructor(message = 'Network error occurred', public originalError?: unknown) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * 레이트 리밋 에러
 */
export class RateLimitError extends SolvedAcAPIError {
  constructor(public retryAfter?: number) {
    super(429, 'Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

/**
 * 입력 검증 에러
 */
export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}
