/**
 * 프로그래머스 웹 스크래핑 클라이언트
 *
 * 검색 페이지: Puppeteer (SPA, JavaScript 렌더링 필요)
 * 상세 페이지: cheerio (Task 7.3에서 구현)
 */
import { Browser } from 'puppeteer';
import { BrowserPool } from '../utils/browser-pool.js';
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
  private browserPool: BrowserPool;
  private rateLimiter: RateLimiter;
  private searchCache: LRUCache<string, ProgrammersProblemSummary[]>;
  private problemCache: LRUCache<string, ProgrammersProblemDetail>;
  private readonly baseUrl = 'https://school.programmers.co.kr';

  constructor() {
    this.browserPool = BrowserPool.getInstance();
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

    let browser: Browser | null = null;

    try {
      // 1. BrowserPool에서 브라우저 획득
      browser = await this.browserPool.acquire();
      const browserPage = await browser.newPage();

      // 2. 검색 URL 생성
      const searchUrl = this.buildSearchUrl({
        levels,
        order,
        page,
        query,
      });

      console.log(`[ProgrammersScraper] 검색 URL: ${searchUrl}`);

      // 3. 페이지 이동 및 로딩 대기
      try {
        await browserPage.goto(searchUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
      } catch (error) {
        throw new ProgrammersScrapeError(
          `페이지 로딩 실패: ${searchUrl}`,
          'NAVIGATION_ERROR',
          error
        );
      }

      // 4. JavaScript 렌더링 대기
      try {
        await browserPage.waitForSelector('table tbody tr', {
          timeout: 10000,
        });
      } catch (error) {
        // 빈 결과일 수 있으므로 스크린샷 저장 후 빈 배열 반환
        await browserPage.screenshot({
          path: 'programmers-search-empty.png',
        });

        const rowCount = await browserPage.$$eval(
          'table tbody tr',
          (rows) => rows.length
        );

        if (rowCount === 0) {
          console.log('[ProgrammersScraper] 검색 결과 없음');
          await browserPage.close();
          return [];
        }

        throw new ProgrammersScrapeError(
          'table tbody tr selector를 찾을 수 없습니다',
          'SELECTOR_NOT_FOUND',
          error
        );
      }

      // 5. 문제 목록 추출
      let problems: ProgrammersProblemSummary[];

      try {
        problems = await browserPage.$$eval('table tbody tr', (rows) => {
          return rows.map((row) => {
            const titleLink = row.querySelector(
              'td.title a[href*="/lessons/"]'
            );
            const categoryEl = row.querySelector('td.title small.part-title');
            const levelSpan = row.querySelector('td.level span[class*="level-"]');
            const finishedEl = row.querySelector('td.finished-count');
            const rateEl = row.querySelector('td.acceptance-rate');

            const href = titleLink?.getAttribute('href') || '';
            const problemId = href.match(/lessons\/(\d+)/)?.[1] || '';
            const title = titleLink?.textContent?.trim() || '';
            const category = categoryEl?.textContent?.trim() || '기타';
            const levelClass = levelSpan?.className || '';
            const level = parseInt(
              levelClass.match(/level-(\d+)/)?.[1] || '0'
            );

            const finishedText = finishedEl?.textContent?.trim() || '0명';
            const finishedCount = parseInt(
              finishedText.replace(/,/g, '').replace('명', '') || '0'
            );

            const rateText = rateEl?.textContent?.trim() || '0%';
            const acceptanceRate = parseInt(rateText.replace('%', '') || '0');

            return {
              problemId,
              title,
              level,
              category,
              url: `https://school.programmers.co.kr${href}`,
              finishedCount,
              acceptanceRate,
            };
          });
        });
      } catch (error) {
        throw new ProgrammersScrapeError(
          '문제 목록 파싱 실패',
          'PARSE_ERROR',
          error
        );
      }

      await browserPage.close();

      // 6. 캐시에 저장 (limit 적용 전 전체 결과 저장)
      this.searchCache.set(cacheKey, problems);

      // 7. limit 적용
      if (limit && limit > 0) {
        problems = problems.slice(0, limit);
      }

      console.log(
        `[ProgrammersScraper] ${problems.length}개 문제 검색 완료`
      );

      return problems;
    } finally {
      // 7. 브라우저 반환 (필수!)
      if (browser) {
        await this.browserPool.release(browser);
      }
    }
  }

  /**
   * 검색 URL 생성
   */
  private buildSearchUrl(options: {
    levels: number[];
    order: string;
    page: number;
    query?: string;
  }): string {
    const params = new URLSearchParams();

    params.set('order', options.order);
    params.set('page', options.page.toString());

    if (options.levels.length > 0) {
      params.set('levels', options.levels.join(','));
    }

    if (options.query) {
      params.set('query', options.query);
    }

    return `${this.baseUrl}/learn/challenges?${params.toString()}`;
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
