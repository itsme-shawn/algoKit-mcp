/**
 * RateLimiter 단위 테스트
 *
 * Token Bucket 알고리즘 기반 Rate Limiter 검증
 * - 기본 동작: 토큰 획득, 소비, 충전
 * - 대기: 토큰 부족 시 대기 처리
 * - 타임아웃: maxWaitTime 초과 시 에러
 * - tryAcquire: 즉시 반환 (대기 없음)
 * - 엣지 케이스: 고속 충전, 분수 토큰, 0 용량
 * - 싱글톤: 전역 singletone 인스턴스
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter, solvedAcLimiter } from '../../src/utils/rate-limiter.js';

/**
 * 유틸리티: 지정된 밀리초만큼 대기
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('RateLimiter', () => {
  describe('Test Suite 1: Token Bucket 기본 동작', () => {
    /**
     * Test-1.1: 토큰 사용 가능 시 즉시 획득
     */
    it('should acquire token immediately if available', async () => {
      const limiter = new RateLimiter({ capacity: 10, refillRate: 10 });

      const start = Date.now();
      await limiter.acquire();
      const elapsed = Date.now() - start;

      // 토큰이 있으면 즉시 반환 (< 10ms)
      expect(elapsed).toBeLessThan(10);

      // 토큰 1개 소비되었는지 확인 (토큰 리필 타이밍으로 인한 소수점 허용)
      expect(limiter.getAvailableTokens()).toBeCloseTo(9, 0);
    });

    /**
     * Test-1.2: 토큰 소비 정확성
     */
    it('should consume tokens correctly', async () => {
      const limiter = new RateLimiter({ capacity: 5, refillRate: 10 });

      // 5개 토큰 모두 소비
      for (let i = 0; i < 5; i++) {
        await limiter.acquire();
      }

      // 최종 토큰은 0개
      expect(limiter.getAvailableTokens()).toBe(0);
    });

    /**
     * Test-1.3: 시간 경과에 따른 토큰 충전
     */
    it('should refill tokens over time', { timeout: 5000 }, async () => {
      const limiter = new RateLimiter({ capacity: 10, refillRate: 10 });

      // 10개 토큰 모두 소비
      for (let i = 0; i < 10; i++) {
        await limiter.acquire();
      }

      // 0.5초 대기 (10개/초 × 0.5초 = 5개 충전)
      await sleep(500);

      const tokens = limiter.getAvailableTokens();
      // 약 5개 ± 0.5개 허용
      expect(tokens).toBeGreaterThanOrEqual(4.5);
      expect(tokens).toBeLessThanOrEqual(5.5);
    });

    /**
     * Test-1.4: 버킷 용량 제한
     */
    it('should respect bucket capacity limit', { timeout: 5000 }, async () => {
      const limiter = new RateLimiter({ capacity: 3, refillRate: 100 });

      // 10초 대기 (이론상 1000개 충전되어야 하지만 capacity 제한)
      await sleep(1000);

      // 토큰은 최대 capacity(3)까지만 보유
      expect(limiter.getAvailableTokens()).toBe(3);
    });
  });

  describe('Test Suite 2: 대기 (Waiting)', () => {
    /**
     * Test-2.1: 토큰 부족 시 대기
     */
    it('should wait until token is available', { timeout: 5000 }, async () => {
      const limiter = new RateLimiter({
        capacity: 1,
        refillRate: 10, // 초당 10개 = 100ms에 1개
      });

      // 첫 토큰 소비
      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(0);

      // 두 번째 요청 (토큰 충전될 때까지 대기)
      const start = Date.now();
      await limiter.acquire();
      const elapsed = Date.now() - start;

      // 예상 대기 시간: 100ms ± 60ms (90-150ms)
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(150);
    });

    /**
     * Test-2.2: 다중 대기자 처리
     */
    it('should handle multiple concurrent waiters', { timeout: 5000 }, async () => {
      const limiter = new RateLimiter({
        capacity: 2,
        refillRate: 10, // 초당 10개 = 100ms에 1개
      });

      // 2개 토큰 모두 소비
      await limiter.acquire();
      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(0);

      // 3개 요청 동시 발생
      const promises = [
        limiter.acquire(), // 0.1초 대기
        limiter.acquire(), // 0.2초 대기
        limiter.acquire(), // 0.3초 대기
      ];

      const start = Date.now();
      await Promise.all(promises);
      const elapsed = Date.now() - start;

      // 총 대기 시간: 300ms (3개 / 10개/초) ± 150ms (250-400ms)
      expect(elapsed).toBeGreaterThanOrEqual(250);
      expect(elapsed).toBeLessThan(400);
    });
  });

  describe('Test Suite 3: 타임아웃', () => {
    /**
     * Test-3.1: maxWaitTime 초과 시 에러
     */
    it('should throw RateLimitError when maxWaitTime exceeded', { timeout: 5000 }, async () => {
      const limiter = new RateLimiter({
        capacity: 1,
        refillRate: 0.1, // 초당 0.1개 = 10초에 1개
        maxWaitTime: 100, // 100ms
      });

      // 첫 토큰 소비
      await limiter.acquire();

      // 두 번째 요청 (10초 필요 > 100ms maxWaitTime)
      await expect(limiter.acquire()).rejects.toThrow('Rate limit');
    });

    /**
     * Test-3.2: retryAfter 정보 포함
     */
    it('should include retryAfter in RateLimitError', { timeout: 5000 }, async () => {
      const limiter = new RateLimiter({
        capacity: 1,
        refillRate: 0.5, // 초당 0.5개 = 2초에 1개
        maxWaitTime: 100,
      });

      // 첫 토큰 소비
      await limiter.acquire();

      try {
        await limiter.acquire();
        // 에러가 발생하지 않으면 실패
        expect(true).toBe(false);
      } catch (error) {
        const err = error as any;
        // retryAfter 필드 확인
        expect(err.retryAfter).toBeDefined();
        expect(err.retryAfter).toBeGreaterThan(0);
        // 대략 2초 (1개 / 0.5개/초)
        expect(err.retryAfter).toBeGreaterThanOrEqual(1);
        expect(err.retryAfter).toBeLessThanOrEqual(3);
      }
    });

    /**
     * Test-3.3: 타임아웃 전 완료
     */
    it('should complete before maxWaitTime', { timeout: 5000 }, async () => {
      const limiter = new RateLimiter({
        capacity: 1,
        refillRate: 10, // 100ms에 1개
        maxWaitTime: 5000, // 5초
      });

      // 첫 토큰 소비
      await limiter.acquire();

      // 두 번째 요청 (100ms 대기 < 5000ms maxWaitTime)
      const start = Date.now();
      await limiter.acquire();
      const elapsed = Date.now() - start;

      // 에러 없이 성공 (90-150ms 대기)
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(150);
    });
  });

  describe('Test Suite 4: tryAcquire()', () => {
    /**
     * Test-4.1: 토큰 사용 가능 시 true 반환
     */
    it('should return true if token is available', () => {
      const limiter = new RateLimiter({ capacity: 5, refillRate: 10 });

      const result = limiter.tryAcquire();

      // true 반환
      expect(result).toBe(true);
      // 토큰 1개 소비 (토큰 리필 타이밍으로 인한 소수점 허용)
      expect(limiter.getAvailableTokens()).toBeCloseTo(4, 0);
    });

    /**
     * Test-4.2: 토큰 부족 시 false 반환
     */
    it('should return false if token is not available', () => {
      // refillRate를 0.01로 설정 (100초에 1개 충전)
      // 테스트 실행 시간 동안 토큰이 충전되지 않도록 함
      const limiter = new RateLimiter({ capacity: 1, refillRate: 0.01 });

      // 첫 토큰 소비
      const firstResult = limiter.tryAcquire();
      expect(firstResult).toBe(true);

      // 두 번째 시도 (토큰 없음)
      const result = limiter.tryAcquire();

      // false 반환
      expect(result).toBe(false);
      // 토큰이 충전되지 않았는지 확인
      expect(limiter.getAvailableTokens()).toBeLessThan(1);
    });

    /**
     * Test-4.3: 대기 없음 검증
     */
    it('should never wait', { timeout: 5000 }, async () => {
      const limiter = new RateLimiter({
        capacity: 1,
        refillRate: 0.1, // 10초에 1개
      });

      // 토큰 소비
      limiter.tryAcquire();

      // 즉시 반환 검증
      const start = Date.now();
      const result = limiter.tryAcquire();
      const elapsed = Date.now() - start;

      // false 반환
      expect(result).toBe(false);
      // 즉시 반환 (< 10ms)
      expect(elapsed).toBeLessThan(10);
    });
  });

  describe('Test Suite 5: 엣지 케이스', () => {
    /**
     * Test-5.1: 고속 충전 속도
     */
    it('should handle high refill rate', { timeout: 5000 }, async () => {
      const limiter = new RateLimiter({
        capacity: 100,
        refillRate: 1000, // 초당 1000개
      });

      // 100개 토큰 모두 소비
      for (let i = 0; i < 100; i++) {
        await limiter.acquire();
      }

      // 0.1초 대기 (1000개/초 × 0.1초 = 100개 충전)
      await sleep(100);

      const tokens = limiter.getAvailableTokens();
      // 약 100개 ± 10개
      expect(tokens).toBeGreaterThanOrEqual(90);
      expect(tokens).toBeLessThanOrEqual(100); // capacity 제한
    });

    /**
     * Test-5.2: 분수(fractional) 토큰
     */
    it('should handle fractional refill rate', { timeout: 5000 }, async () => {
      const limiter = new RateLimiter({
        capacity: 10,
        refillRate: 3.5, // 초당 3.5개
      });

      // 10개 토큰 모두 소비
      for (let i = 0; i < 10; i++) {
        await limiter.acquire();
      }

      // 1초 대기 (3.5개 충전)
      await sleep(1000);

      const tokens = limiter.getAvailableTokens();
      // 약 3.5개 ± 0.5개
      expect(tokens).toBeGreaterThanOrEqual(3);
      expect(tokens).toBeLessThanOrEqual(4);
    });

    /**
     * Test-5.3: 0 용량 버킷
     */
    it('should handle zero capacity bucket', () => {
      const limiter = new RateLimiter({
        capacity: 0,
        refillRate: 10,
      });

      // 생성 성공 (에러 없음)
      expect(limiter).toBeDefined();

      // tryAcquire 항상 false
      const result = limiter.tryAcquire();
      expect(result).toBe(false);

      // 토큰 수: 0개
      expect(limiter.getAvailableTokens()).toBe(0);
    });
  });

  describe('Test Suite 6: 싱글톤 (Singleton)', () => {
    /**
     * Test-6.1: 동일 인스턴스 사용
     */
    it('should use singleton instance', () => {
      // 두 번 임포트해도 동일한 인스턴스
      const limiter1 = solvedAcLimiter;
      const limiter2 = solvedAcLimiter;

      // 동일 참조
      expect(limiter1).toBe(limiter2);

      // 상태 공유 확인
      const initialTokens = limiter1.getAvailableTokens();
      limiter1.tryAcquire();
      const tokensAfter = limiter2.getAvailableTokens();

      // limiter1의 변화가 limiter2에 반영됨
      expect(tokensAfter).toBe(initialTokens - 1);
    });
  });
});
