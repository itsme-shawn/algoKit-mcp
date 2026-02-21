/**
 * 프로그래머스 웹 스크래핑 클라이언트
 *
 * 검색: 프로그래머스 내부 JSON API (fetch 기반)
 * 상세 페이지: cheerio (fetch 기반)
 */
import { RateLimiter } from '../utils/rate-limiter.js';
import { LRUCache } from '../utils/lru-cache.js';
import {
  ProgrammersSearchOptions,
  ProgrammersProblemSummary,
  ProgrammersProblemDetail,
} from '../types/programmers.js';
import { parseProgrammersProblemContent } from '../utils/html-parser.js';

/**
 * 프로그래머스 스크래핑 에러
 */
export class ProgrammersScrapeError extends Error {
  constructor(
    message: string,
    public code:
      | 'TIMEOUT'
      | 'SELECTOR_NOT_FOUND'
      | 'NAVIGATION_ERROR'
      | 'PARSE_ERROR',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ProgrammersScrapeError';
  }
}

/**
 * 프로그래머스 스크래퍼
 */
export class ProgrammersScraper {
  private rateLimiter: RateLimiter;
  private searchCache: LRUCache<string, ProgrammersProblemSummary[]>;
  private problemCache: LRUCache<string, ProgrammersProblemDetail>;
  private readonly baseUrl = 'https://school.programmers.co.kr';

  constructor() {
    // 초당 1회 요청 (보수적)
    this.rateLimiter = new RateLimiter({
      capacity: 2,
      refillRate: 1,
    });
    // 검색 캐시: 50개 항목, 30분 TTL
    this.searchCache = new LRUCache(50, 30 * 60 * 1000);
    // 문제 상세 캐시: 50개 항목, 30일 TTL
    this.problemCache = new LRUCache(50, 30 * 24 * 60 * 60 * 1000);
  }

  /**
   * 프로그래머스 문제 검색
   *
   * @param options 검색 옵션
   * @returns 문제 목록
   * @throws {ProgrammersScrapeError}
   */
  async searchProblems(
    options: ProgrammersSearchOptions = {}
  ): Promise<ProgrammersProblemSummary[]> {
    const {
      levels = [],
      order = 'recent',
      page = 1,
      limit,
      query,
    } = options;

    // 캐시 키 생성
    const cacheKey = JSON.stringify({ levels, order, page, query });

    // 캐시 확인
    const cached = this.searchCache.get(cacheKey);
    if (cached !== undefined) {
      console.log('[ProgrammersScraper] 캐시 히트: 검색 결과');
      // limit 적용 후 반환
      return limit && limit > 0 ? cached.slice(0, limit) : cached;
    }

    // Rate limiting (캐시 미스 시에만)
    await this.rateLimiter.acquire();

    try {
      // 1. 프로그래머스 내부 API URL 생성
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('perPage', '20');
      params.set('order', order);

      for (const level of levels) {
        params.append('levels[]', String(level));
      }

      if (query) {
        params.set('search', query);
      }

      const apiUrl = `${this.baseUrl}/api/v2/school/challenges/?${params.toString()}`;

      console.log(`[ProgrammersScraper] API URL: ${apiUrl}`);

      // 2. API 호출
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let apiResponse: {
        result: Array<{
          id: number;
          title: string;
          partTitle: string;
          level: number;
          finishedCount: number;
          acceptanceRate: number;
        }>;
      };

      try {
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new ProgrammersScrapeError(
            `API 요청 실패: HTTP ${response.status}`,
            'NAVIGATION_ERROR'
          );
        }

        apiResponse = await response.json();
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof ProgrammersScrapeError) {
          throw error;
        }

        if ((error as Error).name === 'AbortError') {
          throw new ProgrammersScrapeError(
            '요청이 타임아웃되었습니다 (10000ms 초과)',
            'TIMEOUT',
            error
          );
        }

        throw new ProgrammersScrapeError(
          `API 요청 실패: ${(error as Error).message}`,
          'NAVIGATION_ERROR',
          error
        );
      }

      // 3. API 응답 → ProgrammersProblemSummary 매핑
      let problems: ProgrammersProblemSummary[];

      try {
        problems = (apiResponse.result ?? []).map((item) => ({
          problemId: String(item.id),
          title: item.title,
          level: item.level,
          category: item.partTitle,
          finishedCount: item.finishedCount,
          acceptanceRate: item.acceptanceRate,
          url: `${this.baseUrl}/learn/courses/30/lessons/${item.id}`,
        }));
      } catch (error) {
        throw new ProgrammersScrapeError(
          '문제 목록 파싱 실패',
          'PARSE_ERROR',
          error
        );
      }

      // 4. 캐시에 저장 (limit 적용 전 전체 결과 저장)
      this.searchCache.set(cacheKey, problems);

      // 5. limit 적용
      if (limit && limit > 0) {
        problems = problems.slice(0, limit);
      }

      console.log(`[ProgrammersScraper] ${problems.length}개 문제 검색 완료`);

      return problems;
    } catch (error) {
      if (error instanceof ProgrammersScrapeError) {
        throw error;
      }
      throw new ProgrammersScrapeError(
        `검색 실패: ${(error as Error).message}`,
        'NAVIGATION_ERROR',
        error
      );
    }
  }

  /**
   * 문제 상세 페이지 HTML 가져오기 (fetch 기반, BOJScraper 패턴)
   *
   * @param problemId 문제 ID
   * @returns HTML 문자열
   * @throws {ProgrammersScrapeError}
   */
  async fetchProblemPage(problemId: string): Promise<string> {
    if (!problemId || !/^\d+$/.test(problemId)) {
      throw new ProgrammersScrapeError(
        `유효하지 않은 문제 ID: ${problemId}`,
        'PARSE_ERROR'
      );
    }

    // Rate limiting
    await this.rateLimiter.acquire();

    const url = `${this.baseUrl}/learn/courses/30/lessons/${problemId}`;
    let lastError: unknown;

    // 재시도 로직 (최대 2회)
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const html = await this._fetchWithTimeout(url);
        return html;
      } catch (error) {
        lastError = error;

        // 404는 재시도 불필요
        if (
          error instanceof ProgrammersScrapeError &&
          error.code === 'NAVIGATION_ERROR'
        ) {
          throw error;
        }

        // 마지막 시도가 아니면 재시도
        if (attempt < 2) {
          await this._delay(3000); // 3초 대기
          continue;
        }
      }
    }

    // 모든 재시도 실패
    throw new ProgrammersScrapeError(
      `문제 ${problemId}를 3번 시도했으나 실패했습니다.`,
      'NAVIGATION_ERROR',
      lastError
    );
  }

  /**
   * 타임아웃 적용된 HTTP 요청 (fetch 기반, BOJScraper 패턴)
   */
  private async _fetchWithTimeout(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      clearTimeout(timeoutId);

      // 404 처리
      if (response.status === 404) {
        throw new ProgrammersScrapeError(
          `문제를 찾을 수 없습니다: ${url}`,
          'NAVIGATION_ERROR'
        );
      }

      // 기타 HTTP 에러
      if (!response.ok) {
        throw new ProgrammersScrapeError(
          `HTTP 에러 ${response.status}: ${response.statusText}`,
          'NAVIGATION_ERROR'
        );
      }

      const html = await response.text();

      // HTML 검증
      if (!html || html.length < 100) {
        throw new ProgrammersScrapeError(
          '빈 HTML 응답을 받았습니다.',
          'PARSE_ERROR'
        );
      }

      return html;
    } catch (error) {
      clearTimeout(timeoutId);

      // 이미 ProgrammersScrapeError면 그대로 throw
      if (error instanceof ProgrammersScrapeError) {
        throw error;
      }

      // AbortError는 타임아웃
      if ((error as Error).name === 'AbortError') {
        throw new ProgrammersScrapeError(
          `요청이 타임아웃되었습니다 (10000ms 초과)`,
          'TIMEOUT',
          error
        );
      }

      // 기타 네트워크 에러
      throw new ProgrammersScrapeError(
        `네트워크 요청 실패: ${(error as Error).message}`,
        'NAVIGATION_ERROR',
        error
      );
    }
  }

  /**
   * 지연 함수 (재시도 간격)
   */
  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 캐시 통계 조회
   *
   * @returns 검색 및 문제 캐시 통계
   */
  getCacheStats() {
    return {
      search: this.searchCache.getStats(),
      problem: this.problemCache.getStats(),
    };
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.searchCache.clear();
    this.problemCache.clear();
  }

  /**
   * 문제 상세 정보 조회 (fetch + cheerio 기반)
   *
   * @param problemId 문제 ID
   * @returns 문제 상세 정보
   * @throws {ProgrammersScrapeError}
   */
  async getProblem(problemId: string): Promise<ProgrammersProblemDetail> {
    // 캐시 확인
    const cached = this.problemCache.get(problemId);
    if (cached !== undefined) {
      console.log(`[ProgrammersScraper] 캐시 히트: 문제 ${problemId}`);
      return cached;
    }

    // 1. HTML 가져오기 (캐시 미스 시에만)
    const html = await this.fetchProblemPage(problemId);

    // 2. HTML 파싱
    try {
      const detail = parseProgrammersProblemContent(html, problemId);

      // 3. 캐시에 저장
      this.problemCache.set(problemId, detail);

      return detail;
    } catch (error) {
      throw new ProgrammersScrapeError(
        `HTML 파싱 실패: ${(error as Error).message}`,
        'PARSE_ERROR',
        error
      );
    }
  }
}
