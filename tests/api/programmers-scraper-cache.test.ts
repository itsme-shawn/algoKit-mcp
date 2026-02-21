/**
 * 프로그래머스 스크래퍼 캐싱 단위 테스트 (fetch mock 기반)
 *
 * LRU 캐시 통합 검증 — fetch 호출 횟수로 캐시 히트 여부 확인
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProgrammersScraper } from '../../src/api/programmers-scraper.js';

/** 기본 mock API 응답 팩토리 */
function makeMockApiResponse(resultItems: object[] = []) {
  return {
    page: 1,
    perPage: 20,
    totalPages: 5,
    totalEntries: 100,
    result:
      resultItems.length > 0
        ? resultItems
        : [
            {
              id: 42748,
              title: 'K번째수',
              partTitle: '정렬',
              level: 1,
              finishedCount: 50000,
              acceptanceRate: 70,
            },
            {
              id: 42746,
              title: '가장 큰 수',
              partTitle: '정렬',
              level: 2,
              finishedCount: 40000,
              acceptanceRate: 55,
            },
            {
              id: 42747,
              title: 'H-Index',
              partTitle: '정렬',
              level: 2,
              finishedCount: 35000,
              acceptanceRate: 48,
            },
            {
              id: 42576,
              title: '완주하지 못한 선수',
              partTitle: '해시',
              level: 1,
              finishedCount: 80000,
              acceptanceRate: 60,
            },
            {
              id: 42577,
              title: '전화번호 목록',
              partTitle: '해시',
              level: 2,
              finishedCount: 55000,
              acceptanceRate: 30,
            },
            {
              id: 42578,
              title: '위장',
              partTitle: '해시',
              level: 2,
              finishedCount: 45000,
              acceptanceRate: 40,
            },
          ],
  };
}

describe('ProgrammersScraper Caching', () => {
  let scraper: ProgrammersScraper;

  beforeEach(() => {
    scraper = new ProgrammersScraper();
    scraper.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    scraper.clearCache();
  });

  describe('검색 결과 캐싱', () => {
    it('should cache search results and hit cache on second call', async () => {
      const mockData = makeMockApiResponse();
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      const options = { levels: [1], page: 1 };

      // 첫 번째 요청 (캐시 미스 → fetch 호출)
      const result1 = await scraper.searchProblems(options);
      expect(result1).toBeDefined();
      expect(result1.length).toBeGreaterThan(0);

      // 두 번째 요청 (캐시 히트 → fetch 호출 없음)
      const result2 = await scraper.searchProblems(options);
      expect(result2).toBeDefined();
      expect(result2).toEqual(result1);

      // fetch는 1번만 호출되어야 함
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // 캐시 통계 확인
      const stats = scraper.getCacheStats();
      expect(stats.search.hits).toBeGreaterThan(0);
      expect(stats.search.size).toBeGreaterThan(0);
    });

    it('should apply limit after cache hit', async () => {
      const mockData = makeMockApiResponse();
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      const options = { levels: [1], page: 1 };

      // 첫 번째 요청 (limit 없음, 전체 결과)
      const result1 = await scraper.searchProblems(options);
      expect(result1.length).toBeGreaterThan(5);

      // 두 번째 요청 (limit 5, 캐시 히트 후 슬라이싱)
      const result2 = await scraper.searchProblems({ ...options, limit: 5 });
      expect(result2.length).toBe(5);
      expect(result2).toEqual(result1.slice(0, 5));

      // fetch는 1번만 호출되어야 함
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should cache different search options separately', async () => {
      const mockDataLevel1 = makeMockApiResponse([
        { id: 42748, title: 'K번째수', partTitle: '정렬', level: 1, finishedCount: 50000, acceptanceRate: 70 },
      ]);
      const mockDataLevel2 = makeMockApiResponse([
        { id: 42746, title: '가장 큰 수', partTitle: '정렬', level: 2, finishedCount: 40000, acceptanceRate: 55 },
      ]);

      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockDataLevel1 } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockDataLevel2 } as Response);

      const options1 = { levels: [1], page: 1 };
      const options2 = { levels: [2], page: 1 };

      const result1 = await scraper.searchProblems(options1);
      const result2 = await scraper.searchProblems(options2);

      // 서로 다른 결과
      expect(result1).not.toEqual(result2);

      // fetch는 각 옵션마다 1번씩 총 2번 호출
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      // 캐시에 2개 항목 저장
      const stats = scraper.getCacheStats();
      expect(stats.search.size).toBe(2);
    });
  });

  describe('캐시 관리', () => {
    it('should return cache statistics', () => {
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

    it('should clear cache and reset size to 0', async () => {
      const mockData = makeMockApiResponse();
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      // 검색 캐시에 데이터 저장
      await scraper.searchProblems({ levels: [1], page: 1 });

      let stats = scraper.getCacheStats();
      expect(stats.search.size).toBeGreaterThan(0);

      // 캐시 초기화
      scraper.clearCache();

      stats = scraper.getCacheStats();
      expect(stats.search.size).toBe(0);
      expect(stats.problem.size).toBe(0);
    });

    it('should increment hit count on cache hit', async () => {
      const mockData = makeMockApiResponse();
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      const options = { levels: [1], page: 1 };

      // 첫 번째 요청 (캐시 미스)
      await scraper.searchProblems(options);

      const statsAfterMiss = scraper.getCacheStats();
      const hitsAfterMiss = statsAfterMiss.search.hits;

      // 두 번째 요청 (캐시 히트)
      await scraper.searchProblems(options);

      const statsAfterHit = scraper.getCacheStats();
      expect(statsAfterHit.search.hits).toBe(hitsAfterMiss + 1);
    });
  });
});
