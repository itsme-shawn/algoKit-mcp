/**
 * search_problems 도구 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { searchProblems, SearchProblemsInputSchema } from '../../src/tools/search-problems.js';

describe('search_problems 도구', () => {
  describe('입력 스키마 검증', () => {
    it('유효한 입력을 통과시켜야 함', () => {
      const validInput = {
        query: 'DP',
        level_min: 11,
        level_max: 15,
        page: 1,
      };

      const result = SearchProblemsInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('선택적 필드 없이도 통과해야 함', () => {
      const minimalInput = {};

      const result = SearchProblemsInputSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
    });

    it('level_min이 1-30 범위를 벗어나면 실패해야 함', () => {
      const invalidInput = {
        level_min: 0,
      };

      const result = SearchProblemsInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('level_max가 1-30 범위를 벗어나면 실패해야 함', () => {
      const invalidInput = {
        level_max: 31,
      };

      const result = SearchProblemsInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('page가 음수이면 실패해야 함', () => {
      const invalidInput = {
        page: -1,
      };

      const result = SearchProblemsInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('도구 핸들러', () => {
    it('level_min > level_max이면 에러를 던져야 함', async () => {
      const input = {
        level_min: 15,
        level_max: 10,
      };

      await expect(searchProblems(input)).rejects.toThrow('level_min은 level_max보다 작거나 같아야 합니다');
    });

    it(
      '실제 API 호출 테스트 - Gold 티어 DP 문제',
      { timeout: 10000 },
      async () => {
        const input = {
          query: 'dp',
          level_min: 11,
          level_max: 15,
          page: 1,
        };

        const result = await searchProblems(input);

        expect(result).toContain('문제 검색 결과');
        expect(result).toContain('Gold');
        expect(result).toContain('https://www.acmicpc.net/problem/');
      }
    );

    it(
      '실제 API 호출 테스트 - 태그 필터',
      { timeout: 10000 },
      async () => {
        const input = {
          tag: 'greedy',
          page: 1,
        };

        const result = await searchProblems(input);

        expect(result).toContain('문제 검색 결과');
      }
    );

    it(
      '빈 결과 처리',
      { timeout: 10000 },
      async () => {
        const input = {
          query: 'xyzabc123nonexistent',
          page: 1,
        };

        const result = await searchProblems(input);

        expect(result).toContain('검색 결과가 없습니다');
      }
    );
  });
});
