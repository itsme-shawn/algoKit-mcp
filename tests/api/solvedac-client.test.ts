import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SolvedAcClient } from '../../src/api/solvedac-client.js';
import {
  ProblemNotFoundError,
  InvalidInputError,
  TimeoutError,
  NetworkError,
  RateLimitError,
  SolvedAcAPIError,
} from '../../src/api/types.js';
import {
  mockProblem1000,
  mockProblem1927,
  mockSearchResult,
  mockEmptySearchResult,
  mockTagSearchResult,
} from '../__mocks__/solved-ac-responses.js';

describe('SolvedAcClient', () => {
  let client: SolvedAcClient;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    client = new SolvedAcClient();
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchProblems()', () => {
    describe('기본 검색 (필터 없음)', () => {
      it('should search problems without filters', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResult,
        } as Response);

        const result = await client.searchProblems();

        expect(result).toBeDefined();
        expect(result.items).toBeInstanceOf(Array);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('키워드 검색', () => {
      it('should search with query keyword', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResult,
        } as Response);

        await client.searchProblems({ query: '그래프' });

        const callUrl = fetchSpy.mock.calls[0][0] as string;
        expect(callUrl).toContain('query');
        expect(callUrl).toContain(encodeURIComponent('그래프'));
      });
    });

    describe('레벨 범위 필터', () => {
      it('should filter by level range', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResult,
        } as Response);

        await client.searchProblems({ level_min: 11, level_max: 15 });

        const callUrl = fetchSpy.mock.calls[0][0] as string;
        expect(callUrl).toContain('*11..15');
      });

      it('should throw error when level_min is out of range', { timeout: 5000 }, async () => {
        await expect(client.searchProblems({ level_min: 0 }))
          .rejects
          .toThrow(InvalidInputError);

        await expect(client.searchProblems({ level_min: 31 }))
          .rejects
          .toThrow(InvalidInputError);
      });

      it('should throw error when level_max is out of range', { timeout: 5000 }, async () => {
        await expect(client.searchProblems({ level_max: 0 }))
          .rejects
          .toThrow(InvalidInputError);

        await expect(client.searchProblems({ level_max: 31 }))
          .rejects
          .toThrow(InvalidInputError);
      });
    });

    describe('태그 필터', () => {
      it('should filter by tag', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResult,
        } as Response);

        await client.searchProblems({ tags: 'dp' });

        const callUrl = fetchSpy.mock.calls[0][0] as string;
        expect(callUrl).toContain('%23dp'); // URL-encoded '#dp'
      });

      it('should filter by multiple tags', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResult,
        } as Response);

        await client.searchProblems({ tags: ['dp', 'greedy', 'bfs'] });

        const callUrl = fetchSpy.mock.calls[0][0] as string;
        expect(callUrl).toContain('%23dp'); // URL-encoded '#dp'
        expect(callUrl).toContain('%23greedy'); // URL-encoded '#greedy'
        expect(callUrl).toContain('%23bfs'); // URL-encoded '#bfs'
      });
    });

    describe('복합 필터', () => {
      it('should apply multiple filters simultaneously', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResult,
        } as Response);

        await client.searchProblems({
          query: '최단거리',
          level_min: 11,
          level_max: 15,
          tags: 'graphs',
          sort: 'level',
          direction: 'asc',
        });

        const callUrl = fetchSpy.mock.calls[0][0] as string;
        expect(callUrl).toContain('query');
        expect(callUrl).toContain('*11..15'); // level 범위
        expect(callUrl).toContain('%23graphs'); // URL-encoded '#graphs'
        expect(callUrl).toContain('sort=level');
        expect(callUrl).toContain('direction=asc');
      });
    });

    describe('페이지네이션', () => {
      it('should handle page parameter', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockSearchResult, page: 2 }),
        } as Response);

        const result = await client.searchProblems({ page: 2 });

        const callUrl = fetchSpy.mock.calls[0][0] as string;
        expect(callUrl).toContain('page=2');
        expect(result.page).toBe(2);
      });

      it('should throw error when page is invalid', { timeout: 5000 }, async () => {
        await expect(client.searchProblems({ page: 0 }))
          .rejects
          .toThrow(InvalidInputError);

        await expect(client.searchProblems({ page: -1 }))
          .rejects
          .toThrow(InvalidInputError);
      });
    });

    describe('빈 결과 처리', () => {
      it('should handle empty search results', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptySearchResult,
        } as Response);

        const result = await client.searchProblems({ query: 'zxcvbnmasdfghjkl' });

        expect(result.count).toBe(0);
        expect(result.items).toHaveLength(0);
      });
    });
  });

  describe('getProblem()', () => {
    describe('유효한 문제 ID', () => {
      it('should get problem by valid ID', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockProblem1000,
        } as Response);

        const problem = await client.getProblem(1000);

        expect(problem.problemId).toBe(1000);
        expect(problem.titleKo).toBe('A+B');
        expect(problem.level).toBe(1);
        expect(problem.tags).toBeInstanceOf(Array);
      });

      it('should include all required fields', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockProblem1927,
        } as Response);

        const problem = await client.getProblem(1927);

        expect(problem).toHaveProperty('problemId');
        expect(problem).toHaveProperty('titleKo');
        expect(problem).toHaveProperty('level');
        expect(problem).toHaveProperty('tags');
        expect(problem).toHaveProperty('acceptedUserCount');
        expect(problem).toHaveProperty('averageTries');
      });
    });

    describe('존재하지 않는 문제 ID', () => {
      it('should throw ProblemNotFoundError for non-existent ID', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: 'Not Found' }),
        } as Response);

        await expect(client.getProblem(999999999))
          .rejects
          .toThrow(ProblemNotFoundError);
      });

      it('should include problemId in error message', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: 'Not Found' }),
        } as Response);

        try {
          await client.getProblem(123456);
        } catch (error) {
          expect(error).toBeInstanceOf(ProblemNotFoundError);
          expect((error as ProblemNotFoundError).message).toContain('123456');
        }
      });
    });

    describe('유효하지 않은 ID 형식', () => {
      it('should throw error for negative ID', { timeout: 5000 }, async () => {
        await expect(client.getProblem(-1))
          .rejects
          .toThrow(InvalidInputError);
      });

      it('should throw error for zero ID', { timeout: 5000 }, async () => {
        await expect(client.getProblem(0))
          .rejects
          .toThrow(InvalidInputError);
      });

      it('should throw error for non-integer ID', { timeout: 5000 }, async () => {
        await expect(client.getProblem(1.5))
          .rejects
          .toThrow(InvalidInputError);
      });
    });
  });

  describe('searchTags()', () => {
    describe('한글 키워드 검색', () => {
      it('should search tags with Korean keyword', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTagSearchResult,
        } as Response);

        const tags = await client.searchTags('다이나믹');

        expect(tags).toBeInstanceOf(Array);
        expect(tags.length).toBeGreaterThan(0);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('영문 키워드 검색', () => {
      it('should search tags with English keyword', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTagSearchResult,
        } as Response);

        const tags = await client.searchTags('dynamic');

        expect(tags).toBeInstanceOf(Array);
        const callUrl = fetchSpy.mock.calls[0][0] as string;
        expect(callUrl).toContain('query=dynamic');
      });
    });

    describe('부분 매칭', () => {
      it('should find tags with partial match', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTagSearchResult,
        } as Response);

        const tags = await client.searchTags('graph');

        expect(tags).toBeInstanceOf(Array);
      });
    });

    describe('검색 결과 없음', () => {
      it('should return empty array for no results', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [] }),
        } as Response);

        const tags = await client.searchTags('zxcvbnmasdfghjkl');

        expect(tags).toBeInstanceOf(Array);
        expect(tags).toHaveLength(0);
      });
    });

    describe('유효하지 않은 입력', () => {
      it('should throw error for empty query', { timeout: 5000 }, async () => {
        await expect(client.searchTags(''))
          .rejects
          .toThrow(InvalidInputError);
      });

      it('should throw error for whitespace query', { timeout: 5000 }, async () => {
        await expect(client.searchTags('   '))
          .rejects
          .toThrow(InvalidInputError);
      });
    });
  });

  describe('에러 처리', () => {
    describe('네트워크 타임아웃', () => {
      it('should throw TimeoutError on timeout', { timeout: 15000 }, async () => {
        // AbortController를 사용한 타임아웃 시뮬레이션
        fetchSpy.mockImplementationOnce(() =>
          new Promise((_, reject) => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            setTimeout(() => reject(error), 100);
          })
        );

        await expect(client.getProblem(1000))
          .rejects
          .toThrow(TimeoutError);
      });
    });

    describe('API 서버 에러 (500)', () => {
      it('should throw SolvedAcAPIError for 500 status', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Internal Server Error' }),
        } as Response);

        await expect(client.getProblem(1000))
          .rejects
          .toThrow(SolvedAcAPIError);
      });

      it('should include error message from API', { timeout: 5000 }, async () => {
        const errorMessage = 'Database connection failed';
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: errorMessage }),
        } as Response);

        try {
          await client.getProblem(1000);
        } catch (error) {
          expect(error).toBeInstanceOf(SolvedAcAPIError);
          expect((error as SolvedAcAPIError).message).toContain(errorMessage);
        }
      });
    });

    describe('레이트 리밋 (429)', () => {
      it('should throw RateLimitError for 429 status', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '60' }),
          json: async () => ({ message: 'Too Many Requests' }),
        } as Response);

        await expect(client.getProblem(1000))
          .rejects
          .toThrow(RateLimitError);
      });

      it('should parse Retry-After header', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '120' }),
          json: async () => ({ message: 'Too Many Requests' }),
        } as Response);

        try {
          await client.getProblem(1000);
        } catch (error) {
          expect(error).toBeInstanceOf(RateLimitError);
          expect((error as RateLimitError).retryAfter).toBe(120);
        }
      });
    });

    describe('네트워크 연결 실패', () => {
      it('should retry on network error', { timeout: 10000 }, async () => {
        let callCount = 0;
        fetchSpy.mockImplementation(() => {
          callCount++;
          if (callCount < 3) {
            // 처음 2번은 실패
            return Promise.reject(new TypeError('Network request failed'));
          }
          // 3번째는 성공
          return Promise.resolve({
            ok: true,
            json: async () => mockProblem1000,
          } as Response);
        });

        const problem = await client.getProblem(1000);

        expect(problem.problemId).toBe(1000);
        expect(fetchSpy).toHaveBeenCalledTimes(3); // 재시도 2번 + 성공 1번
      });

      it('should throw NetworkError after max retries', { timeout: 10000 }, async () => {
        fetchSpy.mockRejectedValue(new TypeError('Network request failed'));

        await expect(client.getProblem(1000))
          .rejects
          .toThrow(NetworkError);

        expect(fetchSpy).toHaveBeenCalledTimes(4); // 최초 1번 + 재시도 3번
      });
    });
  });

  describe('캐싱 동작', () => {
    describe('캐시 히트', () => {
      it('should use cache for repeated requests', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValue({
          ok: true,
          json: async () => mockProblem1000,
        } as Response);

        // 첫 번째 요청 - API 호출
        const problem1 = await client.getProblem(1000);

        // 두 번째 요청 - 캐시 사용
        const problem2 = await client.getProblem(1000);

        expect(problem1).toEqual(problem2);
        expect(fetchSpy).toHaveBeenCalledTimes(1); // API 호출은 1번만
      });

      it('should use separate cache for different requests', { timeout: 5000 }, async () => {
        fetchSpy
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockProblem1000,
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockProblem1927,
          } as Response);

        await client.getProblem(1000);
        await client.getProblem(1927);

        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });
    });

    describe('캐시 무효화', () => {
      it('should clear all cache entries', { timeout: 5000 }, async () => {
        fetchSpy.mockResolvedValue({
          ok: true,
          json: async () => mockProblem1000,
        } as Response);

        // 첫 번째 요청
        await client.getProblem(1000);
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        // 캐시 초기화
        client.clearCache();

        // 두 번째 요청 - 새로운 API 호출
        await client.getProblem(1000);
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('HTTP 헤더 검증', () => {
    it('should include correct headers in requests', { timeout: 5000 }, async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProblem1000,
      } as Response);

      await client.getProblem(1000);

      const fetchCall = fetchSpy.mock.calls[0];
      const options = fetchCall[1] as RequestInit;

      expect(options.headers).toBeDefined();
      const headers = options.headers as Record<string, string>;
      expect(headers['Accept']).toBe('application/json');
      expect(headers['User-Agent']).toContain('AlgoKit');
    });
  });
});
