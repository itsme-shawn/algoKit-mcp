# LRU 캐싱 최적화 설계서

**작성자**: project-manager
**작성일**: 2026-02-15
**상태**: 설계 완료
**관련 Task**: Task 4.4 (Phase 4)

---

## 목차

1. [개요](#1-개요)
2. [현재 문제점](#2-현재-문제점)
3. [LRU 캐시 개념](#3-lru-캐시-개념)
4. [데이터 구조 설계](#4-데이터-구조-설계)
5. [알고리즘 상세](#5-알고리즘-상세)
6. [캐시 전략](#6-캐시-전략)
7. [메모리 관리](#7-메모리-관리)
8. [성능 분석](#8-성능-분석)
9. [마이그레이션 계획](#9-마이그레이션-계획)
10. [향후 확장](#10-향후-확장)

---

## 1. 개요

### 1.1 목표

algokit 서버의 캐싱 시스템을 **LRU (Least Recently Used) 캐시**로 전환하여:
- 메모리 사용량을 제한 (최대 100개 항목)
- 캐시 히트율 70% 이상 달성
- 장시간 운영 시 메모리 누수 방지
- 응답 시간 < 1ms 유지 (O(1) 조회)

### 1.2 배경

**현재 캐싱 시스템** (`src/utils/cache.ts`):
- 단순 Map 기반, TTL 지원
- **문제점**: 메모리 무제한 증가 가능
- **위험**: 장시간 운영 시 메모리 누수

**solved.ac API 호출 패턴**:
- 문제 메타데이터 조회: 빈번 (문제 분석, 힌트, 복습 생성)
- 검색 결과: 중간 빈도
- 태그 정보: 낮은 빈도

**LRU 캐싱 도입 효과**:
- 메모리 제한: 최대 100개 항목
- 성능 유지: O(1) 조회/삽입/제거
- 안정성 향상: 프로덕션 배포 가능

---

## 2. 현재 문제점

### 2.1 메모리 무제한 증가

**src/utils/cache.ts 분석**:
```typescript
export class Cache<T> {
  private store: Map<string, CacheEntry<T>> = new Map();
  // 메모리 제한 없음!
}
```

**시나리오**:
- 사용자가 1000개 문제 검색 → 1000개 캐시 항목
- 장시간 운영 (7일) → 수천 개 항목 축적
- 메모리 사용량: 예측 불가 (10MB? 100MB?)

### 2.2 캐시 정리 메커니즘 부재

**cleanup() 메서드**:
- 존재하지만 자동 호출 없음
- 수동 호출 필요 (사용자 책임)

```typescript
cleanup(): void {
  // TTL 만료 항목 제거
  // BUT: 언제 호출할지 불명확
}
```

### 2.3 SolvedAcClient 중복 캐싱

**src/api/solvedac-client.ts 분석**:
```typescript
export class SolvedAcClient {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  // cache.ts와 별도 캐싱 → 중복 구현
}
```

**문제**:
- 캐시 로직 중복 (cache.ts + solvedac-client.ts)
- 일관성 없는 TTL 처리
- 메모리 사용량 예측 어려움

---

## 3. LRU 캐시 개념

### 3.1 LRU 알고리즘

**Least Recently Used (최근 최소 사용)**:
- 가장 오래 사용하지 않은 항목을 먼저 제거
- 시간 지역성(Temporal Locality) 원리 활용
- 최근 사용된 데이터가 다시 사용될 가능성 높음

**예시**:
```
용량: 3개
삽입 순서: A → B → C → D

[A, B, C] → D 삽입
[B, C, D] (A 제거, 가장 오래된 항목)

B 조회 → B가 최근 사용됨
[C, D, B]

E 삽입
[D, B, E] (C 제거)
```

### 3.2 LRU vs 다른 캐시 정책

| 정책 | 제거 기준 | 장점 | 단점 |
|------|-----------|------|------|
| **LRU** | 최근 사용 시간 | 높은 히트율, 구현 용이 | O(1) 위해 복잡한 구조 필요 |
| FIFO | 삽입 순서 | 구현 간단 | 낮은 히트율 |
| LFU | 사용 빈도 | 인기 항목 유지 | 복잡도 높음, 초기 사용 편향 |
| Random | 무작위 | 구현 매우 간단 | 예측 불가, 낮은 히트율 |

**선택 이유**: LRU는 웹 서비스 캐싱에 가장 적합 (시간 지역성 활용)

---

## 4. 데이터 구조 설계

### 4.1 LRUCache 클래스 구조

```typescript
/**
 * LRU 캐시 구현
 * @template K - 키 타입
 * @template V - 값 타입
 */
export class LRUCache<K, V> {
  private capacity: number;           // 최대 용량
  private cache: Map<K, CacheNode<V>>; // 빠른 조회용
  private head: CacheNode<V> | null;   // 최근 사용 (MRU)
  private tail: CacheNode<V> | null;   // 가장 오래된 (LRU)

  constructor(capacity: number, ttl?: number);

  get(key: K): V | undefined;
  set(key: K, value: V, ttl?: number): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  size(): number;
  getStats(): CacheStats;
}
```

### 4.2 CacheNode 구조

```typescript
/**
 * 캐시 노드 (Doubly Linked List 노드)
 */
interface CacheNode<V> {
  key: K;                    // 키 (역참조용)
  value: V;                  // 실제 데이터
  expiresAt: number;         // TTL 만료 시각 (밀리초)
  prev: CacheNode<V> | null; // 이전 노드
  next: CacheNode<V> | null; // 다음 노드
}
```

### 4.3 Doubly Linked List 구조

```
MRU (Most Recently Used)                    LRU (Least Recently Used)
┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
│ HEAD │ ───> │ Node │ ───> │ Node │ ───> │ TAIL │
│      │ <─── │  1   │ <─── │  2   │ <─── │      │
└──────┘      └──────┘      └──────┘      └──────┘
   ↑             ↑             ↑             ↑
최근 사용       최근          오래됨       가장 오래됨
```

**특징**:
- `head`: 가장 최근 사용된 노드
- `tail`: 가장 오래 사용되지 않은 노드 (제거 대상)
- 양방향 연결로 O(1) 삽입/제거

### 4.4 Map + Doubly Linked List 조합

**Why Map?**
- O(1) 조회 (해시 테이블)
- 키로 노드 직접 접근

**Why Doubly Linked List?**
- O(1) 삽입/제거 (노드 포인터만 변경)
- 최근 사용 순서 추적

**조합 효과**:
```typescript
// Map: 키 → 노드 매핑
cache.set('problem_1000', nodeA); // O(1)

// Doubly Linked List: 순서 관리
moveToHead(nodeA); // O(1) - 포인터만 변경

// 제거 시
cache.delete('problem_1000'); // O(1)
removeTail(); // O(1)
```

---

## 5. 알고리즘 상세

### 5.1 get(key) - 값 조회

**로직**:
1. Map에서 노드 조회
2. TTL 만료 확인 → 만료 시 제거 후 `undefined` 반환
3. 노드를 head로 이동 (최근 사용됨)
4. 값 반환

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
  return node.value; // 캐시 히트
}
```

**시간 복잡도**: O(1)

### 5.2 set(key, value) - 값 저장

**로직**:
1. 기존 노드 존재 시:
   - 값 업데이트
   - head로 이동
2. 신규 노드 삽입:
   - 용량 초과 시 tail 제거 (LRU 제거)
   - 새 노드를 head에 삽입
3. Map에 노드 저장

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
  const newNode: CacheNode<V> = {
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

### 5.3 evictLRU() - LRU 제거

**로직**:
1. tail 노드 제거
2. Map에서도 삭제
3. 통계 갱신

```typescript
private evictLRU(): void {
  if (!this.tail) return;

  const lruNode = this.tail;
  this.removeNode(lruNode);
  this.cache.delete(lruNode.key);
  this.stats.evictions++;
}
```

**시간 복잡도**: O(1)

### 5.4 moveToHead(node) - 노드를 head로 이동

**로직**:
1. 노드를 현재 위치에서 제거
2. head 앞에 삽입

```typescript
private moveToHead(node: CacheNode<V>): void {
  this.removeNode(node);
  this.addToHead(node);
}

private removeNode(node: CacheNode<V>): void {
  if (node.prev) {
    node.prev.next = node.next;
  } else {
    // node가 head인 경우
    this.head = node.next;
  }

  if (node.next) {
    node.next.prev = node.prev;
  } else {
    // node가 tail인 경우
    this.tail = node.prev;
  }
}

private addToHead(node: CacheNode<V>): void {
  node.next = this.head;
  node.prev = null;

  if (this.head) {
    this.head.prev = node;
  }

  this.head = node;

  if (!this.tail) {
    // 첫 노드인 경우
    this.tail = node;
  }
}
```

**시간 복잡도**: O(1)

---

## 6. 캐시 전략

### 6.1 캐시 타입별 설정

| 캐시 타입 | 용량 | TTL | 용도 |
|-----------|------|-----|------|
| **문제 메타데이터** | 100개 | 1시간 | getProblem, analyze_problem, generate_review_template |
| **검색 결과** | 50개 | 10분 | searchProblems (자주 변경) |
| **태그 정보** | 100개 | 1일 | searchTags (거의 변경 없음) |

**결정 근거**:
- **문제 메타데이터**: 가장 빈번하게 조회 → 100개 용량
- **검색 결과**: 사용자마다 다른 쿼리 → 50개로 제한
- **태그 정보**: 태그 종류 제한적 → 100개면 충분

### 6.2 캐시 키 전략

**SolvedAcClient 캐시 키**:
```typescript
// 문제 메타데이터
`https://solved.ac/api/v3/problem/show?problemId=1000`

// 검색 결과
`https://solved.ac/api/v3/search/problem?query=dp&level=11..15`

// 태그 정보
`https://solved.ac/api/v3/search/tag?query=dp`
```

**장점**:
- URL 기반 → 중복 요청 자동 감지
- 쿼리 파라미터 포함 → 정확한 매칭

### 6.3 캐시 계층 구조

```
┌─────────────────────────────────────┐
│  SolvedAcClient (API 호출 레이어)   │
└─────────────────────────────────────┘
              ↓ 캐시 확인
┌─────────────────────────────────────┐
│      LRUCache (통합 캐시 레이어)     │
│  - 문제 메타 (100개, 1시간)          │
│  - 검색 결과 (50개, 10분)            │
│  - 태그 정보 (100개, 1일)            │
└─────────────────────────────────────┘
              ↓ 캐시 미스
┌─────────────────────────────────────┐
│     solved.ac API (네트워크)        │
│  + Rate Limiter (초당 10회)          │
└─────────────────────────────────────┘
```

---

## 7. 메모리 관리

### 7.1 메모리 사용량 추정

**항목당 메모리**:
```typescript
// CacheNode 크기 추정
interface CacheNode<V> {
  key: string;           // ~50 bytes
  value: V;              // ~2KB (문제 메타데이터 JSON)
  expiresAt: number;     // 8 bytes
  prev: pointer;         // 8 bytes
  next: pointer;         // 8 bytes
}
// 총: ~2.1KB per node
```

**최대 메모리 사용량**:
- 문제 메타: 100개 × 2.1KB = **210KB**
- 검색 결과: 50개 × 2.1KB = **105KB**
- 태그 정보: 100개 × 0.5KB = **50KB**
- **총계**: ~365KB (매우 적음)

**Node.js 힙 메모리**: 기본 4GB → 365KB는 0.009% 사용

### 7.2 메모리 누수 방지

**기존 시스템 문제**:
```typescript
// cache.ts - 메모리 무제한
private store: Map<string, CacheEntry<T>> = new Map();
// 1000개 항목 → 2.1MB
// 10000개 항목 → 21MB (장시간 운영 시)
```

**LRU 캐시 해결**:
```typescript
// 최대 100개로 제한
if (this.cache.size >= this.capacity) {
  this.evictLRU(); // 자동 제거
}
// 메모리 사용량: 항상 < 220KB
```

### 7.3 TTL 기반 정리

**TTL 만료 처리**:
1. **Lazy Eviction**: get() 호출 시 TTL 확인 → 만료 시 제거
2. **Proactive Eviction** (선택적): 주기적 cleanup() 호출

```typescript
// Lazy Eviction (현재 방식)
get(key: K): V | undefined {
  if (Date.now() > node.expiresAt) {
    this.removeNode(node); // 자동 제거
    return undefined;
  }
  // ...
}

// Proactive Eviction (선택적)
setInterval(() => {
  lruCache.cleanup(); // 만료된 항목 일괄 제거
}, 60000); // 1분마다
```

---

## 8. 성능 분석

### 8.1 시간 복잡도

| 연산 | 시간 복잡도 | 설명 |
|------|-------------|------|
| **get(key)** | O(1) | Map 조회 + 포인터 변경 |
| **set(key, value)** | O(1) | Map 삽입 + 포인터 변경 |
| **delete(key)** | O(1) | Map 삭제 + 포인터 변경 |
| **evictLRU()** | O(1) | tail 제거 |
| **cleanup()** | O(n) | 모든 노드 순회 (n = 항목 수) |

**비교** (기존 cache.ts):
- get(): O(1) (동일)
- set(): O(1) (동일)
- cleanup(): O(n) (동일)

**LRU 추가 비용**: 포인터 변경 (< 1μs)

### 8.2 공간 복잡도

| 항목 | 공간 복잡도 | 메모리 사용량 |
|------|-------------|---------------|
| Map | O(n) | n × (key + pointer) |
| Doubly Linked List | O(n) | n × (2 pointers) |
| **총계** | O(n) | n × 2.1KB |

**최대 메모리**: 100개 × 2.1KB = 220KB (허용 가능)

### 8.3 캐시 히트율 목표

**목표**: 70% 이상

**근거**:
- 문제 메타데이터: 사용자가 동일 문제 반복 조회 (힌트 → 복습 → 재분석)
- 검색 결과: 동일 필터 반복 검색 가능성 높음
- 태그 정보: 태그 종류 제한적 (100개면 거의 모든 태그 커버)

**예상 히트율**:
- 문제 메타: 80% (용량 100개, 빈번한 재조회)
- 검색 결과: 60% (용량 50개, 다양한 쿼리)
- 태그 정보: 90% (용량 100개, 제한적 태그 종류)
- **평균**: 76% (목표 초과 달성 가능)

### 8.4 성능 벤치마크 목표

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| **get() 응답 시간** | < 1ms | 캐시 히트 |
| **set() 응답 시간** | < 1ms | 삽입 + eviction |
| **캐시 히트율** | ≥ 70% | hits / (hits + misses) |
| **메모리 사용량** | < 500KB | process.memoryUsage() |

---

## 9. 마이그레이션 계획

### 9.1 마이그레이션 전략

**Phase 1: LRUCache 구현** (Day 1)
- `src/utils/lru-cache.ts` 신규 생성
- LRUCache 클래스 구현
- CacheStats 클래스 구현
- 단위 테스트 작성

**Phase 2: SolvedAcClient 통합** (Day 2)
- `src/api/solvedac-client.ts` 수정
  - 기존 `private cache: Map<...>` 제거
  - LRUCache 인스턴스 사용
- 통합 테스트 작성

**Phase 3: cache.ts 대체 여부 결정** (선택적)
- 옵션 A: cache.ts를 LRUCache로 대체
- 옵션 B: cache.ts 유지, 점진적 마이그레이션
- **추천**: 옵션 A (일관성, 단순화)

### 9.2 파일 변경 사항

| 파일 | 변경 타입 | 변경 내용 |
|------|-----------|----------|
| `src/utils/lru-cache.ts` | 신규 | LRUCache 클래스 (~300줄) |
| `src/utils/cache-stats.ts` | 신규 | CacheStats 클래스 (~50줄) |
| `src/api/solvedac-client.ts` | 수정 | private cache 제거, LRUCache 사용 (~10줄) |
| `tests/utils/lru-cache.test.ts` | 신규 | 단위 테스트 (~250줄) |
| `tests/api/solvedac-client-cache.test.ts` | 수정 | 통합 테스트 업데이트 (~50줄) |

**총 코드 규모**: ~660줄 (신규 550줄 + 수정 110줄)

### 9.3 호환성 유지

**기존 Cache 인터페이스**:
```typescript
// cache.ts
class Cache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
}
```

**LRUCache 인터페이스**:
```typescript
// lru-cache.ts
class LRUCache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V, ttl?: number): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  size(): number;
  // 추가 메서드
  getStats(): CacheStats;
}
```

**호환성**: 기존 인터페이스 모두 지원 → Drop-in Replacement 가능

### 9.4 롤백 계획

**롤백 트리거**:
- 캐시 히트율 < 50%
- 성능 저하 (응답 시간 > 5ms)
- 메모리 사용량 급증

**롤백 절차**:
1. `src/api/solvedac-client.ts`에서 LRUCache → Map 복원
2. `src/utils/lru-cache.ts` 제거
3. 기존 cache.ts 사용

**롤백 소요 시간**: < 30분 (파일 복원)

---

## 10. 향후 확장

### 10.1 Redis 기반 분산 캐싱 (Phase 7+)

**현재 LRU 캐시 한계**:
- 인메모리 → 서버 재시작 시 캐시 손실
- 단일 인스턴스 → 다중 서버 배포 시 캐시 공유 불가

**Redis 도입 시**:
- 영속성: 서버 재시작 후에도 캐시 유지
- 분산 캐싱: 여러 MCP 서버 인스턴스가 캐시 공유
- TTL 지원: Redis 내장 TTL 기능 활용

**구현 예시**:
```typescript
import Redis from 'ioredis';

export class RedisLRUCache<K, V> implements ICache<K, V> {
  private redis: Redis;

  async get(key: K): Promise<V | undefined> {
    const value = await this.redis.get(String(key));
    return value ? JSON.parse(value) : undefined;
  }

  async set(key: K, value: V, ttl: number): Promise<void> {
    await this.redis.setex(String(key), ttl / 1000, JSON.stringify(value));
  }
}
```

### 10.2 Adaptive Cache Sizing

**동적 용량 조정**:
- 현재: 고정 용량 (100개)
- 개선: 메모리 사용량 기반 동적 조정

```typescript
class AdaptiveLRUCache<K, V> extends LRUCache<K, V> {
  private maxMemory: number = 10 * 1024 * 1024; // 10MB

  set(key: K, value: V): void {
    // 메모리 사용량 확인
    const currentMemory = this.estimateMemoryUsage();

    if (currentMemory > this.maxMemory) {
      // 용량 축소
      this.capacity = Math.floor(this.capacity * 0.8);
      this.evictMultiple(this.cache.size - this.capacity);
    }

    super.set(key, value);
  }
}
```

### 10.3 캐시 워밍 (Cache Warming)

**문제**: 서버 시작 직후 캐시 미스 → 느린 응답

**해결**: 인기 문제 사전 캐싱
```typescript
async warmupCache(): Promise<void> {
  // 인기 문제 100개 사전 로드
  const popularProblems = [1000, 1001, 1003, ...]; // BOJ 인기 문제

  for (const problemId of popularProblems) {
    await this.client.getProblem(problemId); // 캐시 적재
  }

  console.log(`Cache warmed with ${popularProblems.length} problems`);
}
```

### 10.4 캐시 계층화 (L1/L2 Cache)

**L1 캐시**: 인메모리 LRU (빠름, 작음)
**L2 캐시**: Redis (느림, 큼)

```typescript
class TieredCache<K, V> {
  private l1Cache: LRUCache<K, V>;        // 100개
  private l2Cache: RedisCache<K, V>;      // 10000개

  async get(key: K): Promise<V | undefined> {
    // L1 시도
    let value = this.l1Cache.get(key);
    if (value) return value;

    // L2 시도
    value = await this.l2Cache.get(key);
    if (value) {
      this.l1Cache.set(key, value); // L1에 승격
      return value;
    }

    return undefined; // 캐시 미스
  }
}
```

---

## 부록

### A. 용어 정의

| 용어 | 설명 |
|------|------|
| **LRU** | Least Recently Used (최근 최소 사용) |
| **TTL** | Time To Live (캐시 항목 유효 시간) |
| **Cache Hit** | 캐시에서 데이터 발견 |
| **Cache Miss** | 캐시에 데이터 없음 → API 호출 |
| **Eviction** | 캐시 항목 제거 |
| **MRU** | Most Recently Used (최근 사용) |

### B. 참고 자료

- [LRU Cache - LeetCode 146](https://leetcode.com/problems/lru-cache/)
- [Node.js Map Performance](https://v8.dev/blog/fast-properties)
- [Memory Management in V8](https://v8.dev/blog/trash-talk)
- [Redis LRU Implementation](https://redis.io/docs/reference/eviction/)

### C. 설계 결정 로그

| 날짜 | 결정 사항 | 근거 |
|------|-----------|------|
| 2026-02-15 | LRU 알고리즘 선택 | 웹 서비스 캐싱 표준, 높은 히트율 |
| 2026-02-15 | 용량 100개 설정 | 메모리 효율 + 충분한 커버리지 |
| 2026-02-15 | Map + Doubly Linked List | O(1) 조회/삽입/제거 달성 |
| 2026-02-15 | Lazy Eviction 방식 | 간단한 구현, TTL 자동 처리 |

---

**다음 단계**: [구현 가이드](../02-development/lru-caching-implementation.md) 참조
