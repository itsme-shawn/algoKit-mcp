# Phase 3 테스트 스펙: 문제 분석 및 복습 템플릿 생성 (Keyless)

**프로젝트명**: algokit: BOJ 학습 도우미 MCP Server
**버전**: 2.0 (Keyless Architecture)
**작성일**: 2026-02-13
**마지막 업데이트**: 2026-02-13 (Keyless 아키텍처 반영)
**작성자**: technical-writer

---

## 목차

1. [테스트 개요](#테스트-개요)
2. [Phase 3 구현 범위](#phase-3-구현-범위)
3. [TDD 워크플로우](#tdd-워크플로우)
4. [테스트 케이스 정의](#테스트-케이스-정의)
5. [Mock 전략](#mock-전략)
6. [커버리지 목표](#커버리지-목표)
7. [Project Planner 협의 사항](#project-planner-협의-사항)

---

## 테스트 개요

### Phase 3 목표 (Keyless Architecture)
Phase 3는 **문제 분석**과 **복습 템플릿 생성** 기능을 구현합니다. **LLM API 제거, 결정적 데이터 제공이 핵심**입니다.

### Keyless 아키텍처 변경사항
| 측면 | Before (LLM 기반) | After (Keyless) |
|------|-------------------|-----------------|
| **서비스** | hint-generator.ts (LLM) | problem-analyzer.ts (정적 패턴) |
| **서비스** | review-generator.ts | review-template-generator.ts |
| **도구** | get-hint.ts | analyze-problem.ts |
| **도구** | create-review.ts | generate-review-template.ts |
| **출력** | 자연어 힌트 (변동) | JSON 데이터 (결정적) |
| **테스트** | LLM Mock 필요 | Snapshot 테스트 |

### 테스트 범위
- **서비스 레이어**:
  - `src/services/problem-analyzer.ts` (문제 분석 및 힌트 포인트 생성)
  - `src/services/review-template-generator.ts` (복습 템플릿 생성)
- **도구 레이어**:
  - `src/tools/analyze-problem.ts` (분석 도구 MCP 핸들러)
  - `src/tools/generate-review-template.ts` (템플릿 도구 MCP 핸들러)

### 테스팅 전략 (Keyless)
- **TDD Red-Green-Refactor** 사이클 준수
- **결정적 출력 검증**: Snapshot 테스트 활용
- **JSON 스키마 검증**: Zod 스키마로 출력 구조 확인
- **힌트 패턴 정합성**: HINT_PATTERNS 매핑 테스트
- **응답 시간 검증**: < 500ms 목표

### 품질 목표
- **코드 커버리지**: 85% 이상 (서비스 레이어), 90% 이상 (도구 레이어)
- **테스트 통과율**: 100%
- **응답 시간**: < 500ms (LLM 호출 없음)
- **결정적 출력**: Snapshot 테스트로 일관성 보장

---

## Phase 3 구현 범위

### Task 3.1: 힌트 생성 서비스 구현
**파일**: `src/services/hint-generator.ts`

**주요 기능**:
1. 3단계 힌트 프롬프트 템플릿 생성
   - Level 1: 문제 문제 분석 (어떤 유형인지)
   - Level 2: 핵심 아이디어 (어떻게 접근할지)
   - Level 3: 상세 알고리즘 단계 (단계별 전략)
2. Claude API 통합
3. 문제 메타데이터 기반 프롬프트 최적화
4. 응답 포맷팅 (마크다운)

**입력**:
- `problem`: Problem 객체 (문제 메타데이터)
- `hintLevel`: 1, 2, 3
- `userContext`: (선택) 사용자 추가 정보

**출력**:
- 마크다운 형식의 힌트 문자열

---

### Task 3.2: `get_hint` 도구 구현
**파일**: `src/tools/get-hint.ts`

**주요 기능**:
1. Zod 스키마로 입력 검증
2. `getProblem()`로 문제 메타데이터 조회
3. `HintGenerator` 서비스 호출
4. MCP 프로토콜 준수 응답 반환

**입력 스키마**:
```typescript
{
  problem_id: number (positive),
  hint_level: number (1-3),
  user_context?: string (optional)
}
```

**출력**:
- MCP TextContent 형식 (마크다운 힌트)

---

### Task 3.3: 복습 생성 서비스 구현
**파일**: `src/services/review-generator.ts`

**주요 기능**:
1. 마크다운 템플릿 설계
2. 문제 메타데이터 자동 삽입
3. 사용자 입력 (풀이 접근법, 복잡도, 인사이트) 반영
4. 관련 문제 추천 (같은 태그, 비슷한 난이도)

**입력**:
- `problem`: Problem 객체
- `userInput`: 사용자가 작성한 풀이 내용
  - solution_approach
  - time_complexity
  - space_complexity
  - key_insights
  - difficulties

**출력**:
- 마크다운 형식의 복습 문서

---

### Task 3.4: `create_review` 도구 구현
**파일**: `src/tools/create-review.ts`

**주요 기능**:
1. Zod 스키마로 입력 검증
2. `getProblem()`로 문제 메타데이터 조회
3. `ReviewGenerator` 서비스 호출
4. 마크다운 문서 반환

**입력 스키마**:
```typescript
{
  problem_id: number (positive),
  solution_approach: string (최소 10자),
  time_complexity?: string,
  space_complexity?: string,
  key_insights?: string,
  difficulties?: string
}
```

**출력**:
- MCP TextContent 형식 (마크다운 복습 문서)

---

## TDD 워크플로우

### Phase 3-1: 스펙 작성 (이 문서)
✅ **현재 단계**

**산출물**:
- `docs/04-testing/test-spec-phase3.md` (이 문서)

**체크리스트**:
- [x] 테스트 케이스 정의 완료
- [x] 입출력 스펙 명확화
- [x] 성공 기준 명시
- [ ] project-planner와 스펙 리뷰 완료

---

### Phase 3-2-Red: 실패하는 테스트 작성
🔴 **담당**: qa-testing-agent

**산출물**:
- `tests/services/hint-generator.test.ts`
- `tests/services/review-generator.test.ts`
- `tests/tools/get-hint.test.ts`
- `tests/tools/create-review.test.ts`

**작업 내용**:
1. 모든 테스트 케이스를 코드로 작성
2. API Mock 설정 (Claude API, solved.ac API)
3. 테스트 실행 → 모두 실패 확인 ❌

**체크리스트**:
- [ ] 힌트 생성 서비스 테스트 작성 (15개 케이스)
- [ ] 복습 생성 서비스 테스트 작성 (12개 케이스)
- [ ] get_hint 도구 테스트 작성 (8개 케이스)
- [ ] create_review 도구 테스트 작성 (8개 케이스)
- [ ] 모든 테스트 실행 → 실패 확인 ❌
- [ ] 실패 원인이 "구현이 없어서"인지 확인

---

### Phase 3-2-Green: 테스트 통과하는 코드 작성
🟢 **담당**: fullstack-developer

**산출물**:
- `src/services/hint-generator.ts`
- `src/services/review-generator.ts`
- `src/tools/get-hint.ts`
- `src/tools/create-review.ts`

**작업 내용**:
1. 최소한의 코드로 테스트 통과
2. 과도한 최적화 지양
3. 테스트 실행 → 모두 통과 확인 ✅

**체크리스트**:
- [ ] 힌트 생성 서비스 구현
- [ ] 복습 생성 서비스 구현
- [ ] get_hint 도구 구현
- [ ] create_review 도구 구현
- [ ] 모든 테스트 통과 ✅
- [ ] 커버리지 85% 이상

---

### Phase 3-2-Refactor: 코드 개선
🔵 **담당**: fullstack-developer

**작업 내용**:
1. 프롬프트 템플릿 최적화
2. 중복 코드 제거
3. 에러 핸들링 강화
4. 타입 안전성 개선

**체크리스트**:
- [ ] 프롬프트 템플릿 함수화
- [ ] 공통 유틸 추출
- [ ] 테스트 여전히 통과 ✅
- [ ] 커버리지 유지 또는 향상

---

## 테스트 케이스 정의

### 1. hint-generator.test.ts (힌트 생성 서비스)

**파일**: `tests/services/hint-generator.test.ts`
**테스트 대상**: `src/services/hint-generator.ts`
**커버리지 목표**: 85%

---

#### 1.1 프롬프트 생성 테스트

##### TC-3.1.1: Level 1 힌트 프롬프트 생성
**목적**: Level 1 프롬프트가 올바르게 생성되는지 검증

**입력**:
```typescript
const problem = mockProblem1927; // 최소 힙, Silver I, 자료구조 태그
const hintLevel = 1;
```

**예상 동작**:
- 프롬프트에 문제 제목 포함
- 프롬프트에 티어 정보 포함
- 프롬프트에 태그 정보 포함
- "어떤 유형의 알고리즘 문제인지" 질문 포함
- "구체적인 풀이는 제시하지 말고" 제약 조건 포함

**검증 항목**:
```typescript
expect(prompt).toContain('최소 힙');
expect(prompt).toContain('Silver I');
expect(prompt).toContain('자료구조');
expect(prompt).toContain('어떤 유형');
expect(prompt).toContain('구체적인 풀이는 제시하지 말고');
```

---

##### TC-3.1.2: Level 2 힌트 프롬프트 생성
**목적**: Level 2 프롬프트가 Level 1보다 상세한지 검증

**입력**:
```typescript
const problem = mockProblem11053; // LIS, Gold II, DP 태그
const hintLevel = 2;
```

**예상 동작**:
- Level 1 요소 + 추가 상세 요청
- "어떻게 접근해야 하는지" 질문 포함
- "핵심 아이디어" 또는 "주요 아이디어" 언급
- 여전히 코드는 제시하지 않음

**검증 항목**:
```typescript
expect(prompt).toContain('접근');
expect(prompt).toContain('핵심');
expect(prompt).toContain('코드를 직접 제공하지 마세요');
```

---

##### TC-3.1.3: Level 3 힌트 프롬프트 생성
**목적**: Level 3 프롬프트가 가장 상세한지 검증

**입력**:
```typescript
const problem = mockProblem11053; // LIS, Gold II, DP 태그
const hintLevel = 3;
```

**예상 동작**:
- "단계별로 설명" 요청
- "알고리즘 전략" 언급
- "시간복잡도" 고려 요청
- 여전히 코드는 제시하지 않음

**검증 항목**:
```typescript
expect(prompt).toContain('단계별');
expect(prompt).toContain('알고리즘');
expect(prompt).toContain('코드를 직접 제공하지 마세요');
```

---

##### TC-3.1.4: 사용자 컨텍스트 반영
**목적**: 사용자가 제공한 추가 정보가 프롬프트에 포함되는지 검증

**입력**:
```typescript
const problem = mockProblem1927;
const hintLevel = 2;
const userContext = "배열로 구현하려고 했는데 시간초과가 나요";
```

**예상 동작**:
- 프롬프트에 사용자 컨텍스트 포함
- "사용자가 시도한 방법" 섹션 추가

**검증 항목**:
```typescript
expect(prompt).toContain('배열로 구현');
expect(prompt).toContain('시간초과');
```

---

#### 1.2 Claude API 호출 테스트

##### TC-3.1.5: 정상 API 응답 처리
**목적**: Claude API가 정상 응답을 반환할 때 처리

**시나리오**:
- Mock Claude API 응답: "이 문제는 우선순위 큐를 사용하는 자료구조 문제입니다..."

**예상 동작**:
- API 호출 성공
- 응답 텍스트 반환
- 마크다운 포맷팅 적용

**검증 항목**:
```typescript
const result = await hintGenerator.generateHint(mockProblem1927, 1);
expect(result).toContain('우선순위 큐');
expect(result).toContain('자료구조');
```

---

##### TC-3.1.6: API 타임아웃 처리
**목적**: API 응답 지연 시 에러 처리

**시나리오**:
- Mock API가 30초 이상 응답 없음

**예상 결과**:
- `TimeoutError` 발생
- 명확한 에러 메시지

**검증 항목**:
```typescript
await expect(hintGenerator.generateHint(problem, 1))
  .rejects.toThrow('Claude API 응답 시간 초과');
```

---

##### TC-3.1.7: API 에러 응답 처리
**목적**: Claude API가 4xx, 5xx 에러를 반환할 때 처리

**시나리오**:
- Mock API 응답: 401 Unauthorized

**예상 결과**:
- `ClaudeAPIError` 발생
- 에러 상태 코드 포함

**검증 항목**:
```typescript
await expect(hintGenerator.generateHint(problem, 1))
  .rejects.toThrow('Claude API 인증 실패');
```

---

##### TC-3.1.8: API 키 미설정
**목적**: 환경 변수에 API 키가 없을 때 처리

**시나리오**:
- `ANTHROPIC_API_KEY` 환경 변수 없음

**예상 결과**:
- `ConfigurationError` 발생
- "API 키가 설정되지 않았습니다" 메시지

**검증 항목**:
```typescript
delete process.env.ANTHROPIC_API_KEY;
await expect(hintGenerator.generateHint(problem, 1))
  .rejects.toThrow('API 키가 설정되지 않았습니다');
```

---

#### 1.3 힌트 품질 검증 테스트

##### TC-3.1.9: Bronze 문제 힌트 적절성
**목적**: 쉬운 문제에 대한 힌트가 과도하게 어렵지 않은지 검증

**입력**:
```typescript
const problem = mockProblem1000; // A+B, Bronze V, 수학 태그
const hintLevel = 1;
```

**예상 동작**:
- 프롬프트에 "초보자도 이해할 수 있도록" 요청 포함
- 복잡한 알고리즘 용어 지양

**검증 항목**:
```typescript
const prompt = hintGenerator.buildPrompt(problem, 1);
expect(prompt).toContain('초보자');
expect(prompt).toContain('기본적인');
```

---

##### TC-3.1.10: Platinum 문제 힌트 적절성
**목적**: 어려운 문제에 대한 힌트가 충분히 상세한지 검증

**입력**:
```typescript
const problem = mockProblemPlatinum; // Platinum II, 세그먼트 트리
const hintLevel = 3;
```

**예상 동작**:
- 프롬프트에 "고급 알고리즘" 언급
- "시간복잡도 최적화" 요청 포함

**검증 항목**:
```typescript
const prompt = hintGenerator.buildPrompt(problem, 3);
expect(prompt).toContain('고급');
expect(prompt).toContain('최적화');
```

---

#### 1.4 Edge Cases 테스트

##### TC-3.1.11: 유효하지 않은 hint_level
**목적**: 1-3 범위 밖의 레벨 입력 처리

**입력**:
```typescript
const hintLevel = 0; // 또는 4, -1
```

**예상 결과**:
- `InvalidInputError` 발생
- "힌트 레벨은 1-3 범위여야 합니다" 메시지

**검증 항목**:
```typescript
await expect(hintGenerator.generateHint(problem, 0))
  .rejects.toThrow('힌트 레벨은 1-3');
```

---

##### TC-3.1.12: 태그가 없는 문제
**목적**: 태그 정보가 없을 때 프롬프트 생성

**입력**:
```typescript
const problem = { ...mockProblem1000, tags: [] };
```

**예상 동작**:
- 프롬프트에 "태그 정보 없음" 또는 태그 섹션 생략
- 에러 발생하지 않음

**검증 항목**:
```typescript
const prompt = hintGenerator.buildPrompt(problem, 1);
expect(prompt).not.toContain('태그:');
// 또는
expect(prompt).toContain('태그 정보 없음');
```

---

#### 1.5 응답 포맷팅 테스트

##### TC-3.1.13: 마크다운 포맷 검증
**목적**: 생성된 힌트가 유효한 마크다운인지 검증

**입력**:
```typescript
const mockAPIResponse = "# Level 1 힌트\n\n이 문제는...";
```

**예상 동작**:
- 제목 (H1, H2) 포함
- 문단 구분
- 리스트 또는 코드 블록 (필요 시)

**검증 항목**:
```typescript
const result = await hintGenerator.generateHint(problem, 1);
expect(result).toMatch(/^#+ /); // 제목으로 시작
expect(result).toContain('\n\n'); // 문단 구분
```

---

##### TC-3.1.14: 특수문자 이스케이프
**목적**: 문제 제목에 특수문자가 있을 때 처리

**입력**:
```typescript
const problem = {
  ...mockProblem1000,
  titleKo: "A+B (실수)"
};
```

**예상 동작**:
- 프롬프트에 특수문자가 올바르게 포함
- API 호출 시 인코딩 문제 없음

**검증 항목**:
```typescript
const prompt = hintGenerator.buildPrompt(problem, 1);
expect(prompt).toContain('A+B (실수)');
```

---

##### TC-3.1.15: 긴 힌트 응답 처리
**목적**: API 응답이 매우 길 때 처리

**시나리오**:
- Mock API 응답: 5000자 이상의 상세 힌트

**예상 동작**:
- 전체 응답 반환 (잘리지 않음)
- 메모리 오버플로우 없음

**검증 항목**:
```typescript
const longResponse = 'A'.repeat(5000);
// Mock API가 longResponse 반환하도록 설정
const result = await hintGenerator.generateHint(problem, 3);
expect(result.length).toBeGreaterThan(4000);
```

---

### 2. review-generator.test.ts (복습 생성 서비스)

**파일**: `tests/services/review-generator.test.ts`
**테스트 대상**: `src/services/review-generator.ts`
**커버리지 목표**: 85%

---

#### 2.1 템플릿 생성 테스트

##### TC-3.2.1: 기본 복습 템플릿 생성
**목적**: 모든 필수 필드가 포함된 템플릿 생성

**입력**:
```typescript
const problem = mockProblem1927; // 최소 힙
const userInput = {
  solution_approach: "우선순위 큐를 사용했습니다",
  time_complexity: "O(N log N)",
  space_complexity: "O(N)",
  key_insights: "최소 힙 자료구조의 특성 이해",
  difficulties: "처음에는 배열로 구현하려다 시간초과"
};
```

**예상 출력**:
템플릿에 다음 섹션 포함:
- 문제 정보 (번호, 제목, 티어, BOJ 링크)
- 알고리즘 태그
- 풀이 접근법 (사용자 입력)
- 시간/공간 복잡도 (사용자 입력)
- 핵심 인사이트 (사용자 입력)
- 어려웠던 점 (사용자 입력)
- 관련 문제 추천 (자동 생성)
- 해결 날짜 (자동 생성)

**검증 항목**:
```typescript
const review = await reviewGenerator.generate(problem, userInput);

// 문제 정보
expect(review).toContain('# 1927. 최소 힙');
expect(review).toContain('Silver I');
expect(review).toContain('https://www.acmicpc.net/problem/1927');

// 사용자 입력
expect(review).toContain('우선순위 큐');
expect(review).toContain('O(N log N)');
expect(review).toContain('O(N)');

// 자동 생성
expect(review).toContain('## 관련 문제');
expect(review).toContain('## 해결 날짜');
```

---

##### TC-3.2.2: 선택적 필드 생략 시 처리
**목적**: 선택적 필드가 없을 때 템플릿 생성

**입력**:
```typescript
const userInput = {
  solution_approach: "BFS를 사용했습니다"
  // time_complexity, space_complexity, key_insights, difficulties 생략
};
```

**예상 동작**:
- 필수 필드만으로 템플릿 생성
- 선택적 필드 섹션은 "작성 예정" 또는 생략

**검증 항목**:
```typescript
const review = await reviewGenerator.generate(problem, userInput);
expect(review).toContain('BFS');
expect(review).toContain('작성 예정'); // 또는 선택적 섹션 없음
```

---

#### 2.2 관련 문제 추천 테스트

##### TC-3.2.3: 같은 태그 문제 추천
**목적**: 동일 태그를 가진 문제를 추천하는지 검증

**시나리오**:
- 문제: 1927번 (최소 힙, 자료구조 태그)
- `searchProblems({ tag: 'data_structures' })` Mock 응답: 3개 문제

**예상 동작**:
- 관련 문제 섹션에 3개 문제 포함
- 각 문제의 번호, 제목, 티어 표시

**검증 항목**:
```typescript
const review = await reviewGenerator.generate(problem, userInput);
expect(review).toContain('## 관련 문제');
expect(review).toMatch(/\d+\. .+/); // 문제 번호와 제목
expect(review).toContain('Silver'); // 티어 정보
```

---

##### TC-3.2.4: 비슷한 난이도 필터링
**목적**: 추천 문제가 비슷한 난이도인지 검증

**시나리오**:
- 문제: Silver I (레벨 10)
- 추천 문제: Silver V ~ Gold V (레벨 6-14 범위)

**예상 동작**:
- `searchProblems({ tag, level_min: 8, level_max: 12 })` 호출
- 추천 문제가 ±2 티어 범위 내

**검증 항목**:
```typescript
// Mock searchProblems 호출 인자 검증
expect(mockSearchProblems).toHaveBeenCalledWith({
  tag: 'data_structures',
  level_min: 8,
  level_max: 12
});
```

---

##### TC-3.2.5: 관련 문제 없을 때 처리
**목적**: 관련 문제가 없을 때 템플릿 처리

**시나리오**:
- `searchProblems()` Mock 응답: 빈 배열

**예상 동작**:
- "관련 문제를 찾을 수 없습니다" 메시지
- 또는 "직접 검색해보세요" 안내

**검증 항목**:
```typescript
const review = await reviewGenerator.generate(problem, userInput);
expect(review).toContain('관련 문제를 찾을 수 없습니다');
```

---

#### 2.3 날짜 및 메타데이터 테스트

##### TC-3.2.6: 해결 날짜 자동 삽입
**목적**: 현재 날짜가 자동으로 템플릿에 삽입되는지 검증

**예상 동작**:
- `YYYY-MM-DD` 형식의 날짜
- "해결 날짜" 섹션에 포함

**검증 항목**:
```typescript
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const review = await reviewGenerator.generate(problem, userInput);
expect(review).toContain(`해결 날짜: ${today}`);
```

---

##### TC-3.2.7: 문제 메타데이터 포맷팅
**목적**: 문제 정보가 올바르게 포맷팅되는지 검증

**입력**:
```typescript
const problem = {
  problemId: 1927,
  titleKo: "최소 힙",
  level: 10, // Silver I
  tags: [
    { key: 'data_structures', displayNames: [{ name: '자료 구조' }] },
    { key: 'priority_queue', displayNames: [{ name: '우선순위 큐' }] }
  ],
  acceptedUserCount: 50000,
  averageTries: 2.3
};
```

**예상 출력**:
```markdown
# 1927. 최소 힙

**티어**: 🟡 Silver I
**태그**: 자료 구조, 우선순위 큐
**해결한 사람**: 50,000명
**평균 시도**: 2.3회
**문제 링크**: https://www.acmicpc.net/problem/1927
```

**검증 항목**:
```typescript
const review = await reviewGenerator.generate(problem, userInput);
expect(review).toContain('# 1927. 최소 힙');
expect(review).toContain('🟡 Silver I');
expect(review).toContain('자료 구조, 우선순위 큐');
expect(review).toContain('50,000명');
expect(review).toContain('2.3회');
```

---

#### 2.4 Edge Cases 테스트

##### TC-3.2.8: solution_approach 필드 누락
**목적**: 필수 필드가 없을 때 에러 처리

**입력**:
```typescript
const userInput = {
  // solution_approach 누락
  time_complexity: "O(N)"
};
```

**예상 결과**:
- `ValidationError` 발생
- "solution_approach는 필수입니다" 메시지

**검증 항목**:
```typescript
await expect(reviewGenerator.generate(problem, userInput))
  .rejects.toThrow('solution_approach는 필수');
```

---

##### TC-3.2.9: solution_approach 10자 미만
**목적**: 최소 길이 검증

**입력**:
```typescript
const userInput = {
  solution_approach: "BFS" // 3자 (10자 미만)
};
```

**예상 결과**:
- `ValidationError` 발생
- "solution_approach는 최소 10자 이상이어야 합니다" 메시지

**검증 항목**:
```typescript
await expect(reviewGenerator.generate(problem, userInput))
  .rejects.toThrow('최소 10자');
```

---

##### TC-3.2.10: 태그가 없는 문제 복습 생성
**목적**: 태그 없는 문제의 복습 문서 생성

**입력**:
```typescript
const problem = { ...mockProblem1000, tags: [] };
```

**예상 동작**:
- "태그 정보 없음" 표시
- 관련 문제 추천 불가능 안내

**검증 항목**:
```typescript
const review = await reviewGenerator.generate(problem, userInput);
expect(review).toContain('태그 정보 없음');
expect(review).toContain('관련 문제를 추천할 수 없습니다');
```

---

#### 2.5 마크다운 유효성 테스트

##### TC-3.2.11: 마크다운 구조 검증
**목적**: 생성된 문서가 유효한 마크다운 구조인지 검증

**검증 항목**:
```typescript
const review = await reviewGenerator.generate(problem, userInput);

// H1 제목 (문제명)
expect(review).toMatch(/^# \d+\. /);

// H2 섹션들
expect(review).toContain('## 문제 정보');
expect(review).toContain('## 풀이 접근법');
expect(review).toContain('## 시간/공간 복잡도');
expect(review).toContain('## 핵심 인사이트');
expect(review).toContain('## 관련 문제');
expect(review).toContain('## 해결 날짜');

// 링크 형식
expect(review).toMatch(/\[.*\]\(https:\/\/www\.acmicpc\.net\/problem\/\d+\)/);
```

---

##### TC-3.2.12: 특수문자 이스케이프
**목적**: 사용자 입력의 특수문자가 마크다운에서 올바르게 표시되는지 검증

**입력**:
```typescript
const userInput = {
  solution_approach: "배열[i]를 사용하고, *포인터*로 접근했습니다",
  key_insights: "# 주석이 아니라 중요 포인트: `O(N)`"
};
```

**예상 동작**:
- 마크다운 특수문자가 이스케이프되거나 코드 블록으로 처리
- 사용자 입력이 의도대로 표시

**검증 항목**:
```typescript
const review = await reviewGenerator.generate(problem, userInput);
expect(review).toContain('배열[i]');
expect(review).toContain('*포인터*'); // 또는 이스케이프된 형태
```

---

### 3. get-hint.test.ts (힌트 도구)

**파일**: `tests/tools/get-hint.test.ts`
**테스트 대상**: `src/tools/get-hint.ts`
**커버리지 목표**: 90%

---

#### 3.1 Happy Path 테스트

##### TC-3.3.1: 정상 힌트 생성 (Level 1)
**목적**: 기본 힌트 생성 플로우 검증

**입력**:
```typescript
{
  problem_id: 1927,
  hint_level: 1
}
```

**예상 동작**:
1. `getProblem(1927)` 호출로 문제 메타데이터 조회
2. `hintGenerator.generateHint(problem, 1)` 호출
3. 마크다운 힌트 반환

**검증 항목**:
```typescript
const result = await getHintTool({ problem_id: 1927, hint_level: 1 });
expect(result.type).toBe('text');
expect(result.text).toContain('힌트');
expect(result.text).toContain('우선순위 큐'); // 예상 힌트 내용
```

---

##### TC-3.3.2: Level 2, 3 힌트 생성
**목적**: 각 레벨별 힌트 생성 검증

**입력**:
```typescript
{ problem_id: 11053, hint_level: 2 }
{ problem_id: 11053, hint_level: 3 }
```

**예상 동작**:
- Level 2 힌트가 Level 1보다 상세
- Level 3 힌트가 가장 상세
- 모두 마크다운 형식

**검증 항목**:
```typescript
const level2 = await getHintTool({ problem_id: 11053, hint_level: 2 });
const level3 = await getHintTool({ problem_id: 11053, hint_level: 3 });

expect(level2.text.length).toBeGreaterThan(100);
expect(level3.text.length).toBeGreaterThan(level2.text.length);
```

---

##### TC-3.3.3: 사용자 컨텍스트 포함
**목적**: 선택적 사용자 컨텍스트 처리

**입력**:
```typescript
{
  problem_id: 1927,
  hint_level: 2,
  user_context: "배열로 구현했는데 시간초과가 나요"
}
```

**예상 동작**:
- `hintGenerator.generateHint(problem, 2, userContext)` 호출
- 힌트에 사용자 상황 반영

**검증 항목**:
```typescript
const result = await getHintTool({ ... });
// Mock hintGenerator가 userContext를 받았는지 확인
expect(mockHintGenerator.generateHint).toHaveBeenCalledWith(
  expect.anything(),
  2,
  '배열로 구현했는데 시간초과가 나요'
);
```

---

#### 3.2 Zod 스키마 검증 테스트

##### TC-3.3.4: 유효하지 않은 problem_id
**목적**: Zod 스키마로 입력 검증

**입력**:
```typescript
{ problem_id: 0, hint_level: 1 }      // 0
{ problem_id: -5, hint_level: 1 }     // 음수
{ problem_id: "abc", hint_level: 1 }  // 문자열
```

**예상 결과**:
- Zod 검증 에러 발생
- "problem_id must be a positive number" 메시지

**검증 항목**:
```typescript
await expect(getHintTool({ problem_id: 0, hint_level: 1 }))
  .rejects.toThrow('positive');
```

---

##### TC-3.3.5: 유효하지 않은 hint_level
**목적**: hint_level 범위 검증

**입력**:
```typescript
{ problem_id: 1000, hint_level: 0 }   // 0
{ problem_id: 1000, hint_level: 4 }   // 4
{ problem_id: 1000, hint_level: -1 }  // 음수
```

**예상 결과**:
- Zod 검증 에러 발생
- "hint_level must be between 1 and 3" 메시지

**검증 항목**:
```typescript
await expect(getHintTool({ problem_id: 1000, hint_level: 4 }))
  .rejects.toThrow('1 and 3');
```

---

##### TC-3.3.6: 필수 필드 누락
**목적**: 필수 필드 검증

**입력**:
```typescript
{ hint_level: 1 }  // problem_id 누락
{ problem_id: 1000 }  // hint_level 누락
```

**예상 결과**:
- Zod 검증 에러 발생
- "Required" 메시지

**검증 항목**:
```typescript
await expect(getHintTool({ hint_level: 1 }))
  .rejects.toThrow('required');
```

---

#### 3.3 에러 처리 테스트

##### TC-3.3.7: 존재하지 않는 문제
**목적**: `getProblem()` 실패 시 처리

**시나리오**:
- `getProblem(999999)` Mock 응답: `ProblemNotFoundError`

**예상 결과**:
- 사용자 친화적 에러 메시지
- "문제를 찾을 수 없습니다" 안내

**검증 항목**:
```typescript
mockGetProblem.mockRejectedValue(new ProblemNotFoundError(999999));
await expect(getHintTool({ problem_id: 999999, hint_level: 1 }))
  .rejects.toThrow('문제를 찾을 수 없습니다');
```

---

##### TC-3.3.8: 힌트 생성 실패
**목적**: `hintGenerator.generateHint()` 실패 시 처리

**시나리오**:
- `hintGenerator.generateHint()` Mock 응답: `ClaudeAPIError`

**예상 결과**:
- 에러를 사용자 친화적 메시지로 변환
- "힌트를 생성할 수 없습니다. 잠시 후 다시 시도해주세요" 안내

**검증 항목**:
```typescript
mockHintGenerator.generateHint.mockRejectedValue(new ClaudeAPIError('Rate limit'));
await expect(getHintTool({ problem_id: 1000, hint_level: 1 }))
  .rejects.toThrow('힌트를 생성할 수 없습니다');
```

---

### 4. create-review.test.ts (복습 도구)

**파일**: `tests/tools/create-review.test.ts`
**테스트 대상**: `src/tools/create-review.ts`
**커버리지 목표**: 90%

---

#### 4.1 Happy Path 테스트

##### TC-3.4.1: 정상 복습 문서 생성 (모든 필드)
**목적**: 모든 필드를 포함한 복습 생성

**입력**:
```typescript
{
  problem_id: 1927,
  solution_approach: "우선순위 큐를 사용하여 최소 힙을 구현했습니다",
  time_complexity: "O(N log N)",
  space_complexity: "O(N)",
  key_insights: "힙 자료구조의 특성과 heapq 모듈 사용법",
  difficulties: "처음에는 배열로 구현하려다 시간초과가 발생했습니다"
}
```

**예상 동작**:
1. `getProblem(1927)` 호출
2. `reviewGenerator.generate(problem, userInput)` 호출
3. 마크다운 복습 문서 반환

**검증 항목**:
```typescript
const result = await createReviewTool({ ... });
expect(result.type).toBe('text');
expect(result.text).toContain('# 1927. 최소 힙');
expect(result.text).toContain('우선순위 큐');
expect(result.text).toContain('O(N log N)');
expect(result.text).toContain('관련 문제');
```

---

##### TC-3.4.2: 선택적 필드 생략
**목적**: 필수 필드만으로 복습 생성

**입력**:
```typescript
{
  problem_id: 1000,
  solution_approach: "입력받은 두 수를 더해서 출력했습니다"
  // 선택적 필드 생략
}
```

**예상 동작**:
- 필수 필드만으로 복습 생성
- 선택적 필드 섹션은 "작성 예정" 또는 생략

**검증 항목**:
```typescript
const result = await createReviewTool({ ... });
expect(result.text).toContain('입력받은 두 수');
expect(result.text).toContain('작성 예정'); // 또는 선택적 섹션 없음
```

---

#### 4.2 Zod 스키마 검증 테스트

##### TC-3.4.3: solution_approach 10자 미만
**목적**: 최소 길이 검증

**입력**:
```typescript
{
  problem_id: 1000,
  solution_approach: "BFS" // 3자
}
```

**예상 결과**:
- Zod 검증 에러 발생
- "최소 10자 이상" 메시지

**검증 항목**:
```typescript
await expect(createReviewTool({ ... }))
  .rejects.toThrow('최소 10자');
```

---

##### TC-3.4.4: problem_id 유효성 검증
**목적**: problem_id 검증 (get-hint와 동일 패턴)

**입력**:
```typescript
{ problem_id: 0, solution_approach: "..." }
{ problem_id: -1, solution_approach: "..." }
```

**예상 결과**:
- Zod 검증 에러 발생

**검증 항목**:
```typescript
await expect(createReviewTool({ ... }))
  .rejects.toThrow('positive');
```

---

##### TC-3.4.5: 필수 필드 누락
**목적**: 필수 필드 검증

**입력**:
```typescript
{ problem_id: 1000 }  // solution_approach 누락
{ solution_approach: "..." }  // problem_id 누락
```

**예상 결과**:
- Zod 검증 에러 발생

**검증 항목**:
```typescript
await expect(createReviewTool({ problem_id: 1000 }))
  .rejects.toThrow('required');
```

---

#### 4.3 에러 처리 테스트

##### TC-3.4.6: 존재하지 않는 문제
**목적**: `getProblem()` 실패 시 처리

**시나리오**:
- `getProblem(999999)` Mock 응답: `ProblemNotFoundError`

**예상 결과**:
- "문제를 찾을 수 없습니다" 에러

**검증 항목**:
```typescript
mockGetProblem.mockRejectedValue(new ProblemNotFoundError(999999));
await expect(createReviewTool({ ... }))
  .rejects.toThrow('문제를 찾을 수 없습니다');
```

---

##### TC-3.4.7: 복습 생성 실패
**목적**: `reviewGenerator.generate()` 실패 시 처리

**시나리오**:
- `reviewGenerator.generate()` Mock 응답: Error

**예상 결과**:
- "복습 문서를 생성할 수 없습니다" 에러

**검증 항목**:
```typescript
mockReviewGenerator.generate.mockRejectedValue(new Error('Template error'));
await expect(createReviewTool({ ... }))
  .rejects.toThrow('복습 문서를 생성할 수 없습니다');
```

---

#### 4.4 마크다운 출력 검증

##### TC-3.4.8: 마크다운 형식 확인
**목적**: 출력이 유효한 마크다운인지 검증

**검증 항목**:
```typescript
const result = await createReviewTool({ ... });
expect(result.text).toMatch(/^# \d+\./); // H1 제목
expect(result.text).toContain('## '); // H2 섹션들
expect(result.text).toContain('**'); // 강조
expect(result.text).toContain('['); // 링크
```

---

## Mock 전략 (Keyless)

### Keyless 아키텍처의 테스트 장점
- ❌ **LLM Mock 불필요**: Claude API 제거로 복잡한 Mock 제거
- ✅ **결정적 출력**: 같은 입력 → 같은 JSON 출력
- ✅ **Snapshot 테스트**: 출력 구조를 Snapshot으로 검증
- ✅ **빠른 실행**: API 호출 없이 밀리초 단위

### 1. solved.ac API Mock (재사용)

**기존 Mock 활용**:
- `tests/__mocks__/solved-ac-responses.ts`의 Mock 데이터 재사용
- `getProblem()` Mock: Phase 2에서 이미 테스트됨
- `searchProblems()` Mock: 관련 문제 추천용

```typescript
export const mockProblem1927 = {
  problemId: 1927,
  titleKo: '최소 힙',
  level: 10, // Silver II
  tags: [
    { key: 'data_structures', displayNames: [{ language: 'ko', name: '자료 구조' }] },
    { key: 'priority_queue', displayNames: [{ language: 'ko', name: '우선순위 큐' }] }
  ],
  acceptedUserCount: 50000,
  averageTries: 2.3,
};
```

---

### 2. ProblemAnalyzer (결정적 출력)

**Mock 불필요**: 정적 데이터 기반이므로 실제 서비스 사용
```typescript
import { ProblemAnalyzer } from '../services/problem-analyzer.js';
import { mockSolvedAcClient } from './__mocks__/solved-ac-client.js';

const analyzer = new ProblemAnalyzer(mockSolvedAcClient);

test('DP 문제 분석', async () => {
  const result = await analyzer.analyze(11053);

  // Snapshot 테스트
  expect(result).toMatchSnapshot();

  // 구조 검증
  expect(result.hint_points).toHaveLength(3);
  expect(result.hint_points[0].level).toBe(1);
  expect(result.hint_points[0].key).toBe('동적 프로그래밍');
});
```

---

### 3. ReviewTemplateGenerator (결정적 출력)

**Mock 불필요**: 템플릿 생성 로직이므로 실제 서비스 사용
```typescript
import { ReviewTemplateGenerator } from '../services/review-template-generator.js';

const generator = new ReviewTemplateGenerator(mockSolvedAcClient);

test('복습 템플릿 생성', async () => {
  const result = await generator.generate(1927);

  // Snapshot 테스트
  expect(result).toMatchSnapshot();

  // 필드 존재 확인
  expect(result.template).toContain('# [1927] 최소 힙');
  expect(result.problem_summary.problemId).toBe(1927);
  expect(result.guide_prompt).toContain('사용자에게');
});
```

---

### 4. Snapshot 테스트 활용

**장점**:
- 출력 구조 변경 감지
- 리팩토링 안정성
- 회귀 테스트 자동화

**예시**:
```typescript
test('analyze_problem: DP 문제 분석 (snapshot)', async () => {
  mockSolvedAcClient.getProblem.mockResolvedValue(mockProblem11053);

  const analyzer = new ProblemAnalyzer(mockSolvedAcClient);
  const result = await analyzer.analyze(11053);

  // 전체 출력 구조를 스냅샷으로 저장
  expect(result).toMatchSnapshot();
});
```

**Snapshot 파일 경로**:
```
tests/__snapshots__/
├── problem-analyzer.test.ts.snap
└── review-template-generator.test.ts.snap
```

---

## 커버리지 목표

### 파일별 커버리지 목표

| 파일 | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| hint-generator.ts | 85% | 75% | 90% | 85% |
| review-generator.ts | 85% | 75% | 90% | 85% |
| get-hint.ts | 90% | 85% | 100% | 90% |
| create-review.ts | 90% | 85% | 100% | 90% |

### 전체 목표
- **Phase 3 전체 커버리지**: 85% 이상
- **테스트 통과율**: 100%
- **실행 시간**: 5초 이내 (API Mock 사용 시)

---

## Project Planner 협의 사항

### 1. 스펙 명확화 필요 사항

#### 1.1 Claude API 통합
**질문**:
- Claude API 엔드포인트: `/v1/messages` 사용?
- 모델: `claude-3-5-sonnet-20241022` 또는 다른 모델?
- Max tokens: 힌트 생성 시 몇 토큰까지 허용?
- Temperature: 0.7? (창의성 vs 일관성)

**권장**:
- `.env.example`에 Claude API 설정 예시 추가
- 환경 변수:
  - `ANTHROPIC_API_KEY`
  - `CLAUDE_MODEL` (기본값: claude-3-5-sonnet-20241022)
  - `CLAUDE_MAX_TOKENS` (기본값: 1024)
  - `CLAUDE_TEMPERATURE` (기본값: 0.7)

---

#### 1.2 힌트 레벨 정의 명확화
**질문**:
- Level 1, 2, 3의 구체적인 차이는?
- Level 3에서도 코드는 절대 제공하지 않는다는 제약이 맞는지?

**권장**:
```
Level 1: "어떤 유형의 문제인가?" (문제 분석)
- 알고리즘 카테고리만 제시
- 예: "이 문제는 동적 프로그래밍 문제입니다"

Level 2: "어떻게 접근해야 하는가?" (핵심 아이디어)
- 알고리즘 + 핵심 아이디어
- 예: "DP 테이블을 정의하고, 점화식을 세워야 합니다"

Level 3: "단계별로 무엇을 해야 하는가?" (상세 전략)
- 알고리즘 + 핵심 아이디어 + 단계별 전략
- 예: "1. DP[i] = i번째까지의 최장 증가 수열 길이로 정의
       2. 각 i에 대해 j < i이고 arr[j] < arr[i]인 경우 DP[i] = max(DP[j]+1)
       3. 시간복잡도: O(N^2)"
- ❌ 코드는 여전히 제공하지 않음
```

---

#### 1.3 복습 템플릿 구조
**질문**:
- 복습 템플릿의 최종 구조는?
- 사용자가 작성하는 부분 vs 자동 생성 부분의 명확한 구분

**권장 템플릿 구조**:
```markdown
# {problemId}. {title}

**티어**: {tier}
**태그**: {tags}
**해결한 사람**: {acceptedUserCount}명
**평균 시도**: {averageTries}회
**문제 링크**: [BOJ {problemId}](https://www.acmicpc.net/problem/{problemId})
**해결 날짜**: {YYYY-MM-DD}

---

## 풀이 접근법
{user_input.solution_approach}

## 시간/공간 복잡도
- **시간 복잡도**: {user_input.time_complexity || "작성 예정"}
- **공간 복잡도**: {user_input.space_complexity || "작성 예정"}

## 핵심 인사이트
{user_input.key_insights || "작성 예정"}

## 어려웠던 점
{user_input.difficulties || "작성 예정"}

## 관련 문제
{auto_generated_related_problems}
- [문제번호. 문제제목 (티어)](BOJ링크)
- ...

---

*이 문서는 algokit 도구를 사용하여 자동 생성되었습니다.*
```

---

### 2. 테스트 가능한 구현 요청

#### 2.1 프롬프트 템플릿 함수 분리
**요청**:
- `HintGenerator.buildPrompt()` 메서드를 public으로 노출
- 테스트에서 프롬프트 내용을 검증할 수 있도록

**이유**:
- API를 실제로 호출하지 않고도 프롬프트 품질 검증 가능
- 다양한 문제 유형에 대한 프롬프트 테스트 가능

---

#### 2.2 관련 문제 추천 로직 분리
**요청**:
- `ReviewGenerator.getRelatedProblems()` 메서드 분리
- 테스트에서 추천 알고리즘을 독립적으로 검증

**이유**:
- 추천 로직이 복잡할 수 있으므로 단위 테스트 필요
- Mock 없이 추천 알고리즘 자체를 테스트 가능

---

#### 2.3 에러 타입 정의
**요청**:
- `ClaudeAPIError` 클래스 정의 (401, 429, 500 등 구분)
- `ConfigurationError` 클래스 정의 (API 키 없음 등)
- `ValidationError` 클래스 정의 (입력 검증 실패)

**파일**: `src/utils/errors.ts` (기존 파일 확장)

```typescript
export class ClaudeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ClaudeAPIError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
```

---

### 3. 테스트 환경 설정

#### 3.1 환경 변수 테스트 격리
**요청**:
- 테스트에서 환경 변수를 조작할 때 원본 값 보존
- `beforeEach`에서 환경 변수 백업, `afterEach`에서 복원

**예시**:
```typescript
let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  process.env.ANTHROPIC_API_KEY = 'test_key';
});

afterEach(() => {
  process.env = originalEnv;
});
```

---

#### 3.2 vitest 타임아웃 설정
**요청**:
- Claude API 호출 테스트는 타임아웃 설정 (30초)
- Mock 테스트는 기본 타임아웃 (5초)

**예시**:
```typescript
// 실제 API 호출 (통합 테스트)
it('Claude API 통합 테스트', { timeout: 30000 }, async () => {
  // ...
});

// Mock 테스트 (단위 테스트)
it('프롬프트 생성 테스트', async () => {
  // 기본 타임아웃
});
```

---

### 4. 우선순위 및 일정

#### Phase 3 개발 일정 (예상)
```
Day 1-2: 스펙 리뷰 및 테스트 작성 (Red)
  - qa-testing-agent: 모든 테스트 케이스 작성
  - project-planner: 스펙 리뷰 및 피드백

Day 3-5: 힌트 생성 기능 구현 (Green)
  - fullstack-developer: hint-generator.ts 구현
  - fullstack-developer: get-hint.ts 구현
  - qa-testing-agent: 테스트 실행 및 검증

Day 6-7: 복습 생성 기능 구현 (Green)
  - fullstack-developer: review-generator.ts 구현
  - fullstack-developer: create-review.ts 구현
  - qa-testing-agent: 테스트 실행 및 검증

Day 8-9: 리팩토링 및 최적화 (Refactor)
  - fullstack-developer: 코드 개선
  - qa-testing-agent: 커버리지 분석 및 추가 테스트

Day 10: Phase 3 완료 및 문서화
  - technical-writer: 문서 업데이트
  - project-planner: tasks.md 업데이트
```

---

## 다음 단계

### 즉시 수행
1. ✅ **이 문서를 project-planner에게 전달** (스펙 리뷰 요청)
2. ⏸️ project-planner의 피드백 반영 및 스펙 확정
3. ⏸️ TDD Red Phase 시작: 테스트 코드 작성

### 블로킹 이슈
- Claude API 키 발급 필요 (통합 테스트용)
- 프롬프트 템플릿 최종 승인 필요

---

**문서 상태**: 초안 완료, project-planner 리뷰 대기
**다음 작성자**: project-planner (스펙 리뷰 및 승인)
**이후 작성자**: qa-testing-agent (TDD Red Phase: 테스트 코드 작성)

---

## 부록: vitest 4.x 참고사항

### 타임아웃 설정
```typescript
// vitest 4.x
it('test name', { timeout: 30000 }, async () => {
  // ...
});
```

### API Mock 예시
```typescript
import { vi } from 'vitest';

const mockClaudeAPI = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Mock hint' }]
});

vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn().mockImplementation(() => ({
    messages: { create: mockClaudeAPI }
  }))
}));
```
