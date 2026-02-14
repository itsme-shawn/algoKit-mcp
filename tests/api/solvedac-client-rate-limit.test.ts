/**
 * SolvedAcClient Rate Limiting 통합 테스트
 *
 * Rate Limiter가 SolvedAcClient에 정상적으로 통합되었는지 검증
 * - API 요청에 Rate Limiting 적용
 * - 캐시 히트 시 Rate Limiter 우회
 * - 여러 메서드 간 Rate Limit 공유
 * - Rate Limit 복구
 * - 성능 테스트
 * - 캐싱과의 조합
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SolvedAcClient } from '../../src/api/solvedac-client.js';
import { solvedAcLimiter } from '../../src/utils/rate-limiter.js';
import {
  mockProblem1000,
  mockSearchResult,
  mockTagSearchResult,
} from '../__mocks__/solved-ac-responses.js';

/**
 * 유틸리티: 지정된 밀리초만큼 대기
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('SolvedAcClient with Rate Limiting', () => {
  let client: SolvedAcClient;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    client = new SolvedAcClient();
    fetchSpy = vi.spyOn(global, 'fetch');

    // 캐시 초기화 (각 테스트 전 캐시 비우기)
    if (typeof client.clearCache === 'function') {
      client.clearCache();
    }

    // Rate Limiter 토큰 충전 대기 (1초 대기 → 10개 토큰 충전)
    await sleep(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Test Suite 7: SolvedAcClient 통합', () => {
    /**
     * Test-7.1: API 요청에 Rate Limiting 적용
     *
     * 20개 요청이 초당 10회 제한에 의해 제어됨
     */
    it(
      'should apply rate limiting to API requests',
      { timeout: 15000 },
      async () => {
        // 20개 서로 다른 문제의 응답 모킹
        const mockResponses = Array.from({ length: 20 }, () => ({
          ok: true,
          json: async () => mockProblem1000,
        }));

        fetchSpy.mockResolvedValueOnce(mockResponses[0] as Response);
        for (let i = 1; i < 20; i++) {
          fetchSpy.mockResolvedValueOnce(mockResponses[i] as Response);
        }

        // 20개 문제 동시 요청
        const promises = Array.from({ length: 20 }, (_, i) =>
          client.getProblem(1000 + i)
        );

        const start = Date.now();
        const results = await Promise.all(promises);
        const elapsed = Date.now() - start;

        // 검증
        // 소요 시간: 20개 / 10개/초 = 2초, 버스트 고려 최소 900ms (오차 허용)
        expect(elapsed).toBeGreaterThanOrEqual(900);

        // 모든 요청 성공
        expect(results).toHaveLength(20);
        results.forEach((result) => {
          expect(result).toBeDefined();
        });
      }
    );

    /**
     * Test-7.2: 캐시 히트 시 Rate Limiter 우회
     */
    it('should bypass rate limiter on cache hit', { timeout: 5000 }, async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProblem1000,
      } as Response);

      // 첫 요청 (캐시 미스, Rate Limiter 통과)
      await client.getProblem(1000);

      const start = Date.now();
      // 두 번째 요청 (캐시 히트, Rate Limiter 우회)
      await client.getProblem(1000);
      const elapsed = Date.now() - start;

      // 즉시 반환 (< 10ms)
      expect(elapsed).toBeLessThan(10);
    });

    /**
     * Test-7.3: 여러 메서드 혼용 시 Rate Limit 공유
     *
     * searchProblems, getProblem, searchTags가 동일한 Rate Limiter 사용
     */
    it(
      'should share rate limit across multiple methods',
      { timeout: 5000 },
      async () => {
        // 5개 메서드 호출 모킹
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResult,
        } as Response);

        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockProblem1000,
        } as Response);

        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTagSearchResult,
        } as Response);

        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResult,
        } as Response);

        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockProblem1000,
        } as Response);

        const promises = [
          client.searchProblems({ query: 'DP' }),
          client.getProblem(1000),
          client.searchTags('graph'),
          client.searchProblems({ level_min: 10 }),
          client.getProblem(2000),
        ];

        const start = Date.now();
        await Promise.all(promises);
        const elapsed = Date.now() - start;

        // 5개 요청이 모두 버킷 용량(10)에 들어가므로 즉시 처리
        // 소요 시간: < 100ms
        expect(elapsed).toBeLessThan(100);
      }
    );

    /**
     * Test-7.4: Rate Limit 대기 후 복구
     *
     * 토큰 소진 후 대기하고 정상 복구
     */
    it(
      'should recover after rate limit wait',
      { timeout: 5000 },
      async () => {
        // 10개 요청 모킹
        for (let i = 0; i < 11; i++) {
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => mockProblem1000,
          } as Response);
        }

        // 10개 토큰 소비
        for (let i = 0; i < 10; i++) {
          await client.getProblem(1000 + i);
        }

        // 11번째 요청 (토큰 충전 대기)
        const start = Date.now();
        await client.getProblem(2000);
        const elapsed = Date.now() - start;

        // 대기 시간: 90-200ms (초당 10개이므로 약 100ms)
        expect(elapsed).toBeGreaterThanOrEqual(90);
        expect(elapsed).toBeLessThan(200);
      }
    );
  });

  describe('Test Suite 8: 성능 테스트', () => {
    /**
     * Test-8.1: 100개 동시 요청 부하 테스트
     *
     * 100개 요청 / 10개/초 = 10초 (버스트 고려 9-12초)
     */
    it(
      'should handle 100 concurrent requests',
      { timeout: 15000 },
      async () => {
        // 100개 응답 모킹
        for (let i = 0; i < 100; i++) {
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => mockProblem1000,
          } as Response);
        }

        const promises = Array.from({ length: 100 }, (_, i) =>
          client.getProblem(1000 + i)
        );

        const start = Date.now();
        const results = await Promise.all(promises);
        const elapsed = Date.now() - start;

        // 검증
        // 소요 시간: 8.5-12초 (100개 / 10개/초 = 10초, 초기 버킷 10개 고려 시 9초, 오차 허용)
        expect(elapsed).toBeGreaterThanOrEqual(8500);
        expect(elapsed).toBeLessThan(12000);

        // 모든 요청 성공
        expect(results).toHaveLength(100);
      }
    );

    /**
     * Test-8.2: 지속적 부하 테스트
     *
     * 5초간 연속 요청 시 약 50개 처리 (5초 × 10개/초)
     */
    it(
      'should maintain rate limit during sustained load',
      { timeout: 15000 },
      async () => {
        // 충분한 응답 모킹
        for (let i = 0; i < 100; i++) {
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => mockProblem1000,
          } as Response);
        }

        const endTime = Date.now() + 5000;
        let count = 0;

        const start = Date.now();
        while (Date.now() < endTime) {
          await client.getProblem(1000 + count);
          count++;
        }
        const elapsed = Date.now() - start;

        // 검증
        // 총 요청 수: 55-65개 (초기 10개 + 5초 × 10개/초, 오차 허용)
        expect(count).toBeGreaterThanOrEqual(55);
        expect(count).toBeLessThanOrEqual(65);

        // 실제 소요 시간 5초 근처
        expect(elapsed).toBeGreaterThanOrEqual(5000);
        expect(elapsed).toBeLessThan(6000);
      }
    );
  });

  describe('Test Suite 9: 캐싱과의 조합', () => {
    /**
     * Test-9.1: 캐시로 Rate Limit 압력 감소
     *
     * 동일 문제 10번 요청 시 캐시 효과
     */
    it('should reduce rate limit pressure with caching', { timeout: 5000 }, async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProblem1000,
      } as Response);

      // 첫 요청으로 캐시 생성
      await client.getProblem(1000);

      // 이제 캐시에서 10번 요청 (모두 캐시 히트)
      const promises = Array.from({ length: 10 }, () => client.getProblem(1000));

      const start = Date.now();
      await Promise.all(promises);
      const elapsed = Date.now() - start;

      // 모두 캐시 히트 → 즉시 완료
      // 소요 시간: < 100ms
      expect(elapsed).toBeLessThan(100);
    });

    /**
     * Test-9.2: Rate Limiter 호출 횟수 검증
     *
     * 캐시 히트 시 Rate Limiter를 호출하지 않음
     */
    it('should not call rate limiter on cache hit', { timeout: 5000 }, async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProblem1000,
      } as Response);

      // Rate Limiter acquire 메서드 spy
      const spy = vi.spyOn(solvedAcLimiter, 'acquire');

      // 첫 요청 (캐시 미스, Rate Limiter 호출)
      await client.getProblem(1000);
      expect(spy).toHaveBeenCalledTimes(1);

      // 두 번째 요청 (캐시 히트, Rate Limiter 호출 안 함)
      await client.getProblem(1000);

      // 여전히 1회만 호출됨
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });
  });
});
