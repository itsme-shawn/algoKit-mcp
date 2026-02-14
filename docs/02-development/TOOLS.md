# MCP 도구 레퍼런스

**버전**: 3.1
**마지막 업데이트**: 2026-02-15 (Rate Limiting 구현 완료)

---

## 목차

1. [도구 개요](#도구-개요)
2. [핵심 도구](#핵심-도구)
3. [부가 도구](#부가-도구)
4. [향후 계획](#향후-계획)

---

## 도구 개요

### 전체 도구 목록

| 도구명 | 상태 | Phase | 설명 |
|-------|------|-------|------|
| `analyze_problem` | ✅ 완료 | Phase 5 | 문제 메타데이터 분석 |
| `generate_hint` | ✅ 완료 | SRP 리팩토링 | 3단계 힌트 가이드 생성 |
| `generate_review_template` | ✅ 완료 | Phase 5 | 복습 템플릿 및 가이드 프롬프트 |
| `search_problems` | ✅ 완료 | Phase 2 | 문제 검색 |
| `get_problem` | ✅ 완료 | Phase 2 | 문제 상세 조회 |
| `search_tags` | ✅ 완료 | Phase 2 | 알고리즘 태그 검색 |
| `fetch_problem_content` | ✅ 완료 | Phase 6 | BOJ 문제 본문 스크래핑 |
| `analyze_code_submission` | ✅ 완료 | Phase 6 | 사용자 코드 분석 및 피드백 |

### 아키텍처 특징

- **프롬프트 기반**: 가이드 프롬프트 제공, Claude Code가 맞춤 힌트 생성
- **Zero Configuration**: API 키 불필요
- **빠른 응답**: < 500ms (프롬프트만 생성)
- **MCP Inspector 호환**: 표준 JSON Schema 사용
- **Rate Limiting**: solved.ac API 호출 제한 (초당 10회, 자동 대기) ✅ Phase 4 구현 완료

---

## 핵심 도구

### 1. analyze_problem

**설명**: BOJ 문제 메타데이터를 분석합니다 (SRP: 분석만, 힌트는 별도 도구).

**입력**:
```typescript
{
  problem_id: number;       // BOJ 문제 번호 (예: 11053)
  include_similar?: boolean; // 유사 문제 추천 포함 (기본: true)
}
```

**출력**:
```typescript
{
  problem: ProblemDetail;    // 문제 메타데이터
  difficulty: {              // 난이도 정보
    tier: string;            // "Gold II"
    level: number;           // 14
    emoji: string;           // "🟡"
    percentile: string;      // "중급 (상위 40-60%)"
    context: string;         // "Gold 난이도의 다이나믹 프로그래밍 문제"
  };
  tags: [                    // 태그 정보
    {
      key: string;           // "dp"
      name_ko: string;       // "다이나믹 프로그래밍"
    }
  ];
  similar_problems: Problem[]; // 유사 문제 추천 (같은 태그, 비슷한 난이도)
}
```

**사용 방법**:
```typescript
// MCP 호출
const result = await mcpClient.call('analyze_problem', {
  problem_id: 11053,
  include_similar: true
});

// 문제 메타데이터만 필요할 때 사용
// 힌트가 필요하면 generate_hint 도구 사용
```

**핵심 기능**:
- 📊 **메타데이터 분석**: solved.ac API 기반
- 🔍 **유사 문제 추천**: 같은 알고리즘, 비슷한 난이도
- ⚡ **빠른 응답**: < 500ms
- 🎯 **단일 책임**: 분석만 (힌트는 generate_hint)

---

### 2. generate_hint

**설명**: BOJ 문제의 3단계 힌트 가이드를 생성합니다 (SRP: 힌트만).

**입력**:
```typescript
{
  problem_id: number;       // BOJ 문제 번호 (예: 11053)
}
```

**출력**:
```typescript
{
  problem: ProblemDetail;    // 문제 메타데이터 (최소한)
  difficulty: DifficultyContext; // 난이도 정보
  tags: TagInfo[];           // 태그 정보
  hint_guide: {              // 힌트 가이드
    context: string;         // 문제 요약
    hint_levels: [           // 3단계 힌트
      {
        level: 1;
        label: "문제 분석";
        prompt: string;      // Claude Code 실행용 프롬프트
      },
      {
        level: 2;
        label: "핵심 아이디어";
        prompt: string;
      },
      {
        level: 3;
        label: "상세 풀이";
        prompt: string;
      }
    ];
    review_prompts: {        // 복습용 가이드
      solution_approach: string;
      time_complexity: string;
      space_complexity: string;
      key_insights: string;
      difficulties: string;
    };
  };
}
```

**사용 방법**:
```typescript
// MCP 호출
const result = await mcpClient.call('generate_hint', {
  problem_id: 11053
});

// 🎯 Claude Code가 사용자 상황 판단 → 적절한 1개 레벨만 제시
// (절대 1,2,3 단계를 동시에 제시하지 않음!)

// Level 자동 선택 기준:
// 1️⃣ Level 1 제시: 사용자가 코드 없거나 막혀있을 때
//    → hint_levels[0].prompt 실행
//    → 문제 접근법, 입출력 분석 힌트

// 2️⃣ Level 2 제시: 사용자가 "더 필요해", "더 자세히" 요청하거나 부분 구현 언급
//    → hint_levels[1].prompt 실행
//    → 핵심 로직, 알고리즘 아이디어

// 3️⃣ Level 3 제시: 사용자가 "정답", "풀이", "코드" 등 최종 답변 요청
//    → hint_levels[2].prompt 실행
//    → 상세 구현 가이드, 전체 풀이 방법
```

**핵심 기능** (Phase 5 + SRP):
- 🎯 **문제 특화 힌트**: 모든 DP 문제 동일 힌트 → 문제별 맞춤
- 🚀 **빠른 응답**: < 500ms (프롬프트만 생성)
- 🔑 **Zero Configuration**: API 키 불필요
- 📊 **단계적 학습**: 한 번에 1개 레벨만 → 사용자가 필요할 때마다 요청
- 🤖 **자동 판단**: Claude Code가 사용자 상황 분석 → Level 1/2/3 자동 선택
- 🎨 **단일 책임**: 힌트만 (메타데이터는 analyze_problem)

---

### 3. generate_review_template

**설명**: 문제 복습용 마크다운 템플릿 및 가이드 프롬프트를 생성합니다.

**입력**:
```typescript
{
  problem_id: number;        // BOJ 문제 번호
}
```

**출력**:
```typescript
{
  template: string;          // 마크다운 템플릿
  problem_summary: {         // 문제 요약
    problemId: number;
    titleKo: string;
    tier: string;
    tags: string[];
  };
  related_problems: string[]; // 관련 문제 목록
  guide_prompt: string;       // Claude Code 가이드 프롬프트
}
```

**사용 방법**:
```typescript
const result = await mcpClient.call('generate_review_template', {
  problem_id: 1927
});

// Claude Code가 guide_prompt 실행:
// 1. 사용자에게 풀이 접근법 질문
// 2. 시간/공간 복잡도 질문
// 3. 핵심 인사이트 질문
// 4. 어려웠던 점 질문
// 5. template에 사용자 답변 채워넣기
// → 완성된 복습 문서 생성
```

**템플릿 구조**:
```markdown
# [1927] 최소 힙

## 문제 정보
**티어**: ⚪ Silver II
**태그**: 자료 구조, 우선순위 큐
**해결한 사람**: 73,425명
**문제 링크**: [BOJ 1927](https://www.acmicpc.net/problem/1927)

## 풀이 접근법
(사용자 입력)

## 시간/공간 복잡도
(사용자 입력)

## 핵심 인사이트
(사용자 입력)

## 어려웠던 점
(사용자 입력)

## 관련 문제
- [11279] 최대 힙 (⚪ Silver II)
- [11286] 절댓값 힙 (⚪ Silver I)

## 해결 날짜
해결 날짜: 2026-02-14
```

---

## 부가 도구

### 4. search_problems

**설명**: 키워드, 태그, 난이도로 BOJ 문제를 검색합니다.

**입력**:
```typescript
{
  query?: string;            // 검색 키워드 (예: "이분 탐색")
  tag?: string;              // 태그 (예: "dp")
  level_min?: number;        // 최소 난이도 (1-30)
  level_max?: number;        // 최대 난이도 (1-30)
  page?: number;             // 페이지 번호 (기본: 1)
}
```

**출력**:
```typescript
{
  count: number;             // 총 결과 개수
  problems: Problem[];       // 문제 목록 (최대 50개)
}
```

---

### 5. get_problem

**설명**: 특정 문제의 상세 메타데이터를 조회합니다.

**입력**:
```typescript
{
  problem_id: number;        // BOJ 문제 번호
}
```

**출력**:
```typescript
{
  problemId: number;
  titleKo: string;
  level: number;
  tags: Tag[];
  acceptedUserCount: number;
  averageTries: number;
}
```

---

### 6. search_tags

**설명**: 알고리즘 태그를 검색합니다.

**입력**:
```typescript
{
  query: string;             // 검색 키워드 (예: "그래프")
}
```

**출력**:
```typescript
{
  count: number;
  tags: TagDetail[];
}
```

---

## Rate Limiting

**상태**: ✅ Phase 4 구현 완료 (2026-02-15)

### 개요
- solved.ac API 호출 제한: 초당 10회
- 알고리즘: Token Bucket (버킷 용량 10개, 초당 10개 충전)
- 동작: 캐시 히트 시 즉시 응답, API 호출 시 자동 대기 (최대 5초)

### 구현 명세
- **파일**: `src/utils/rate-limiter.ts` (300줄)
- **클래스**: `RateLimiter`
- **메서드**:
  - `acquire()`: 토큰 획득 대기 (비동기)
  - `tryAcquire()`: 즉시 획득 시도 (동기)
- **파라미터**:
  - capacity: 10개 (버킷 최대 토큰 수)
  - refillRate: 초당 10개 (토큰 충전 속도)
  - timeout: 5초 (최대 대기 시간)

### 성능 특성
- ⚡ **토큰 획득 오버헤드**: < 1ms
- 🚀 **캐시 히트 응답**: < 10ms (Rate Limiter 우회)
- 🎯 **정확도**: 초당 10회 제한 정확히 동작
- ✅ **테스트**: 24개 테스트 모두 통과 (단위 16개 + 통합 8개)

### 사용자 영향
- **대부분의 경우**: 영향 없음 (캐싱으로 즉시 응답)
- **연속 요청 시**: 자동 대기 후 응답 (투명하게 처리)
- **에러**: Rate Limit 초과 시 명확한 메시지 (`RateLimitTimeoutError`)

### 기술 문서
- [Rate Limiting 설계](../01-planning/rate-limiting-design.md)
- [Rate Limiting 구현 가이드](./rate-limiting-implementation.md)
- [테스트 코드](../../tests/utils/rate-limiter.test.ts)

---

## 향후 계획

### Phase 4: 완성도 & 최적화 (진행 중)

#### Rate Limiting (Task 4.2) ✅
- **상태**: 구현 완료
- **담당**: fullstack-developer
- **완료일**: 2026-02-15
- **산출물**:
  - `src/utils/rate-limiter.ts` (300줄)
  - `tests/utils/rate-limiter.test.ts` (16개 테스트)
  - `tests/api/solvedac-client-rate-limit.test.ts` (8개 테스트)

#### 로깅/모니터링 (Task 4.3) 📋
- **상태**: 대기 중
- **내용**: Winston 로거, 메트릭 수집

#### 캐싱 최적화 (Task 4.4) 📋
- **상태**: 대기 중
- **내용**: LRU 캐시, 메모리 제한

---

**참고 문서**:
- [아키텍처 문서](../01-planning/ARCHITECTURE.md)
- [API 통합 가이드](./API.md)
- [E2E 테스트 가이드](../04-testing/e2e-manual-test-guide.md)
- [현재 작업 상황](../03-project-management/tasks.md)
