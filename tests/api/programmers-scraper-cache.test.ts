/**
 * 프로그래머스 스크래퍼 캐싱 통합 테스트
 *
 * Phase 7 - Task 7.7: 테스트 확장
 * LRU 캐시 통합 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProgrammersScraper } from '../../src/api/programmers-scraper.js';

describe('ProgrammersScraper Caching', () => {
  let scraper: ProgrammersScraper;

  beforeEach(() => {
    scraper = new ProgrammersScraper();
  });

  afterEach(async () => {
    scraper.clearCache();
  });

  describe('검색 결과 캐싱', () => {
    it(
      'should cache search results',
      { timeout: 15000 },
      async () => {
        const options = { levels: [1], page: 1 };

        // 첫 번째 요청 (캐시 미스)
        const result1 = await scraper.searchProblems(options);
        expect(result1).toBeDefined();
        expect(result1.length).toBeGreaterThan(0);

        // 두 번째 요청 (캐시 히트)
        const result2 = await scraper.searchProblems(options);
        expect(result2).toBeDefined();
        expect(result2).toEqual(result1);

        // 캐시 통계 확인
        const stats = scraper.getCacheStats();
        expect(stats.search.hits).toBeGreaterThan(0);
        expect(stats.search.size).toBeGreaterThan(0);
      }
    );

    it(
      'should apply limit after cache hit',
      { timeout: 15000 },
      async () => {
        const options = { levels: [1], page: 1 };

        // 첫 번째 요청 (limit 없음)
        const result1 = await scraper.searchProblems(options);
        expect(result1.length).toBeGreaterThan(5);

        // 두 번째 요청 (limit 5, 캐시 히트)
        const result2 = await scraper.searchProblems({ ...options, limit: 5 });
        expect(result2.length).toBe(5);
        expect(result2).toEqual(result1.slice(0, 5));
      }
    );

    it('should cache different search options separately', { timeout: 30000 }, async () => {
      const options1 = { levels: [1], page: 1 };
      const options2 = { levels: [2], page: 1 };

      // 두 가지 다른 검색
      const result1 = await scraper.searchProblems(options1);
      const result2 = await scraper.searchProblems(options2);

      expect(result1).not.toEqual(result2);

      // 캐시 통계 확인 (2개 항목 저장)
      const stats = scraper.getCacheStats();
      expect(stats.search.size).toBe(2);
    });
  });

  describe('문제 상세 캐싱', () => {
    it(
      'should cache problem details',
      { timeout: 10000 },
      async () => {
        const problemId = '12928'; // 짝수와 홀수

        // 첫 번째 요청 (캐시 미스)
        const result1 = await scraper.getProblem(problemId);
        expect(result1).toBeDefined();
        expect(result1.problemId).toBe(problemId);

        // 두 번째 요청 (캐시 히트)
        const result2 = await scraper.getProblem(problemId);
        expect(result2).toEqual(result1);

        // 캐시 통계 확인
        const stats = scraper.getCacheStats();
        expect(stats.problem.hits).toBeGreaterThan(0);
        expect(stats.problem.size).toBeGreaterThan(0);
      }
    );

    it('should cache multiple problems', { timeout: 15000 }, async () => {
      const problemIds = ['12928', '12903']; // 짝수와 홀수, 가운데 글자 가져오기

      // 두 문제 조회
      const result1 = await scraper.getProblem(problemIds[0]);
      const result2 = await scraper.getProblem(problemIds[1]);

      expect(result1.problemId).toBe(problemIds[0]);
      expect(result2.problemId).toBe(problemIds[1]);

      // 캐시 통계 확인 (2개 항목 저장)
      const stats = scraper.getCacheStats();
      expect(stats.problem.size).toBe(2);
    });
  });

  describe('캐시 관리', () => {
    it('should return cache statistics', async () => {
      const stats = scraper.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.search).toBeDefined();
      expect(stats.problem).toBeDefined();

      expect(stats.search).toHaveProperty('hits');
      expect(stats.search).toHaveProperty('misses');
      expect(stats.search).toHaveProperty('size');
      expect(stats.search).toHaveProperty('capacity');

      expect(stats.problem).toHaveProperty('hits');
      expect(stats.problem).toHaveProperty('misses');
      expect(stats.problem).toHaveProperty('size');
      expect(stats.problem).toHaveProperty('capacity');
    });

    it('should clear cache', { timeout: 15000 }, async () => {
      // 캐시에 데이터 저장
      await scraper.searchProblems({ levels: [1], page: 1 });
      await scraper.getProblem('12928');

      let stats = scraper.getCacheStats();
      expect(stats.search.size).toBeGreaterThan(0);
      expect(stats.problem.size).toBeGreaterThan(0);

      // 캐시 초기화
      scraper.clearCache();

      stats = scraper.getCacheStats();
      expect(stats.search.size).toBe(0);
      expect(stats.problem.size).toBe(0);
    });
  });
});
