/**
 * BOJ 스크래퍼 캐싱 및 Rate Limiting 통합 테스트
 *
 * Phase 7 - Task 7.7: 테스트 확장
 * LRU 캐시 및 Rate Limiter 통합 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BOJScraper } from '../../src/api/boj-scraper.js';

describe('BOJScraper Caching & Rate Limiting', () => {
  let scraper: BOJScraper;

  beforeEach(() => {
    scraper = new BOJScraper();
  });

  afterEach(() => {
    scraper.clearCache();
  });

  describe('캐싱', () => {
    it(
      'should cache problem HTML',
      { timeout: 15000 },
      async () => {
        const problemId = 1000; // A+B

        // 첫 번째 요청 (캐시 미스)
        const html1 = await scraper.fetchProblemPage(problemId);
        expect(html1).toBeDefined();
        expect(html1.length).toBeGreaterThan(0);

        // 두 번째 요청 (캐시 히트, 3초 간격 없이 즉시 반환)
        const startTime = Date.now();
        const html2 = await scraper.fetchProblemPage(problemId);
        const elapsed = Date.now() - startTime;

        expect(html2).toEqual(html1);
        expect(elapsed).toBeLessThan(100); // 캐시 히트는 거의 즉시 반환
      }
    );

    it('should cache multiple problems', { timeout: 30000 }, async () => {
      const problemIds = [1000, 1001]; // A+B, A-B

      // 두 문제 조회
      const html1 = await scraper.fetchProblemPage(problemIds[0]);
      const html2 = await scraper.fetchProblemPage(problemIds[1]);

      expect(html1).toBeDefined();
      expect(html2).toBeDefined();
      expect(html1).not.toEqual(html2);

      // 캐시 통계 확인 (2개 항목 저장)
      const stats = scraper.getCacheStats();
      expect(stats.size).toBe(2);
    });

    it(
      'should bypass rate limiter on cache hit',
      { timeout: 15000 },
      async () => {
        const problemId = 1000;

        // 첫 번째 요청 (캐시 미스, Rate Limiter + 3초 간격)
        await scraper.fetchProblemPage(problemId);

        // 두 번째 요청 (캐시 히트, Rate Limiter 우회)
        const startTime = Date.now();
        await scraper.fetchProblemPage(problemId);
        const elapsed = Date.now() - startTime;

        // 캐시 히트 시 즉시 반환 (3초 대기 없음)
        expect(elapsed).toBeLessThan(100);
      }
    );
  });

  describe('캐시 관리', () => {
    it('should return cache statistics', () => {
      const stats = scraper.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('capacity');
      expect(stats).toHaveProperty('hitRate');
    });

    it('should clear cache', { timeout: 15000 }, async () => {
      // 캐시에 데이터 저장
      await scraper.fetchProblemPage(1000);

      let stats = scraper.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      // 캐시 초기화
      scraper.clearCache();

      stats = scraper.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('Rate Limiting (백업 보호)', () => {
    it('should apply rate limiting on cache miss', { timeout: 30000 }, async () => {
      // 캐시 미스 시에만 Rate Limiter 작동
      // (3초 간격이 주 보호 메커니즘이고, Rate Limiter는 백업)

      const problemIds = [1000, 1001, 1002];
      const startTime = Date.now();

      // 3개 문제 순차 조회 (각각 3초 간격)
      for (const id of problemIds) {
        await scraper.fetchProblemPage(id);
      }

      const elapsed = Date.now() - startTime;

      // 최소 6초 소요 (3초 × 2 간격)
      expect(elapsed).toBeGreaterThan(6000);
    });
  });

  describe('에러 케이스', () => {
    it('should throw error for invalid problem ID', async () => {
      await expect(scraper.fetchProblemPage(-1)).rejects.toThrow('유효하지 않은 문제 번호');
      await expect(scraper.fetchProblemPage(0)).rejects.toThrow('유효하지 않은 문제 번호');
      await expect(scraper.fetchProblemPage(1.5)).rejects.toThrow('유효하지 않은 문제 번호');
    });

    it('should not cache error responses', async () => {
      const invalidId = 99999999; // 존재하지 않는 문제

      // 첫 번째 요청 (에러)
      await expect(scraper.fetchProblemPage(invalidId)).rejects.toThrow();

      // 캐시에 저장되지 않아야 함
      const stats = scraper.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });
});
