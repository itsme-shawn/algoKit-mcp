# MCP 도구 레퍼런스

**cote-mcp: BOJ 학습 도우미 MCP Server**
**버전**: 1.1
**마지막 업데이트**: 2026-02-13 (Phase 3 구현 완료)

> **참고**: MCP 도구 이름은 일반 이름을 사용합니다. 향후 슬래시 커맨드(/스킬)를 만들 때 `cote:` prefix를 사용할 예정입니다.

---

## 목차
1. [도구 개요](#도구-개요)
2. [search_problems](#search_problems)
3. [get_problem](#get_problem)
4. [search_tags](#search_tags)
5. [analyze_problem](#analyze_problem) ⭐ NEW
6. [generate_review_template](#generate_review_template) ⭐ NEW
7. [사용 예시 시나리오](#사용-예시-시나리오)

---

## 도구 개요

cote-mcp는 7개의 MCP 도구를 제공합니다:

| MCP 도구 | 향후 슬래시 커맨드 | 카테고리 | 목적 | 구현 상태 |
|---------|------------------|---------|------|---------|
| `search_problems` | `/cote:search` | 🔍 검색 | 필터를 사용한 문제 검색 | ✅ Phase 1-2 |
| `get_problem` | `/cote:problem` | 📄 조회 | 특정 문제의 상세 정보 조회 | ✅ Phase 1-2 |
| `search_tags` | `/cote:tags` | 🏷️ 검색 | 알고리즘 태그 검색 | ✅ Phase 1-2 |
| `analyze_problem` | `/cote:analyze` | 🔍 분석 | 문제 분석 및 힌트 데이터 생성 | ✅ Phase 3 |
| `generate_review_template` | `/cote:template` | 📝 템플릿 | 복습 템플릿 및 가이드 프롬프트 생성 | ✅ Phase 3 |
| ~~`get_hint`~~ | ~~`/cote:hint`~~ | 💡 학습 | ~~단계별 힌트 생성 (AI 기반)~~ | ❌ 제거 (Keyless 전환) |
| ~~`create_review`~~ | ~~`/cote:review`~~ | 📝 복습 | ~~문제 복습 문서 생성~~ | ❌ 제거 (Keyless 전환) |

---

## search_problems

### 설명
다양한 필터 옵션을 사용하여 백준 온라인 저지(BOJ) 문제를 검색합니다.
키워드, 난이도(티어), 알고리즘 태그 등으로 원하는 문제를 찾을 수 있습니다.

### 입력 스키마

```typescript
{
  query?: string;                          // 검색어 (제목, 문제 번호, 태그)
  level_min?: number | string;             // 최소 난이도 (숫자 1-30 또는 "실버 3", "Gold I")
  level_max?: number | string;             // 최대 난이도 (숫자 1-30 또는 "골드 1", "Silver III")
  tag?: string;                            // 알고리즘 태그 키
  sort?: "level" | "id" | "average_try";  // 정렬 기준
  direction?: "asc" | "desc";              // 정렬 방향
  page?: number;                           // 페이지 번호 (기본값: 1)
}
```

#### 파라미터 상세

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `query` | string | 선택 | - | 검색어 (예: "이분 탐색", "1927") |
| `level_min` | number \| string | 선택 | 1 | 최소 난이도. **숫자 형식**: 1-30 (1=Bronze V, 30=Ruby I). **문자열 형식**: "실버 3", "Silver III", "골 1", "Gold I" 등 |
| `level_max` | number \| string | 선택 | 30 | 최대 난이도. **숫자 형식**: 1-30. **문자열 형식**: "골드 1", "Gold I", "실 3", "Silver III" 등 |
| `tag` | string | 선택 | - | 태그 키 (예: "dp", "greedy") |
| `sort` | string | 선택 | "level" | 정렬 기준 |
| `direction` | string | 선택 | "asc" | 정렬 방향 |
| `page` | number | 선택 | 1 | 페이지 번호 (한 페이지당 50개) |

#### 티어 입력 형식 (NEW ✨)

`level_min`과 `level_max`는 **숫자** 또는 **티어 문자열** 두 가지 형식을 모두 지원합니다:

**1. 숫자 형식** (기존 방식)
- 1-30 사이의 정수
- 예: `level_min: 11` (Gold V), `level_max: 15` (Gold I)

**2. 티어 문자열 형식** (NEW 🎉)
- 형식: `"<티어> <등급>"`
- **한글 티어명**: `"실버 3"`, `"골드 1"`, `"브론즈 5"`
  - 축약형도 지원: `"실 3"`, `"골 1"`, `"브 5"`, `"플 2"`, `"다 4"`, `"루 1"`
- **영문 티어명**: `"Silver III"`, `"Gold I"`, `"Bronze V"`
- **대소문자 무관**: `"gold i"`, `"SILVER III"`, `"Gold I"` 모두 동일
- **구분자**: 공백 또는 하이픈 (예: `"실버 3"`, `"Silver-III"`)

**지원하는 티어**:
- 브론즈/Bronze (1-5): `"브론즈 1"` ~ `"브론즈 5"` 또는 `"Bronze I"` ~ `"Bronze V"`
- 실버/Silver (6-10): `"실버 1"` ~ `"실버 5"` 또는 `"Silver I"` ~ `"Silver V"`
- 골드/Gold (11-15): `"골드 1"` ~ `"골드 5"` 또는 `"Gold I"` ~ `"Gold V"`
- 플래티넘/Platinum (16-20): `"플래티넘 1"` ~ `"플래티넘 5"` 또는 `"Platinum I"` ~ `"Platinum V"`
- 다이아몬드/Diamond (21-25): `"다이아몬드 1"` ~ `"다이아몬드 5"` 또는 `"Diamond I"` ~ `"Diamond V"`
- 루비/Ruby (26-30): `"루비 1"` ~ `"루비 5"` 또는 `"Ruby I"` ~ `"Ruby V"`

**등급 표기법**:
- 아라비아 숫자: 1, 2, 3, 4, 5 (5가 가장 낮음, 1이 가장 높음)
- 로마 숫자: I, II, III, IV, V (V가 가장 낮음, I가 가장 높음)

**혼용 가능**:
```json
{
  "level_min": 10,          // 숫자 형식
  "level_max": "골드 1"      // 문자열 형식
}
```

### 출력 스키마

```typescript
{
  count: number;            // 총 검색 결과 개수
  page: number;             // 현재 페이지
  problems: [
    {
      problemId: number;
      title: string;        // 한글 제목
      level: number;        // 1-30
      tierName: string;     // "Gold III"
      tierBadge: string;    // "🟡 Gold III"
      tags: string[];       // ["DP", "그리디"]
      acceptedCount: number;
      averageTries: number;
      bojLink: string;
    }
  ]
}
```

### 사용 예시

#### 예시 1: 키워드 검색
**사용자**: "이분 탐색 문제 찾아줘"

**도구 호출**:
```json
{
  "query": "이분 탐색"
}
```

**응답**:
```
총 89개의 이분 탐색 문제를 찾았습니다:

1. [1920] 수 찾기 (Silver IV)
   - 태그: 이분 탐색, 자료 구조
   - 89,234명 해결, 평균 1.8회 시도

2. [1654] 랜선 자르기 (Silver II)
   - 태그: 이분 탐색, 매개변수 탐색
   - 67,892명 해결, 평균 2.4회 시도

...
```

#### 예시 2: 난이도 범위 필터링 (숫자 형식)
**사용자**: "Gold 티어의 DP 문제 중에서 쉬운 순으로 보여줘"

**도구 호출**:
```json
{
  "level_min": 11,
  "level_max": 15,
  "tag": "dp",
  "sort": "level",
  "direction": "asc"
}
```

#### 예시 3: 난이도 범위 필터링 (티어 문자열 형식) ✨ NEW
**사용자**: "실버 3부터 골드 1까지 DP 문제 찾아줘"

**도구 호출** (한글 형식):
```json
{
  "level_min": "실버 3",
  "level_max": "골드 1",
  "tag": "dp"
}
```

또는 **도구 호출** (영문 형식):
```json
{
  "level_min": "Silver III",
  "level_max": "Gold I",
  "tag": "dp"
}
```

또는 **도구 호출** (축약형):
```json
{
  "level_min": "실 3",
  "level_max": "골 1",
  "tag": "dp"
}
```

> 💡 **팁**: 세 가지 형식 모두 동일한 결과를 반환합니다 (level_min=8, level_max=15)

#### 예시 4: 혼용 형식 ✨ NEW
**사용자**: "Silver 10부터 골드 1까지"

**도구 호출**:
```json
{
  "level_min": 10,           // 숫자 형식
  "level_max": "골드 1"       // 문자열 형식
}
```

#### 예시 5: 특정 문제 번호 검색
**사용자**: "1927번 문제 있어?"

**도구 호출**:
```json
{
  "query": "1927"
}
```

### 주의사항

- `level_min`과 `level_max`는 1-30 범위 또는 유효한 티어 문자열이어야 합니다
- 티어 문자열 형식: `"<티어> <등급>"` (예: "실버 3", "Gold I")
- `level_min`이 `level_max`보다 크면 에러 발생
- `page`는 1부터 시작합니다
- 검색 결과가 없으면 빈 배열 반환

### 에러 케이스

| 에러 | 원인 | 해결 방법 |
|------|------|----------|
| "Invalid level range" | level_min > level_max | 레벨 범위 확인 |
| "Invalid tag key" | 존재하지 않는 태그 | `search_tags`로 유효한 태그 확인 |
| "Page out of range" | 페이지 범위 초과 | 1부터 시작하는 유효한 페이지 입력 |

---

## get_problem

### 설명
특정 BOJ 문제의 상세 메타데이터를 조회합니다.
문제 번호만 있으면 제목, 난이도, 태그, 통계 등 모든 정보를 얻을 수 있습니다.

### 입력 스키마

```typescript
{
  problem_id: number;       // BOJ 문제 번호 (필수)
}
```

#### 파라미터 상세

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `problem_id` | number | **필수** | BOJ 문제 번호 (예: 1000) |

### 출력 스키마

```typescript
{
  problemId: number;
  title: string;            // 한글 제목
  titleEn?: string;         // 영문 제목 (있는 경우)
  level: number;            // 1-30
  tierName: string;         // "Gold III"
  tierBadge: string;        // "🟡 Gold III"
  tags: [
    {
      key: string;          // "dp"
      name: string;         // "다이나믹 프로그래밍"
      problemCount: number; // 2847
    }
  ];
  acceptedUserCount: number;
  averageTries: number;
  bojLink: string;          // https://www.acmicpc.net/problem/1927
  isSolvable: boolean;
  isOfficial: boolean;
}
```

### 사용 예시

#### 예시 1: 문제 정보 조회
**사용자**: "1927번 문제에 대해 알려줘"

**도구 호출**:
```json
{
  "problem_id": 1927
}
```

**응답**:
```
[1927] 최소 힙

📊 난이도: 🟤 Silver II (레벨 9)

🏷️ 태그:
- 자료 구조 (2,847개 문제)
- 우선순위 큐 (456개 문제)

📈 통계:
- 73,425명이 해결
- 평균 1.8회 시도

🔗 문제 링크: https://www.acmicpc.net/problem/1927
```

#### 예시 2: 복수 문제 비교
**사용자**: "1920번과 1654번 문제 중 어떤 게 더 어려워?"

**도구 호출** (2회):
```json
{ "problem_id": 1920 }
{ "problem_id": 1654 }
```

**응답**:
```
두 문제를 비교해드리겠습니다:

[1920] 수 찾기 (Silver IV, 레벨 7)
- 평균 1.8회 시도
- 89,234명 해결

[1654] 랜선 자르기 (Silver II, 레벨 9)
- 평균 2.4회 시도
- 67,892명 해결

1654번이 2단계 더 어렵습니다 (레벨 7 vs 9).
```

### 주의사항

- 존재하지 않는 문제 번호는 에러 반환
- 문제 번호는 양의 정수여야 함
- 응답 데이터는 1시간 캐싱됨 (최신 통계는 약간 지연 가능)

### 에러 케이스

| 에러 | 원인 | 해결 방법 |
|------|------|----------|
| "Problem not found" | 존재하지 않는 문제 ID | BOJ에서 문제 번호 확인 |
| "Invalid problem ID" | 음수 또는 0 입력 | 양의 정수 입력 |

---

## search_tags

### 설명
알고리즘 태그를 키워드로 검색합니다.
한글, 영문 모두 지원하며, 부분 매칭으로 관련 태그를 찾을 수 있습니다.

### 입력 스키마

```typescript
{
  query: string;            // 검색 키워드 (필수)
}
```

#### 파라미터 상세

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `query` | string | **필수** | 태그 검색 키워드 (예: "dynamic", "그래프") |

### 출력 스키마

```typescript
{
  count: number;
  tags: [
    {
      key: string;          // "dp"
      nameKo: string;       // "다이나믹 프로그래밍"
      nameEn: string;       // "Dynamic Programming"
      problemCount: number; // 2847
      aliases: string[];    // ["동적계획법", "동적 계획법"]
    }
  ]
}
```

### 사용 예시

#### 예시 1: 한글 키워드
**사용자**: "그래프 관련 알고리즘에는 뭐가 있어?"

**도구 호출**:
```json
{
  "query": "그래프"
}
```

**응답**:
```
그래프 관련 알고리즘 태그를 찾았습니다:

1. graphs (그래프 이론) - 3,247개 문제
   별칭: 그래프이론

2. graph_traversal (그래프 탐색) - 2,103개 문제
   별칭: 그래프순회

3. dfs (깊이 우선 탐색) - 1,892개 문제
   별칭: 깊이우선탐색, depth first search

4. bfs (너비 우선 탐색) - 1,654개 문제
   별칭: 너비우선탐색, breadth first search

5. shortest_path (최단 경로) - 487개 문제
   별칭: 최단경로

어떤 태그로 문제를 검색해드릴까요?
```

#### 예시 2: 영문 키워드
**사용자**: "dynamic programming 태그 찾아줘"

**도구 호출**:
```json
{
  "query": "dynamic"
}
```

**응답**:
```
Dynamic Programming 관련 태그:

1. dp (다이나믹 프로그래밍) - 2,847개 문제
   별칭: 동적계획법, 동적 계획법, 다이나믹프로그래밍
```

#### 예시 3: 부분 매칭
**사용자**: "이분으로 시작하는 알고리즘 뭐 있어?"

**도구 호출**:
```json
{
  "query": "이분"
}
```

**응답**:
```
'이분'으로 검색한 태그:

1. binary_search (이분 탐색) - 789개 문제
   별칭: 이분탐색, 이진 탐색, 이진탐색

2. parametric_search (매개변수 탐색) - 234개 문제
   별칭: 파라메트릭 서치
   * 이분 탐색의 응용 기법
```

### 주의사항

- 대소문자 구분 없이 검색
- 부분 문자열 매칭 지원
- 검색 결과는 관련도 순으로 정렬
- 빈 결과 시 유사 태그 추천 (향후 기능)

### 에러 케이스

| 에러 | 원인 | 해결 방법 |
|------|------|----------|
| "Query too short" | 1글자 이하 입력 | 2글자 이상 입력 |
| "No tags found" | 매칭되는 태그 없음 | 다른 키워드로 재시도 |

---

## analyze_problem

### 설명
백준 문제를 분석하여 구조화된 힌트 데이터를 제공합니다.
**Keyless 아키텍처**로 설계되어 API 키 없이 사용 가능하며, Claude Code가 이 데이터를 받아 자연어 힌트를 생성합니다.

**구현 상태**: ✅ Phase 3 완료 (`src/tools/analyze-problem.ts`, `src/services/problem-analyzer.ts`)

### 입력 스키마

```typescript
{
  problem_id: number;          // BOJ 문제 번호 (필수, 양의 정수)
  include_similar?: boolean;   // 유사 문제 포함 여부 (선택, 기본값: true)
}
```

**Zod 스키마**:
```typescript
const AnalyzeProblemInputSchema = z.object({
  problem_id: z.number().int().positive().describe('백준 문제 번호 (양수)'),
  include_similar: z.boolean().optional().default(true).describe('유사 문제 포함 여부 (기본값: true)')
});
```

#### 파라미터 상세

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `problem_id` | number | **필수** | - | BOJ 문제 번호 |
| `include_similar` | boolean | 선택 | true | 유사 문제 추천 포함 여부 |

### 출력 스키마

```typescript
{
  problem: Problem;                     // 문제 기본 정보
  difficulty: DifficultyContext;        // 난이도 컨텍스트
  algorithm: AlgorithmInfo;             // 알고리즘 정보
  hint_points: HintPoint[];             // 3단계 힌트 포인트
  constraints: Constraint[];            // 제약 조건 분석
  similar_problems?: Problem[];         // 유사 문제 추천
}
```

**상세 타입 정의**:

```typescript
interface Problem {
  problemId: number;
  titleKo: string;
  level: number;
  tags: Tag[];
}

interface DifficultyContext {
  tier: string;              // "Silver III"
  emoji: string;             // "🥈"
  percentile: string;        // "상위 30-40%"
  context: string;           // "Silver 중급 DP 입문 문제"
}

interface AlgorithmInfo {
  primary_tags: string[];                    // ["dp"]
  typical_approaches: string[];              // ["Bottom-up DP"]
  time_complexity_typical: string;           // "O(N)"
  space_complexity_typical: string;          // "O(N)"
}

interface HintPoint {
  level: 1 | 2 | 3;          // 힌트 레벨
  type: 'pattern' | 'insight' | 'strategy';
  key: string;               // 힌트 제목
  description: string;       // 힌트 설명
  steps?: string[];          // 구체적 단계 (level 3에만)
  pitfalls?: string[];       // 주의할 점
}

interface Constraint {
  type: 'input_size' | 'value_range' | 'time_limit' | 'memory_limit';
  description: string;
  implication: string;       // 제약이 의미하는 바
}
```

### 사용 예시

#### 예시 1: 기본 문제 분석
**사용자**: "1463번 문제 분석해줘"

**도구 호출**:
```json
{
  "problem_id": 1463,
  "include_similar": true
}
```

**응답**:
```json
{
  "problem": {
    "problemId": 1463,
    "titleKo": "1로 만들기",
    "level": 8,
    "tags": [
      { "key": "dp", "displayNames": [{ "language": "ko", "name": "다이나믹 프로그래밍" }] }
    ]
  },
  "difficulty": {
    "tier": "Silver III",
    "emoji": "🥈",
    "percentile": "상위 30-40%",
    "context": "Silver 중급 DP 입문 문제"
  },
  "algorithm": {
    "primary_tags": ["dp"],
    "typical_approaches": ["Bottom-up DP", "Top-down DP (메모이제이션)"],
    "time_complexity_typical": "O(N)",
    "space_complexity_typical": "O(N)"
  },
  "hint_points": [
    {
      "level": 1,
      "type": "pattern",
      "key": "동적 프로그래밍 (DP)",
      "description": "이 문제는 큰 문제를 작은 부분 문제로 나누어 해결하는 DP 문제입니다. 각 숫자 N에 대해 '1로 만드는 최소 연산 횟수'를 구해야 합니다.",
      "pitfalls": [
        "그리디하게 접근하면 최적해를 보장할 수 없습니다",
        "3으로 나누기가 항상 최선은 아닙니다"
      ]
    },
    {
      "level": 2,
      "type": "insight",
      "key": "상태 정의와 점화식",
      "description": "dp[i] = i를 1로 만드는 최소 연산 횟수로 정의합니다. dp[i]는 dp[i-1], dp[i/2] (i가 짝수), dp[i/3] (i가 3의 배수) 중 최솟값 + 1입니다.",
      "pitfalls": [
        "dp 배열을 초기화할 때 충분히 큰 값으로 설정해야 합니다",
        "나눗셈 조건을 확인하지 않으면 인덱스 에러가 발생합니다"
      ]
    },
    {
      "level": 3,
      "type": "strategy",
      "key": "Bottom-up 구현 전략",
      "description": "1부터 N까지 순차적으로 dp 값을 채워나갑니다. 각 i에 대해 가능한 연산(3으로 나누기, 2로 나누기, 1 빼기)을 모두 고려하여 최솟값을 선택합니다.",
      "steps": [
        "1. dp 배열을 크기 N+1로 초기화 (dp[1] = 0)",
        "2. 2부터 N까지 반복",
        "3. 각 i에 대해:",
        "   - dp[i] = dp[i-1] + 1 (기본값)",
        "   - i % 2 == 0이면 dp[i] = min(dp[i], dp[i/2] + 1)",
        "   - i % 3 == 0이면 dp[i] = min(dp[i], dp[i/3] + 1)",
        "4. dp[N] 반환"
      ],
      "pitfalls": [
        "dp[0]은 사용하지 않으므로 초기화 불필요",
        "연산 순서는 결과에 영향을 주지 않습니다"
      ]
    }
  ],
  "constraints": [
    {
      "type": "input_size",
      "description": "1 ≤ N ≤ 1,000,000",
      "implication": "O(N) 시간 복잡도로 충분합니다. O(N log N)이나 O(N²)도 가능하지만 비효율적입니다."
    },
    {
      "type": "time_limit",
      "description": "0.15초 (150ms)",
      "implication": "Python의 경우 약 1,500만 번 연산, C++은 약 1억 5천만 번 연산 가능. DP 배열 갱신만으로 충분합니다."
    }
  ],
  "similar_problems": [
    {
      "problemId": 2579,
      "titleKo": "계단 오르기",
      "level": 8,
      "tags": [{ "key": "dp" }]
    },
    {
      "problemId": 1149,
      "titleKo": "RGB거리",
      "level": 10,
      "tags": [{ "key": "dp" }]
    }
  ]
}
```

#### 예시 2: 유사 문제 제외
**사용자**: "11053번 문제 분석만 해줘, 유사 문제는 필요 없어"

**도구 호출**:
```json
{
  "problem_id": 11053,
  "include_similar": false
}
```

**응답**:
```json
{
  "problem": { ... },
  "difficulty": { ... },
  "algorithm": { ... },
  "hint_points": [ ... ]
  // similar_problems 필드 없음
}
```

#### 예시 3: Claude Code 활용 시나리오
**사용자**: "1463번 문제 Level 2 힌트 줘"

**Claude Code 내부 처리**:
```
1. analyze_problem(1463) 호출 → JSON 응답 수신
2. hint_points 배열에서 level: 2 항목 추출
3. 자연어 힌트 생성:

"[1463] 1로 만들기 - Level 2 힌트

🧩 핵심 아이디어

이 문제는 **상태 정의와 점화식**이 핵심입니다.

dp[i]를 'i를 1로 만드는 최소 연산 횟수'로 정의합니다.
dp[i]는 다음 세 가지 경우 중 최솟값에 1을 더한 값입니다:
- dp[i-1] (1을 뺀 경우)
- dp[i/2] (2로 나눈 경우, i가 짝수일 때)
- dp[i/3] (3으로 나눈 경우, i가 3의 배수일 때)

⚠️ 주의할 점:
- dp 배열을 초기화할 때 충분히 큰 값으로 설정해야 합니다
- 나눗셈 조건을 확인하지 않으면 인덱스 에러가 발생합니다

💡 다음 단계
Level 3 힌트에서는 구체적인 구현 단계를 알려드리겠습니다."
```

### 구현 세부사항

**ProblemAnalyzer 서비스**:
- **위치**: `src/services/problem-analyzer.ts` (590 lines)
- **주요 메서드**:
  - `analyzeProblem(problemId, includeSimilar)`: 문제 분석 실행
  - `buildDifficultyContext(level)`: 난이도 컨텍스트 생성
  - `buildAlgorithmInfo(tags)`: 알고리즘 정보 구축
  - `generateHintPoints(problem, algorithmInfo)`: 3단계 힌트 포인트 생성
  - `analyzeConstraints(problem)`: 제약 조건 분석
  - `findSimilarProblems(problem)`: 유사 문제 찾기

**힌트 패턴 데이터**:
```typescript
const HINT_PATTERNS = {
  dp: {
    level1: { type: 'pattern', key: '동적 프로그래밍', ... },
    level2: { type: 'insight', key: '상태 정의와 점화식', ... },
    level3: { type: 'strategy', key: 'Bottom-up 구현', steps: [...] }
  },
  greedy: { ... },
  graph: { ... }
  // 30개 이상의 알고리즘 패턴
};
```

**특징**:
- **결정적(Deterministic)**: 동일 입력에 항상 같은 출력
- **API 키 불필요**: 모든 데이터는 사전 정의됨
- **빠른 응답**: LLM 호출 없이 즉시 반환 (< 500ms)

### Claude Code 활용

**Keyless 아키텍처**의 핵심 원리:
1. **MCP 서버**: 구조화된 JSON 데이터만 제공
2. **Claude Code**: JSON을 받아 자연어 힌트 생성
3. **Zero Configuration**: API 키 설정 불필요

**사용자 워크플로우**:
```
사용자: "1463번 문제 Level 2 힌트 줘"
    ↓
Claude Code: analyze_problem(1463) 호출
    ↓
cote-mcp Server: ProblemAnalysis JSON 반환
    ↓
Claude Code: hint_points[1]을 자연어로 변환
    ↓
사용자: 자연스러운 한글 힌트 받음
```

### 주의사항

- ✅ **API 키 불필요**: 환경 변수 설정 없이 바로 사용 가능
- Level 3 힌트도 **실제 코드는 제공하지 않습니다** (알고리즘 단계까지만)
- 힌트는 문제의 태그와 난이도를 기반으로 사전 정의된 패턴에서 생성됩니다
- 응답 시간 < 500ms (LLM 호출 없음)
- Claude Code가 자연어 생성을 담당하므로, MCP 서버는 데이터만 제공합니다

### 에러 케이스

| 에러 | 원인 | 해결 방법 |
|------|------|----------|
| "Number must be positive" | problem_id가 양수가 아님 | 양의 정수 입력 |
| "Required" (problem_id) | problem_id 누락 | 필수 파라미터 확인 |
| "문제를 찾을 수 없습니다: {id}번" | ProblemNotFoundError | 유효한 문제 번호 확인 |
| "문제 분석 중 오류 발생" | 내부 에러 | 재시도 또는 로그 확인 |

---

## generate_review_template

### 설명
문제 복습용 마크다운 템플릿과 가이드 프롬프트를 생성합니다.
**Keyless 아키텍처**로 설계되어, Claude Code가 템플릿과 프롬프트를 받아 사용자와 대화하며 복습 문서를 완성합니다.

**구현 상태**: ✅ Phase 3 완료 (`src/tools/generate-review-template.ts`, `src/services/review-template-generator.ts`)

### 입력 스키마

```typescript
{
  problem_id: number;       // BOJ 문제 번호 (필수, 양의 정수)
  user_notes?: string;      // 사용자 초기 메모 (선택)
}
```

**Zod 스키마**:
```typescript
const GenerateReviewTemplateInputSchema = z.object({
  problem_id: z.number().int().positive().describe('백준 문제 번호 (양수)'),
  user_notes: z.string().optional().describe('사용자 초기 메모 (선택)')
});
```

#### 파라미터 상세

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `problem_id` | number | **필수** | BOJ 문제 번호 |
| `user_notes` | string | 선택 | 초기 메모 또는 간단한 요약 |

### 출력 스키마

```typescript
{
  template: string;                  // 마크다운 템플릿
  problem_data: ProblemData;         // 문제 기본 정보
  analysis: AnalysisInfo;            // 분석 정보
  related_problems: Problem[];       // 관련 문제 추천
  prompts: GuidePrompts;             // 가이드 프롬프트
}
```

**상세 타입 정의**:

```typescript
interface ProblemData {
  id: number;
  title: string;
  tier: string;                      // "Silver III"
  tier_emoji: string;                // "🥈"
  tags: string[];                    // ["다이나믹 프로그래밍"]
  accepted_count: number;
  average_tries: number;
  boj_link: string;
}

interface AnalysisInfo {
  tags_explanation: Record<string, string>;     // { dp: "동적 프로그래밍은..." }
  common_approaches: string[];                  // ["Bottom-up DP"]
  time_complexity_hint: string;                 // "일반적으로 O(N) 또는 O(N log N)"
  space_complexity_hint: string;                // "일반적으로 O(N)"
  common_mistakes: string[];                    // ["dp 배열 크기 설정", ...]
}

interface GuidePrompts {
  solution_approach: string;                    // "이 문제를 어떻게 해결했나요?"
  time_complexity: string;                      // "시간 복잡도를 분석해주세요..."
  space_complexity: string;                     // "공간 복잡도는 어떻게 되나요?"
  key_insights: string;                         // "배운 점이나 주의할 점은?"
  difficulties: string;                         // "어려웠던 부분이 있었나요?"
}
```

**템플릿 구조**:
```markdown
# [문제번호] 문제제목

## 문제 정보
[자동 생성: 티어, 태그, 통계, BOJ 링크]

## 풀이 접근법
[사용자 입력 필요]

## 시간 복잡도
[사용자 입력 필요]

## 공간 복잡도
[사용자 입력 필요]

## 핵심 인사이트
[사용자 입력 필요]

## 어려웠던 점
[사용자 입력 필요]

## 관련 문제
[자동 생성: 유사 문제 추천]

---
*해결 날짜: [현재 날짜]*
```

### 사용 예시

#### 예시 1: 템플릿 생성
**사용자**: "1463번 문제 복습 템플릿 만들어줘"

**도구 호출**:
```json
{
  "problem_id": 1463
}
```

**응답**:
```json
{
  "template": "# 1463. 1로 만들기\n\n## 문제 정보\n**티어**: 🥈 Silver III\n**태그**: 다이나믹 프로그래밍\n**해결한 사람**: 123,456명\n**평균 시도**: 2.3회\n**문제 링크**: [BOJ 1463](https://www.acmicpc.net/problem/1463)\n\n## 풀이 접근법\n[여기에 작성해주세요]\n\n## 시간 복잡도\n[여기에 작성해주세요]\n\n## 공간 복잡도\n[여기에 작성해주세요]\n\n## 핵심 인사이트\n[여기에 작성해주세요]\n\n## 어려웠던 점\n[여기에 작성해주세요]\n\n## 관련 문제\n- [2579] 계단 오르기 (Silver III)\n- [1149] RGB거리 (Silver I)\n\n---\n*해결 날짜: 2026-02-13*\n",
  "problem_data": {
    "id": 1463,
    "title": "1로 만들기",
    "tier": "Silver III",
    "tier_emoji": "🥈",
    "tags": ["다이나믹 프로그래밍"],
    "accepted_count": 123456,
    "average_tries": 2.3,
    "boj_link": "https://www.acmicpc.net/problem/1463"
  },
  "analysis": {
    "tags_explanation": {
      "dp": "동적 프로그래밍은 큰 문제를 작은 부분 문제로 나누어 해결하는 알고리즘입니다. 각 부분 문제의 해를 저장(메모이제이션)하여 중복 계산을 방지합니다."
    },
    "common_approaches": [
      "Bottom-up DP (반복문)",
      "Top-down DP (재귀 + 메모이제이션)"
    ],
    "time_complexity_hint": "일반적으로 O(N) 또는 O(N log N)",
    "space_complexity_hint": "일반적으로 O(N) (DP 배열)",
    "common_mistakes": [
      "그리디하게 접근하여 최적해를 놓침",
      "dp 배열 초기화를 잘못함",
      "나눗셈 조건을 확인하지 않음"
    ]
  },
  "related_problems": [
    {
      "problemId": 2579,
      "titleKo": "계단 오르기",
      "level": 8,
      "tags": [{"key": "dp"}]
    },
    {
      "problemId": 1149,
      "titleKo": "RGB거리",
      "level": 10,
      "tags": [{"key": "dp"}]
    }
  ],
  "prompts": {
    "solution_approach": "이 문제를 어떻게 해결했나요? 사용한 알고리즘과 접근 방법을 설명해주세요.",
    "time_complexity": "시간 복잡도를 분석해주세요. 반복문이나 재귀 호출의 횟수를 고려하여 Big-O 표기법으로 작성해주세요.",
    "space_complexity": "공간 복잡도는 어떻게 되나요? 사용한 배열이나 자료구조의 크기를 고려해주세요.",
    "key_insights": "이 문제를 풀면서 배운 점이나 나중에 주의할 점이 있나요?",
    "difficulties": "문제를 푸는 과정에서 어려웠던 부분이 있었나요? 어떻게 해결했나요?"
  }
}
```

#### 예시 2: Claude Code 대화형 복습 작성
**사용자**: "1463번 문제 복습 문서 만들어줘"

**Claude Code 내부 처리**:
```
1. generate_review_template(1463) 호출 → JSON 응답 수신
2. 템플릿과 프롬프트 확인
3. 대화형 복습 문서 작성 시작

Claude Code: "1463번 '1로 만들기' 문제의 복습 문서를 만들어드리겠습니다.

먼저, 이 문제를 어떻게 해결했나요?
사용한 알고리즘과 접근 방법을 설명해주세요."

사용자: "DP 배열을 만들어서 1부터 N까지 각 숫자를 1로 만드는 최소 횟수를 저장했어요."

Claude Code: "좋습니다! 시간 복잡도를 분석해주세요.
반복문이나 재귀 호출의 횟수를 고려하여 Big-O 표기법으로 작성해주세요."

사용자: "O(N)이에요. 1부터 N까지 한 번씩만 순회했거든요."

Claude Code: "완벽합니다. 공간 복잡도는 어떻게 되나요?"

사용자: "O(N)이요. dp 배열 하나만 사용했어요."

Claude Code: "이 문제를 풀면서 배운 점이나 나중에 주의할 점이 있나요?"

사용자: "그리디로 접근하면 안 되고, 세 가지 연산을 모두 고려해야 한다는 걸 배웠어요."

Claude Code: "훌륭합니다! 복습 문서를 완성했습니다."

[최종 마크다운 생성]
```

**최종 생성 문서**:
```markdown
# 1463. 1로 만들기

## 문제 정보
**티어**: 🥈 Silver III
**태그**: 다이나믹 프로그래밍
**해결한 사람**: 123,456명
**평균 시도**: 2.3회
**문제 링크**: [BOJ 1463](https://www.acmicpc.net/problem/1463)

## 풀이 접근법
DP 배열을 만들어서 1부터 N까지 각 숫자를 1로 만드는 최소 횟수를 저장했습니다.

## 시간 복잡도
O(N) - 1부터 N까지 한 번씩만 순회

## 공간 복잡도
O(N) - dp 배열 하나만 사용

## 핵심 인사이트
그리디로 접근하면 안 되고, 세 가지 연산(3으로 나누기, 2로 나누기, 1 빼기)을 모두 고려해야 한다는 것을 배웠습니다.

## 관련 문제
- [2579] 계단 오르기 (Silver III)
- [1149] RGB거리 (Silver I)

---
*해결 날짜: 2026-02-13*
```

#### 예시 3: 초기 메모 포함
**사용자**: "11053번 복습 템플릿 만들어줘. DP 배열 정의가 헷갈렸다고 메모 남겨줘"

**도구 호출**:
```json
{
  "problem_id": 11053,
  "user_notes": "DP 배열 정의가 헷갈렸음"
}
```

**응답**:
```json
{
  "template": "# 11053. 가장 긴 증가하는 부분 수열\n\n...\n\n## 초기 메모\nDP 배열 정의가 헷갈렸음\n\n...",
  "problem_data": { ... },
  "analysis": {
    "tags_explanation": {
      "dp": "동적 프로그래밍...",
      "lis": "최장 증가 부분 수열(LIS)은 배열에서 순서를 유지하면서 증가하는 부분 수열 중 가장 긴 것을 찾는 문제입니다."
    },
    "common_approaches": ["O(N²) DP", "O(N log N) 이분 탐색"],
    "time_complexity_hint": "O(N²) 또는 O(N log N)",
    "space_complexity_hint": "O(N)",
    "common_mistakes": [
      "dp[i]를 'i번째까지의 최장 길이'로 잘못 정의",
      "dp[i]는 'i번째를 끝으로 하는 LIS 길이'로 정의해야 함"
    ]
  },
  "prompts": { ... }
}
```

### 구현 세부사항

**ReviewTemplateGenerator 서비스**:
- **위치**: `src/services/review-template-generator.ts` (242 lines)
- **주요 메서드**:
  - `generateTemplate(problemId, userNotes?)`: 템플릿 및 데이터 생성
  - `buildTemplate(problemData, userNotes?)`: 마크다운 템플릿 구축
  - `buildAnalysis(tags)`: 분석 정보 생성
  - `buildGuidePrompts()`: 가이드 프롬프트 생성
  - `findRelatedProblems(problem)`: 관련 문제 찾기

**분석 데이터 패턴**:
```typescript
const TAG_EXPLANATIONS = {
  dp: "동적 프로그래밍은 큰 문제를 작은 부분 문제로...",
  greedy: "그리디 알고리즘은 매 순간 최선의 선택을...",
  graph: "그래프는 정점과 간선으로 이루어진..."
  // 30개 이상의 태그 설명
};

const COMMON_MISTAKES = {
  dp: ["상태 정의 오류", "초기화 실수", ...],
  greedy: ["최적해 보장 확인 누락", ...],
  // ...
};
```

**가이드 프롬프트**:
```typescript
const GUIDE_PROMPTS = {
  solution_approach: "이 문제를 어떻게 해결했나요? 사용한 알고리즘과 접근 방법을 설명해주세요.",
  time_complexity: "시간 복잡도를 분석해주세요. 반복문이나 재귀 호출의 횟수를 고려하여 Big-O 표기법으로 작성해주세요.",
  space_complexity: "공간 복잡도는 어떻게 되나요? 사용한 배열이나 자료구조의 크기를 고려해주세요.",
  key_insights: "이 문제를 풀면서 배운 점이나 나중에 주의할 점이 있나요?",
  difficulties: "문제를 푸는 과정에서 어려웠던 부분이 있었나요? 어떻게 해결했나요?"
};
```

**특징**:
- **결정적(Deterministic)**: 동일 입력에 항상 같은 템플릿
- **API 키 불필요**: 모든 데이터는 사전 정의됨
- **빠른 응답**: < 500ms

### Claude Code 활용

**Keyless 아키텍처**의 핵심 워크플로우:
1. **MCP 서버**: 템플릿 + 분석 정보 + 가이드 프롬프트 제공
2. **Claude Code**: 프롬프트를 사용하여 사용자와 대화
3. **Claude Code**: 사용자 답변을 템플릿에 채워 최종 문서 생성

**사용자 워크플로우**:
```
사용자: "1463번 문제 복습 문서 만들어줘"
    ↓
Claude Code: generate_review_template(1463) 호출
    ↓
cote-mcp Server: ReviewTemplate JSON 반환
    ↓
Claude Code: prompts.solution_approach로 질문
    ↓
사용자: 답변
    ↓
Claude Code: 답변을 템플릿에 채우기
    ↓
(반복: 시간 복잡도, 공간 복잡도, 인사이트, 어려웠던 점)
    ↓
Claude Code: 최종 마크다운 문서 생성
```

### 주의사항

- ✅ **API 키 불필요**: 환경 변수 설정 없이 바로 사용 가능
- Claude Code가 대화형으로 복습 문서를 작성하도록 안내합니다
- 관련 문제는 같은 태그를 가진 문제 중 비슷한 난이도로 자동 추천됩니다
- 응답 시간 < 500ms (LLM 호출 없음)
- 최종 문서는 Claude Code가 생성하며, 사용자가 파일로 저장할 수 있습니다

### 에러 케이스

| 에러 | 원인 | 해결 방법 |
|------|------|----------|
| "Number must be positive" | problem_id가 양수가 아님 | 양의 정수 입력 |
| "Required" (problem_id) | problem_id 누락 | 필수 파라미터 확인 |
| "문제를 찾을 수 없습니다: {id}번" | ProblemNotFoundError | 유효한 문제 번호 확인 |
| "템플릿 생성 중 오류 발생" | 내부 에러 | 재시도 또는 로그 확인 |

---

## 사용 예시 시나리오

### 시나리오 1: 문제 발견부터 복습까지 (전체 워크플로우)

**1단계: 문제 검색**
```
사용자: Gold 티어의 DP 문제 추천해줘

[search_problems 호출]
- level_min: 11
- level_max: 15
- tag: "dp"

응답: 20개 문제 발견
```

**2단계: 문제 선택 및 상세 확인**
```
사용자: 11053번 어떤 문제야?

[get_problem 호출]
- problem_id: 11053

응답: 가장 긴 증가하는 부분 수열, Silver II, DP 태그
```

**3단계: 문제 풀이 중 막힘 → 힌트 요청**
```
사용자: 이 문제 어떻게 접근해야 해? 힌트 줘

[get_hint 호출]
- problem_id: 11053
- hint_level: 1

응답: DP 문제, 각 위치에서 최선의 선택 저장

사용자: 좀 더 구체적으로 알려줘

[get_hint 호출]
- problem_id: 11053
- hint_level: 2

응답: dp[i] = i번째를 끝으로 하는 LIS 길이, 점화식 제시
```

**4단계: 문제 해결 후 복습**
```
사용자: 문제 풀었어! 복습 문서 만들어줘

[create_review 호출]
- problem_id: 11053
- solution_approach: "..."
- time_complexity: "O(n^2)"
- key_insights: "DP 상태 정의가 핵심"

응답: 마크다운 복습 문서 생성
```

### 시나리오 2: 태그 기반 학습 계획

```
1. 사용자: 그래프 알고리즘 공부하고 싶은데 뭐부터 시작해야 해?

   [search_tags 호출]
   - query: "그래프"

   응답: graphs, dfs, bfs, shortest_path 등 태그 제시

2. 사용자: BFS부터 시작할게. Silver 티어 BFS 문제 추천해줘

   [search_problems 호출]
   - tag: "bfs"
   - level_min: 6
   - level_max: 10
   - sort: "level"

   응답: BFS 기초 문제들 추천

3. 사용자: 첫 번째 문제 풀어볼게

   [get_problem 호출] → 상세 정보 확인
   [get_hint 호출] → 필요시 힌트
   [create_review 호출] → 해결 후 복습
```

### 시나리오 3: 비슷한 문제 연습

```
1. 사용자: 방금 푼 1927번 문제랑 비슷한 문제 더 풀고 싶어

   [get_problem 호출]
   - problem_id: 1927

   응답에서 태그 확인: priority_queue, data_structures

2. 사용자: 우선순위 큐 문제 더 찾아줘

   [search_problems 호출]
   - tag: "priority_queue"
   - level_min: 8
   - level_max: 12

   응답: 유사 난이도의 우선순위 큐 문제들
```

---

## 문제 해결 팁

### 도구 선택 가이드

| 목적 | 사용할 도구 |
|------|-----------|
| 원하는 난이도/태그의 문제 찾기 | `search_problems` |
| 특정 문제 번호의 정보 확인 | `get_problem` |
| 알고리즘 유형 탐색 | `search_tags` |
| 문제 풀이 막힘 | `get_hint` (레벨 1부터) |
| 문제 해결 후 정리 | `create_review` |

### 효과적인 힌트 활용법

1. **레벨 1부터 시작**: 항상 가장 낮은 레벨부터 힌트를 받으세요
2. **충분히 고민**: 각 힌트를 받은 후 스스로 생각할 시간을 가지세요
3. **컨텍스트 제공**: `user_context`에 현재 이해도를 작성하면 더 맞춤화된 힌트를 받습니다
4. **적절한 시점**: 30분 이상 막혔을 때 힌트를 요청하는 것이 효과적입니다

### 복습 문서 작성 팁

- **즉시 작성**: 문제를 푼 직후에 작성하는 것이 가장 좋습니다
- **자세히 작성**: 나중에 봤을 때 이해할 수 있을 만큼 상세하게
- **실수 기록**: 어려웠던 점과 실수를 꼭 기록하세요 (반복 방지)
- **복잡도 분석**: 시간/공간 복잡도를 분석하는 습관을 들이세요

---

**지원 및 피드백**:
- 도구 사용 중 문제가 있다면 이슈를 등록해주세요
- 더 나은 기능 제안도 환영합니다
