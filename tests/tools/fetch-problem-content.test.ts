/**
 * fetch_problem_content MCP 도구 테스트
 *
 * Phase 6 - P6-004
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleFetchProblemContent,
  FetchProblemContentInputSchema,
} from '../../src/tools/fetch-problem-content.js';

// Mock 함수 선언 (vi.hoisted로 호이스팅)
const { mockFetchProblemPage, mockParseProblemContent } = vi.hoisted(() => ({
  mockFetchProblemPage: vi.fn(),
  mockParseProblemContent: vi.fn(),
}));

// BOJScraper 모킹
vi.mock('../../src/api/boj-scraper.js', () => {
  // BojFetchError 클래스 정의 (mock 팩토리 내부)
  class BojFetchError extends Error {
    constructor(
      message: string,
      public code: 'NOT_FOUND' | 'NETWORK_ERROR' | 'TIMEOUT' | 'PARSE_ERROR',
      public originalError?: unknown
    ) {
      super(message);
      this.name = 'BojFetchError';
    }
  }

  return {
    BOJScraper: class {
      fetchProblemPage = mockFetchProblemPage;
    },
    BojFetchError,
  };
});

// html-parser 모킹
vi.mock('../../src/utils/html-parser.js', () => {
  // HtmlParseError 클래스 정의 (mock 팩토리 내부)
  class HtmlParseError extends Error {
    constructor(message: string, public field: string) {
      super(message);
      this.name = 'HtmlParseError';
    }
  }

  return {
    parseProblemContent: mockParseProblemContent,
    HtmlParseError,
  };
});

describe('FetchProblemContentInputSchema', () => {
  describe('유효한 입력', () => {
    it('양의 정수 problem_id', () => {
      const input = { problem_id: 1000 };
      const result = FetchProblemContentInputSchema.parse(input);
      expect(result).toEqual({ problem_id: 1000 });
    });

    it('큰 문제 번호도 허용', () => {
      const input = { problem_id: 30000 };
      const result = FetchProblemContentInputSchema.parse(input);
      expect(result).toEqual({ problem_id: 30000 });
    });
  });

  describe('유효하지 않은 입력', () => {
    it('0은 거부', () => {
      const input = { problem_id: 0 };
      expect(() => FetchProblemContentInputSchema.parse(input)).toThrow();
    });

    it('음수는 거부', () => {
      const input = { problem_id: -1 };
      expect(() => FetchProblemContentInputSchema.parse(input)).toThrow();
    });

    it('소수는 거부', () => {
      const input = { problem_id: 1000.5 };
      expect(() => FetchProblemContentInputSchema.parse(input)).toThrow();
    });

    it('문자열은 거부', () => {
      const input = { problem_id: '1000' };
      expect(() => FetchProblemContentInputSchema.parse(input)).toThrow();
    });

    it('problem_id 누락 시 거부', () => {
      const input = {};
      expect(() => FetchProblemContentInputSchema.parse(input)).toThrow();
    });
  });
});

describe('handleFetchProblemContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('정상 케이스', () => {
    it('문제 1000번 크롤링 성공', async () => {
      // Mock HTML 응답
      const mockHtml = '<html>...</html>';
      mockFetchProblemPage.mockResolvedValue(mockHtml);

      // Mock 파싱 결과
      const mockContent = {
        problemId: 1000,
        title: 'A+B',
        description: '두 정수 A와 B를 입력받은 다음, A+B를 출력하는 프로그램을 작성하시오.',
        inputFormat: '첫째 줄에 A와 B가 주어진다.',
        outputFormat: '첫째 줄에 A+B를 출력한다.',
        examples: [
          {
            input: '1 2',
            output: '3',
          },
        ],
        limits: {
          timeLimit: '2초',
          memoryLimit: '128MB',
        },
        metadata: {
          fetchedAt: '2026-02-14T00:00:00.000Z',
          source: 'web',
          cacheExpiresAt: '2026-03-16T00:00:00.000Z',
        },
      };
      mockParseProblemContent.mockReturnValue(mockContent);

      // 도구 호출
      const result = await handleFetchProblemContent({ problem_id: 1000 });

      // 검증
      expect(result.type).toBe('text');
      const content = JSON.parse(result.text);
      expect(content.problemId).toBe(1000);
      expect(content.title).toBe('A+B');
      expect(content.examples).toHaveLength(1);
      expect(content.limits.timeLimit).toBe('2초');

      // Mock 호출 검증
      expect(mockFetchProblemPage).toHaveBeenCalledWith(1000);
      expect(mockParseProblemContent).toHaveBeenCalledWith(mockHtml, 1000);
    });

    it('여러 예제가 있는 문제 크롤링', async () => {
      const mockHtml = '<html>...</html>';
      mockFetchProblemPage.mockResolvedValue(mockHtml);

      const mockContent = {
        problemId: 2557,
        title: 'Hello World',
        description: 'Hello World를 출력하시오.',
        inputFormat: '없음',
        outputFormat: 'Hello World를 출력하시오.',
        examples: [
          { input: '', output: 'Hello World' },
          { input: '', output: 'Hello World' },
        ],
        limits: {
          timeLimit: '1초',
          memoryLimit: '128MB',
        },
        metadata: {
          fetchedAt: '2026-02-14T00:00:00.000Z',
          source: 'web',
          cacheExpiresAt: '2026-03-16T00:00:00.000Z',
        },
      };
      mockParseProblemContent.mockReturnValue(mockContent);

      const result = await handleFetchProblemContent({ problem_id: 2557 });

      const content = JSON.parse(result.text);
      expect(content.examples).toHaveLength(2);
    });
  });

  describe('에러 케이스', () => {
    it('입력 검증 실패 - 0', async () => {
      await expect(
        handleFetchProblemContent({ problem_id: 0 })
      ).rejects.toThrow('입력 검증 실패');
    });

    it('입력 검증 실패 - 음수', async () => {
      await expect(
        handleFetchProblemContent({ problem_id: -1 })
      ).rejects.toThrow('입력 검증 실패');
    });

    it('입력 검증 실패 - 문자열', async () => {
      await expect(
        handleFetchProblemContent({ problem_id: '1000' as unknown as number })
      ).rejects.toThrow('입력 검증 실패');
    });

    it('문제 없음 (404)', async () => {
      // 에러 객체 생성 (mock 팩토리의 BojFetchError 사용)
      const error = new Error('문제를 찾을 수 없습니다');
      (error as any).code = 'NOT_FOUND';
      error.name = 'BojFetchError';
      mockFetchProblemPage.mockRejectedValue(error);

      await expect(
        handleFetchProblemContent({ problem_id: 999999 })
      ).rejects.toThrow('문제를 찾을 수 없습니다');
    });

    it('타임아웃 에러', async () => {
      const error = new Error('요청이 타임아웃되었습니다');
      (error as any).code = 'TIMEOUT';
      error.name = 'BojFetchError';
      mockFetchProblemPage.mockRejectedValue(error);

      await expect(
        handleFetchProblemContent({ problem_id: 1000 })
      ).rejects.toThrow('요청이 타임아웃되었습니다');
    });

    it('네트워크 에러', async () => {
      const error = new Error('네트워크 요청 실패');
      (error as any).code = 'NETWORK_ERROR';
      error.name = 'BojFetchError';
      mockFetchProblemPage.mockRejectedValue(error);

      await expect(
        handleFetchProblemContent({ problem_id: 1000 })
      ).rejects.toThrow('네트워크 요청 실패');
    });

    it('HTML 파싱 에러', async () => {
      mockFetchProblemPage.mockResolvedValue('<html>...</html>');

      const error = new Error('문제 제목을 찾을 수 없습니다.');
      (error as any).field = 'title';
      error.name = 'HtmlParseError';

      mockParseProblemContent.mockImplementation(() => {
        throw error;
      });

      await expect(
        handleFetchProblemContent({ problem_id: 1000 })
      ).rejects.toThrow('문제 제목을 찾을 수 없습니다.');
    });
  });

  describe('응답 형식', () => {
    it('TextContent 타입으로 반환', async () => {
      const mockHtml = '<html>...</html>';
      mockFetchProblemPage.mockResolvedValue(mockHtml);

      const mockContent = {
        problemId: 1000,
        title: 'A+B',
        description: 'test',
        inputFormat: 'test',
        outputFormat: 'test',
        examples: [{ input: '1 2', output: '3' }],
        limits: { timeLimit: '2초', memoryLimit: '128MB' },
        metadata: {
          fetchedAt: '2026-02-14T00:00:00.000Z',
          source: 'web',
          cacheExpiresAt: '2026-03-16T00:00:00.000Z',
        },
      };
      mockParseProblemContent.mockReturnValue(mockContent);

      const result = await handleFetchProblemContent({ problem_id: 1000 });

      expect(result).toHaveProperty('type', 'text');
      expect(result).toHaveProperty('text');
      expect(typeof result.text).toBe('string');
    });

    it('JSON 문자열로 반환', async () => {
      const mockHtml = '<html>...</html>';
      mockFetchProblemPage.mockResolvedValue(mockHtml);

      const mockContent = {
        problemId: 1000,
        title: 'A+B',
        description: 'test',
        inputFormat: 'test',
        outputFormat: 'test',
        examples: [{ input: '1 2', output: '3' }],
        limits: { timeLimit: '2초', memoryLimit: '128MB' },
        metadata: {
          fetchedAt: '2026-02-14T00:00:00.000Z',
          source: 'web',
          cacheExpiresAt: '2026-03-16T00:00:00.000Z',
        },
      };
      mockParseProblemContent.mockReturnValue(mockContent);

      const result = await handleFetchProblemContent({ problem_id: 1000 });

      // JSON 파싱 가능한지 확인
      expect(() => JSON.parse(result.text)).not.toThrow();

      const parsed = JSON.parse(result.text);
      expect(parsed).toEqual(mockContent);
    });
  });
});
