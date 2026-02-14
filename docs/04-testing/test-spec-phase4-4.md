# Task 4.4: LRU 캐싱 최적화 테스트 스펙

**작성자**: project-manager
**작성일**: 2026-02-15
**상태**: 테스트 스펙 완료
**관련 Task**: Task 4.4 (Phase 4)
**설계 문서**: [lru-caching-design.md](../01-planning/lru-caching-design.md)
**구현 가이드**: [lru-caching-implementation.md](../02-development/lru-caching-implementation.md)

---

## 목차

1. [테스트 개요](#1-테스트-개요)
2. [단위 테스트 (LRUCache)](#2-단위-테스트-lrucache)
3. [단위 테스트 (CacheStats)](#3-단위-테스트-cachestats)
4. [통합 테스트 (SolvedAcClient)](#4-통합-테스트-solvedacclient)
5. [성능 테스트](#5-성능-테스트)
6. [엣지 케이스 테스트](#6-엣지-케이스-테스트)
7. [테스트 실행 계획](#7-테스트-실행-계획)
8. [성공 기준](#8-성공-기준)

---

## 1. 테스트 개요

### 1.1 테스트 범위

| 테스트 타입 | 파일 | 테스트 수 | 우선순위 |
|-------------|------|-----------|----------|
| **단위 테스트 (LRUCache)** | `tests/utils/lru-cache.test.ts` | 15-20개 | P0 |
| **단위 테스트 (CacheStats)** | `tests/utils/cache-stats.test.ts` | 5-8개 | P1 |
| **통합 테스트 (SolvedAcClient)** | `tests/api/solvedac-client-cache.test.ts` | 8-12개 | P0 |
| **성능 테스트** | `tests/performance/lru-cache-perf.test.ts` | 5개 | P1 |
| **엣지 케이스** | 각 테스트 파일에 포함 | 10개 | P2 |

**총 테스트 수**: 43-55개

### 1.2 테스트 우선순위

**P0 (최우선)**:
- LRUCache 기본 동작 (get, set, delete, clear)
- LRU 제거 로직 (evictLRU)
- TTL 처리
- SolvedAcClient 통합

**P1 (높음)**:
- 캐시 통계 (CacheStats)
- 성능 벤치마크
- 메모리 사용량

**P2 (중간)**:
- 엣지 케이스 (0 용량, 음수 TTL, null/undefined)

### 1.3 테스트 도구

- **프레임워크**: vitest (기존 사용 중)
- **Mock**: vitest의 vi.fn()
- **타이머**: vi.useFakeTimers() (TTL 테스트)
- **성능 측정**: performance.now()

---

## 2. 단위 테스트 (LRUCache)

### 2.1 기본 동작 테스트

**파일**: `tests/utils/lru-cache.test.ts`

#### TC-LRU-001: 값 저장 및 조회
```typescript
it('should store and retrieve values', () => {
  const cache = new LRUCache<string, number>(10);
  cache.set('a', 1);
  cache.set('b', 2);

  expect(cache.get('a')).toBe(1);
  expect(cache.get('b')).toBe(2);
});
```

**검증**:
- ✅ set() 후 get()으로 동일한 값 반환
- ✅ 여러 키 저장 가능

#### TC-LRU-002: 존재하지 않는 키 조회
```typescript
it('should return undefined for non-existent keys', () => {
  const cache = new LRUCache<string, number>(10);

  expect(cache.get('nonexistent')).toBeUndefined();
});
```

**검증**:
- ✅ 캐시 미스 시 undefined 반환
- ✅ 에러 없이 정상 동작

#### TC-LRU-003: 키 삭제
```typescript
it('should delete keys', () => {
  const cache = new LRUCache<string, number>(10);
  cache.set('a', 1);

  expect(cache.delete('a')).toBe(true);
  expect(cache.get('a')).toBeUndefined();
  expect(cache.delete('a')).toBe(false); // 이미 삭제됨
});
```

**검증**:
- ✅ delete() 성공 시 true 반환
- ✅ 삭제된 키는 get()으로 조회 불가
- ✅ 존재하지 않는 키 삭제 시 false 반환

#### TC-LRU-004: 캐시 전체 삭제
```typescript
it('should clear all entries', () => {
  const cache = new LRUCache<string, number>(10);
  cache.set('a', 1);
  cache.set('b', 2);

  cache.clear();

  expect(cache.size()).toBe(0);
  expect(cache.get('a')).toBeUndefined();
  expect(cache.get('b')).toBeUndefined();
});
```

**검증**:
- ✅ clear() 후 size === 0
- ✅ 모든 키 조회 불가

#### TC-LRU-005: has() 메서드
```typescript
it('should check key existence with has()', () => {
  const cache = new LRUCache<string, number>(10);
  cache.set('a', 1);

  expect(cache.has('a')).toBe(true);
  expect(cache.has('b')).toBe(false);
});
```

**검증**:
- ✅ 존재하는 키는 true
- ✅ 존재하지 않는 키는 false

---

### 2.2 LRU 제거 로직 테스트

#### TC-LRU-006: 용량 초과 시 LRU 제거
```typescript
it('should evict LRU item when capacity exceeded', () => {
  const cache = new LRUCache<string, number>(3); // 용량 3

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  cache.set('d', 4); // 용량 초과 → 'a' 제거 (가장 오래됨)

  expect(cache.get('a')).toBeUndefined();
  expect(cache.get('b')).toBe(2);
  expect(cache.get('c')).toBe(3);
  expect(cache.get('d')).toBe(4);
  expect(cache.size()).toBe(3);
});
```

**검증**:
- ✅ 용량 초과 시 가장 오래된 항목(tail) 제거
- ✅ size() === capacity
- ✅ 제거된 항목은 조회 불가

#### TC-LRU-007: 최근 사용된 항목은 유지
```typescript
it('should keep recently accessed items', () => {
  const cache = new LRUCache<string, number>(3);

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);

  cache.get('a'); // 'a'를 head로 이동 (최근 사용됨)

  cache.set('d', 4); // 용량 초과 → 'b' 제거 ('a'는 최근 사용됨)

  expect(cache.get('a')).toBe(1); // 유지됨
  expect(cache.get('b')).toBeUndefined(); // 제거됨
  expect(cache.get('c')).toBe(3);
  expect(cache.get('d')).toBe(4);
});
```

**검증**:
- ✅ get() 호출 시 항목이 head로 이동
- ✅ 최근 사용된 항목은 제거되지 않음

#### TC-LRU-008: set() 업데이트 시 head 이동
```typescript
it('should move updated items to head', () => {
  const cache = new LRUCache<string, number>(3);

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);

  cache.set('a', 10); // 업데이트 → head로 이동

  cache.set('d', 4); // 용량 초과 → 'b' 제거

  expect(cache.get('a')).toBe(10); // 유지됨 (업데이트됨)
  expect(cache.get('b')).toBeUndefined(); // 제거됨
});
```

**검증**:
- ✅ set() 업데이트 시 항목이 head로 이동
- ✅ 값도 정상 업데이트

---

### 2.3 TTL 처리 테스트

#### TC-LRU-009: TTL 만료 시 항목 제거
```typescript
it('should remove expired items on get()', async () => {
  const cache = new LRUCache<string, number>(10, 1000); // TTL 1초

  cache.set('a', 1, 100); // TTL 100ms

  await new Promise(resolve => setTimeout(resolve, 150)); // 150ms 대기

  expect(cache.get('a')).toBeUndefined();
  expect(cache.size()).toBe(0); // 만료된 항목은 자동 제거됨
});
```

**검증**:
- ✅ TTL 만료 후 get() 호출 시 undefined 반환
- ✅ 만료된 항목은 자동 제거 (size 감소)

#### TC-LRU-010: cleanup() 메서드로 일괄 제거
```typescript
it('should cleanup expired items with cleanup()', async () => {
  const cache = new LRUCache<string, number>(10, 1000);

  cache.set('a', 1, 100); // TTL 100ms
  cache.set('b', 2, 100);
  cache.set('c', 3, 5000); // TTL 5초

  await new Promise(resolve => setTimeout(resolve, 150)); // 150ms 대기

  cache.cleanup(); // 만료된 항목 일괄 제거

  expect(cache.size()).toBe(1); // 'c'만 남음
  expect(cache.get('c')).toBe(3);
});
```

**검증**:
- ✅ cleanup() 호출 시 만료된 항목 모두 제거
- ✅ 유효한 항목은 유지

#### TC-LRU-011: 기본 TTL 사용
```typescript
it('should use default TTL when not specified', () => {
  const cache = new LRUCache<string, number>(10, 1000); // 기본 TTL 1초

  cache.set('a', 1); // TTL 명시하지 않음

  // 내부적으로 expiresAt = Date.now() + 1000
  const node = (cache as any).cache.get('a');
  expect(node.expiresAt).toBeGreaterThan(Date.now());
  expect(node.expiresAt).toBeLessThanOrEqual(Date.now() + 1000);
});
```

**검증**:
- ✅ TTL 미지정 시 defaultTTL 사용
- ✅ expiresAt 값이 올바르게 설정됨

---

### 2.4 캐시 통계 테스트

#### TC-LRU-012: 캐시 히트/미스 추적
```typescript
it('should track cache hits and misses', () => {
  const cache = new LRUCache<string, number>(10);

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
```

**검증**:
- ✅ hits 카운트 정확
- ✅ misses 카운트 정확
- ✅ hitRate = hits / (hits + misses)

#### TC-LRU-013: 제거 카운트 추적
```typescript
it('should track evictions', () => {
  const cache = new LRUCache<string, number>(2); // 용량 2

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3); // 'a' 제거
  cache.set('d', 4); // 'b' 제거

  const stats = cache.getStats();
  expect(stats.evictions).toBe(2);
  expect(stats.size).toBe(2);
});
```

**검증**:
- ✅ evictions 카운트 정확
- ✅ size는 capacity 유지

#### TC-LRU-014: clear() 후 통계 초기화
```typescript
it('should reset stats on clear()', () => {
  const cache = new LRUCache<string, number>(10);

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
```

**검증**:
- ✅ clear() 후 모든 통계 0으로 초기화

---

### 2.5 엣지 케이스 테스트

#### TC-LRU-015: 용량 1 캐시
```typescript
it('should work with capacity 1', () => {
  const cache = new LRUCache<string, number>(1);

  cache.set('a', 1);
  expect(cache.get('a')).toBe(1);

  cache.set('b', 2); // 'a' 제거
  expect(cache.get('a')).toBeUndefined();
  expect(cache.get('b')).toBe(2);
});
```

**검증**:
- ✅ 최소 용량에서도 정상 동작

#### TC-LRU-016: 용량 0 또는 음수 (생성자 에러)
```typescript
it('should throw error for invalid capacity', () => {
  expect(() => new LRUCache<string, number>(0)).toThrow('Capacity must be positive');
  expect(() => new LRUCache<string, number>(-1)).toThrow('Capacity must be positive');
});
```

**검증**:
- ✅ 유효하지 않은 용량은 에러 발생

#### TC-LRU-017: null/undefined 값 저장
```typescript
it('should handle null and undefined values', () => {
  const cache = new LRUCache<string, any>(10);

  cache.set('a', null);
  cache.set('b', undefined);

  expect(cache.get('a')).toBe(null);
  expect(cache.get('b')).toBe(undefined);
});
```

**검증**:
- ✅ null/undefined 값도 정상 저장/조회

#### TC-LRU-018: 대량 데이터 저장
```typescript
it('should handle large number of items', () => {
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
```

**검증**:
- ✅ 대량 데이터 처리 성능
- ✅ LRU 제거 정상 동작

---

## 3. 단위 테스트 (CacheStats)

### 3.1 기본 동작 테스트

**파일**: `tests/utils/cache-stats.test.ts`

#### TC-STATS-001: 통계 기록 및 조회
```typescript
it('should record and retrieve cache stats', () => {
  const collector = new CacheStatsCollector();

  collector.record('problems', {
    hits: 80,
    misses: 20,
    evictions: 5,
    size: 95,
    capacity: 100,
  });

  const stats = collector.get('problems');
  expect(stats).toBeDefined();
  expect(stats!.totalRequests).toBe(100);
  expect(stats!.hitRate).toBeCloseTo(0.8);
});
```

**검증**:
- ✅ record() 후 get()으로 조회 가능
- ✅ 통계 계산 정확 (hitRate)

#### TC-STATS-002: 여러 캐시 통계 관리
```typescript
it('should manage multiple cache stats', () => {
  const collector = new CacheStatsCollector();

  collector.record('problems', { hits: 80, misses: 20, evictions: 5, size: 95, capacity: 100 });
  collector.record('tags', { hits: 90, misses: 10, evictions: 0, size: 100, capacity: 100 });

  const all = collector.getAll();
  expect(all.size).toBe(2);
  expect(all.has('problems')).toBe(true);
  expect(all.has('tags')).toBe(true);
});
```

**검증**:
- ✅ 여러 캐시 통계 동시 관리

#### TC-STATS-003: 보고서 생성
```typescript
it('should generate report', () => {
  const collector = new CacheStatsCollector();

  collector.record('problems', { hits: 80, misses: 20, evictions: 5, size: 95, capacity: 100 });

  const report = collector.generateReport();
  expect(report).toContain('캐시: problems');
  expect(report).toContain('총 요청: 100');
  expect(report).toContain('히트: 80 (80.00%)');
  expect(report).toContain('제거: 5');
});
```

**검증**:
- ✅ 보고서 포맷 정확
- ✅ 모든 통계 포함

#### TC-STATS-004: reset() 메서드
```typescript
it('should reset all stats', () => {
  const collector = new CacheStatsCollector();

  collector.record('problems', { hits: 80, misses: 20, evictions: 5, size: 95, capacity: 100 });
  collector.reset();

  const all = collector.getAll();
  expect(all.size).toBe(0);
});
```

**검증**:
- ✅ reset() 후 모든 통계 제거

---

## 4. 통합 테스트 (SolvedAcClient)

### 4.1 캐시 통합 테스트

**파일**: `tests/api/solvedac-client-cache.test.ts`

#### TC-INT-001: 캐시 히트 테스트
```typescript
it('should return cached problem on second request', async () => {
  const client = new SolvedAcClient();

  // 첫 번째 요청 (캐시 미스)
  const problem1 = await client.getProblem(1000);

  // 두 번째 요청 (캐시 히트)
  const problem2 = await client.getProblem(1000);

  expect(problem1).toEqual(problem2);

  const stats = client.getCacheStats();
  expect(stats.hits).toBe(1);
  expect(stats.misses).toBe(1);
});
```

**검증**:
- ✅ 동일 요청 시 캐시된 데이터 반환
- ✅ 캐시 통계 정확

#### TC-INT-002: 캐시 미스 후 API 호출
```typescript
it('should call API on cache miss', async () => {
  const client = new SolvedAcClient();

  // 캐시 비어있음 → API 호출
  const problem = await client.getProblem(1001);

  expect(problem).toBeDefined();
  expect(problem.problemId).toBe(1001);

  const stats = client.getCacheStats();
  expect(stats.misses).toBe(1);
});
```

**검증**:
- ✅ 캐시 미스 시 API 호출
- ✅ 응답 데이터 정상

#### TC-INT-003: 여러 문제 캐싱
```typescript
it('should cache multiple problems', async () => {
  const client = new SolvedAcClient();

  await client.getProblem(1000); // 캐시 미스
  await client.getProblem(1001); // 캐시 미스
  await client.getProblem(1000); // 캐시 히트

  const stats = client.getCacheStats();
  expect(stats.hits).toBe(1);
  expect(stats.misses).toBe(2);
  expect(stats.size).toBe(2);
});
```

**검증**:
- ✅ 여러 문제 동시 캐싱
- ✅ 캐시 크기 정확

#### TC-INT-004: 용량 초과 시 LRU 제거
```typescript
it('should evict LRU item when capacity exceeded', async () => {
  const client = new SolvedAcClient(); // 용량 100

  // 101개 문제 요청 → 첫 번째 문제 제거됨
  for (let i = 1000; i < 1101; i++) {
    await client.getProblem(i);
  }

  const stats = client.getCacheStats();
  expect(stats.size).toBe(100); // 최대 100개 유지
  expect(stats.evictions).toBeGreaterThan(0);
});
```

**검증**:
- ✅ 용량 초과 시 LRU 제거
- ✅ 최대 용량 유지

---

### 4.2 캐시 히트율 측정

#### TC-INT-005: 캐시 히트율 70% 이상 달성
```typescript
it('should achieve 70%+ hit rate with realistic usage', async () => {
  const client = new SolvedAcClient();

  // 시나리오: 사용자가 10개 문제를 반복 조회
  const problems = [1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009];

  for (let i = 0; i < 10; i++) {
    for (const problemId of problems) {
      await client.getProblem(problemId);
    }
  }

  // 첫 10회: 캐시 미스 (10 misses)
  // 이후 90회: 캐시 히트 (90 hits)
  // 총: 10 misses, 90 hits → 90% 히트율

  const stats = client.getCacheStats();
  expect(stats.hitRate).toBeGreaterThanOrEqual(0.7); // 70% 이상
});
```

**검증**:
- ✅ 현실적 사용 패턴에서 70%+ 히트율

#### TC-INT-006: 검색 결과 캐싱
```typescript
it('should cache search results', async () => {
  const client = new SolvedAcClient();

  // 동일 검색 쿼리 반복
  const params = { query: 'dp', level_min: 11, level_max: 15 };

  await client.searchProblems(params); // 캐시 미스
  await client.searchProblems(params); // 캐시 히트

  const stats = client.getCacheStats();
  expect(stats.hits).toBe(1);
});
```

**검증**:
- ✅ 검색 결과도 캐싱됨
- ✅ 동일 쿼리는 캐시 히트

---

### 4.3 캐시 관리 테스트

#### TC-INT-007: clearCache() 메서드
```typescript
it('should clear cache on clearCache()', async () => {
  const client = new SolvedAcClient();

  await client.getProblem(1000);
  client.clearCache();

  const stats = client.getCacheStats();
  expect(stats.size).toBe(0);
  expect(stats.hits).toBe(0);
  expect(stats.misses).toBe(0);
});
```

**검증**:
- ✅ clearCache() 후 캐시 비워짐
- ✅ 통계도 초기화

#### TC-INT-008: TTL 만료 후 재요청
```typescript
it('should refetch on TTL expiry', async () => {
  const client = new SolvedAcClient(); // TTL 1시간

  await client.getProblem(1000); // 캐시에 저장

  // TTL 만료 시뮬레이션 (실제로는 1시간 대기 불가 → Mock TTL 사용)
  // 또는 짧은 TTL로 캐시 생성
  const shortTTLClient = new SolvedAcClient();
  (shortTTLClient as any).cache = new LRUCache<string, unknown>(100, 100); // TTL 100ms

  await shortTTLClient.getProblem(1000); // 캐시 미스

  await new Promise(resolve => setTimeout(resolve, 150)); // 150ms 대기

  await shortTTLClient.getProblem(1000); // TTL 만료 → 캐시 미스

  const stats = shortTTLClient.getCacheStats();
  expect(stats.misses).toBe(2); // 두 번 다 미스
});
```

**검증**:
- ✅ TTL 만료 후 재요청 시 API 호출

---

## 5. 성능 테스트

### 5.1 응답 시간 측정

**파일**: `tests/performance/lru-cache-perf.test.ts`

#### TC-PERF-001: get() 응답 시간 < 1ms
```typescript
it('should retrieve cached value in < 1ms', () => {
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
```

**검증**:
- ✅ 평균 조회 시간 < 1ms

#### TC-PERF-002: set() 응답 시간 < 1ms
```typescript
it('should insert value in < 1ms', () => {
  const cache = new LRUCache<string, number>(1000);

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    cache.set(`key${i}`, i);
  }
  const duration = performance.now() - start;

  const avgTime = duration / 1000;
  expect(avgTime).toBeLessThan(1); // < 1ms
});
```

**검증**:
- ✅ 평균 삽입 시간 < 1ms

#### TC-PERF-003: evictLRU() 응답 시간 < 1ms
```typescript
it('should evict LRU in < 1ms', () => {
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
```

**검증**:
- ✅ LRU 제거 성능 < 1ms

---

### 5.2 메모리 사용량 측정

#### TC-PERF-004: 메모리 사용량 < 500KB
```typescript
it('should use < 500KB memory for 100 items', () => {
  const cache = new LRUCache<string, any>(100);

  // 100개 항목 삽입 (각 2KB)
  for (let i = 0; i < 100; i++) {
    const largeValue = { data: 'x'.repeat(2000) }; // ~2KB
    cache.set(`key${i}`, largeValue);
  }

  // 메모리 사용량 측정 (근사치)
  const memUsage = process.memoryUsage();
  console.log('Heap Used:', (memUsage.heapUsed / 1024 / 1024).toFixed(2), 'MB');

  // 정확한 측정은 어려우므로, 캐시 크기로 추정
  expect(cache.size()).toBe(100);
});
```

**검증**:
- ✅ 메모리 사용량 합리적 수준

#### TC-PERF-005: 대량 데이터 처리 (부하 테스트)
```typescript
it('should handle 10,000 operations efficiently', () => {
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

  console.log('10,000 operations took:', duration.toFixed(2), 'ms');
  expect(duration).toBeLessThan(1000); // < 1초
});
```

**검증**:
- ✅ 대량 연산 처리 성능 < 1초

---

## 6. 엣지 케이스 테스트

### 6.1 경계 조건

#### TC-EDGE-001: 빈 캐시에서 delete() 호출
```typescript
it('should handle delete on empty cache', () => {
  const cache = new LRUCache<string, number>(10);

  expect(cache.delete('nonexistent')).toBe(false);
  expect(cache.size()).toBe(0);
});
```

#### TC-EDGE-002: 동일 키 여러 번 set()
```typescript
it('should handle multiple sets on same key', () => {
  const cache = new LRUCache<string, number>(10);

  cache.set('a', 1);
  cache.set('a', 2);
  cache.set('a', 3);

  expect(cache.get('a')).toBe(3);
  expect(cache.size()).toBe(1); // 중복 제거
});
```

#### TC-EDGE-003: TTL 0 (즉시 만료)
```typescript
it('should handle TTL 0', async () => {
  const cache = new LRUCache<string, number>(10);

  cache.set('a', 1, 0); // TTL 0ms

  await new Promise(resolve => setTimeout(resolve, 10)); // 10ms 대기

  expect(cache.get('a')).toBeUndefined(); // 즉시 만료
});
```

#### TC-EDGE-004: 음수 TTL (에러 또는 무시)
```typescript
it('should handle negative TTL gracefully', () => {
  const cache = new LRUCache<string, number>(10);

  // 옵션 A: 에러 발생
  // expect(() => cache.set('a', 1, -1000)).toThrow();

  // 옵션 B: 음수 TTL 무시 → 기본 TTL 사용
  cache.set('a', 1, -1000);
  expect(cache.get('a')).toBeDefined(); // 정상 저장 (기본 TTL)
});
```

---

## 7. 테스트 실행 계획

### 7.1 Day 1: 단위 테스트 (4시간)

**오전** (2시간):
- TC-LRU-001 ~ TC-LRU-008 (기본 동작, LRU 제거)
- 구현 버그 수정

**오후** (2시간):
- TC-LRU-009 ~ TC-LRU-018 (TTL, 통계, 엣지 케이스)
- TC-STATS-001 ~ TC-STATS-004 (CacheStats)

### 7.2 Day 2: 통합 테스트 (4시간)

**오전** (2시간):
- TC-INT-001 ~ TC-INT-004 (캐시 통합)
- SolvedAcClient 버그 수정

**오후** (2시간):
- TC-INT-005 ~ TC-INT-008 (히트율, 관리)
- TC-PERF-001 ~ TC-PERF-005 (성능 테스트)

### 7.3 테스트 명령어

```bash
# 전체 테스트
npm run test

# 특정 파일 테스트
npm run test tests/utils/lru-cache.test.ts

# 특정 테스트 케이스
npm run test -t "should store and retrieve values"

# 커버리지 측정
npm run test -- --coverage
```

---

## 8. 성공 기준

### 8.1 테스트 통과율

- ✅ **단위 테스트**: 100% 통과 (15-20개)
- ✅ **통합 테스트**: 100% 통과 (8-12개)
- ✅ **성능 테스트**: 100% 통과 (5개)
- ✅ **엣지 케이스**: 100% 통과 (10개)

**총 통과율**: 100% (43-55개 모두 통과)

### 8.2 성능 기준

| 지표 | 목표 | 검증 방법 |
|------|------|----------|
| **get() 응답 시간** | < 1ms | TC-PERF-001 |
| **set() 응답 시간** | < 1ms | TC-PERF-002 |
| **캐시 히트율** | ≥ 70% | TC-INT-005 |
| **메모리 사용량** | < 500KB | TC-PERF-004 |
| **대량 연산 처리** | < 1초 (10,000 ops) | TC-PERF-005 |

### 8.3 코드 커버리지

- ✅ **라인 커버리지**: ≥ 90%
- ✅ **브랜치 커버리지**: ≥ 85%
- ✅ **함수 커버리지**: 100%

```bash
npm run test -- --coverage

# 예상 출력:
# LRUCache: 95% line coverage
# CacheStats: 92% line coverage
# SolvedAcClient: 88% line coverage
```

### 8.4 통합 검증

**기존 기능 정상 동작**:
- ✅ search_problems 도구
- ✅ get_problem 도구
- ✅ search_tags 도구
- ✅ analyze_problem 도구
- ✅ generate_review_template 도구

**캐시 효과 확인**:
- ✅ 동일 요청 2회 → 1회만 API 호출 (캐시 히트)
- ✅ Rate Limiter와 정상 연동

---

## 부록

### A. 테스트 파일 목록

```
tests/
├── utils/
│   ├── lru-cache.test.ts          # 15-20개 테스트
│   └── cache-stats.test.ts        # 5-8개 테스트
├── api/
│   └── solvedac-client-cache.test.ts  # 8-12개 테스트
└── performance/
    └── lru-cache-perf.test.ts     # 5개 테스트
```

### B. Mock 데이터 예시

```typescript
// Mock 문제 데이터
const mockProblem: Problem = {
  problemId: 1000,
  titleKo: 'A+B',
  level: 1, // Bronze V
  tags: [{ key: 'math', displayNames: [{ name: '수학' }] }],
  acceptedUserCount: 100000,
  averageTries: 1.5,
};

// Mock 검색 결과
const mockSearchResult: SearchResult = {
  count: 1,
  items: [mockProblem],
};
```

### C. 테스트 유틸리티

```typescript
// 랜덤 문제 ID 생성
function randomProblemId(): number {
  return Math.floor(Math.random() * 30000) + 1000;
}

// 대량 문제 생성
function generateProblems(count: number): Problem[] {
  return Array.from({ length: count }, (_, i) => ({
    problemId: 1000 + i,
    titleKo: `문제 ${i}`,
    level: (i % 30) + 1,
    tags: [],
    acceptedUserCount: 1000,
    averageTries: 2.0,
  }));
}
```

---

**다음 단계**: 구현 시작 (fullstack-developer에게 위임)
