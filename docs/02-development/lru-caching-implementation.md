# LRU 캐싱 구현 가이드

**작성자**: project-manager
**작성일**: 2026-02-15
**상태**: 구현 가이드 완료
**관련 Task**: Task 4.4 (Phase 4)
**설계 문서**: [lru-caching-design.md](../01-planning/lru-caching-design.md)

---

## 목차

1. [구현 개요](#1-구현-개요)
2. [파일별 구현 상세](#2-파일별-구현-상세)
3. [LRUCache 클래스 구현](#3-lrucache-클래스-구현)
4. [CacheStats 클래스 구현](#4-cachestats-클래스-구현)
5. [SolvedAcClient 통합](#5-solvedacclient-통합)
6. [마이그레이션 가이드](#6-마이그레이션-가이드)
7. [성능 최적화 팁](#7-성능-최적화-팁)
8. [트러블슈팅](#8-트러블슈팅)

---

## 1. 구현 개요

### 1.1 구현 순서 (2일 계획)

**Day 1: LRUCache 클래스 구현** (4시간)
1. `src/utils/lru-cache.ts` 생성 (~300줄)
2. CacheNode 인터페이스 정의
3. LRUCache 클래스 구현
   - constructor, get, set, delete, clear
   - private 메서드 (moveToHead, removeNode, addToHead, evictLRU)
4. 단위 테스트 작성 (~150줄)

**Day 2: 통합 및 테스트** (4시간)
1. `src/utils/cache-stats.ts` 생성 (~50줄)
2. `src/api/solvedac-client.ts` 수정 (~10줄)
3. 통합 테스트 작성 (~100줄)
4. 캐시 히트율 측정 및 검증

### 1.2 파일 구조

```
src/
├── utils/
│   ├── lru-cache.ts         # LRUCache 클래스 (신규, ~300줄)
│   ├── cache-stats.ts       # CacheStats 클래스 (신규, ~50줄)
│   └── cache.ts             # 기존 Cache 클래스 (유지 또는 제거)
├── api/
│   └── solvedac-client.ts   # LRUCache 통합 (수정, +10줄)
tests/
├── utils/
│   ├── lru-cache.test.ts    # 단위 테스트 (신규, ~250줄)
│   └── cache-stats.test.ts  # 단위 테스트 (신규, ~50줄)
└── api/
    └── solvedac-client-cache.test.ts  # 통합 테스트 (수정)
```

---

## 2. 파일별 구현 상세

### 2.1 src/utils/lru-cache.ts

**목적**: LRU 캐시 클래스 구현

**구조**:
```typescript
/**
 * LRU 캐시 노드 (Doubly Linked List)
 */
interface CacheNode<K, V> {
  key: K;
  value: V;
  expiresAt: number;
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
}

/**
 * LRU 캐시 통계
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
}

/**
 * LRU 캐시 구현
 */
export class LRUCache<K, V> {
  private capacity: number;
  private defaultTTL: number;
  private cache: Map<K, CacheNode<K, V>>;
  private head: CacheNode<K, V> | null;
  private tail: CacheNode<K, V> | null;
  private stats: { hits: number; misses: number; evictions: number };

  constructor(capacity: number, defaultTTL?: number);

  // Public API
  get(key: K): V | undefined;
  set(key: K, value: V, ttl?: number): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  size(): number;
  getStats(): CacheStats;
  cleanup(): void;

  // Private 헬퍼 메서드
  private moveToHead(node: CacheNode<K, V>): void;
  private removeNode(node: CacheNode<K, V>): void;
  private addToHead(node: CacheNode<K, V>): void;
  private evictLRU(): void;
}
```

**코드 예시**:

```typescript
/**
 * LRU 캐시 구현
 *
 * 특징:
 * - O(1) 조회/삽입/제거
 * - TTL (Time To Live) 지원
 * - 메모리 제한 (capacity)
 * - Doubly Linked List + Map 조합
 */

interface CacheNode<K, V> {
  key: K;
  value: V;
  expiresAt: number;
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
}

export class LRUCache<K, V> {
  private capacity: number;
  private defaultTTL: number;
  private cache: Map<K, CacheNode<K, V>>;
  private head: CacheNode<K, V> | null;
  private tail: CacheNode<K, V> | null;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
  };

  /**
   * LRU 캐시 생성
   * @param capacity - 최대 항목 수
   * @param defaultTTL - 기본 TTL (밀리초, 기본값 1시간)
   */
  constructor(capacity: number, defaultTTL: number = 60 * 60 * 1000) {
    if (capacity <= 0) {
      throw new Error('Capacity must be positive');
    }

    this.capacity = capacity;
    this.defaultTTL = defaultTTL;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * 값 조회
   * @param key - 캐시 키
   * @returns 캐시된 값 또는 undefined
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.stats.misses++;
      return undefined;
    }

    // TTL 만료 확인
    if (Date.now() > node.expiresAt) {
      this.removeNode(node);
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // 최근 사용됨 → head로 이동
    this.moveToHead(node);
    this.stats.hits++;
    return node.value;
  }

  /**
   * 값 저장
   * @param key - 캐시 키
   * @param value - 저장할 값
   * @param ttl - TTL (밀리초, 선택사항)
   */
  set(key: K, value: V, ttl?: number): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // 기존 노드 업데이트
      existingNode.value = value;
      existingNode.expiresAt = Date.now() + (ttl || this.defaultTTL);
      this.moveToHead(existingNode);
      return;
    }

    // 용량 초과 확인
    if (this.cache.size >= this.capacity) {
      this.evictLRU();
    }

    // 신규 노드 생성
    const newNode: CacheNode<K, V> = {
      key,
      value,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
      prev: null,
      next: null,
    };

    this.addToHead(newNode);
    this.cache.set(key, newNode);
  }

  /**
   * 키 존재 확인
   * @param key - 캐시 키
   * @returns 존재 여부
   */
  has(key: K): boolean {
    const value = this.get(key);
    return value !== undefined;
  }

  /**
   * 키 삭제
   * @param key - 캐시 키
   * @returns 삭제 성공 여부
   */
  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  /**
   * 캐시 전체 삭제
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * 캐시 크기 반환
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 캐시 통계 반환
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * 만료된 항목 정리
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: K[] = [];

    // 만료된 항목 수집
    for (const [key, node] of this.cache.entries()) {
      if (now > node.expiresAt) {
        keysToDelete.push(key);
      }
    }

    // 삭제
    for (const key of keysToDelete) {
      const node = this.cache.get(key);
      if (node) {
        this.removeNode(node);
        this.cache.delete(key);
      }
    }
  }

  // ==================== Private 헬퍼 메서드 ====================

  /**
   * 노드를 head로 이동 (최근 사용됨)
   */
  private moveToHead(node: CacheNode<K, V>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * 노드를 리스트에서 제거
   */
  private removeNode(node: CacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      // node가 head
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      // node가 tail
      this.tail = node.prev;
    }
  }

  /**
   * 노드를 head에 추가
   */
  private addToHead(node: CacheNode<K, V>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * LRU 항목 제거 (tail 제거)
   */
  private evictLRU(): void {
    if (!this.tail) return;

    const lruNode = this.tail;
    this.removeNode(lruNode);
    this.cache.delete(lruNode.key);
    this.stats.evictions++;
  }
}
```

---

### 2.2 src/utils/cache-stats.ts

**목적**: 캐시 통계 수집 및 분석

**코드 예시**:

```typescript
/**
 * 캐시 통계 수집 및 분석
 */

export interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  evictions: number;
  currentSize: number;
  capacity: number;
}

/**
 * 캐시 통계 수집기
 */
export class CacheStatsCollector {
  private metrics: Map<string, CacheMetrics> = new Map();

  /**
   * 캐시 통계 등록
   * @param name - 캐시 이름
   * @param stats - 캐시 통계
   */
  record(name: string, stats: {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
    capacity: number;
  }): void {
    const totalRequests = stats.hits + stats.misses;
    const hitRate = totalRequests > 0 ? stats.hits / totalRequests : 0;

    this.metrics.set(name, {
      totalRequests,
      cacheHits: stats.hits,
      cacheMisses: stats.misses,
      hitRate,
      evictions: stats.evictions,
      currentSize: stats.size,
      capacity: stats.capacity,
    });
  }

  /**
   * 모든 캐시 통계 조회
   */
  getAll(): Map<string, CacheMetrics> {
    return new Map(this.metrics);
  }

  /**
   * 특정 캐시 통계 조회
   */
  get(name: string): CacheMetrics | undefined {
    return this.metrics.get(name);
  }

  /**
   * 통계 초기화
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * 요약 보고서 생성
   */
  generateReport(): string {
    let report = '=== 캐시 통계 보고서 ===\n\n';

    for (const [name, metrics] of this.metrics.entries()) {
      report += `캐시: ${name}\n`;
      report += `  총 요청: ${metrics.totalRequests}\n`;
      report += `  히트: ${metrics.cacheHits} (${(metrics.hitRate * 100).toFixed(2)}%)\n`;
      report += `  미스: ${metrics.cacheMisses}\n`;
      report += `  제거: ${metrics.evictions}\n`;
      report += `  현재 크기: ${metrics.currentSize}/${metrics.capacity}\n\n`;
    }

    return report;
  }
}

/**
 * 싱글톤 통계 수집기
 */
export const cacheStatsCollector = new CacheStatsCollector();
```

---

### 2.3 src/api/solvedac-client.ts 수정

**목적**: 기존 Map 캐시를 LRUCache로 교체

**변경 전**:
```typescript
export class SolvedAcClient {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cacheTTL: number = 3600000; // 1시간

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}
```

**변경 후**:
```typescript
import { LRUCache } from '../utils/lru-cache.js';

export class SolvedAcClient {
  private cache: LRUCache<string, unknown>;

  constructor() {
    // LRU 캐시 생성 (최대 100개, TTL 1시간)
    this.cache = new LRUCache<string, unknown>(100, 60 * 60 * 1000);
  }

  private request<T>(
    endpoint: string,
    params: Record<string, string | number> = {},
    retries = 0
  ): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    // 쿼리 파라미터 추가
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });

    const cacheKey = url.toString();

    // 캐시 확인 (LRU 캐시 사용)
    const cached = this.cache.get(cacheKey) as T | undefined;
    if (cached !== undefined) {
      return Promise.resolve(cached); // 캐시 히트
    }

    // Rate Limiting 적용
    await solvedAcLimiter.acquire();

    try {
      // ... API 호출 로직 ...

      const data = await response.json() as T;

      // 캐시 저장 (LRU 캐시 사용)
      this.cache.set(cacheKey, data);

      return data;
    } catch (error) {
      // ... 에러 처리 ...
    }
  }

  /**
   * 캐시 초기화
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 캐시 통계 조회
   */
  public getCacheStats() {
    return this.cache.getStats();
  }
}
```

**변경 요약**:
1. `private cache: Map<...>` → `private cache: LRUCache<...>`
2. `getCached()` 메서드 제거 → `this.cache.get()` 직접 사용
3. `setCache()` 메서드 제거 → `this.cache.set()` 직접 사용
4. `getCacheStats()` 메서드 추가 (옵션)

**변경 줄 수**: ~10줄 수정, ~15줄 제거

---

## 3. LRUCache 클래스 구현

### 3.1 생성자 (Constructor)

```typescript
constructor(capacity: number, defaultTTL: number = 60 * 60 * 1000) {
  if (capacity <= 0) {
    throw new Error('Capacity must be positive');
  }

  this.capacity = capacity;
  this.defaultTTL = defaultTTL;
  this.cache = new Map();
  this.head = null;
  this.tail = null;
  this.stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };
}
```

**검증**:
- ✅ capacity > 0 확인
- ✅ defaultTTL 기본값 1시간

### 3.2 get(key) 구현

**핵심 로직**:
1. Map에서 노드 조회
2. TTL 만료 확인
3. 노드를 head로 이동 (최근 사용됨)
4. 통계 갱신

```typescript
get(key: K): V | undefined {
  const node = this.cache.get(key);

  if (!node) {
    this.stats.misses++;
    return undefined; // 캐시 미스
  }

  // TTL 만료 확인
  if (Date.now() > node.expiresAt) {
    this.removeNode(node);
    this.cache.delete(key);
    this.stats.misses++;
    return undefined;
  }

  // 최근 사용됨 → head로 이동
  this.moveToHead(node);
  this.stats.hits++;
  return node.value;
}
```

**시간 복잡도**: O(1)

### 3.3 set(key, value) 구현

**핵심 로직**:
1. 기존 노드 확인 → 업데이트 후 head 이동
2. 용량 초과 확인 → LRU 제거
3. 신규 노드 생성 → head 추가

```typescript
set(key: K, value: V, ttl?: number): void {
  const existingNode = this.cache.get(key);

  if (existingNode) {
    // 기존 노드 업데이트
    existingNode.value = value;
    existingNode.expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.moveToHead(existingNode);
    return;
  }

  // 용량 초과 확인
  if (this.cache.size >= this.capacity) {
    this.evictLRU(); // tail 제거
  }

  // 신규 노드 생성
  const newNode: CacheNode<K, V> = {
    key,
    value,
    expiresAt: Date.now() + (ttl || this.defaultTTL),
    prev: null,
    next: null,
  };

  this.addToHead(newNode);
  this.cache.set(key, newNode);
}
```

**시간 복잡도**: O(1)

### 3.4 Private 헬퍼 메서드

#### moveToHead(node)

```typescript
private moveToHead(node: CacheNode<K, V>): void {
  this.removeNode(node);
  this.addToHead(node);
}
```

#### removeNode(node)

```typescript
private removeNode(node: CacheNode<K, V>): void {
  if (node.prev) {
    node.prev.next = node.next;
  } else {
    // node가 head
    this.head = node.next;
  }

  if (node.next) {
    node.next.prev = node.prev;
  } else {
    // node가 tail
    this.tail = node.prev;
  }
}
```

#### addToHead(node)

```typescript
private addToHead(node: CacheNode<K, V>): void {
  node.next = this.head;
  node.prev = null;

  if (this.head) {
    this.head.prev = node;
  }

  this.head = node;

  if (!this.tail) {
    // 첫 노드
    this.tail = node;
  }
}
```

#### evictLRU()

```typescript
private evictLRU(): void {
  if (!this.tail) return;

  const lruNode = this.tail;
  this.removeNode(lruNode);
  this.cache.delete(lruNode.key);
  this.stats.evictions++;
}
```

---

## 4. CacheStats 클래스 구현

### 4.1 기본 구조

```typescript
export interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  evictions: number;
  currentSize: number;
  capacity: number;
}

export class CacheStatsCollector {
  private metrics: Map<string, CacheMetrics> = new Map();

  record(name: string, stats: any): void { /* ... */ }
  getAll(): Map<string, CacheMetrics> { /* ... */ }
  get(name: string): CacheMetrics | undefined { /* ... */ }
  reset(): void { /* ... */ }
  generateReport(): string { /* ... */ }
}
```

### 4.2 사용 예시

```typescript
import { cacheStatsCollector } from './cache-stats.js';

// 캐시 통계 기록
const stats = lruCache.getStats();
cacheStatsCollector.record('problems', {
  ...stats,
  capacity: 100,
});

// 보고서 생성
console.log(cacheStatsCollector.generateReport());
```

**출력 예시**:
```
=== 캐시 통계 보고서 ===

캐시: problems
  총 요청: 1000
  히트: 780 (78.00%)
  미스: 220
  제거: 50
  현재 크기: 100/100
```

---

## 5. SolvedAcClient 통합

### 5.1 변경 사항 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| **캐시 타입** | `Map<string, CacheEntry<unknown>>` | `LRUCache<string, unknown>` |
| **캐시 크기** | 무제한 | 최대 100개 |
| **TTL 처리** | 수동 (getCached에서 확인) | 자동 (LRUCache.get에서 확인) |
| **LRU 제거** | 없음 | 자동 (용량 초과 시) |
| **통계** | 없음 | getStats() 메서드 |

### 5.2 마이그레이션 체크리스트

- [ ] `import { LRUCache } from '../utils/lru-cache.js';` 추가
- [ ] `private cache: Map<...>` → `private cache: LRUCache<...>`
- [ ] constructor에서 LRUCache 인스턴스 생성
- [ ] `getCached()` 메서드 제거
- [ ] `setCache()` 메서드 제거
- [ ] `request()` 메서드에서 `this.cache.get()`, `this.cache.set()` 직접 사용
- [ ] `clearCache()` 메서드 업데이트
- [ ] `getCacheStats()` 메서드 추가 (옵션)

### 5.3 코드 비교 (request 메서드)

**변경 전**:
```typescript
const cached = this.getCached<T>(cacheKey);
if (cached !== null) {
  return cached;
}

// ... API 호출 ...

this.setCache(cacheKey, data);
```

**변경 후**:
```typescript
const cached = this.cache.get(cacheKey) as T | undefined;
if (cached !== undefined) {
  return Promise.resolve(cached);
}

// ... API 호출 ...

this.cache.set(cacheKey, data);
```

**차이점**:
- `getCached()` → `this.cache.get()` (간결)
- `setCache()` → `this.cache.set()` (간결)
- null 체크 → undefined 체크

---

## 6. 마이그레이션 가이드

### 6.1 단계별 마이그레이션

**Step 1: LRUCache 구현 및 테스트** (Day 1)
```bash
# 파일 생성
touch src/utils/lru-cache.ts
touch tests/utils/lru-cache.test.ts

# 구현
# ... lru-cache.ts 작성 ...

# 테스트
npm run test tests/utils/lru-cache.test.ts
```

**Step 2: SolvedAcClient 통합** (Day 2 오전)
```bash
# solvedac-client.ts 수정
# 1. import LRUCache 추가
# 2. private cache 타입 변경
# 3. getCached/setCache 제거
# 4. request 메서드 수정

# 테스트
npm run test tests/api/solvedac-client.test.ts
```

**Step 3: 통합 테스트** (Day 2 오후)
```bash
# 전체 테스트 실행
npm run test

# 캐시 히트율 측정
# ... 통합 테스트에서 확인 ...
```

### 6.2 검증 체크리스트

- [ ] 단위 테스트 통과 (lru-cache.test.ts)
- [ ] 통합 테스트 통과 (solvedac-client.test.ts)
- [ ] 캐시 히트율 ≥ 70%
- [ ] 메모리 사용량 < 500KB
- [ ] get() 응답 시간 < 1ms
- [ ] 기존 기능 정상 동작 (search_problems, get_problem, search_tags)

### 6.3 롤백 계획

**롤백 트리거**:
- 테스트 실패
- 성능 저하 (응답 시간 > 5ms)
- 캐시 히트율 < 50%

**롤백 절차**:
1. `src/api/solvedac-client.ts` 변경사항 되돌리기
2. `src/utils/lru-cache.ts` 삭제
3. 기존 Map 기반 캐싱으로 복원

```bash
git restore src/api/solvedac-client.ts
git clean -fd src/utils/lru-cache.ts
npm run test
```

---

## 7. 성능 최적화 팁

### 7.1 메모리 효율

**불필요한 데이터 제거**:
```typescript
// 나쁜 예: 전체 응답 캐싱
cache.set(key, entireAPIResponse); // 10KB

// 좋은 예: 필요한 필드만 추출
const minimalData = {
  id: response.id,
  title: response.title,
  level: response.level,
};
cache.set(key, minimalData); // 1KB
```

### 7.2 TTL 최적화

**데이터 특성에 맞는 TTL 설정**:
```typescript
// 문제 메타데이터: 자주 변경되지 않음 → 1시간
lruCache.set(problemKey, data, 60 * 60 * 1000);

// 검색 결과: 상대적으로 자주 변경 → 10분
lruCache.set(searchKey, data, 10 * 60 * 1000);

// 태그 정보: 거의 변경 없음 → 1일
lruCache.set(tagKey, data, 24 * 60 * 60 * 1000);
```

### 7.3 Proactive Cleanup

**주기적 cleanup() 호출** (선택적):
```typescript
// MCP 서버 시작 시
setInterval(() => {
  lruCache.cleanup(); // 만료된 항목 일괄 제거
  console.log(`Cleaned up expired entries. Current size: ${lruCache.size()}`);
}, 60000); // 1분마다
```

**주의**: Lazy Eviction만으로 충분할 수 있음 (트레이드오프 고려)

### 7.4 캐시 워밍

**서버 시작 시 인기 문제 사전 로드**:
```typescript
async function warmupCache(client: SolvedAcClient): Promise<void> {
  const popularProblems = [1000, 1001, 1003, 1152, 1157]; // 예시

  for (const problemId of popularProblems) {
    try {
      await client.getProblem(problemId); // 캐시 적재
    } catch (error) {
      console.error(`Failed to warm up cache for problem ${problemId}`);
    }
  }

  console.log(`Cache warmed with ${popularProblems.length} problems`);
}
```

---

## 8. 트러블슈팅

### 8.1 캐시 히트율이 낮은 경우 (< 50%)

**원인**:
- 용량이 너무 작음 (100개 → 부족)
- TTL이 너무 짧음 (10분 → 만료 빠름)
- 사용 패턴이 불규칙 (랜덤 액세스)

**해결**:
```typescript
// 용량 증가
const lruCache = new LRUCache<string, unknown>(200, 60 * 60 * 1000);

// TTL 증가
lruCache.set(key, value, 2 * 60 * 60 * 1000); // 2시간
```

### 8.2 메모리 사용량이 높은 경우

**원인**:
- 캐시 값이 너무 큼 (10KB+ per item)
- 용량이 너무 많음 (200개 → 과다)

**해결**:
```typescript
// 용량 감소
const lruCache = new LRUCache<string, unknown>(50, 60 * 60 * 1000);

// 데이터 압축 (필요한 필드만)
const minimalData = extractEssentialFields(response);
lruCache.set(key, minimalData);
```

### 8.3 Doubly Linked List 포인터 에러

**증상**: `Cannot read property 'next' of null`

**원인**: removeNode/addToHead 로직 버그

**디버깅**:
```typescript
private removeNode(node: CacheNode<K, V>): void {
  console.log('removeNode called', { key: node.key, hasHead: !!this.head, hasTail: !!this.tail });

  // ... 로직 ...

  console.log('removeNode done', { hasHead: !!this.head, hasTail: !!this.tail });
}
```

### 8.4 TTL 만료 항목이 제거되지 않는 경우

**원인**: cleanup() 호출 없음, Lazy Eviction만 사용

**해결**:
```typescript
// Option 1: Proactive Cleanup 추가
setInterval(() => lruCache.cleanup(), 60000);

// Option 2: get() 호출 시 항상 TTL 확인 (이미 구현됨)
get(key: K): V | undefined {
  // ... TTL 확인 로직 ...
}
```

### 8.5 성능 저하 (응답 시간 > 5ms)

**원인**:
- Doubly Linked List 조작 오버헤드
- Map 조회 성능 문제 (unlikely)

**디버깅**:
```typescript
const start = Date.now();
const value = lruCache.get(key);
const duration = Date.now() - start;
console.log(`Cache get took ${duration}ms`);
```

**해결**: 일반적으로 < 1ms이므로, 문제가 있다면 구현 버그 확인

---

## 부록

### A. 전체 코드 체크리스트

**src/utils/lru-cache.ts**:
- [ ] CacheNode 인터페이스 정의
- [ ] CacheStats 인터페이스 정의
- [ ] LRUCache 클래스 구현
  - [ ] constructor
  - [ ] get, set, has, delete, clear, size, getStats, cleanup
  - [ ] moveToHead, removeNode, addToHead, evictLRU
- [ ] JSDoc 주석 완비
- [ ] 타입 안전성 확인 (TypeScript strict mode)

**src/utils/cache-stats.ts**:
- [ ] CacheMetrics 인터페이스 정의
- [ ] CacheStatsCollector 클래스 구현
- [ ] record, getAll, get, reset, generateReport 메서드
- [ ] 싱글톤 인스턴스 export

**src/api/solvedac-client.ts**:
- [ ] LRUCache import 추가
- [ ] private cache 타입 변경
- [ ] constructor에서 LRUCache 생성
- [ ] getCached/setCache 메서드 제거
- [ ] request 메서드에서 cache.get/set 직접 사용
- [ ] getCacheStats 메서드 추가

**tests/utils/lru-cache.test.ts**:
- [ ] 기본 동작 테스트 (get, set, delete, clear)
- [ ] LRU 제거 테스트 (용량 초과)
- [ ] TTL 처리 테스트
- [ ] 통계 테스트 (getStats)
- [ ] 엣지 케이스 테스트

**tests/api/solvedac-client-cache.test.ts**:
- [ ] 캐시 히트 테스트
- [ ] 캐시 미스 테스트
- [ ] LRU 제거 확인
- [ ] 캐시 히트율 측정

### B. 테스트 케이스 예시

```typescript
// tests/utils/lru-cache.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache } from '../../src/utils/lru-cache.js';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3, 1000); // 용량 3, TTL 1초
  });

  it('should store and retrieve values', () => {
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('should evict LRU item when capacity exceeded', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4); // 용량 초과 → 'a' 제거

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('d')).toBe(4);
  });

  it('should move accessed item to head', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    cache.get('a'); // 'a'를 head로 이동

    cache.set('d', 4); // 'b' 제거 ('a'는 최근 사용됨)

    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
  });

  it('should remove expired items', async () => {
    cache.set('a', 1, 100); // TTL 100ms

    await new Promise(resolve => setTimeout(resolve, 150)); // 150ms 대기

    expect(cache.get('a')).toBeUndefined();
  });

  it('should track cache statistics', () => {
    cache.set('a', 1);
    cache.get('a'); // hit
    cache.get('b'); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(0.5);
  });
});
```

---

**다음 단계**: [테스트 스펙](../04-testing/test-spec-phase4-4.md) 참조
