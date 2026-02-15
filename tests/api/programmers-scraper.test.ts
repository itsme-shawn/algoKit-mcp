/**
 * ProgrammersScraper 단위 테스트
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ProgrammersScraper,
  ProgrammersScrapeError,
} from '../../src/api/programmers-scraper.js';
import { BrowserPool } from '../../src/utils/browser-pool.js';

describe('ProgrammersScraper', () => {
  let scraper: ProgrammersScraper;

  beforeEach(() => {
    BrowserPool.resetInstance();
    scraper = new ProgrammersScraper();
  });

  afterEach(async () => {
    await BrowserPool.getInstance().closeAll();
    BrowserPool.resetInstance();
  });

  describe('searchProblems', () => {
    it('should search problems with default options', async () => {
      const problems = await scraper.searchProblems();

      expect(problems).toBeDefined();
      expect(Array.isArray(problems)).toBe(true);

      if (problems.length > 0) {
        const firstProblem = problems[0];
        expect(firstProblem).toHaveProperty('problemId');
        expect(firstProblem).toHaveProperty('title');
        expect(firstProblem).toHaveProperty('level');
        expect(firstProblem).toHaveProperty('category');
        expect(firstProblem).toHaveProperty('url');
        expect(typeof firstProblem.problemId).toBe('string');
        expect(typeof firstProblem.title).toBe('string');
        expect(typeof firstProblem.level).toBe('number');
        expect(typeof firstProblem.category).toBe('string');
        expect(firstProblem.url).toContain('programmers.co.kr');
      }
    }, 60000);

    it('should filter problems by level', async () => {
      const problems = await scraper.searchProblems({ levels: [1] });

      expect(problems).toBeDefined();
      expect(Array.isArray(problems)).toBe(true);

      // 프로그래머스는 levels 파라미터가 있어도 다른 레벨도 반환할 수 있음
      // 최소한 레벨 1 문제가 포함되어 있는지 확인
      const hasLevel1 = problems.some((problem) => problem.level === 1);
      expect(hasLevel1).toBe(true);
    }, 60000);

    it('should support multiple levels', async () => {
      const problems = await scraper.searchProblems({ levels: [1, 2] });

      expect(problems).toBeDefined();
      expect(Array.isArray(problems)).toBe(true);

      // 프로그래머스는 levels 파라미터가 있어도 필터링이 완벽하지 않음
      // 최소한 레벨 1 또는 2 문제가 포함되어 있는지 확인
      const hasTargetLevel = problems.some(
        (problem) => problem.level === 1 || problem.level === 2
      );
      expect(hasTargetLevel).toBe(true);
    }, 60000);

    it('should sort by recent (default)', async () => {
      const problems = await scraper.searchProblems({ order: 'recent' });

      expect(problems).toBeDefined();
      expect(Array.isArray(problems)).toBe(true);
      expect(problems.length).toBeGreaterThan(0);
    }, 60000);

    it('should sort by accuracy', async () => {
      const problems = await scraper.searchProblems({ order: 'accuracy' });

      expect(problems).toBeDefined();
      expect(Array.isArray(problems)).toBe(true);
      expect(problems.length).toBeGreaterThan(0);
    }, 60000);

    it('should sort by popular', async () => {
      const problems = await scraper.searchProblems({ order: 'popular' });

      expect(problems).toBeDefined();
      expect(Array.isArray(problems)).toBe(true);
      expect(problems.length).toBeGreaterThan(0);
    }, 60000);

    it('should handle pagination', async () => {
      const page1 = await scraper.searchProblems({ page: 1, levels: [1] });
      const page2 = await scraper.searchProblems({ page: 2, levels: [1] });

      expect(page1).toBeDefined();
      expect(page2).toBeDefined();

      // 서로 다른 문제들
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].problemId).not.toBe(page2[0].problemId);
      }
    }, 120000);

    it('should limit results', async () => {
      const problems = await scraper.searchProblems({ limit: 5 });

      expect(problems).toBeDefined();
      expect(problems.length).toBeLessThanOrEqual(5);
    }, 60000);

    it('should handle empty results', async () => {
      // 존재하지 않는 검색 조건
      const problems = await scraper.searchProblems({
        levels: [0], // 레벨 0은 거의 없음
        page: 999, // 매우 높은 페이지
      });

      expect(problems).toBeDefined();
      expect(Array.isArray(problems)).toBe(true);
      // 빈 배열 또는 매우 적은 결과
    }, 60000);

    it('should extract finishedCount and acceptanceRate', async () => {
      const problems = await scraper.searchProblems({ levels: [1] });

      expect(problems).toBeDefined();

      if (problems.length > 0) {
        const firstProblem = problems[0];
        expect(firstProblem).toHaveProperty('finishedCount');
        expect(firstProblem).toHaveProperty('acceptanceRate');
        expect(typeof firstProblem.finishedCount).toBe('number');
        expect(typeof firstProblem.acceptanceRate).toBe('number');
        expect(firstProblem.finishedCount).toBeGreaterThanOrEqual(0);
        expect(firstProblem.acceptanceRate).toBeGreaterThanOrEqual(0);
        expect(firstProblem.acceptanceRate).toBeLessThanOrEqual(100);
      }
    }, 60000);

    it('should extract problem ID from URL', async () => {
      const problems = await scraper.searchProblems({ levels: [1] });

      expect(problems).toBeDefined();

      if (problems.length > 0) {
        const firstProblem = problems[0];
        expect(firstProblem.problemId).toMatch(/^\d+$/); // 숫자만
        expect(firstProblem.url).toContain(`/lessons/${firstProblem.problemId}`);
      }
    }, 60000);

    it('should extract category', async () => {
      const problems = await scraper.searchProblems({ levels: [1] });

      expect(problems).toBeDefined();

      if (problems.length > 0) {
        const firstProblem = problems[0];
        expect(typeof firstProblem.category).toBe('string');
        // 카테고리는 "연습문제", "PCCP 기출문제" 등
      }
    }, 60000);

    it('should reuse browser instances', async () => {
      const pool = BrowserPool.getInstance();

      // 첫 번째 검색
      await scraper.searchProblems({ levels: [1], limit: 5 });

      const status1 = pool.getStatus();
      expect(status1.total).toBeGreaterThan(0);

      // 두 번째 검색
      await scraper.searchProblems({ levels: [2], limit: 5 });

      const status2 = pool.getStatus();
      // 브라우저가 재사용되므로 total은 증가하지 않음
      expect(status2.total).toBe(status1.total);
    }, 120000);

    it('should release browser on error', async () => {
      const pool = BrowserPool.getInstance();

      try {
        // 잘못된 URL로 에러 유발 (실제로는 정상 동작할 수 있음)
        await scraper.searchProblems({ page: 999999 });
      } catch (error) {
        // 에러 발생 가능
      }

      // 브라우저가 release 되었는지 확인
      const status = pool.getStatus();
      expect(status.active).toBe(status.total); // 모든 브라우저가 사용 가능 상태
    }, 60000);
  });
});
