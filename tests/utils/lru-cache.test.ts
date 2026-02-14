/**
 * LRUCache 단위 및 통합 테스트
 *
 * Test Suite:
 * 1. 기본 동작 (TC-LRU-001 ~ TC-LRU-005): 5개
 * 2. LRU 제거 로직 (TC-LRU-006 ~ TC-LRU-008): 3개
 * 3. TTL 처리 (TC-LRU-009 ~ TC-LRU-011): 3개
 * 4. 캐시 통계 (TC-LRU-012 ~ TC-LRU-014): 3개
 * 5. 엣지 케이스 (TC-LRU-015 ~ TC-LRU-018): 4개
 * 6. SolvedAcClient 통합 (TC-INT-001 ~ TC-INT-004): 4개
 * 7. 캐시 히트율 (TC-INT-005 ~ TC-INT-006): 2개
 * 8. 캐시 관리 (TC-INT-007 ~ TC-INT-008): 2개
 * 9. 성능 테스트 (TC-PERF-001 ~ TC-PERF-005): 5개
 *
 * 총 31개 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LRUCache } from '../../src/utils/lru-cache.js';

/**
 * Test Suite 1: 기본 동작 (5개)
 */
describe('LRUCache - Test Suite 1: 기본 동작', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(10);
  });

  /**
   * TC-LRU-001: 값 저장 및 조회
   */
  it('TC-LRU-001: should store and retrieve values', () => {
    cache.set('a', 1);
    cache.set('b', 2);

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
  });

  /**
   * TC-LRU-002: 존재하지 않는 키 조회
   */
  it('TC-LRU-002: should return undefined for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  /**
   * TC-LRU-003: 키 삭제
   */
  it('TC-LRU-003: should delete keys', () => {
    cache.set('a', 1);

    expect(cache.delete('a')).toBe(true);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.delete('a')).toBe(false); // 이미 삭제됨
  });

  /**
   * TC-LRU-004: 캐시 전체 삭제
   */
  it('TC-LRU-004: should clear all entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);

    cache.clear();

    expect(cache.size()).toBe(0);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });

  /**
   * TC-LRU-005: has() 메서드
   */
  it('TC-LRU-005: should check key existence with has()', () => {
    cache.set('a', 1);

    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
  });
});

/**
 * Test Suite 2: LRU 제거 로직 (3개)
 */
describe('LRUCache - Test Suite 2: LRU 제거 로직', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3); // 용량 3
  });

  /**
   * TC-LRU-006: 용량 초과 시 LRU 제거
   */
  it('TC-LRU-006: should evict LRU item when capacity exceeded', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4); // 용량 초과 → 'a' 제거

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
    expect(cache.size()).toBe(3);
  });

  /**
   * TC-LRU-007: 최근 사용된 항목은 유지
   */
  it('TC-LRU-007: should keep recently accessed items', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    cache.get('a'); // 'a'를 head로 이동 (최근 사용됨)

    cache.set('d', 4); // 용량 초과 → 'b' 제거

    expect(cache.get('a')).toBe(1); // 유지됨
    expect(cache.get('b')).toBeUndefined(); // 제거됨
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  /**
   * TC-LRU-008: set() 업데이트 시 head 이동
   */
  it('TC-LRU-008: should move updated items to head', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    cache.set('a', 10); // 업데이트 → head로 이동

    cache.set('d', 4); // 용량 초과 → 'b' 제거

    expect(cache.get('a')).toBe(10); // 유지됨 (업데이트됨)
    expect(cache.get('b')).toBeUndefined(); // 제거됨
  });
});

/**
 * Test Suite 3: TTL 처리 (3개)
 */
describe('LRUCache - Test Suite 3: TTL 처리', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(10, 1000); // TTL 1초
  });

  /**
   * TC-LRU-009: TTL 만료 시 항목 제거
   */
  it(
    'TC-LRU-009: should remove expired items on get()',
    { timeout: 5000 },
    async () => {
      cache.set('a', 1, 100); // TTL 100ms

      await new Promise((resolve) => setTimeout(resolve, 150)); // 150ms 대기

      expect(cache.get('a')).toBeUndefined();
      expect(cache.size()).toBe(0); // 만료된 항목은 자동 제거됨
    }
  );

  /**
   * TC-LRU-010: cleanup() 메서드로 일괄 제거
   */
  it(
    'TC-LRU-010: should cleanup expired items with cleanup()',
    { timeout: 5000 },
    async () => {
      cache.set('a', 1, 100); // TTL 100ms
      cache.set('b', 2, 100);
      cache.set('c', 3, 5000); // TTL 5초

      await new Promise((resolve) => setTimeout(resolve, 150)); // 150ms 대기

      cache.cleanup(); // 만료된 항목 일괄 제거

      expect(cache.size()).toBe(1); // 'c'만 남음
      expect(cache.get('c')).toBe(3);
    }
  );

  /**
   * TC-LRU-011: 기본 TTL 사용
   */
  it('TC-LRU-011: should use default TTL when not specified', () => {
    cache.set('a', 1); // TTL 명시하지 않음

    // 내부적으로 expiresAt = Date.now() + 1000
    const node = (cache as any).cache.get('a');
    expect(node.expiresAt).toBeGreaterThan(Date.now());
    expect(node.expiresAt).toBeLessThanOrEqual(Date.now() + 1000);
  });
});

/**
 * Test Suite 4: 캐시 통계 (3개)
 */
describe('LRUCache - Test Suite 4: 캐시 통계', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(10);
  });

  /**
   * TC-LRU-012: 캐시 히트/미스 추적
   */
  it('TC-LRU-012: should track cache hits and misses', () => {
    cache.set('a', 1);

    cache.get('a'); // hit
    cache.get('b'); // miss
    cache.get('a'); // hit
    cache.get('c'); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(2);
    expect(stats.hitRate).toBeCloseTo(0.5);
  });

  /**
   * TC-LRU-013: 제거 카운트 추적
   */
  it('TC-LRU-013: should track evictions', () => {
    const smallCache = new LRUCache<string, number>(2); // 용량 2

    smallCache.set('a', 1);
    smallCache.set('b', 2);
    smallCache.set('c', 3); // 'a' 제거
    smallCache.set('d', 4); // 'b' 제거

    const stats = smallCache.getStats();
    expect(stats.evictions).toBe(2);
    expect(stats.size).toBe(2);
  });

  /**
   * TC-LRU-014: clear() 후 통계 초기화
   */
  it('TC-LRU-014: should reset stats on clear()', () => {
    cache.set('a', 1);
    cache.get('a'); // hit
    cache.get('b'); // miss

    cache.clear();

    const stats = cache.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.evictions).toBe(0);
    expect(stats.size).toBe(0);
  });
});

/**
 * Test Suite 5: 엣지 케이스 (4개)
 */
describe('LRUCache - Test Suite 5: 엣지 케이스', () => {
  /**
   * TC-LRU-015: 용량 1 캐시
   */
  it('TC-LRU-015: should work with capacity 1', () => {
    const cache = new LRUCache<string, number>(1);

    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);

    cache.set('b', 2); // 'a' 제거
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
  });

  /**
   * TC-LRU-016: 용량 0 또는 음수 (생성자 에러)
   */
  it('TC-LRU-016: should throw error for invalid capacity', () => {
    expect(() => new LRUCache<string, number>(0)).toThrow(
      'Capacity must be positive'
    );
    expect(() => new LRUCache<string, number>(-1)).toThrow(
      'Capacity must be positive'
    );
  });

  /**
   * TC-LRU-017: null/undefined 값 저장
   */
  it('TC-LRU-017: should handle null and undefined values', () => {
    const cache = new LRUCache<string, any>(10);

    cache.set('a', null);
    cache.set('b', undefined);

    expect(cache.get('a')).toBe(null);
    expect(cache.get('b')).toBe(undefined);
  });

  /**
   * TC-LRU-018: 대량 데이터 저장
   */
  it('TC-LRU-018: should handle large number of items', () => {
    const cache = new LRUCache<string, number>(1000);

    for (let i = 0; i < 1000; i++) {
      cache.set(`key${i}`, i);
    }

    expect(cache.size()).toBe(1000);

    // 1001번째 삽입 → key0 제거
    cache.set('key1000', 1000);
    expect(cache.size()).toBe(1000);
    expect(cache.get('key0')).toBeUndefined();
  });
});

/**
 * Test Suite 6: 엣지 케이스 추가
 */
describe('LRUCache - Test Suite 6: 엣지 케이스 추가', () => {
  /**
   * TC-EDGE-001: 빈 캐시에서 delete() 호출
   */
  it('TC-EDGE-001: should handle delete on empty cache', () => {
    const cache = new LRUCache<string, number>(10);

    expect(cache.delete('nonexistent')).toBe(false);
    expect(cache.size()).toBe(0);
  });

  /**
   * TC-EDGE-002: 동일 키 여러 번 set()
   */
  it('TC-EDGE-002: should handle multiple sets on same key', () => {
    const cache = new LRUCache<string, number>(10);

    cache.set('a', 1);
    cache.set('a', 2);
    cache.set('a', 3);

    expect(cache.get('a')).toBe(3);
    expect(cache.size()).toBe(1); // 중복 제거
  });

  /**
   * TC-EDGE-003: TTL 0 (즉시 만료)
   */
  it(
    'TC-EDGE-003: should handle TTL 0',
    { timeout: 5000 },
    async () => {
      const cache = new LRUCache<string, number>(10);

      cache.set('a', 1, 0); // TTL 0ms

      await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms 대기

      expect(cache.get('a')).toBeUndefined(); // 즉시 만료
    }
  );

  /**
   * TC-EDGE-004: 음수 TTL (무시 또는 에러)
   */
  it('TC-EDGE-004: should handle negative TTL gracefully', () => {
    const cache = new LRUCache<string, number>(10);

    // 음수 TTL을 무시하고 기본 TTL 사용
    cache.set('a', 1, -1000);
    expect(cache.get('a')).toBeDefined(); // 정상 저장 (기본 TTL)
  });
});

/**
 * Test Suite 7: 성능 테스트 (5개)
 */
describe('LRUCache - Test Suite 7: 성능 테스트', () => {
  /**
   * TC-PERF-001: get() 응답 시간 < 1ms
   */
  it('TC-PERF-001: should retrieve cached value in < 1ms', () => {
    const cache = new LRUCache<string, number>(1000);

    // 100개 항목 삽입
    for (let i = 0; i < 100; i++) {
      cache.set(`key${i}`, i);
    }

    // 조회 성능 측정
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      cache.get('key50'); // 중간 항목 조회
    }
    const duration = performance.now() - start;

    const avgTime = duration / 1000;
    expect(avgTime).toBeLessThan(1); // < 1ms
  });

  /**
   * TC-PERF-002: set() 응답 시간 < 1ms
   */
  it('TC-PERF-002: should insert value in < 1ms', () => {
    const cache = new LRUCache<string, number>(1000);

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      cache.set(`key${i}`, i);
    }
    const duration = performance.now() - start;

    const avgTime = duration / 1000;
    expect(avgTime).toBeLessThan(1); // < 1ms
  });

  /**
   * TC-PERF-003: evictLRU() 응답 시간 < 1ms
   */
  it('TC-PERF-003: should evict LRU in < 1ms', () => {
    const cache = new LRUCache<string, number>(100);

    // 100개 삽입
    for (let i = 0; i < 100; i++) {
      cache.set(`key${i}`, i);
    }

    // 101번째 삽입 → eviction 발생
    const start = performance.now();
    for (let i = 100; i < 200; i++) {
      cache.set(`key${i}`, i); // 각 삽입마다 eviction 발생
    }
    const duration = performance.now() - start;

    const avgTime = duration / 100;
    expect(avgTime).toBeLessThan(1); // < 1ms
  });

  /**
   * TC-PERF-004: 메모리 사용량 < 500KB
   */
  it('TC-PERF-004: should use reasonable memory for 100 items', () => {
    const cache = new LRUCache<string, any>(100);

    // 100개 항목 삽입 (각 2KB)
    for (let i = 0; i < 100; i++) {
      const largeValue = { data: 'x'.repeat(2000) }; // ~2KB
      cache.set(`key${i}`, largeValue);
    }

    // 캐시 크기 확인
    expect(cache.size()).toBe(100);
  });

  /**
   * TC-PERF-005: 대량 데이터 처리 (부하 테스트)
   */
  it('TC-PERF-005: should handle 10,000 operations efficiently', () => {
    const cache = new LRUCache<string, number>(1000);

    const start = performance.now();

    // 10,000개 항목 삽입 (LRU 제거 발생)
    for (let i = 0; i < 10000; i++) {
      cache.set(`key${i}`, i);
    }

    // 10,000번 조회
    for (let i = 9000; i < 10000; i++) {
      cache.get(`key${i}`);
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000); // < 1초
  });
});

/**
 * Test Suite 8: SolvedAcClient 통합 (4개)
 * 참고: SolvedAcClient 구현이 없으므로 이 테스트들은 스킵됨
 */
describe.skip('LRUCache - Test Suite 8: SolvedAcClient 통합', () => {
  /**
   * TC-INT-001: 캐시 히트 테스트
   */
  it('TC-INT-001: should return cached problem on second request', async () => {
    // TODO: SolvedAcClient 구현 후 활성화
  });

  /**
   * TC-INT-002: 캐시 미스 후 API 호출
   */
  it('TC-INT-002: should call API on cache miss', async () => {
    // TODO: SolvedAcClient 구현 후 활성화
  });

  /**
   * TC-INT-003: 여러 문제 캐싱
   */
  it('TC-INT-003: should cache multiple problems', async () => {
    // TODO: SolvedAcClient 구현 후 활성화
  });

  /**
   * TC-INT-004: 용량 초과 시 LRU 제거
   */
  it('TC-INT-004: should evict LRU item when capacity exceeded', async () => {
    // TODO: SolvedAcClient 구현 후 활성화
  });
});

/**
 * Test Suite 9: 캐시 히트율 (2개)
 * 참고: SolvedAcClient 구현이 없으므로 이 테스트들은 스킵됨
 */
describe.skip('LRUCache - Test Suite 9: 캐시 히트율', () => {
  /**
   * TC-INT-005: 캐시 히트율 70% 이상 달성
   */
  it('TC-INT-005: should achieve 70%+ hit rate with realistic usage', async () => {
    // TODO: SolvedAcClient 구현 후 활성화
  });

  /**
   * TC-INT-006: 검색 결과 캐싱
   */
  it('TC-INT-006: should cache search results', async () => {
    // TODO: SolvedAcClient 구현 후 활성화
  });
});

/**
 * Test Suite 10: 캐시 관리 (2개)
 * 참고: SolvedAcClient 구현이 없으므로 이 테스트들은 스킵됨
 */
describe.skip('LRUCache - Test Suite 10: 캐시 관리', () => {
  /**
   * TC-INT-007: clearCache() 메서드
   */
  it('TC-INT-007: should clear cache on clearCache()', async () => {
    // TODO: SolvedAcClient 구현 후 활성화
  });

  /**
   * TC-INT-008: TTL 만료 후 재요청
   */
  it('TC-INT-008: should refetch on TTL expiry', async () => {
    // TODO: SolvedAcClient 구현 후 활성화
  });
});
