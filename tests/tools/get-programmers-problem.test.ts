/**
 * get_programmers_problem MCP 도구 단위 테스트
 */
import { describe, it, expect } from 'vitest';
import { handleGetProgrammersProblem as getProgrammersProblem } from '../../src/tools/get-programmers-problem.js';

describe('getProgrammersProblem', () => {
  describe('성공 케이스', () => {
    it('URL 입력으로 문제 조회', { timeout: 15000 }, async () => {
      const result = await getProgrammersProblem({
        problem_id:
          'https://school.programmers.co.kr/learn/courses/30/lessons/42748',
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('42748');
      expect(result.text).toContain('문제 설명');
    });

    it('숫자 입력으로 문제 조회', { timeout: 15000 }, async () => {
      const result = await getProgrammersProblem({
        problem_id: 42748,
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('42748');
      expect(result.text).toContain('K번째수');
    });

    it('문자열 숫자 입력으로 문제 조회', { timeout: 15000 }, async () => {
      const result = await getProgrammersProblem({
        problem_id: '42748',
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('42748');
    });

    it('마크다운 포맷팅 확인', { timeout: 15000 }, async () => {
      const result = await getProgrammersProblem({
        problem_id: 42748,
      });

      const markdown = result.text;

      // 헤더
      expect(markdown).toContain('#');
      // 레벨 표시
      expect(markdown).toMatch(/레벨|Lv/);
      // URL
      expect(markdown).toContain('https://school.programmers.co.kr');
      // 구조
      expect(markdown).toContain('문제 설명');
      expect(markdown).toContain('제한사항');
      expect(markdown).toContain('입출력 예');
    });
  });

  describe('에러 케이스', () => {
    it('잘못된 URL 입력', { timeout: 5000 }, async () => {
      await expect(
        getProgrammersProblem({
          problem_id: 'https://invalid-url.com',
        })
      ).rejects.toThrow(/유효하지 않은 문제 ID 또는 URL/);
    });

    it('존재하지 않는 문제 ID', { timeout: 15000 }, async () => {
      await expect(
        getProgrammersProblem({
          problem_id: 999999,
        })
      ).rejects.toThrow(/찾을 수 없습니다|프로그래머스 문제 조회 실패/);
    });

    it('입력 검증 실패 (null)', { timeout: 5000 }, async () => {
      await expect(
        getProgrammersProblem({
          problem_id: null,
        })
      ).rejects.toThrow();
    });

    it('입력 검증 실패 (undefined)', { timeout: 5000 }, async () => {
      await expect(
        getProgrammersProblem({
          problem_id: undefined,
        })
      ).rejects.toThrow();
    });
  });

  describe('응답 형식', () => {
    it('TextContent 타입 반환', { timeout: 15000 }, async () => {
      const result = await getProgrammersProblem({
        problem_id: 42748,
      });

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('text');
      expect(result.type).toBe('text');
      expect(typeof result.text).toBe('string');
    });
  });
});
