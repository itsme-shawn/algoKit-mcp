# LRU 캐싱 (Phase 4.4)

**프로젝트명**: cote-mcp-server
**버전**: 1.0
**작성일**: 2026-02-15
**마지막 업데이트**: 2026-02-16
**작성자**: project-planner, technical-writer

---

## 목차

1. [개요](#개요)
2. [설계](#설계)
3. [구현](#구현)
4. [테스트](#테스트)
5. [참고 자료](#참고-자료)

---

## 개요

### 목표

cote-mcp 서버의 캐싱 시스템을 **LRU (Least Recently Used) 캐시**로 전환하여:
- 메모리 사용량을 제한 (최대 100개 항목)
- 캐시 히트율 70% 이상 달성
- 장시간 운영 시 메모리 누수 방지
- 응답 시간 < 1ms 유지 (O(1) 조회)

### 현재 문제점

**src/utils/cache.ts**:
- 단순 Map 기반, TTL 지원
- **문제점**: 메모리 무제한 증가 가능
- **위험**: 장시간 운영 시 메모리 누수

**시나리오**:
- 사용자가 1000개 문제 검색 → 1000개 캐시 항목
- 장시간 운영 (7일) → 수천 개 항목 축적
- 메모리 사용량: 예측 불가 (10MB? 100MB?)

---

## 설계

### LRU 알고리즘

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

### 데이터 구조

**Doubly Linked List + Map 조합**:

```
MRU (Most Recently Used)                    LRU (Least Recently Used)
┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
│ HEAD │ ───> │ Node │ ───> │ Node │ ───> │ TAIL │
│      │ <─── │  1   │ <─── │  2   │ <─── │      │
└──────┘      └──────┘      └──────┘      └──────┘
   ↑             ↑             ↑             ↑
최근 사용       최근          오래됨       가장 오래됨
```

**Why Map?**
- O(1) 조회 (해시 테이블)
- 키로 노드 직접 접근

**Why Doubly Linked List?**
- O(1) 삽입/제거 (노드 포인터만 변경)
- 최근 사용 순서 추적

### CacheNode 구조

```typescript
interface CacheNode<K, V> {
  key: K;                    // 키 (역참조용)
  value: V;                  // 실제 데이터
  expiresAt: number;         // TTL 만료 시각 (밀리초)
  prev: CacheNode<K, V> | null; // 이전 노드
  next: CacheNode<K, V> | null; // 다음 노드
}
```

### 알고리즘 상세

**get(key) - 값 조회**:
1. Map에서 노드 조회
2. TTL 만료 확인 → 만료 시 제거 후 `undefined` 반환
3. 노드를 head로 이동 (최근 사용됨)
4. 값 반환

**시간 복잡도**: O(1)

**set(key, value) - 값 저장**:
1. 기존 노드 존재 시:
   - 값 업데이트
   - head로 이동
2. 신규 노드 삽입:
   - 용량 초과 시 tail 제거 (LRU 제거)
   - 새 노드를 head에 삽입
3. Map에 노드 저장

**시간 복잡도**: O(1)

### 캐시 전략

| 플랫폼 | TTL | 용량 | 근거 |
|--------|-----|------|------|
| **solved.ac API** | 1시간 | 100개 | 문제 메타데이터 변경 드뭄 |
| **BOJ 스크래핑** | 30일 | 50개 | 문제 본문 변경 거의 없음 |
| **Programmers** | 1시간 | 50개 | 향후 계획 |

**총 메모리 예상**:
- solved.ac: 100개 × ~10KB = 1MB
- BOJ: 50개 × ~50KB = 2.5MB
- **총 예상**: ~3.5MB (안정적)

---

## 구현

### 파일 구조

```
src/
├── utils/
│   ├── lru-cache.ts         # LRUCache 클래스 (신규, ~300줄)
│   └── cache.ts             # 기존 Cache 클래스 (제거 또는 유지)
├── api/
│   └── solvedac-client.ts   # LRUCache 통합 (수정, +10줄)
tests/
├── utils/
│   └── lru-cache.test.ts    # 단위 테스트 (신규, ~250줄)
└── api/
    └── solvedac-client-cache.test.ts  # 통합 테스트 (수정)
```

### LRUCache 클래스

**구조**:

```typescript
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

**핵심 메서드 구현**:

```typescript
/**
 * 값 조회
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
 * LRU 제거 (tail 제거)
 */
private evictLRU(): void {
  if (!this.tail) return;

  const key = this.tail.key;
  this.removeNode(this.tail);
  this.cache.delete(key);
  this.stats.evictions++;
}
```

### SolvedAcClient 통합

**변경 사항**:

```typescript
// Before:
private cache: Map<string, CacheEntry<unknown>> = new Map();

// After:
import { LRUCache } from '../utils/lru-cache.js';
private cache: LRUCache<string, unknown>;

constructor() {
  this.cache = new LRUCache(100, 60 * 60 * 1000); // 100개, 1시간 TTL
}
```

---

## 테스트

### 단위 테스트 시나리오

**tests/utils/lru-cache.test.ts**:

1. **기본 동작** (5개 테스트)
   - get/set 정상 동작
   - has() 존재 확인
   - delete() 삭제
   - clear() 전체 삭제
   - size() 크기 확인

2. **LRU 제거** (3개 테스트)
   - 용량 초과 시 tail 제거
   - 최근 사용 항목 유지
   - 제거 통계 확인

3. **TTL** (2개 테스트)
   - TTL 만료 시 자동 제거
   - TTL 업데이트

4. **통계** (2개 테스트)
   - 캐시 히트율 계산
   - evictions 카운트

### 통합 테스트 시나리오

**tests/api/solvedac-client-cache.test.ts**:

1. **캐시 히트율** (1개 테스트)
   - 동일 문제 10회 조회 → 1회만 API 호출
   - 히트율 90% 이상

2. **메모리 제한** (1개 테스트)
   - 101개 문제 조회 → 캐시 크기 100개 유지
   - 가장 오래된 항목 제거 확인

3. **TTL 동작** (1개 테스트)
   - TTL 만료 후 재조회 → API 호출 발생

### 인수 조건

**기능 요구사항**:
- ✅ LRUCache 클래스가 O(1) 조회/삽입/제거 보장
- ✅ 용량 초과 시 LRU 제거 정상 동작
- ✅ TTL 만료 시 자동 제거
- ✅ 캐시 통계 정확성

**성능 요구사항**:
- ✅ get/set 오버헤드 < 1ms
- ✅ 메모리 사용량 < 5MB (100개 항목)
- ✅ 캐시 히트율 70% 이상

**테스트 요구사항**:
- ✅ 단위 테스트 12개 이상 통과
- ✅ 통합 테스트 3개 이상 통과

---

## 참고 자료

### 관련 문서

- **Phase 4 계획**: [/docs/03-project-management/TASKS.md](/docs/03-project-management/TASKS.md)
- **API 통합 가이드**: [/docs/02-development/EXTERNAL_API.md](/docs/02-development/EXTERNAL_API.md)

### 외부 자료

- [LRU Cache (Wikipedia)](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU))
- [LeetCode LRU Cache Problem](https://leetcode.com/problems/lru-cache/)

### 코드 위치

- **LRUCache 클래스**: `/src/utils/lru-cache.ts`
- **SolvedAcClient 통합**: `/src/api/solvedac-client.ts`
- **단위 테스트**: `/tests/utils/lru-cache.test.ts`

---

## 변경 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|----------|
| 2026-02-15 | project-planner | 최초 작성 (설계서 및 구현 가이드) |
| 2026-02-16 | technical-writer | 2개 문서 통합 (design + implementation) |

---

**작성자**: project-planner, technical-writer
**상태**: 설계 완료 (Phase 4.4)
**다음 단계**: fullstack-developer 구현 시작
