/**
 * ProgrammersScraper.getProblem() 단위 테스트
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProgrammersScraper,
  ProgrammersScrapeError,
} from '../../src/api/programmers-scraper.js';

describe('ProgrammersScraper.getProblem', () => {
  let scraper: ProgrammersScraper;

  beforeEach(() => {
    scraper = new ProgrammersScraper();
  });

  describe('성공 케이스', () => {
    it('유효한 문제 ID로 조회', { timeout: 15000 }, async () => {
      const problem = await scraper.getProblem('42748');

      expect(problem.problemId).toBe('42748');
      expect(problem.title).toBeTruthy();
      expect(problem.level).toBeGreaterThanOrEqual(0);
      expect(problem.level).toBeLessThanOrEqual(5);
    });

    it('모든 필드 존재 확인', { timeout: 15000 }, async () => {
      const problem = await scraper.getProblem('42748');

      expect(problem).toHaveProperty('problemId');
      expect(problem).toHaveProperty('title');
      expect(problem).toHaveProperty('level');
      expect(problem).toHaveProperty('category');
      expect(problem).toHaveProperty('description');
      expect(problem).toHaveProperty('constraints');
      expect(problem).toHaveProperty('examples');
      expect(problem).toHaveProperty('tags');

      expect(typeof problem.title).toBe('string');
      expect(typeof problem.category).toBe('string');
      expect(typeof problem.description).toBe('string');
      expect(Array.isArray(problem.constraints)).toBe(true);
      expect(Array.isArray(problem.examples)).toBe(true);
      expect(Array.isArray(problem.tags)).toBe(true);
    });

    it('문제 설명이 HTML 형식', { timeout: 15000 }, async () => {
      const problem = await scraper.getProblem('42748');

      expect(problem.description).toBeTruthy();
      expect(problem.description.length).toBeGreaterThan(10);
    });

    it('제한사항 배열', { timeout: 15000 }, async () => {
      const problem = await scraper.getProblem('42748');

      expect(Array.isArray(problem.constraints)).toBe(true);
      // 42748번 문제는 제한사항이 있음
      expect(problem.constraints.length).toBeGreaterThan(0);
    });

    it('입출력 예제 배열', { timeout: 15000 }, async () => {
      const problem = await scraper.getProblem('42748');

      expect(Array.isArray(problem.examples)).toBe(true);
      expect(problem.examples.length).toBeGreaterThan(0);

      const firstExample = problem.examples[0];
      expect(firstExample).toHaveProperty('input');
      expect(firstExample).toHaveProperty('output');
      expect(typeof firstExample.input).toBe('string');
      expect(typeof firstExample.output).toBe('string');
    });

    it('Level이 0-5 범위 내', { timeout: 15000 }, async () => {
      const problem = await scraper.getProblem('42748');

      expect(problem.level).toBeGreaterThanOrEqual(0);
      expect(problem.level).toBeLessThanOrEqual(5);
    });
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 문제 ID', { timeout: 15000 }, async () => {
      await expect(scraper.getProblem('999999')).rejects.toThrow(
        ProgrammersScrapeError
      );
    });

    it('유효하지 않은 문제 ID (빈 문자열)', { timeout: 5000 }, async () => {
      await expect(scraper.getProblem('')).rejects.toThrow(
        ProgrammersScrapeError
      );
    });

    it(
      '유효하지 않은 문제 ID (문자 포함)',
      { timeout: 5000 },
      async () => {
        await expect(scraper.getProblem('abc123')).rejects.toThrow(
          ProgrammersScrapeError
        );
      }
    );
  });

  describe('캐싱', () => {
    it.skip('동일한 문제 ID로 두 번 조회 시 캐시 사용', { timeout: 20000 }, async () => {
      const start1 = Date.now();
      const problem1 = await scraper.getProblem('42748');
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const problem2 = await scraper.getProblem('42748');
      const time2 = Date.now() - start2;

      // 두 번째 요청은 캐시에서 가져오므로 훨씬 빠름
      expect(time2).toBeLessThan(time1 / 2);

      // 데이터 일치 확인
      expect(problem1.problemId).toBe(problem2.problemId);
      expect(problem1.title).toBe(problem2.title);
    });
  });

  describe('특정 문제 검증', () => {
    it('42748번: K번째수 문제', { timeout: 15000 }, async () => {
      const problem = await scraper.getProblem('42748');

      expect(problem.problemId).toBe('42748');
      expect(problem.title).toContain('K번째수');
      expect(problem.level).toBe(1);
      expect(problem.constraints.length).toBeGreaterThan(0);
      expect(problem.examples.length).toBeGreaterThan(0);
    });

    it('다른 문제도 조회 가능', { timeout: 15000 }, async () => {
      const problem = await scraper.getProblem('42747'); // H-Index

      expect(problem.problemId).toBe('42747');
      expect(problem.title).toBeTruthy();
      expect(problem.level).toBeGreaterThanOrEqual(0);
    });
  });
});
