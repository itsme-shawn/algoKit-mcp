/**
 * get_problem 도구 테스트
 */

import { describe, it, expect } from 'vitest';
import { getProblem, GetProblemInputSchema } from '../../../src/tools/boj/get-problem-boj.js';

describe('get_problem 도구', () => {
  describe('입력 스키마 검증', () => {
    it('유효한 problem_id를 통과시켜야 함', () => {
      const validInput = {
        problem_id: 1000,
      };

      const result = GetProblemInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('problem_id가 음수이면 실패해야 함', () => {
      const invalidInput = {
        problem_id: -1,
      };

      const result = GetProblemInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('problem_id가 0이면 실패해야 함', () => {
      const invalidInput = {
        problem_id: 0,
      };

      const result = GetProblemInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('problem_id가 없으면 실패해야 함', () => {
      const invalidInput = {};

      const result = GetProblemInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('도구 핸들러', () => {
    it(
      '실제 API 호출 테스트 - 유효한 문제 (1000번: A+B)',
      { timeout: 10000 },
      async () => {
        const input = {
          problem_id: 1000,
        };

        const result = await getProblem(input);

        expect(result).toContain('[1000]');
        expect(result).toContain('A+B');
        expect(result).toContain('https://www.acmicpc.net/problem/1000');
        expect(result).toContain('📋 기본 정보');
        expect(result).toContain('🏷️ 알고리즘 태그');
        expect(result).toContain('📊 통계');
      }
    );

    it(
      '실제 API 호출 테스트 - 유효한 문제 (1927번: 최소 힙)',
      { timeout: 10000 },
      async () => {
        const input = {
          problem_id: 1927,
        };

        const result = await getProblem(input);

        expect(result).toContain('[1927]');
        expect(result).toContain('최소 힙');
        expect(result).toContain('Silver');
        expect(result).toContain('자료 구조');
      }
    );

    it(
      '존재하지 않는 문제 ID',
      { timeout: 10000 },
      async () => {
        const input = {
          problem_id: 99999999,
        };

        await expect(getProblem(input)).rejects.toThrow('문제 99999999를 찾을 수 없습니다');
      }
    );
  });
});
