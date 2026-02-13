# Phase 2: 핵심 도구 테스트 스펙

**프로젝트**: cote-mcp-server
**Phase**: 2 - Core Tools (핵심 도구)
**작성일**: 2026-02-13
**상태**: 📋 PLANNED

---

## 개요

### 목표
Phase 2는 MCP 서버의 핵심 도구인 문제 검색, 문제 조회, 태그 검색 기능을 구현합니다. solved.ac API를 통해 BOJ 문제 데이터를 가져오고, MCP 프로토콜에 맞게 구조화된 응답을 제공합니다.

### 테스트 대상
1. **search_problems** - 다중 필터를 지원하는 문제 검색 도구
2. **get_problem** - 단일 문제 상세 조회 도구
3. **search_tags** - 알고리즘 태그 검색 도구
4. **MCP Server Integration** - 도구 등록 및 전체 통합

### 의존성
- ✅ Phase 1 완료 (API 클라이언트, 티어 유틸리티)
- ✅ solved.ac API 접근 가능
- ✅ Zod 스키마 검증 라이브러리

### 테스트 전략
- **단위 테스트**: 각 도구의 입력 검증, 응답 포맷팅
- **통합 테스트**: solved.ac API 호출 및 응답 처리
- **E2E 테스트**: MCP 프로토콜을 통한 전체 플로우

---

## 1. search_problems 도구 테스트

### TC-2.1.1: 기본 문제 검색
**파일**: `tests/tools/search-problems.test.ts`
**타입**: Integration
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: 필터 없이 기본 검색 요청
2. **When**: search_problems({}) 호출
3. **Then**: 문제 목록 반환 (기본 정렬)

#### 코드 예시
```typescript
describe('search_problems', () => {
  it('should return problem list with default settings', async () => {
    const result = await searchProblems({});

    expect(result.problems).toBeDefined();
    expect(result.problems.length).toBeGreaterThan(0);
    expect(result.problems[0]).toHaveProperty('problemId');
    expect(result.problems[0]).toHaveProperty('titleKo');
    expect(result.problems[0]).toHaveProperty('level');
  });
});
```

#### 성공 기준
- [ ] 최소 1개 이상의 문제 반환
- [ ] 각 문제에 필수 필드 포함 (problemId, titleKo, level)
- [ ] 응답 시간 < 2초

---

### TC-2.1.2: 티어 범위 필터링
**파일**: `tests/tools/search-problems.test.ts`
**타입**: Integration
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: level_min=11, level_max=15 (Gold 티어)
2. **When**: search_problems({ level_min: 11, level_max: 15 }) 호출
3. **Then**: Gold 티어 문제만 반환

#### 코드 예시
```typescript
it('should filter problems by tier range', async () => {
  const result = await searchProblems({
    level_min: 11,
    level_max: 15
  });

  expect(result.problems.every(p => p.level >= 11 && p.level <= 15)).toBe(true);
});
```

#### 성공 기준
- [ ] 모든 문제의 level이 11-15 범위
- [ ] 최소 5개 이상의 결과
- [ ] 티어 변환 정확 (getTierBadge 사용)

---

### TC-2.1.3: 태그 필터링
**파일**: `tests/tools/search-problems.test.ts`
**타입**: Integration
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: tag="dp" (동적계획법)
2. **When**: search_problems({ tag: "dp" }) 호출
3. **Then**: DP 태그가 있는 문제만 반환

#### 코드 예시
```typescript
it('should filter problems by tag', async () => {
  const result = await searchProblems({ tag: 'dp' });

  expect(result.problems.every(p =>
    p.tags.some(tag => tag.key === 'dp')
  )).toBe(true);
});
```

#### 성공 기준
- [ ] 모든 문제에 'dp' 태그 포함
- [ ] 태그 표시명 한글 우선
- [ ] 최소 10개 이상의 결과

---

### TC-2.1.4: 정렬 옵션 (레벨 오름차순)
**파일**: `tests/tools/search-problems.test.ts`
**타입**: Unit
**우선순위**: P1

#### 테스트 시나리오
1. **Given**: sort="level", direction="asc"
2. **When**: search_problems({ sort: "level", direction: "asc" }) 호출
3. **Then**: 레벨 오름차순 정렬된 결과

#### 코드 예시
```typescript
it('should sort problems by level ascending', async () => {
  const result = await searchProblems({
    sort: 'level',
    direction: 'asc'
  });

  const levels = result.problems.map(p => p.level);
  expect(levels).toEqual([...levels].sort((a, b) => a - b));
});
```

#### 성공 기준
- [ ] 레벨 오름차순 정렬 확인
- [ ] 정렬 순서가 일관됨

---

### TC-2.1.5: 페이지네이션
**파일**: `tests/tools/search-problems.test.ts`
**타입**: Integration
**우선순위**: P1

#### 테스트 시나리오
1. **Given**: page=2
2. **When**: search_problems({ page: 2 }) 호출
3. **Then**: 2페이지 결과 반환

#### 코드 예시
```typescript
it('should handle pagination correctly', async () => {
  const page1 = await searchProblems({ page: 1 });
  const page2 = await searchProblems({ page: 2 });

  expect(page1.problems[0].problemId).not.toBe(page2.problems[0].problemId);
  expect(page2.currentPage).toBe(2);
});
```

#### 성공 기준
- [ ] 페이지별로 다른 결과 반환
- [ ] currentPage 필드 정확
- [ ] totalCount 필드 포함

---

### TC-2.1.6: 빈 결과 처리
**파일**: `tests/tools/search-problems.test.ts`
**타입**: Unit
**우선순위**: P1

#### 테스트 시나리오
1. **Given**: 존재하지 않는 조건 (예: level_min=100)
2. **When**: search_problems({ level_min: 100 }) 호출
3. **Then**: 빈 배열 및 적절한 메시지

#### 코드 예시
```typescript
it('should handle empty results gracefully', async () => {
  const result = await searchProblems({ level_min: 100 });

  expect(result.problems).toEqual([]);
  expect(result.totalCount).toBe(0);
  expect(result.message).toContain('검색 결과가 없습니다');
});
```

#### 성공 기준
- [ ] 빈 배열 반환 (에러 아님)
- [ ] 사용자 친화적 메시지
- [ ] totalCount === 0

---

### TC-2.1.7: 유효하지 않은 입력 검증
**파일**: `tests/tools/search-problems.test.ts`
**타입**: Unit
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: 잘못된 level_min (예: -1)
2. **When**: search_problems({ level_min: -1 }) 호출
3. **Then**: Zod 검증 에러

#### 코드 예시
```typescript
it('should reject invalid level_min', async () => {
  await expect(searchProblems({ level_min: -1 }))
    .rejects.toThrow('Number must be greater than or equal to 1');
});

it('should reject invalid sort option', async () => {
  await expect(searchProblems({ sort: 'invalid' as any }))
    .rejects.toThrow();
});
```

#### 성공 기준
- [ ] level_min: 1-30 범위 검증
- [ ] level_max: 1-30 범위 검증
- [ ] sort: 허용된 값만 (level, id, average_try)
- [ ] direction: asc 또는 desc만
- [ ] page: 양수만

---

### TC-2.1.8: API 실패 처리
**파일**: `tests/tools/search-problems.test.ts`
**타입**: Integration
**우선순위**: P1

#### 테스트 시나리오
1. **Given**: solved.ac API 타임아웃
2. **When**: API 호출 실패
3. **Then**: 명확한 에러 메시지

#### 코드 예시
```typescript
it('should handle API timeout gracefully', async () => {
  mockApiClient.searchProblems.mockRejectedValue(new Error('Timeout'));

  await expect(searchProblems({}))
    .rejects.toThrow('문제 검색 중 오류가 발생했습니다');
});
```

#### 성공 기준
- [ ] 네트워크 에러 처리
- [ ] 사용자 친화적 에러 메시지
- [ ] 스택 트레이스 노출 안 함

---

## 2. get_problem 도구 테스트

### TC-2.2.1: 유효한 문제 ID 조회
**파일**: `tests/tools/get-problem.test.ts`
**타입**: Integration
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: 유효한 문제 ID (예: 1000번 A+B)
2. **When**: get_problem({ problem_id: 1000 }) 호출
3. **Then**: 문제 상세 정보 반환

#### 코드 예시
```typescript
describe('get_problem', () => {
  it('should return problem details for valid ID', async () => {
    const result = await getProblem({ problem_id: 1000 });

    expect(result.problemId).toBe(1000);
    expect(result.titleKo).toBe('A+B');
    expect(result.level).toBeGreaterThan(0);
    expect(result.tags).toBeDefined();
    expect(result.link).toBe('https://www.acmicpc.net/problem/1000');
  });
});
```

#### 성공 기준
- [ ] 모든 메타데이터 필드 포함
- [ ] 티어 이름 변환 정확
- [ ] BOJ 링크 생성 정확
- [ ] 태그 한글 표시명 포함

---

### TC-2.2.2: 존재하지 않는 문제 ID
**파일**: `tests/tools/get-problem.test.ts`
**타입**: Integration
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: 존재하지 않는 문제 ID (예: 999999)
2. **When**: get_problem({ problem_id: 999999 }) 호출
3. **Then**: 명확한 에러 메시지

#### 코드 예시
```typescript
it('should throw error for non-existent problem', async () => {
  await expect(getProblem({ problem_id: 999999 }))
    .rejects.toThrow('문제를 찾을 수 없습니다: 999999번');
});
```

#### 성공 기준
- [ ] ProblemNotFoundError 발생
- [ ] 에러 메시지에 문제 ID 포함
- [ ] 사용자 친화적 메시지

---

### TC-2.2.3: 유효하지 않은 문제 ID
**파일**: `tests/tools/get-problem.test.ts`
**타입**: Unit
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: 잘못된 문제 ID (0, 음수, 문자열)
2. **When**: get_problem 호출
3. **Then**: Zod 검증 에러

#### 코드 예시
```typescript
it('should reject problem_id of 0', async () => {
  await expect(getProblem({ problem_id: 0 }))
    .rejects.toThrow('Number must be positive');
});

it('should reject negative problem_id', async () => {
  await expect(getProblem({ problem_id: -100 }))
    .rejects.toThrow('Number must be positive');
});

it('should reject non-numeric problem_id', async () => {
  await expect(getProblem({ problem_id: 'abc' as any }))
    .rejects.toThrow();
});
```

#### 성공 기준
- [ ] 0 거부
- [ ] 음수 거부
- [ ] 비숫자 거부
- [ ] 명확한 검증 에러

---

### TC-2.2.4: 문제 메타데이터 포맷팅
**파일**: `tests/tools/get-problem.test.ts`
**타입**: Unit
**우선순위**: P1

#### 테스트 시나리오
1. **Given**: API 응답 (level=15)
2. **When**: 응답 포맷팅
3. **Then**: 티어 변환 및 구조화

#### 코드 예시
```typescript
it('should format problem metadata correctly', async () => {
  const result = await getProblem({ problem_id: 11053 });

  expect(result.tierName).toBe('Gold V');
  expect(result.tierBadge).toContain('🟡');
  expect(result.tags[0]).toHaveProperty('displayNameKo');
  expect(result.acceptedUserCount).toBeGreaterThan(0);
});
```

#### 성공 기준
- [ ] tierName 필드 추가 (문자열)
- [ ] tierBadge 필드 추가 (이모지 포함)
- [ ] 태그에 displayNameKo 포함
- [ ] 통계 정보 숫자 포맷팅

---

### TC-2.2.5: API 캐싱 (선택 사항)
**파일**: `tests/tools/get-problem.test.ts`
**타입**: Integration
**우선순위**: P2

#### 테스트 시나리오
1. **Given**: 동일한 문제 ID 두 번 조회
2. **When**: 첫 번째 호출 후 두 번째 호출
3. **Then**: 두 번째 호출은 캐시에서 반환

#### 코드 예시
```typescript
it('should cache problem data', async () => {
  const spy = vi.spyOn(apiClient, 'getProblem');

  await getProblem({ problem_id: 1000 });
  await getProblem({ problem_id: 1000 });

  expect(spy).toHaveBeenCalledTimes(1); // 첫 번째만 API 호출
});
```

#### 성공 기준
- [ ] 동일 ID는 API 1회만 호출
- [ ] 캐시 TTL 설정 (24시간)
- [ ] 캐시 히트율 로깅

---

## 3. search_tags 도구 테스트

### TC-2.3.1: 한글 키워드 검색
**파일**: `tests/tools/search-tags.test.ts`
**타입**: Integration
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: query="다이나믹"
2. **When**: search_tags({ query: "다이나믹" }) 호출
3. **Then**: 관련 태그 반환 (dp)

#### 코드 예시
```typescript
describe('search_tags', () => {
  it('should search tags by Korean keyword', async () => {
    const result = await searchTags({ query: '다이나믹' });

    expect(result.tags.length).toBeGreaterThan(0);
    expect(result.tags.some(tag => tag.key === 'dp')).toBe(true);
    expect(result.tags[0].displayNameKo).toBeDefined();
  });
});
```

#### 성공 기준
- [ ] 한글 키워드로 검색 가능
- [ ] dp 태그 포함
- [ ] 한글 표시명 포함

---

### TC-2.3.2: 영문 키워드 검색
**파일**: `tests/tools/search-tags.test.ts`
**타입**: Integration
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: query="dynamic"
2. **When**: search_tags({ query: "dynamic" }) 호출
3. **Then**: 관련 태그 반환

#### 코드 예시
```typescript
it('should search tags by English keyword', async () => {
  const result = await searchTags({ query: 'dynamic' });

  expect(result.tags.length).toBeGreaterThan(0);
  expect(result.tags.some(tag => tag.key === 'dp')).toBe(true);
});
```

#### 성공 기준
- [ ] 영문 키워드로 검색 가능
- [ ] 한글 검색과 동일한 결과

---

### TC-2.3.3: 부분 매칭
**파일**: `tests/tools/search-tags.test.ts`
**타입**: Integration
**우선순위**: P1

#### 테스트 시나리오
1. **Given**: query="그래"
2. **When**: search_tags({ query: "그래" }) 호출
3. **Then**: "그래프", "그리디" 등 포함

#### 코드 예시
```typescript
it('should support partial matching', async () => {
  const result = await searchTags({ query: '그래' });

  const tagNames = result.tags.map(t => t.displayNameKo);
  expect(tagNames.some(name => name.includes('그래프'))).toBe(true);
});
```

#### 성공 기준
- [ ] 부분 매칭 지원
- [ ] 여러 결과 반환
- [ ] 관련도순 정렬

---

### TC-2.3.4: 빈 결과 처리
**파일**: `tests/tools/search-tags.test.ts`
**타입**: Unit
**우선순위**: P1

#### 테스트 시나리오
1. **Given**: query="존재하지않는태그"
2. **When**: search_tags 호출
3. **Then**: 빈 배열 및 메시지

#### 코드 예시
```typescript
it('should handle empty results gracefully', async () => {
  const result = await searchTags({ query: '존재하지않는태그' });

  expect(result.tags).toEqual([]);
  expect(result.message).toContain('검색 결과가 없습니다');
});
```

#### 성공 기준
- [ ] 빈 배열 반환
- [ ] 사용자 친화적 메시지

---

### TC-2.3.5: 유효하지 않은 입력 검증
**파일**: `tests/tools/search-tags.test.ts`
**타입**: Unit
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: 빈 문자열 또는 공백
2. **When**: search_tags 호출
3. **Then**: Zod 검증 에러

#### 코드 예시
```typescript
it('should reject empty query', async () => {
  await expect(searchTags({ query: '' }))
    .rejects.toThrow('String must contain at least 1 character(s)');
});

it('should reject missing query', async () => {
  await expect(searchTags({} as any))
    .rejects.toThrow('Required');
});
```

#### 성공 기준
- [ ] 빈 문자열 거부
- [ ] 누락된 query 거부
- [ ] 최소 1자 이상 요구

---

### TC-2.3.6: 태그 메타데이터
**파일**: `tests/tools/search-tags.test.ts`
**타입**: Unit
**우선순위**: P1

#### 테스트 시나리오
1. **Given**: 태그 검색 결과
2. **When**: 응답 확인
3. **Then**: 문제 개수 포함

#### 코드 예시
```typescript
it('should include problem count in tags', async () => {
  const result = await searchTags({ query: 'dp' });

  expect(result.tags[0]).toHaveProperty('problemCount');
  expect(result.tags[0].problemCount).toBeGreaterThan(0);
});
```

#### 성공 기준
- [ ] problemCount 필드 포함
- [ ] 양수 값
- [ ] 정확한 카운트

---

## 4. MCP 서버 통합 테스트

### TC-2.4.1: 도구 등록 확인
**파일**: `tests/integration/mcp-server.test.ts`
**타입**: Integration
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: MCP 서버 시작
2. **When**: 도구 목록 조회
3. **Then**: 3개 도구 모두 등록됨

#### 코드 예시
```typescript
describe('MCP Server Integration', () => {
  it('should register all Phase 2 tools', async () => {
    const server = new McpServer({ name: 'cote-mcp' });
    // 도구 등록 로직

    const tools = server.listTools();
    expect(tools).toContain('search_problems');
    expect(tools).toContain('get_problem');
    expect(tools).toContain('search_tags');
  });
});
```

#### 성공 기준
- [ ] 3개 도구 모두 등록
- [ ] 도구 메타데이터 정확
- [ ] 스키마 정의 정확

---

### TC-2.4.2: 도구 호출 플로우
**파일**: `tests/integration/mcp-server.test.ts`
**타입**: E2E
**우선순위**: P0

#### 테스트 시나리오
1. **Given**: MCP 클라이언트 연결
2. **When**: search_problems 도구 호출
3. **Then**: MCP 프로토콜 응답 수신

#### 코드 예시
```typescript
it('should handle tool call through MCP protocol', async () => {
  const client = new McpClient();
  await client.connect(server);

  const response = await client.callTool('search_problems', {
    level_min: 11,
    level_max: 15
  });

  expect(response.type).toBe('text');
  expect(JSON.parse(response.text)).toHaveProperty('problems');
});
```

#### 성공 기준
- [ ] MCP 프로토콜 준수
- [ ] JSON-RPC 2.0 형식
- [ ] 에러 처리 정확

---

### TC-2.4.3: 에러 로깅
**파일**: `tests/integration/mcp-server.test.ts`
**타입**: Integration
**우선순위**: P1

#### 테스트 시나리오
1. **Given**: 에러 발생 시나리오
2. **When**: 도구 호출 실패
3. **Then**: 에러 로그 기록

#### 코드 예시
```typescript
it('should log errors properly', async () => {
  const logSpy = vi.spyOn(console, 'error');

  await expect(getProblem({ problem_id: 999999 }))
    .rejects.toThrow();

  expect(logSpy).toHaveBeenCalledWith(
    expect.stringContaining('Problem not found')
  );
});
```

#### 성공 기준
- [ ] 에러 로그 기록
- [ ] 스택 트레이스 포함
- [ ] 민감 정보 마스킹

---

## 5. 성능 테스트

### TC-2.5.1: 응답 시간 측정
**파일**: `tests/performance/response-time.test.ts`
**타입**: Performance
**우선순위**: P2

#### 테스트 시나리오
1. **Given**: 각 도구 호출
2. **When**: 응답 시간 측정
3. **Then**: 목표 시간 내 응답

#### 코드 예시
```typescript
describe('Performance Tests', () => {
  it('search_problems should respond within 2 seconds', async () => {
    const start = Date.now();
    await searchProblems({});
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000);
  });

  it('get_problem should respond within 500ms (with cache)', async () => {
    await getProblem({ problem_id: 1000 }); // 캐시 워밍

    const start = Date.now();
    await getProblem({ problem_id: 1000 });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
  });
});
```

#### 성공 기준
- [ ] search_problems: < 2초
- [ ] get_problem: < 500ms (캐시 히트)
- [ ] search_tags: < 1초

---

## 테스트 실행 계획

### 1단계: Red (실패하는 테스트 작성)
```bash
# 테스트 작성
npm test -- tests/tools/search-problems.test.ts
npm test -- tests/tools/get-problem.test.ts
npm test -- tests/tools/search-tags.test.ts

# 결과 확인 (모두 실패 예상)
# 📊 02-results-phase2-red.md 작성
```

### 2단계: Green (기능 구현)
```bash
# 도구 구현
# src/tools/search-problems.ts
# src/tools/get-problem.ts
# src/tools/search-tags.ts

# 테스트 재실행
npm test -- tests/tools/

# 결과 확인 (모두 통과)
```

### 3단계: Refactor (리팩토링)
```bash
# 코드 개선
# 테스트 유지
npm test -- tests/tools/

# 최종 결과
# 📊 02-results-phase2.md 작성
```

---

## 커버리지 목표

| 파일 | 목표 커버리지 | 측정 항목 |
|------|-------------|----------|
| search-problems.ts | 90%+ | 함수, 분기, 라인 |
| get-problem.ts | 95%+ | 함수, 분기, 라인 |
| search-tags.ts | 90%+ | 함수, 분기, 라인 |

**전체 Phase 2 목표**: 85% 이상

---

## 의존성 확인

### Phase 1 완료 항목
- ✅ tier-converter.ts (61/61 테스트 통과)
- ✅ solved.ac API 클라이언트 기본 구조

### 외부 의존성
- ✅ solved.ac API 접근 가능
- ✅ Zod 라이브러리 설치
- ✅ Vitest 설정 완료

---

## 리스크 및 완화 방안

### 리스크 1: solved.ac API Rate Limit
**완화**:
- 테스트에서 API 호출 최소화
- Mock 데이터 적극 활용
- 캐싱 구현

### 리스크 2: API 응답 지연
**완화**:
- 타임아웃 설정 (10초)
- 재시도 로직 구현
- 성능 테스트 별도 실행

### 리스크 3: 데이터 변동성
**완화**:
- 특정 문제 ID 사용 (예: 1000번)
- 결과 개수가 아닌 구조 검증
- 상대적 비교 테스트

---

**작성자**: qa-testing-agent
**검토자**: project-planner
**다음 단계**: 🔴 Red 단계 - 실패하는 테스트 작성
