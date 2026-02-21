# MCP 도구 레퍼런스

**버전**: 3.3
**마지막 업데이트**: 2026-02-21 (search_problems level 파라미터 설명 수정)

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
| `search_problems` | ✅ 완료 | Phase 2 | BOJ 문제 검색 |
| `get_problem` | ✅ 완료 | Phase 2 | BOJ 문제 상세 조회 |
| `search_tags` | ✅ 완료 | Phase 2 | 알고리즘 태그 검색 |
| `analyze_problem_boj` | ✅ 완료 | Phase 5 | BOJ 문제 분석 및 힌트 가이드 |
| `generate_hint_boj` | ✅ 완료 | Phase 5 | BOJ 3단계 힌트 생성 |
| `generate_review_template_boj` | ✅ 완료 | Phase 5 | BOJ 복습 템플릿 및 가이드 프롬프트 |
| `fetch_problem_content_boj` | ✅ 완료 | Phase 6 | BOJ 문제 본문 스크래핑 |
| `analyze_code_submission_boj` | ✅ 완료 | Phase 6 | BOJ 코드 분석 및 피드백 |
| `search_programmers_problems` | ✅ 완료 | Phase 7 | 프로그래머스 문제 검색 |
| `get_programmers_problem` | ✅ 완료 | Phase 7 | 프로그래머스 문제 상세 조회 |
| `analyze_problem_programmers` | 🚧 스텁 | Phase 7+ | 프로그래머스 문제 분석 |
| `generate_hint_programmers` | 🚧 스텁 | Phase 7+ | 프로그래머스 힌트 생성 |
| `generate_review_template_programmers` | 🚧 스텁 | Phase 7+ | 프로그래머스 복습 템플릿 |
| `fetch_problem_content_programmers` | 🚧 스텁 | Phase 7+ | 프로그래머스 문제 본문 스크래핑 |
| `analyze_code_submission_programmers` | 🚧 스텁 | Phase 7+ | 프로그래머스 코드 분석 |

### 아키텍처 특징

- **프롬프트 기반**: 가이드 프롬프트 제공, Claude Code가 맞춤 힌트 생성
- **Zero Configuration**: API 키 불필요
- **빠른 응답**: < 500ms (프롬프트만 생성)
- **MCP Inspector 호환**: 표준 JSON Schema 사용
- **Rate Limiting**: solved.ac API 호출 제한 (초당 10회, 자동 대기) ✅ Phase 4 구현 완료

---

## 핵심 도구

### 1. analyze_problem_boj

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
const result = await mcpClient.call('analyze_problem_boj', {
  problem_id: 11053,
  include_similar: true
});

// 문제 메타데이터만 필요할 때 사용
// 힌트가 필요하면 generate_hint_boj 도구 사용
```

**핵심 기능**:
- 📊 **메타데이터 분석**: solved.ac API 기반
- 🔍 **유사 문제 추천**: 같은 알고리즘, 비슷한 난이도
- ⚡ **빠른 응답**: < 500ms
- 🎯 **단일 책임**: 분석만 (힌트는 generate_hint)

---

### 2. generate_hint_boj

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
const result = await mcpClient.call('generate_hint_boj', {
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

### 3. generate_review_template_boj

**설명**: BOJ 문제 복습용 마크다운 템플릿 및 가이드 프롬프트를 생성합니다.

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
const result = await mcpClient.call('generate_review_template_boj', {
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
  query?: string;              // 검색 키워드 (예: "이분 탐색")
  tags?: string | string[];    // 태그 (예: "dp" 또는 ["dp", "greedy", "bfs"])
  level_min?: number | string; // 최소 난이도: 숫자(1-30) 또는 티어 문자열(예: "실버 3", "Gold I")
  level_max?: number | string; // 최대 난이도: 숫자(1-30) 또는 티어 문자열(예: "골드 2", "Silver I")
  sort?: 'level' | 'id' | 'average_try'; // 정렬 기준
  direction?: 'asc' | 'desc'; // 정렬 방향
  page?: number;               // 페이지 번호 (기본: 1)
}
```

**level_min / level_max 입력 형식**:
- 숫자: `11` (Gold V), `15` (Gold I)
- 숫자 문자열: `"11"`, `"15"` (자동 변환)
- 티어 문자열: `"골드 5"`, `"Gold I"`, `"실버 3"`, `"Silver III"`

**티어-레벨 대응표**:
- 1-5: Bronze V-I
- 6-10: Silver V-I
- 11-15: Gold V-I
- 16-20: Platinum V-I
- 21-25: Diamond V-I
- 26-30: Ruby V-I

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
- [Rate Limiting 설계 및 구현](../01-planning/rate-limiting.md)
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

#### 캐싱 최적화 (Task 4.4) ✅
- **상태**: 구현 완료
- **담당**: fullstack-developer
- **완료일**: 2026-02-15
- **산출물**:
  - `src/utils/lru-cache.ts` (304줄)
  - `src/utils/cache-stats.ts` (107줄)
  - `tests/utils/lru-cache.test.ts` (31개 테스트)

---

## LRU Caching (Task 4.4)

**상태**: ✅ Phase 4 구현 완료 (2026-02-15)

### 기술 스펙
- **최대 용량**: 100개 항목 (메모리 제한)
- **기본 TTL**: 1시간
- **데이터 구조**: Doubly Linked List + Map
- **시간 복잡도**: O(1) get/set/delete
- **메모리 사용**: ~365KB (100개 항목 기준)

### 성능 지표 (실측)
| 작업 | 응답 시간 | 목표 | 달성 여부 |
|------|----------|------|-----------|
| get() | < 0.01ms | < 1ms | ✅ 달성 |
| set() | < 0.01ms | < 1ms | ✅ 달성 |
| evict() | < 0.01ms | < 1ms | ✅ 달성 |
| 10,000 ops | 2ms | < 1s | ✅ 달성 |

### 캐시 전략
| 캐시 타입 | 용량 | TTL | 용도 | 구현 위치 |
|----------|------|-----|------|-----------|
| 문제 메타데이터 | 100 | 1시간 | getProblem | solvedac-client.ts |
| 검색 결과 | 50 | 10분 | searchProblems | solvedac-client.ts |
| 태그 정보 | 100 | 1일 | searchTags | solvedac-client.ts |

### 메모리 효율성
- **최대 메모리 사용**: ~500KB (100개 항목 + 오버헤드)
- **LRU Eviction**: 용량 초과 시 가장 오래된 항목 자동 제거
- **TTL 만료**: 만료된 항목은 get() 시 자동 제거
- **메모리 누수 방지**: Doubly Linked List로 확실한 메모리 해제

### 캐시 통계
- **히트율 목표**: ≥ 70%
- **수집 메트릭**: hits, misses, evictions, hitRate, size, capacity
- **통계 클래스**: `CacheStatsCollector` (중앙 집중식 관리)

### 기술 문서
- [구현 파일: lru-cache.ts](../../src/utils/lru-cache.ts)
- [통계 수집: cache-stats.ts](../../src/utils/cache-stats.ts)
- [테스트 코드](../../tests/utils/lru-cache.test.ts)

---

## 프로그래머스 도구

### 8. search_programmers_problems

**설명**: 프로그래머스 문제를 검색합니다 (내부 JSON API 사용).

**입력**:
```typescript
{
  levels?: number[];        // 레벨 필터 (0-5)
  order?: string;           // 정렬 순서 (recent, accuracy, popular)
  page?: number;            // 페이지 번호 (기본: 1)
  query?: string;           // 검색 키워드
  limit?: number;           // 결과 수 (최대 20)
}
```

**출력**:
```typescript
{
  problems: [
    {
      id: number;           // 문제 ID (예: 42576)
      title: string;        // 문제 제목
      level: number;        // 난이도 (0-5)
      partTitle: string;    // 카테고리 (예: "연습문제")
      finishedCount: number;// 완료한 사람 수
      acceptanceRate: number;// 정답률
    }
  ];
  totalEntries: number;     // 총 문제 수
  totalPages: number;       // 총 페이지 수
  page: number;             // 현재 페이지
}
```

**사용 방법**:
```typescript
// MCP 호출
const result = await mcpClient.call('search_programmers_problems', {
  levels: [2, 3],
  order: 'recent',
  page: 1
});
```

**핵심 기능**:
- 🔍 **다중 필터**: 레벨, 정렬 순서, 키워드
- 📄 **페이지네이션**: 페이지 단위 결과 반환
- ⚡ **JSON API 기반**: Puppeteer 불필요 (< 1초)
- 💾 **캐싱**: LRU 캐시 (TTL 30분)

**제약사항**:
- API 엔드포인트: `GET https://school.programmers.co.kr/api/v2/school/challenges/`
- 타임아웃: 10초
- Rate Limiting: 초당 1회
- 최초 응답: < 1초
- 캐시 응답: < 100ms

---

### 9. get_programmers_problem

**설명**: 프로그래머스 문제 상세 정보를 조회합니다 (cheerio 기반 웹 스크래핑).

**입력**:
```typescript
{
  problem_id: string | number;  // 문제 ID 또는 URL
}
```

**입력 예시**:
- 숫자: `42576`
- 문자열: `"42576"`
- URL: `"https://school.programmers.co.kr/learn/courses/30/lessons/42576"`

**출력**:
```markdown
# 완주하지 못한 선수

**레벨**: 🟢 Lv. 1 | **카테고리**: 해시

**문제 ID**: 42576
**URL**: https://school.programmers.co.kr/learn/courses/30/lessons/42576

---

## 문제 설명
수많은 마라톤 선수들이 마라톤에 참여하였습니다...

## 제한사항
- 경기에 참여한 선수의 수는 1명 이상 100,000명 이하입니다.
- completion의 길이는 participant의 길이보다 1 작습니다.

## 입출력 예
| 입력 | 출력 |
|------|------|
| ["leo", "kiki", "eden"] | "leo" |

---

💡 **다음 단계**:
- 문제 분석: `analyze_programmers_problem` (구현 예정)
- 코드 제출 분석: `analyze_code_submission` (BOJ만 지원)

⚠️ **참고**: 프로그래머스 사이트에서 직접 문제를 풀어야 합니다.
```

**사용 방법**:
```typescript
// MCP 호출
const result = await mcpClient.call('get_programmers_problem', {
  problem_id: 42576
});

// URL로도 가능
const result2 = await mcpClient.call('get_programmers_problem', {
  problem_id: "https://school.programmers.co.kr/learn/courses/30/lessons/42576"
});
```

**핵심 기능**:
- 📖 **전체 문제 내용**: 제목, 설명, 제한사항, 입출력 예제
- ⚡ **빠른 응답**: cheerio 기반 (1-2초)
- 🔗 **URL 지원**: 문제 ID 또는 URL 입력 가능
- 💾 **장기 캐싱**: LRU 캐시 (TTL 30일)

**제약사항**:
- 스크래핑 대상: https://school.programmers.co.kr/learn/courses/30/lessons/{problem_id}
- 타임아웃: 10초
- 재시도: 최대 2회
- Rate Limiting: 초당 1회

**참고**:
- BOJ와 다르게 프로그래머스는 fetch + cheerio 사용 (SSR 페이지)
- 프로그래머스는 태그 정보가 없으므로 tags 필드는 빈 배열
- 문제 분석 도구(`analyze_programmers_problem`)는 향후 구현 예정

---

**참고 문서**:
- [아키텍처 문서](./ARCHITECTURE.md)
- [외부 API 통합 가이드](./EXTERNAL_API.md)
- [E2E 테스트 가이드](../04-testing/e2e-manual-test-guide.md)
- [현재 작업 상황](../03-project-management/TASKS.md)
