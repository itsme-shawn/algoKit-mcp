/**
 * ProgrammersScraper 단위 테스트 (fetch mock 기반)
 *
 * Puppeteer 의존성 제거 후 프로그래머스 내부 API 호출을 fetch mock으로 검증
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ProgrammersScraper,
  ProgrammersScrapeError,
} from '../../src/api/programmers-scraper.js';

const BASE_URL = 'https://school.programmers.co.kr';

/** 기본 mock API 응답 팩토리 */
function makeMockApiResponse(overrides: Partial<{
  page: number;
  perPage: number;
  totalPages: number;
  totalEntries: number;
  result: object[];
}> = {}) {
  return {
    page: 1,
    perPage: 20,
    totalPages: 5,
    totalEntries: 100,
    result: [
      {
        id: 42748,
        title: 'K번째수',
        partTitle: '정렬',
        level: 1,
        finishedCount: 50000,
        acceptanceRate: 70,
      },
      {
        id: 42746,
        title: '가장 큰 수',
        partTitle: '정렬',
        level: 2,
        finishedCount: 40000,
        acceptanceRate: 55,
      },
    ],
    ...overrides,
  };
}

/** fetch mock 헬퍼 */
function mockFetchSuccess(data: object) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
  } as Response);
}

describe('ProgrammersScraper', () => {
  let scraper: ProgrammersScraper;

  beforeEach(() => {
    scraper = new ProgrammersScraper();
    scraper.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchProblems', () => {
    it('should search problems with default options', async () => {
      const mockData = makeMockApiResponse();
      mockFetchSuccess(mockData);

      const problems = await scraper.searchProblems();

      expect(problems).toBeDefined();
      expect(Array.isArray(problems)).toBe(true);
      expect(problems.length).toBe(2);

      const first = problems[0];
      expect(first).toHaveProperty('problemId', '42748');
      expect(first).toHaveProperty('title', 'K번째수');
      expect(first).toHaveProperty('level', 1);
      expect(first).toHaveProperty('category', '정렬');
      expect(first).toHaveProperty('url');
      expect(typeof first.problemId).toBe('string');
      expect(typeof first.title).toBe('string');
      expect(typeof first.level).toBe('number');
      expect(typeof first.category).toBe('string');
      expect(first.url).toContain('programmers.co.kr');
    });

    it('should filter problems by single level', async () => {
      const mockData = makeMockApiResponse({
        result: [
          { id: 42748, title: 'K번째수', partTitle: '정렬', level: 1, finishedCount: 50000, acceptanceRate: 70 },
        ],
      });
      const fetchSpy = mockFetchSuccess(mockData);

      const problems = await scraper.searchProblems({ levels: [1] });

      expect(problems).toBeDefined();
      expect(Array.isArray(problems)).toBe(true);

      // fetch 호출 URL에 levels[] 파라미터가 포함되어야 함
      const calledUrl = String((fetchSpy.mock.calls[0] as unknown[])[0]);
      expect(calledUrl).toContain('levels%5B%5D=1');

      const hasLevel1 = problems.some((p) => p.level === 1);
      expect(hasLevel1).toBe(true);
    });

    it('should support multiple levels', async () => {
      const mockData = makeMockApiResponse();
      const fetchSpy = mockFetchSuccess(mockData);

      const problems = await scraper.searchProblems({ levels: [1, 2] });

      expect(problems).toBeDefined();
      expect(Array.isArray(problems)).toBe(true);

      const calledUrl = String((fetchSpy.mock.calls[0] as unknown[])[0]);
      expect(calledUrl).toContain('levels%5B%5D=1');
      expect(calledUrl).toContain('levels%5B%5D=2');

      const hasTargetLevel = problems.some((p) => p.level === 1 || p.level === 2);
      expect(hasTargetLevel).toBe(true);
    });

    it('should sort by recent (default)', async () => {
      const mockData = makeMockApiResponse();
      const fetchSpy = mockFetchSuccess(mockData);

      const problems = await scraper.searchProblems({ order: 'recent' });

      expect(Array.isArray(problems)).toBe(true);
      expect(problems.length).toBeGreaterThan(0);

      const calledUrl = String((fetchSpy.mock.calls[0] as unknown[])[0]);
      expect(calledUrl).toContain('order=recent');
    });

    it('should sort by accuracy', async () => {
      const mockData = makeMockApiResponse();
      const fetchSpy = mockFetchSuccess(mockData);

      const problems = await scraper.searchProblems({ order: 'accuracy' });

      expect(Array.isArray(problems)).toBe(true);
      expect(problems.length).toBeGreaterThan(0);

      const calledUrl = String((fetchSpy.mock.calls[0] as unknown[])[0]);
      expect(calledUrl).toContain('order=accuracy');
    });

    it('should sort by popular', async () => {
      const mockData = makeMockApiResponse();
      const fetchSpy = mockFetchSuccess(mockData);

      const problems = await scraper.searchProblems({ order: 'popular' });

      expect(Array.isArray(problems)).toBe(true);
      expect(problems.length).toBeGreaterThan(0);

      const calledUrl = String((fetchSpy.mock.calls[0] as unknown[])[0]);
      expect(calledUrl).toContain('order=popular');
    });

    it('should handle pagination', async () => {
      const page1Data = makeMockApiResponse({
        page: 1,
        result: [
          { id: 42748, title: 'K번째수', partTitle: '정렬', level: 1, finishedCount: 50000, acceptanceRate: 70 },
        ],
      });
      const page2Data = makeMockApiResponse({
        page: 2,
        result: [
          { id: 42746, title: '가장 큰 수', partTitle: '정렬', level: 2, finishedCount: 40000, acceptanceRate: 55 },
        ],
      });

      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => page1Data } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => page2Data } as Response);

      const page1 = await scraper.searchProblems({ page: 1, levels: [1] });
      const page2 = await scraper.searchProblems({ page: 2, levels: [1] });

      expect(page1).toBeDefined();
      expect(page2).toBeDefined();
      expect(page1[0].problemId).not.toBe(page2[0].problemId);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should limit results', async () => {
      const mockData = makeMockApiResponse();
      mockFetchSuccess(mockData);

      const problems = await scraper.searchProblems({ limit: 1 });

      expect(problems).toBeDefined();
      expect(problems.length).toBeLessThanOrEqual(1);
    });

    it('should handle empty results', async () => {
      const emptyData = makeMockApiResponse({ result: [], totalEntries: 0 });
      mockFetchSuccess(emptyData);

      const problems = await scraper.searchProblems({
        levels: [0],
        page: 999,
      });

      expect(problems).toBeDefined();
      expect(Array.isArray(problems)).toBe(true);
      expect(problems.length).toBe(0);
    });

    it('should extract finishedCount and acceptanceRate', async () => {
      const mockData = makeMockApiResponse({
        result: [
          { id: 42748, title: 'K번째수', partTitle: '정렬', level: 1, finishedCount: 50000, acceptanceRate: 70 },
        ],
      });
      mockFetchSuccess(mockData);

      const problems = await scraper.searchProblems({ levels: [1] });

      expect(problems.length).toBeGreaterThan(0);
      const first = problems[0];
      expect(first).toHaveProperty('finishedCount', 50000);
      expect(first).toHaveProperty('acceptanceRate', 70);
      expect(typeof first.finishedCount).toBe('number');
      expect(typeof first.acceptanceRate).toBe('number');
      expect(first.finishedCount).toBeGreaterThanOrEqual(0);
      expect(first.acceptanceRate).toBeGreaterThanOrEqual(0);
      expect(first.acceptanceRate).toBeLessThanOrEqual(100);
    });

    it('should extract problem ID from URL', async () => {
      const mockData = makeMockApiResponse({
        result: [
          { id: 42748, title: 'K번째수', partTitle: '정렬', level: 1, finishedCount: 50000, acceptanceRate: 70 },
        ],
      });
      mockFetchSuccess(mockData);

      const problems = await scraper.searchProblems({ levels: [1] });

      expect(problems.length).toBeGreaterThan(0);
      const first = problems[0];
      expect(first.problemId).toMatch(/^\d+$/);
      expect(first.url).toContain(`/lessons/${first.problemId}`);
    });

    it('should extract category from partTitle', async () => {
      const mockData = makeMockApiResponse({
        result: [
          { id: 42748, title: 'K번째수', partTitle: '연습문제', level: 1, finishedCount: 50000, acceptanceRate: 70 },
        ],
      });
      mockFetchSuccess(mockData);

      const problems = await scraper.searchProblems({ levels: [1] });

      expect(problems.length).toBeGreaterThan(0);
      expect(typeof problems[0].category).toBe('string');
      expect(problems[0].category).toBe('연습문제');
    });

    it('should build correct URL for problemId', async () => {
      const mockData = makeMockApiResponse({
        result: [
          { id: 42748, title: 'K번째수', partTitle: '정렬', level: 1, finishedCount: 50000, acceptanceRate: 70 },
        ],
      });
      mockFetchSuccess(mockData);

      const problems = await scraper.searchProblems();

      expect(problems[0].url).toBe(`${BASE_URL}/learn/courses/30/lessons/42748`);
    });

    it('should throw ProgrammersScrapeError on HTTP error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(scraper.searchProblems()).rejects.toThrow(ProgrammersScrapeError);
    });

    it('should throw ProgrammersScrapeError on timeout', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(() => {
        return new Promise((_, reject) => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          setTimeout(() => reject(err), 10);
        });
      });

      await expect(scraper.searchProblems()).rejects.toThrow(ProgrammersScrapeError);
    });

    it('should include search query in API request', async () => {
      const mockData = makeMockApiResponse();
      const fetchSpy = mockFetchSuccess(mockData);

      await scraper.searchProblems({ query: '해시' });

      const calledUrl = String((fetchSpy.mock.calls[0] as unknown[])[0]);
      expect(calledUrl).toContain('search=');
      expect(decodeURIComponent(calledUrl)).toContain('search=해시');
    });
  });
});
