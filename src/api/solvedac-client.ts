/**
 * solved.ac API 클라이언트
 *
 * solved.ac의 공개 API를 사용하여 백준 문제 데이터를 조회합니다.
 * - Base URL: https://solved.ac/api/v3
 * - 인증 불필요
 * - Rate Limiting 적용
 */

import {
  Problem,
  Tag,
  SearchResult,
  SearchParams,
  ProblemNotFoundError,
  SolvedAcAPIError,
  TimeoutError,
  NetworkError,
  RateLimitError,
  InvalidInputError,
} from './types.js';
import { solvedAcLimiter } from '../utils/rate-limiter.js';
import { LRUCache } from '../utils/lru-cache.js';

const API_BASE_URL = 'https://solved.ac/api/v3';
const DEFAULT_TIMEOUT = 10000; // 10초
const MAX_RETRIES = 3;

/**
 * solved.ac API 클라이언트
 */
export class SolvedAcClient {
  private cache = new LRUCache<string, unknown>(100, 3600000); // 용량 100, TTL 1시간

  /**
   * HTTP GET 요청
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string | number> = {},
    retries = 0
  ): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    // 쿼리 파라미터 추가
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });

    const cacheKey = url.toString();

    // 캐시 확인
    const cached = this.getCached<T>(cacheKey);
    if (cached !== null) {
      return cached; // 캐시 히트 시 Rate Limiter 우회
    }

    // Rate Limiting 적용
    await solvedAcLimiter.acquire();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AlgoKit/1.0',
        },
      });

      clearTimeout(timeoutId);

      // 에러 처리
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json() as T;

      // 캐시 저장
      this.setCache(cacheKey, data);

      return data;
    } catch (error: unknown) {
      // Abort 에러 = 타임아웃
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError();
      }

      // 네트워크 에러
      if (error instanceof TypeError) {
        // Fetch API는 네트워크 실패 시 TypeError를 던짐
        if (retries < MAX_RETRIES) {
          await this.delay(1000 * (retries + 1)); // 지수 백오프
          return this.request<T>(endpoint, params, retries + 1);
        }
        throw new NetworkError('Network request failed', error);
      }

      // 이미 커스텀 에러인 경우 재던지기
      if (
        error instanceof SolvedAcAPIError ||
        error instanceof TimeoutError ||
        error instanceof NetworkError
      ) {
        throw error;
      }

      // 알 수 없는 에러
      throw new SolvedAcAPIError(500, 'Unknown error occurred', error);
    }
  }

  /**
   * 에러 응답 처리
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const statusCode = response.status;

    if (statusCode === 404) {
      throw new ProblemNotFoundError(0); // problemId는 호출자에서 설정
    }

    if (statusCode === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(retryAfter ? parseInt(retryAfter, 10) : undefined);
    }

    let message = `API request failed with status ${statusCode}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }

    throw new SolvedAcAPIError(statusCode, message);
  }

  /**
   * 지연 함수 (재시도용)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 캐시에서 데이터 조회
   */
  private getCached<T>(key: string): T | null {
    const data = this.cache.get(key);
    return data !== undefined ? (data as T) : null;
  }

  /**
   * 캐시에 데이터 저장
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, data);
  }

  /**
   * 캐시 초기화
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 캐시 통계 조회
   */
  public getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * 문제 검색
   *
   * @param params - 검색 파라미터
   * @returns 검색 결과 (문제 배열 및 메타데이터)
   */
  public async searchProblems(params: SearchParams = {}): Promise<SearchResult> {
    // 입력 검증
    if (params.level_min !== undefined && (params.level_min < 1 || params.level_min > 30)) {
      throw new InvalidInputError('level_min must be between 1 and 30');
    }
    if (params.level_max !== undefined && (params.level_max < 1 || params.level_max > 30)) {
      throw new InvalidInputError('level_max must be between 1 and 30');
    }
    if (params.page !== undefined && params.page < 1) {
      throw new InvalidInputError('page must be positive');
    }

    const queryParams: Record<string, string | number> = {};

    // query 문자열 구성 (level, tag 포함)
    const queryParts: string[] = [];

    if (params.query) {
      queryParts.push(params.query);
    }

    // level 필터 (solved.ac는 "tier:g3..g1" 같은 형식 사용)
    if (params.level_min !== undefined || params.level_max !== undefined) {
      const min = params.level_min || 1;
      const max = params.level_max || 30;
      queryParts.push(`*${min}..${max}`);
    }

    // tags 필터 (단일 문자열 또는 배열 지원)
    if (params.tags) {
      const tagsArray = Array.isArray(params.tags) ? params.tags : [params.tags];
      tagsArray.forEach(tag => queryParts.push(`#${tag}`));
    }

    if (queryParts.length > 0) {
      queryParams.query = queryParts.join(' ');
    }

    if (params.sort) queryParams.sort = params.sort;
    if (params.direction) queryParams.direction = params.direction;
    if (params.page) queryParams.page = params.page;

    return this.request<SearchResult>('/search/problem', queryParams);
  }

  /**
   * 문제 상세 정보 조회
   *
   * @param problemId - 문제 ID
   * @returns 문제 정보
   * @throws {ProblemNotFoundError} 문제를 찾을 수 없는 경우
   * @throws {InvalidInputError} 유효하지 않은 문제 ID
   */
  public async getProblem(problemId: number): Promise<Problem> {
    if (!Number.isInteger(problemId) || problemId <= 0) {
      throw new InvalidInputError('problemId must be a positive integer');
    }

    try {
      return await this.request<Problem>(`/problem/show`, { problemId });
    } catch (error) {
      if (error instanceof ProblemNotFoundError) {
        // problemId를 정확하게 설정
        throw new ProblemNotFoundError(problemId);
      }
      throw error;
    }
  }

  /**
   * 태그 검색
   *
   * @param query - 검색 키워드
   * @returns 태그 배열
   */
  public async searchTags(query: string): Promise<Tag[]> {
    if (typeof query !== 'string' || query.trim() === '') {
      throw new InvalidInputError('query must be a non-empty string');
    }

    const result = await this.request<{ items: Tag[] }>('/search/tag', { query });
    return result.items || [];
  }
}
