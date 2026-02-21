/**
 * search_problems 도구 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { searchProblems, SearchProblemsInputSchema } from '../../src/tools/search-problems.js';

describe('search_problems 도구', () => {
  describe('입력 스키마 검증', () => {
    describe('숫자 형식 레벨 입력', () => {
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

    describe('티어 문자열 형식 입력', () => {
      it('한글 티어명 + 숫자 형식을 통과시켜야 함', () => {
        const validInput = {
          level_min: '실버 3',
          level_max: '골드 1',
        };

        const result = SearchProblemsInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.level_min).toBe(8);
          expect(result.data.level_max).toBe(15);
        }
      });

      it('영문 티어명 + 로마 숫자 형식을 통과시켜야 함', () => {
        const validInput = {
          level_min: 'Silver III',
          level_max: 'Gold I',
        };

        const result = SearchProblemsInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.level_min).toBe(8);
          expect(result.data.level_max).toBe(15);
        }
      });

      it('축약형 티어명을 통과시켜야 함', () => {
        const validInput = {
          level_min: '실 3',
          level_max: '골 1',
        };

        const result = SearchProblemsInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.level_min).toBe(8);
          expect(result.data.level_max).toBe(15);
        }
      });

      it('유효하지 않은 티어 문자열은 실패해야 함', () => {
        const invalidInput = {
          level_min: '마스터 1',
        };

        const result = SearchProblemsInputSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('잘못된 형식은 실패해야 함', () => {
        const invalidInput = {
          level_min: '실버',
        };

        const result = SearchProblemsInputSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('숫자 문자열("16")을 숫자(16)로 변환해야 함', () => {
        const input = { level_min: '16', level_max: '17' };

        const result = SearchProblemsInputSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.level_min).toBe(16);
          expect(result.data.level_max).toBe(17);
        }
      });

      it('범위를 벗어난 숫자 문자열("31")은 실패해야 함', () => {
        const result = SearchProblemsInputSchema.safeParse({ level_min: '31' });
        expect(result.success).toBe(false);
      });

      it('숫자와 문자열 혼용 가능해야 함', () => {
        const mixedInput = {
          level_min: 10,
          level_max: '골드 1',
        };

        const result = SearchProblemsInputSchema.safeParse(mixedInput);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.level_min).toBe(10);
          expect(result.data.level_max).toBe(15);
        }
      });
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
      '실제 API 호출 테스트 - 단일 태그 필터',
      { timeout: 10000 },
      async () => {
        const input = {
          tags: 'greedy',
          page: 1,
        };

        const result = await searchProblems(input);

        expect(result).toContain('문제 검색 결과');
      }
    );

    it(
      '실제 API 호출 테스트 - 다중 태그 필터',
      { timeout: 10000 },
      async () => {
        const input = {
          tags: ['dp', 'greedy'],
          page: 1,
        };

        const result = await searchProblems(input);

        expect(result).toContain('문제 검색 결과');
      }
    );

    it(
      '다중 태그 배열 검증',
      () => {
        const multiTagInput = {
          tags: ['dp', 'greedy', 'bfs'],
          level_min: 13,
          level_max: 15,
        };

        const result = SearchProblemsInputSchema.safeParse(multiTagInput);
        expect(result.success).toBe(true);
      }
    );

    it(
      '태그 없이도 검색 가능',
      { timeout: 10000 },
      async () => {
        const input = {
          level_min: 10,
          level_max: 15,
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
