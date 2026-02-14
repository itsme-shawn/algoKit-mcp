# Rate Limiting (Phase 4.2)

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

### 목적

외부 API 호출에 대한 Rate Limiting을 구현하여 다음 목표를 달성합니다:

- **서비스 안정성**: API 제공자의 차단 위험 제거
- **공정한 사용**: 공개 API의 책임있는 사용
- **예측 가능성**: 일관된 응답 시간 보장
- **확장 가능성**: 향후 다중 사용자/배포 시나리오 대응

### 적용 범위

| API | 현재 상태 | Rate Limiting 필요성 | 우선순위 |
|-----|-----------|---------------------|----------|
| **solved.ac API** | 재시도 O, Rate Limiting X | 높음 (공개 API, 제한 명시 없음) | P0 |
| **BOJ 스크래핑** | 3초 간격 구현 완료 | 낮음 (이미 윤리적 스크래핑 적용) | P2 |
| **Programmers** | 미구현 | 중간 (향후 계획) | P3 |

**Phase 4.2 구현 범위**: solved.ac API만 우선 구현

---

## 설계

### Rate Limiting 정책

#### solved.ac API 정책

**제약 분석**:
- solved.ac는 공개 API이며 공식 Rate Limit 명시 없음
- 하지만 과도한 호출 시 IP 차단 위험 존재
- 일반적인 공개 API Rate Limit: 초당 10-100회

**결정된 정책**:

```typescript
const SOLVED_AC_RATE_LIMIT = {
  /** 버킷 최대 용량 (한 번에 사용 가능한 최대 토큰 수) */
  capacity: 10,

  /** 토큰 충전 속도 (초당 토큰 수) */
  refillRate: 10, // 초당 10회

  /** 대기 시 최대 타임아웃 (밀리초) */
  maxWaitTime: 5000, // 5초
};
```

**근거**:
- **초당 10회**: 보수적인 값으로 API 차단 위험 최소화
- **버킷 크기 10**: 순간적인 버스트 트래픽 허용 (10회까지)
- **최대 대기 5초**: 사용자 경험 저해 방지

**캐싱과의 조합**:
- 현재 캐시 히트율: 예상 60-70% (TTL 1시간)
- 실제 API 호출: 30-40%만 Rate Limiter 통과
- **효과**: 초당 10회 제한으로 충분 (실제 부하는 초당 3-4회)

### 알고리즘 선택: Token Bucket

**비교 분석**:

| 알고리즘 | 장점 | 단점 | 적합성 |
|---------|------|------|--------|
| **Token Bucket** | • 버스트 트래픽 허용<br>• 구현 간단<br>• 메모리 효율적 | • 순간 부하 가능 | ✅ **최적** |
| Fixed Window | • 매우 간단 | • 윈도우 경계 부하 집중 | ❌ |
| Sliding Window | • 정밀한 제어 | • 복잡한 구현 | ❌ 과도한 엔지니어링 |
| Leaky Bucket | • 일정한 속도 보장 | • 버스트 불가 | ❌ 사용자 경험 저해 |

**Token Bucket 선택 이유**:
1. **버스트 허용**: 사용자가 여러 문제를 연속 조회할 수 있음 (최대 10개)
2. **간단함**: 100줄 미만의 코드로 구현 가능
3. **효율성**: O(1) 시간 복잡도, 최소 메모리 사용

### Token Bucket 동작 원리

```
┌─────────────────────────────────────────┐
│       Token Bucket Algorithm            │
├─────────────────────────────────────────┤
│                                         │
│  Bucket Capacity: 10 tokens             │
│  Refill Rate: 10 tokens/sec             │
│                                         │
│  [🟢🟢🟢🟢🟢🟢🟢⚪⚪⚪]                    │
│   ↑                                     │
│   현재 7개 토큰 보유                     │
│                                         │
│  요청 1회 → 토큰 1개 소비                │
│  1초 경과 → 토큰 10개 충전               │
│  (최대 10개까지만 보유)                  │
│                                         │
└─────────────────────────────────────────┘
```

**의사코드**:
```typescript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;        // 10
    this.tokens = capacity;          // 초기값 10
    this.refillRate = refillRate;    // 10/sec
    this.lastRefillTime = Date.now();
  }

  async acquire() {
    // 1. 토큰 충전
    this.refill();

    // 2. 토큰 사용 가능 확인
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return; // 즉시 반환
    }

    // 3. 토큰 부족 시 대기
    const waitTime = this.calculateWaitTime(1);
    await sleep(waitTime);
    this.tokens -= 1;
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefillTime) / 1000; // 초 단위
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }
}
```

### 아키텍처 구조

**옵션 분석**:

| 구조 | 설명 | 장점 | 단점 | 선택 |
|------|------|------|------|------|
| **Single Limiter** | 전역 1개 리미터 | 간단 | 모든 API 동일 제한 | ❌ |
| **Per-API Limiter** | API별 독립 리미터 | API마다 정책 다름 | 관리 복잡 | ❌ |
| **Per-Platform Limiter** | 플랫폼별 리미터 | 플랫폼별 정책 다름 | 균형적 복잡도 | ✅ **최적** |

**선택: Per-Platform Limiter**

**이유**:
- solved.ac, BOJ, Programmers는 각각 다른 Rate Limit 필요
- 하지만 같은 플랫폼 내 API는 동일한 제한 공유 (예: `searchProblems`, `getProblem` 모두 초당 10회)
- 확장 가능: 새 플랫폼 추가 시 리미터만 추가

**클래스 다이어그램**:

```
┌──────────────────────────────┐
│      RateLimiter             │
├──────────────────────────────┤
│ - capacity: number           │
│ - refillRate: number         │
│ - tokens: number             │
│ - lastRefillTime: number     │
├──────────────────────────────┤
│ + acquire(): Promise<void>   │
│ + tryAcquire(): boolean      │
│ - refill(): void             │
│ - calculateWaitTime(): number│
└──────────────────────────────┘
         ↑
         │ 싱글톤 인스턴스
         │
┌────────┴────────┐
│ solvedAcLimiter │  (export)
│ bojLimiter      │  (export, 향후)
│ programmersLimiter│ (export, 향후)
└─────────────────┘
```

### 에러 처리 전략

#### Rate Limit 도달 시 동작

**Scenario 1: 토큰 부족, 대기 가능**

```typescript
// 예: 토큰 0개, 0.1초 후 충전 예정
await limiter.acquire();
// → 0.1초 대기 후 자동으로 요청 진행
```

**사용자 경험**: 투명한 대기 (별도 메시지 없음)

**Scenario 2: 토큰 부족, 대기 시간 초과**

```typescript
// 예: 토큰 0개, 5초 이상 대기 필요
await limiter.acquire(); // maxWaitTime=5000ms
// → RateLimitError 발생
```

**에러 메시지**:
```json
{
  "error": "Rate limit exceeded",
  "message": "API 호출 횟수 제한에 도달했습니다. 5초 후 다시 시도해주세요.",
  "retryAfter": 5
}
```

---

## 구현

### 파일 구조

```
src/
├── utils/
│   ├── rate-limiter.ts          # NEW: RateLimiter 클래스
│   └── cache.ts                 # EXISTING: 캐싱 (변경 없음)
├── api/
│   ├── solvedac-client.ts       # MODIFY: limiter.acquire() 추가
│   ├── boj-scraper.ts           # NO CHANGE: 이미 간격 제어
│   └── types.ts                 # MODIFY: RateLimitError 추가
└── index.ts                     # NO CHANGE
```

### 파일별 구현 상세

#### `src/utils/rate-limiter.ts` (신규 생성)

**핵심 클래스**:

```typescript
export interface RateLimiterOptions {
  /** 버킷 최대 용량 (한 번에 사용 가능한 최대 토큰 수) */
  capacity: number;

  /** 토큰 충전 속도 (초당 토큰 수) */
  refillRate: number;

  /** 대기 시 최대 타임아웃 (밀리초, 기본값: 5000ms) */
  maxWaitTime?: number;
}

export class RateLimiter {
  private readonly capacity: number;
  private readonly refillRate: number;
  private readonly maxWaitTime: number;
  private tokens: number;
  private lastRefillTime: number;

  constructor(options: RateLimiterOptions) {
    this.capacity = options.capacity;
    this.refillRate = options.refillRate;
    this.maxWaitTime = options.maxWaitTime || 5000;
    this.tokens = options.capacity;
    this.lastRefillTime = Date.now();
  }

  /**
   * 토큰 1개를 획득합니다. 토큰이 없으면 대기합니다.
   * @throws {RateLimitError} maxWaitTime 초과 시
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    const waitTime = this.calculateWaitTime(1);

    if (waitTime > this.maxWaitTime) {
      throw new RateLimitError(
        Math.ceil(waitTime / 1000),
        `Rate limit wait time (${waitTime}ms) exceeds max wait time (${this.maxWaitTime}ms)`
      );
    }

    console.info(`[RateLimiter] Waiting ${waitTime}ms for token...`);
    await this.delay(waitTime);

    this.refill();
    this.tokens -= 1;
  }

  /**
   * 토큰 획득을 시도합니다. 즉시 반환합니다.
   * @returns 성공 여부 (true: 토큰 획득, false: 토큰 부족)
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
   */
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefillTime) / 1000;

    if (elapsed <= 0) {
      return;
    }

    const tokensToAdd = elapsed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  private calculateWaitTime(tokensNeeded: number): number {
    const tokensShortage = tokensNeeded - this.tokens;

    if (tokensShortage <= 0) {
      return 0;
    }

    return (tokensShortage / this.refillRate) * 1000;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * solved.ac API Rate Limiter
 */
export const solvedAcLimiter = new RateLimiter({
  capacity: 10,
  refillRate: 10,
  maxWaitTime: 5000,
});
```

#### `src/api/types.ts` (수정)

**추가 내용**:

```typescript
/**
 * Rate Limit 에러
 */
export class RateLimitError extends Error {
  /**
   * @param retryAfter - 재시도 가능 시간 (초 단위, 선택사항)
   * @param message - 에러 메시지
   */
  constructor(
    public retryAfter?: number,
    message = 'Rate limit exceeded'
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}
```

#### `src/api/solvedac-client.ts` (수정)

**변경 사항**:

```typescript
// import 추가
import { solvedAcLimiter } from '../utils/rate-limiter.js';

// request() 메서드 수정
private async request<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  retries = 0
): Promise<T> {
  // ... (쿼리 파라미터 추가)

  const cacheKey = url.toString();

  // 캐시 확인
  const cached = this.getCached<T>(cacheKey);
  if (cached !== null) {
    return cached; // 캐시 히트 시 Rate Limiter 우회
  }

  // ✨ NEW: Rate Limiting 적용
  await solvedAcLimiter.acquire();

  try {
    // ... (기존 fetch 로직)
  } catch (error) {
    // ... (기존 에러 처리)
  }
}
```

---

## 테스트

### 테스트 파일 구조

```
tests/
├── utils/
│   └── rate-limiter.test.ts              # 단위 테스트 (14개)
└── api/
    └── solvedac-client-rate-limit.test.ts # 통합 테스트 (8개)
```

### 단위 테스트 (`tests/utils/rate-limiter.test.ts`)

**테스트 시나리오**:

1. **Token Bucket 기본 동작** (4개 테스트)
   - 토큰 충분 시 즉시 획득
   - 토큰 소비 검증
   - 시간 경과에 따른 충전
   - 용량 제한 준수

2. **대기 (Waiting)** (2개 테스트)
   - 토큰 부족 시 대기 동작
   - 다중 대기자 처리

3. **타임아웃** (2개 테스트)
   - maxWaitTime 초과 시 에러 발생
   - retryAfter 정보 포함 확인

4. **tryAcquire()** (3개 테스트)
   - 토큰 있을 때 true 반환
   - 토큰 없을 때 false 반환
   - 대기 없이 즉시 반환 확인

5. **엣지 케이스** (3개 테스트)
   - 고속 충전 속도
   - 분수 토큰 처리
   - 0 용량 처리

### 통합 테스트 (`tests/api/solvedac-client-rate-limit.test.ts`)

**테스트 시나리오**:

1. **기본 Rate Limiting** (4개 테스트)
   - API 요청에 Rate Limiting 적용
   - 캐시된 요청은 Rate Limiter 우회
   - 다양한 메서드 혼용
   - Rate Limit 대기 후 복구

2. **부하 테스트** (2개 테스트)
   - 100개 동시 요청 처리
   - 지속적 부하에서 Rate Limit 유지

3. **캐싱 조합** (2개 테스트)
   - 캐시로 Rate Limit 압력 감소
   - 캐시 미스에만 Rate Limiter 사용

### 인수 조건 (Acceptance Criteria)

**기능 요구사항**:
- ✅ RateLimiter 클래스가 Token Bucket 알고리즘 정확히 구현
- ✅ 초당 10회 제한이 정상 작동
- ✅ 대기 시간 초과 시 RateLimitError 발생
- ✅ 캐시 히트 시 Rate Limiter 우회

**성능 요구사항**:
- ✅ 토큰 획득 오버헤드 < 1ms (즉시 획득 시)
- ✅ 대기 시간 정확도 ±10ms

**테스트 요구사항**:
- ✅ 단위 테스트 14개 이상 통과
- ✅ 통합 테스트 8개 이상 통과
- ✅ 부하 테스트 통과 (100개 요청)

---

## 참고 자료

### 관련 문서

- **Phase 4 계획**: [/docs/03-project-management/TASKS.md](/docs/03-project-management/TASKS.md)
- **API 통합 가이드**: [/docs/02-development/EXTERNAL_API.md](/docs/02-development/EXTERNAL_API.md)

### 외부 자료

- [Token Bucket 알고리즘 (Wikipedia)](https://en.wikipedia.org/wiki/Token_bucket)
- [Stripe API Rate Limiting](https://stripe.com/docs/rate-limits)
- [solved.ac API 문서](https://solvedac.github.io/unofficial-documentation/)

### 코드 위치

- **RateLimiter 클래스**: `/src/utils/rate-limiter.ts`
- **SolvedAcClient 통합**: `/src/api/solvedac-client.ts`
- **단위 테스트**: `/tests/utils/rate-limiter.test.ts`
- **통합 테스트**: `/tests/api/solvedac-client-rate-limit.test.ts`

---

## 변경 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|----------|
| 2026-02-15 | project-planner | 최초 작성 (설계서 및 구현 전략) |
| 2026-02-16 | technical-writer | 2개 문서 통합 (design + implementation) |

---

**작성자**: project-planner, technical-writer
**상태**: ✅ 완료 (Phase 4.2)
**다음 단계**: Phase 4.3 (로깅/모니터링) 및 Phase 4.4 (LRU 캐싱)
