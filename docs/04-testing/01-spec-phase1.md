# Phase 1 테스트 스펙

**작성일**: 2026-02-13
**작성자**: QA Testing Agent
**대상**: Phase 1 - 기반 구축
**테스팅 프레임워크**: vitest v4.0.18

---

## 테스트 개요

Phase 1의 핵심 컴포넌트에 대한 단위 테스트 및 통합 테스트를 작성합니다.

**테스트 목표**:
- 코드 커버리지 80% 이상 달성
- 모든 Happy Path 및 Edge Case 검증
- API 모킹을 통한 안정적인 테스트 환경 구축
- 에러 처리 로직 검증

---

## 1. 티어 변환 유틸리티 테스트

**파일**: `tests/utils/tier-converter.test.ts`
**테스트 대상**: `src/utils/tier-converter.ts`
**커버리지 목표**: 100%

### 1.1 테스트 케이스: levelToTier()

#### TC-1.1.1: 정상 변환 - 모든 티어 레벨
**목적**: 1-30 범위의 모든 레벨이 올바른 티어 이름으로 변환되는지 검증

| 입력 | 예상 출력 | 설명 |
|------|-----------|------|
| 1 | "Bronze V" | Bronze 최하위 |
| 5 | "Bronze I" | Bronze 최상위 |
| 6 | "Silver V" | Silver 최하위 |
| 10 | "Silver I" | Silver 최상위 |
| 11 | "Gold V" | Gold 최하위 |
| 15 | "Gold I" | Gold 최상위 |
| 16 | "Platinum V" | Platinum 최하위 |
| 20 | "Platinum I" | Platinum 최상위 |
| 21 | "Diamond V" | Diamond 최하위 |
| 25 | "Diamond I" | Diamond 최상위 |
| 26 | "Ruby V" | Ruby 최하위 |
| 30 | "Ruby I" | Ruby 최상위 |

#### TC-1.1.2: 경계값 테스트
**목적**: 유효 범위 밖의 입력에 대한 에러 처리 검증

| 입력 | 예상 결과 | 에러 메시지 |
|------|-----------|-------------|
| 0 | Error | "Level must be between 1 and 30" |
| -1 | Error | "Level must be between 1 and 30" |
| 31 | Error | "Level must be between 1 and 30" |
| 100 | Error | "Level must be between 1 and 30" |

#### TC-1.1.3: 타입 검증
**목적**: 잘못된 타입 입력 처리

| 입력 | 예상 결과 |
|------|-----------|
| null | Error |
| undefined | Error |
| "15" | Error (타입 불일치) |
| 15.5 | Error (정수가 아님) |

### 1.2 테스트 케이스: tierToLevelRange()

#### TC-1.2.1: 정상 변환 - 모든 티어 그룹
**목적**: 티어 이름이 올바른 레벨 범위로 변환되는지 검증

| 입력 | 예상 출력 | 설명 |
|------|-----------|------|
| "Bronze" | [1, 5] | Bronze 전체 |
| "Silver" | [6, 10] | Silver 전체 |
| "Gold" | [11, 15] | Gold 전체 |
| "Platinum" | [16, 20] | Platinum 전체 |
| "Diamond" | [21, 25] | Diamond 전체 |
| "Ruby" | [26, 30] | Ruby 전체 |

#### TC-1.2.2: 대소문자 무관 처리
**목적**: 다양한 대소문자 입력 허용

| 입력 | 예상 출력 |
|------|-----------|
| "gold" | [11, 15] |
| "GOLD" | [11, 15] |
| "GoLd" | [11, 15] |

#### TC-1.2.3: 유효하지 않은 티어 이름
**목적**: 잘못된 티어 이름 처리

| 입력 | 예상 결과 | 에러 메시지 |
|------|-----------|-------------|
| "Master" | Error | "Invalid tier name" |
| "Unknown" | Error | "Invalid tier name" |
| "" | Error | "Invalid tier name" |

### 1.3 테스트 케이스: getTierBadge()

#### TC-1.3.1: 정상 뱃지 생성
**목적**: 레벨에 맞는 이모지와 티어 이름 생성

| 입력 | 예상 출력 | 설명 |
|------|-----------|------|
| 1 | "🟤 Bronze V" | Bronze 색상 |
| 6 | "⚪ Silver V" | Silver 색상 |
| 11 | "🟡 Gold V" | Gold 색상 |
| 16 | "🟢 Platinum V" | Platinum 색상 |
| 21 | "🔵 Diamond V" | Diamond 색상 |
| 26 | "🔴 Ruby V" | Ruby 색상 |

#### TC-1.3.2: 경계값 테스트
**목적**: 잘못된 레벨 입력 시 에러 발생

| 입력 | 예상 결과 |
|------|-----------|
| 0 | Error |
| 31 | Error |

### 1.4 테스트 케이스: 양방향 변환 일관성

#### TC-1.4.1: 왕복 변환 검증
**목적**: level → tier → level 변환 시 원래 값 유지

```typescript
// 모든 레벨 1-30에 대해
for (let level = 1; level <= 30; level++) {
  const tierName = levelToTier(level);
  const [min, max] = tierToLevelRange(tierName.split(' ')[0]);
  expect(level).toBeGreaterThanOrEqual(min);
  expect(level).toBeLessThanOrEqual(max);
}
```

---

## 2. solved.ac API 클라이언트 테스트

**파일**: `tests/api/solvedac-client.test.ts`
**테스트 대상**: `src/api/solvedac-client.ts`
**커버리지 목표**: 85%

### 2.1 테스트 케이스: searchProblems()

#### TC-2.1.1: 기본 검색 (필터 없음)
**목적**: 기본 문제 검색 동작 검증

**입력**:
```typescript
{}
```

**예상 동작**:
- API 호출: `GET /search/problem?query=&page=1`
- 성공 응답 반환
- 문제 배열 포함
- 페이지네이션 정보 포함

#### TC-2.1.2: 키워드 검색
**목적**: 검색어 필터링 검증

**입력**:
```typescript
{ query: "그래프" }
```

**예상 동작**:
- API 호출: `GET /search/problem?query=그래프`
- 검색어가 URL 인코딩됨
- 관련 문제 반환

#### TC-2.1.3: 레벨 범위 필터
**목적**: 난이도 필터링 검증

**입력**:
```typescript
{ level_min: 11, level_max: 15 }  // Gold 티어
```

**예상 동작**:
- API 호출 시 쿼리 파라미터 포함
- 반환된 모든 문제의 레벨이 11-15 범위

#### TC-2.1.4: 태그 필터
**목적**: 알고리즘 태그 필터링 검증

**입력**:
```typescript
{ tag: "dp" }
```

**예상 동작**:
- API 호출 시 태그 파라미터 포함
- 반환된 문제들이 "dp" 태그 포함

#### TC-2.1.5: 복합 필터
**목적**: 여러 필터 동시 적용

**입력**:
```typescript
{
  query: "최단거리",
  level_min: 11,
  level_max: 15,
  tag: "graphs",
  sort: "level",
  direction: "asc"
}
```

**예상 동작**:
- 모든 필터가 쿼리 스트링에 포함
- 정렬 옵션 적용됨

#### TC-2.1.6: 페이지네이션
**목적**: 페이지 처리 검증

**입력**:
```typescript
{ page: 2 }
```

**예상 동작**:
- API 호출: `?page=2`
- 2페이지 데이터 반환
- 페이지 정보가 응답에 포함

### 2.2 테스트 케이스: getProblem()

#### TC-2.2.1: 유효한 문제 ID
**목적**: 정상적인 문제 정보 조회

**입력**:
```typescript
1000  // A+B 문제
```

**예상 동작**:
- API 호출: `GET /problem/show?problemId=1000`
- 문제 메타데이터 반환
- 필수 필드 존재: problemId, titleKo, level, tags

#### TC-2.2.2: 존재하지 않는 문제 ID
**목적**: 404 에러 처리

**입력**:
```typescript
999999999
```

**예상 결과**:
- API 404 응답
- `ProblemNotFoundError` 발생
- 명확한 에러 메시지

#### TC-2.2.3: 유효하지 않은 ID 형식
**목적**: 입력 검증

**입력**:
```typescript
-1, 0, "abc"
```

**예상 결과**:
- `InvalidInputError` 발생

### 2.3 테스트 케이스: searchTags()

#### TC-2.3.1: 한글 키워드 검색
**목적**: 한글 태그 검색

**입력**:
```typescript
"다이나믹"
```

**예상 동작**:
- API 호출 시 UTF-8 인코딩
- "dp" 관련 태그 반환
- 한글 표시명 포함

#### TC-2.3.2: 영문 키워드 검색
**목적**: 영문 태그 검색

**입력**:
```typescript
"dynamic"
```

**예상 동작**:
- "dp", "dynamic_programming" 등 반환

#### TC-2.3.3: 부분 매칭
**목적**: 부분 문자열 검색

**입력**:
```typescript
"graph"
```

**예상 동작**:
- "graphs", "graph_traversal" 등 관련 태그 반환

#### TC-2.3.4: 검색 결과 없음
**목적**: 빈 결과 처리

**입력**:
```typescript
"zxcvbnmasdfghjkl"
```

**예상 결과**:
- 빈 배열 반환
- 에러 발생하지 않음

### 2.4 테스트 케이스: 에러 처리

#### TC-2.4.1: 네트워크 타임아웃
**목적**: 타임아웃 에러 처리

**시나리오**:
- 10초 이상 응답 없음

**예상 결과**:
- `TimeoutError` 발생
- 에러 메시지: "Request timed out"

#### TC-2.4.2: API 서버 에러 (500)
**목적**: 서버 에러 처리

**시나리오**:
- API 500 응답

**예상 결과**:
- `APIError` 발생
- 에러 메시지 포함

#### TC-2.4.3: 레이트 리밋 (429)
**목적**: Rate Limit 처리

**시나리오**:
- API 429 응답

**예상 결과**:
- `RateLimitError` 발생
- Retry-After 헤더 파싱

#### TC-2.4.4: 네트워크 연결 실패
**목적**: 네트워크 에러 처리

**시나리오**:
- DNS 실패, 연결 거부 등

**예상 결과**:
- `NetworkError` 발생

### 2.5 테스트 케이스: 재시도 로직

#### TC-2.5.1: 일시적 실패 후 성공
**목적**: 재시도 성공 시나리오

**시나리오**:
1. 첫 번째 요청: 500 에러
2. 두 번째 요청: 200 성공

**예상 동작**:
- 자동으로 재시도
- 최종적으로 성공 응답 반환
- 재시도 횟수 로깅

#### TC-2.5.2: 최대 재시도 초과
**목적**: 재시도 제한 검증

**시나리오**:
- 3회 연속 500 에러

**예상 결과**:
- 3회 재시도 후 에러 발생
- `MaxRetriesExceededError`

### 2.6 테스트 케이스: 캐싱 동작

#### TC-2.6.1: 캐시 히트
**목적**: 같은 요청 시 캐시 사용

**시나리오**:
1. `getProblem(1000)` 첫 번째 호출 - API 요청
2. `getProblem(1000)` 두 번째 호출 - 캐시 사용

**예상 동작**:
- 두 번째 호출 시 API 요청 없음
- 동일한 결과 반환
- 응답 시간 단축

#### TC-2.6.2: 캐시 만료 (TTL)
**목적**: TTL 이후 새로운 요청

**시나리오**:
1. `getProblem(1000)` - 캐시 저장
2. 1시간 대기 (또는 모킹)
3. `getProblem(1000)` - 캐시 만료

**예상 동작**:
- 새로운 API 요청 발생
- 캐시 갱신

#### TC-2.6.3: 캐시 무효화
**목적**: 수동 캐시 클리어

**시나리오**:
1. 여러 요청으로 캐시 채움
2. `clearCache()` 호출
3. 동일 요청 재실행

**예상 동작**:
- 캐시가 비워짐
- 새로운 API 요청 발생

---

## 3. API 타입 검증 테스트

**파일**: `tests/api/types.test.ts`
**테스트 대상**: `src/api/types.ts`
**커버리지 목표**: 100%

### 3.1 테스트 케이스: 타입 가드 함수

#### TC-3.1.1: isProblem() 타입 가드
**목적**: Problem 타입 검증

**유효한 입력**:
```typescript
{
  problemId: 1000,
  titleKo: "A+B",
  level: 1,
  tags: [{ key: "math", displayNames: [{ name: "수학" }] }],
  acceptedUserCount: 100000,
  averageTries: 1.5
}
```

**무효한 입력**:
```typescript
{ problemId: "1000" }  // 타입 불일치
{ titleKo: "A+B" }     // 필수 필드 누락
```

#### TC-3.1.2: isTag() 타입 가드
**목적**: Tag 타입 검증

**유효한 입력**:
```typescript
{
  key: "dp",
  displayNames: [
    { language: "ko", name: "다이나믹 프로그래밍" },
    { language: "en", name: "Dynamic Programming" }
  ],
  problemCount: 1500
}
```

### 3.2 테스트 케이스: Zod 스키마 검증

#### TC-3.2.1: ProblemSchema 파싱
**목적**: Zod 스키마로 API 응답 검증

**시나리오**:
- API 응답 객체를 ProblemSchema로 파싱
- 유효성 검증 통과
- 타입 안전성 확보

---

## 4. MCP 서버 통합 테스트

**파일**: `tests/integration/mcp-server.test.ts`
**테스트 대상**: `src/index.ts`
**커버리지 목표**: 70%

### 4.1 테스트 케이스: 서버 초기화

#### TC-4.1.1: 서버 시작
**목적**: MCP 서버 정상 시작 검증

**예상 동작**:
- 서버 인스턴스 생성
- 에러 없이 초기화
- Transport 연결 대기

#### TC-4.1.2: Health Check
**목적**: 서버 상태 확인

**예상 동작**:
- 서버가 응답함
- 정상 상태 코드 반환

### 4.2 테스트 케이스: 도구 등록 (Phase 2 이후)

#### TC-4.2.1: 도구 목록 조회
**목적**: 등록된 도구 확인

**예상 결과**:
- MCP 도구 목록 반환
- 각 도구의 메타데이터 포함

---

## 5. 통합 워크플로우 테스트

**파일**: `tests/integration/api-workflow.test.ts`
**커버리지 목표**: N/A (E2E 성격)

### 5.1 테스트 시나리오: 문제 발견 플로우

#### TS-5.1.1: 키워드 검색 → 문제 선택 → 상세 조회
**목적**: 실제 사용자 플로우 검증

**단계**:
1. `searchProblems({ query: "그래프", level_min: 11, level_max: 15 })`
2. 첫 번째 결과에서 problemId 추출
3. `getProblem(problemId)`로 상세 정보 조회

**예상 결과**:
- 모든 단계 성공
- 일관된 데이터 (검색 결과와 상세 정보 일치)

#### TS-5.1.2: 태그 검색 → 문제 검색
**목적**: 태그 기반 탐색 플로우

**단계**:
1. `searchTags("다이나믹")`
2. 첫 번째 태그의 key 추출
3. `searchProblems({ tag: key })`

**예상 결과**:
- 관련 문제 목록 반환
- 모든 문제가 해당 태그 포함

---

## 6. 성능 테스트

**파일**: `tests/performance/api-performance.test.ts`
**목적**: API 응답 시간 및 캐싱 효과 측정

### 6.1 성능 기준

| 작업 | 목표 시간 | 캐시 사용 시 |
|------|-----------|--------------|
| searchProblems | < 2초 | N/A |
| getProblem (캐시 미스) | < 1초 | N/A |
| getProblem (캐시 히트) | N/A | < 50ms |
| searchTags | < 1.5초 | N/A |

### 6.2 테스트 케이스

#### TC-6.1.1: 캐시 효과 측정
**목적**: 캐싱으로 인한 성능 향상 검증

**시나리오**:
1. 동일한 문제를 10회 조회
2. 첫 번째 요청 시간 vs 이후 요청 평균 시간 비교

**예상 결과**:
- 캐시 히트 시 90% 이상 시간 단축

#### TC-6.1.2: 동시 요청 처리
**목적**: 병렬 요청 처리 성능

**시나리오**:
- 10개의 서로 다른 문제를 동시에 조회

**예상 결과**:
- 모든 요청이 5초 이내 완료
- 에러 없이 모두 성공

---

## 7. 모킹 전략

### 7.1 API Mock 데이터

**파일**: `tests/__mocks__/solved-ac-responses.ts`

#### Mock Problem 데이터
```typescript
export const mockProblem1000 = {
  problemId: 1000,
  titleKo: "A+B",
  level: 1,
  tags: [
    {
      key: "math",
      displayNames: [{ language: "ko", name: "수학" }],
      problemCount: 5000
    }
  ],
  acceptedUserCount: 500000,
  averageTries: 1.2
};
```

#### Mock Search Result
```typescript
export const mockSearchResult = {
  count: 100,
  items: [mockProblem1000, mockProblem1001, ...],
  page: 1
};
```

### 7.2 fetch 모킹

**라이브러리**: vitest의 vi.fn()

**전략**:
- 각 테스트에서 fetch를 모킹
- 응답 상태 코드 제어
- 타임아웃/에러 시뮬레이션

---

## 8. 테스트 실행 및 커버리지

### 8.1 실행 명령어

```bash
# 모든 테스트 실행
npm test

# 워치 모드
npm run test:watch

# 커버리지 포함
npm test -- --coverage

# 특정 파일만 실행
npm test tests/utils/tier-converter.test.ts
```

### 8.2 커버리지 목표

| 컴포넌트 | 목표 커버리지 | 우선순위 |
|----------|---------------|----------|
| tier-converter.ts | 100% | 높음 |
| types.ts | 100% | 높음 |
| solvedac-client.ts | 85% | 높음 |
| index.ts | 70% | 중간 |

### 8.3 커버리지 측정 항목

- **Statements**: 모든 구문 실행
- **Branches**: 모든 조건문 분기
- **Functions**: 모든 함수 호출
- **Lines**: 모든 라인 실행

---

## 9. 테스트 작성 가이드라인

### 9.1 명명 규칙

```typescript
// ✅ 좋은 예
it('should return "Gold I" when level is 15', { timeout: 5000 }, async () => {
  // ...
});

// ❌ 나쁜 예
it('test tier conversion', async () => {
  // ...
});
```

### 9.2 AAA 패턴

```typescript
it('should handle API timeout', { timeout: 15000 }, async () => {
  // Arrange
  vi.spyOn(global, 'fetch').mockImplementation(() =>
    new Promise(resolve => setTimeout(resolve, 11000))
  );
  const client = new SolvedAcClient();

  // Act & Assert
  await expect(client.getProblem(1000)).rejects.toThrow('timeout');
});
```

### 9.3 격리 원칙

- 각 테스트는 독립적으로 실행 가능
- 테스트 간 의존성 없음
- beforeEach/afterEach로 상태 초기화

---

## 10. CI/CD 통합 (향후)

### 10.1 GitHub Actions 설정

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run build
```

### 10.2 품질 게이트

- 모든 테스트 통과 필수
- 커버리지 80% 미만 시 경고
- 빌드 성공 확인

---

## 11. 테스트 우선순위

### Phase 1 테스트 순서

1. ✅ **tier-converter.test.ts** - 가장 단순, 의존성 없음
2. ✅ **types.test.ts** - 타입 가드 검증
3. ✅ **solvedac-client.test.ts** - API 클라이언트 핵심 기능
4. ✅ **api-workflow.test.ts** - 통합 워크플로우
5. ⏸️ **mcp-server.test.ts** - Phase 2 이후 도구 등록 후

### 블로킹 이슈

- 실제 API 응답 스키마 확인 필요
- Mock 데이터 정확성 검증 필요

---

## 12. 발견된 이슈 추적

### 이슈 템플릿

```markdown
### [이슈 ID] 제목

**발견일**: YYYY-MM-DD
**심각도**: Critical / High / Medium / Low
**재현 단계**:
1. ...
2. ...

**예상 동작**:
...

**실제 동작**:
...

**영향 범위**:
...

**해결 방안**:
...
```

---

## 부록: vitest 4.x 주요 변경사항

### 타임아웃 설정 방식

```typescript
// vitest 4.x
it('test name', { timeout: 10000 }, async () => {
  // 옵션을 두 번째 인자로
});

// vitest 3.x (구버전)
it('test name', async () => {
  // ...
}, 10000);  // 타임아웃을 세 번째 인자로
```

### 모킹 API

```typescript
// vi.fn() - 함수 모킹
// vi.spyOn() - 메서드 스파이
// vi.mock() - 모듈 모킹
```

---

**문서 상태**: 초안 완료
**다음 단계**: 테스트 코드 구현 및 실행
