/**
 * Rate Limiter 유틸리티
 *
 * Token Bucket 알고리즘을 사용하여 API 호출 속도 제한
 * - 초기 버킷은 최대 용량으로 시작
 * - 매 초마다 refillRate만큼 토큰 충전 (최대 capacity까지)
 * - 토큰 부족 시 대기 (최대 maxWaitTime)
 */

import { RateLimitTimeoutError } from '../api/types.js';

/**
 * RateLimiter 옵션
 */
export interface RateLimiterOptions {
  /** 버킷 최대 용량 (한 번에 사용 가능한 최대 토큰 수) */
  capacity: number;

  /** 토큰 충전 속도 (초당 토큰 수) */
  refillRate: number;

  /** 대기 시 최대 타임아웃 (밀리초, 기본값: 5000ms) */
  maxWaitTime?: number;
}

/**
 * Token Bucket 기반 Rate Limiter
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter({
 *   capacity: 10,
 *   refillRate: 10,
 *   maxWaitTime: 5000
 * });
 *
 * // 토큰 획득 (대기 가능)
 * await limiter.acquire();
 *
 * // 토큰 획득 시도 (즉시 반환)
 * if (limiter.tryAcquire()) {
 *   // API 호출
 * }
 * ```
 */
export class RateLimiter {
  /** 버킷 최대 용량 */
  private readonly capacity: number;

  /** 토큰 충전 속도 (초당) */
  private readonly refillRate: number;

  /** 대기 최대 타임아웃 (밀리초) */
  private readonly maxWaitTime: number;

  /** 현재 토큰 수 */
  private tokens: number;

  /** 마지막 충전 시간 (밀리초) */
  private lastRefillTime: number;

  /** 대기 중인 요청 큐 */
  private waitQueue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    tokensNeeded: number;
    timeoutId?: NodeJS.Timeout;
  }> = [];

  /**
   * RateLimiter 생성
   *
   * @param options - Rate Limiter 설정
   */
  constructor(options: RateLimiterOptions) {
    this.capacity = options.capacity;
    this.refillRate = options.refillRate;
    this.maxWaitTime = options.maxWaitTime ?? 5000;

    // 초기 상태: 버킷이 가득 차 있음
    this.tokens = options.capacity;
    this.lastRefillTime = Date.now();
  }

  /**
   * 토큰 1개를 획득합니다. 토큰이 없으면 대기합니다.
   *
   * @throws {RateLimitTimeoutError} maxWaitTime 초과 시
   *
   * @example
   * ```typescript
   * await limiter.acquire();
   * // API 호출 진행
   * ```
   */
  async acquire(): Promise<void> {
    // 1. 토큰 충전
    this.refill();

    // 2. 토큰 사용 가능 확인
    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.processQueue(); // 대기 중인 요청 처리
      return; // 즉시 반환
    }

    // 3. 토큰 부족 시 대기 큐에 추가
    return new Promise<void>((resolve, reject) => {
      const waitTime = this.calculateWaitTime(1);

      // 4. 타임아웃 체크
      if (waitTime > this.maxWaitTime) {
        const retryAfterSeconds = Math.ceil(waitTime / 1000);
        reject(new RateLimitTimeoutError(retryAfterSeconds));
        return;
      }

      // 5. 큐에 추가
      const timeoutId = setTimeout(() => {
        // 타임아웃 발생
        const index = this.waitQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
          const retryAfterSeconds = Math.ceil(waitTime / 1000);
          reject(new RateLimitTimeoutError(retryAfterSeconds));
        }
      }, this.maxWaitTime);

      this.waitQueue.push({
        resolve,
        reject,
        tokensNeeded: 1,
        timeoutId,
      });

      // 6. 큐 처리 시작
      this.processQueue();
    });
  }

  /**
   * 대기 큐를 처리합니다
   *
   * @private
   */
  private processQueue(): void {
    if (this.waitQueue.length === 0) {
      return;
    }

    // 토큰 충전
    this.refill();

    // 큐에서 처리 가능한 요청 처리
    while (this.waitQueue.length > 0 && this.tokens >= 1) {
      const waiter = this.waitQueue.shift();
      if (!waiter) break;

      // 타임아웃 타이머 취소
      if (waiter.timeoutId) {
        clearTimeout(waiter.timeoutId);
      }

      // 토큰 소비
      this.tokens -= 1;

      // Promise resolve
      waiter.resolve();
    }

    // 남은 대기자가 있으면 다음 충전 시간에 다시 처리
    if (this.waitQueue.length > 0) {
      const nextRefillTime = this.calculateWaitTime(1);
      setTimeout(() => this.processQueue(), nextRefillTime);
    }
  }

  /**
   * 토큰 획득을 시도합니다. 즉시 반환합니다. (대기 없음)
   *
   * @returns 성공 여부 (true: 토큰 획득, false: 토큰 부족)
   *
   * @example
   * ```typescript
   * if (limiter.tryAcquire()) {
   *   // API 호출
   * } else {
   *   // 나중에 재시도
   * }
   * ```
   */
  tryAcquire(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * 현재 사용 가능한 토큰 수를 반환합니다 (테스트/디버깅용)
   *
   * @returns 현재 토큰 수
   */
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * 대기 중인 요청 수를 반환합니다 (테스트/디버깅용)
   *
   * @returns 대기 중인 요청 수
   */
  getWaitingCount(): number {
    return this.waitQueue.length;
  }

  /**
   * 토큰을 충전합니다 (시간 경과에 따라)
   *
   * @private
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefillTime) / 1000; // 초 단위 변환

    if (elapsed <= 0) {
      return; // 시간 경과 없음
    }

    // 충전할 토큰 수 계산
    const tokensToAdd = elapsed * this.refillRate;

    // 버킷 용량 초과 방지
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);

    // 마지막 충전 시간 업데이트
    this.lastRefillTime = now;
  }

  /**
   * 필요한 토큰을 얻기 위한 대기 시간을 계산합니다 (밀리초)
   *
   * @param tokensNeeded - 필요한 토큰 수
   * @returns 대기 시간 (밀리초)
   *
   * @private
   */
  private calculateWaitTime(tokensNeeded: number): number {
    const tokensShortage = tokensNeeded - this.tokens;

    if (tokensShortage <= 0) {
      return 0; // 이미 충분
    }

    // 부족한 토큰을 충전하는 데 걸리는 시간 (밀리초)
    return (tokensShortage / this.refillRate) * 1000;
  }

  /**
   * 지연 함수
   *
   * @param ms - 대기 시간 (밀리초)
   * @returns Promise
   *
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

/**
 * solved.ac API Rate Limiter
 *
 * - 버킷 용량: 10개
 * - 충전 속도: 초당 10개
 * - 최대 대기: 15초
 *
 * @example
 * ```typescript
 * import { solvedAcLimiter } from './utils/rate-limiter.js';
 *
 * await solvedAcLimiter.acquire();
 * // API 호출 진행
 * ```
 */
export const solvedAcLimiter = new RateLimiter({
  capacity: 10,
  refillRate: 10,
  maxWaitTime: 15000,
});
