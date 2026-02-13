# 시스템 아키텍처 문서

**BOJ 학습 도우미 MCP Server**
**버전**: 2.0 (Keyless Architecture)
**마지막 업데이트**: 2026-02-13 (Phase 3 Keyless 아키텍처 구현 완료)

---

## 목차
1. [시스템 개요](#시스템-개요)
2. [Keyless 아키텍처 원칙](#keyless-아키텍처-원칙)
3. [아키텍처 다이어그램](#아키텍처-다이어그램)
4. [컴포넌트 상세 설명](#컴포넌트-상세-설명)
5. [데이터 흐름](#데이터-흐름)
6. [기술 스택](#기술-스택)
7. [설계 결정사항](#설계-결정사항)
8. [확장성 및 성능](#확장성-및-성능)

---

## 시스템 개요

### 목적
BOJ 학습 도우미는 **MCP(Model Context Protocol)** 기반 서버로, Claude Code와 같은 AI 어시스턴트가 백준 온라인 저지 문제를 검색하고 학습을 지원할 수 있도록 도구를 제공합니다.

### 핵심 특징
- **Keyless 아키텍처**: API 키 불필요, 결정적 데이터만 제공
- **MCP 프로토콜 준수**: 표준 MCP SDK 사용
- **Stateless 설계**: 각 요청은 독립적으로 처리
- **외부 API 통합**: solved.ac API 활용
- **Zero Configuration**: 즉시 사용 가능한 설정
- **캐싱 최적화**: 자주 조회되는 데이터 캐싱

### 배포 모델
- **로컬 실행**: 사용자 PC에서 MCP 서버로 실행
- **Claude Desktop 통합**: Claude Desktop의 MCP 클라이언트로 연결

---

## Keyless 아키텍처 원칙

### 철학
**MCP 서버는 결정적(Deterministic) 데이터만 제공하고, 자연어 생성은 Claude Code에 위임합니다.**

### 핵심 원칙

#### 1. Zero Configuration
- **API 키 불필요**: 사용자는 환경 변수 설정 없이 즉시 사용 가능
- **즉시 사용 가능**: 설치 후 바로 작동

#### 2. Separation of Concerns
```
┌─────────────────────┬───────────────────────────────────┐
│ MCP Server          │ 역할: 결정적 데이터 제공           │
│                     │ - 문제 메타데이터 조회             │
│                     │ - 구조화된 힌트 포인트 생성         │
│                     │ - JSON 출력                       │
└─────────────────────┴───────────────────────────────────┘

┌─────────────────────┬───────────────────────────────────┐
│ Claude Code         │ 역할: 자연어 생성                  │
│                     │ - JSON 데이터 파싱                 │
│                     │ - 사용자 친화적 메시지 생성         │
│                     │ - 대화형 인터랙션                  │
└─────────────────────┴───────────────────────────────────┘
```

#### 3. Deterministic Output
- **예측 가능한 출력**: 같은 입력에 항상 같은 JSON 반환
- **테스트 안정성**: LLM Mock 불필요, Snapshot 테스트 가능
- **빠른 응답**: LLM 호출 없이 < 500ms 응답

### Before/After 비교

| 측면 | Before (LLM 기반) | After (Keyless) |
|------|-------------------|-----------------|
| **API 키** | ANTHROPIC_API_KEY 필수 | 불필요 ✅ |
| **응답 시간** | 2-5초 (LLM 호출) | < 500ms ✅ |
| **테스트** | LLM Mock 필요 | 결정적 출력, Snapshot 테스트 ✅ |
| **비용** | Claude API 호출마다 과금 | 무료 ✅ |
| **안정성** | LLM 출력 변동 가능 | 일관된 JSON ✅ |
| **사용자 경험** | 설정 복잡 | Zero Configuration ✅ |

---

## 아키텍처 다이어그램

### Keyless 아키텍처 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자                                │
│          (Claude Desktop, Claude Code, Codex...)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ 자연어 대화
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Claude Code (AI Client)                    │
│              (MCP Protocol Consumer)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  자연어 생성 레이어 (LLM이 담당)                      │  │
│  │  - JSON 데이터 파싱                                  │  │
│  │  - 사용자 친화적 메시지 생성                          │  │
│  │  - 힌트 포인트를 자연어로 변환                        │  │
│  │  - 대화형 복습 문서 작성                             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ MCP Protocol (JSON-RPC)
                         │ Request: { problem_id, hint_level }
                         │ Response: { JSON 데이터 }
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    MCP Server                                │
│               (BOJ 학습 도우미 - Keyless)                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                Tool Registry                          │  │
│  │  - search_problems                                   │  │
│  │  - get_problem                                       │  │
│  │  - search_tags                                       │  │
│  │  ✅ analyze_problem (구조화된 힌트 JSON)              │  │
│  │  ✅ generate_review_template (템플릿 + 프롬프트)      │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                              │
│  ┌────────────▼──────────┐  ┌─────────────────────────┐    │
│  │    Tool Handlers      │  │   Service Layer         │    │
│  │  - search-problems.ts │  │  ✅ problem-analyzer.ts │    │
│  │  - get-problem.ts     │  │  ✅ review-template-    │    │
│  │  - search-tags.ts     │  │     generator.ts        │    │
│  │  ✅ analyze-problem.ts│  │                         │    │
│  │  ✅ generate-review-  │  │  (힌트 패턴 정적 데이터)│    │
│  │     template.ts       │  │  (템플릿 생성 로직)     │    │
│  └────────────┬──────────┘  └──────────┬──────────────┘    │
│               │                        │                    │
│  ┌────────────▼────────────────────────▼──────────────┐    │
│  │              API Client Layer                      │    │
│  │          (solvedac-client.ts)                      │    │
│  │                                                     │    │
│  │  - HTTP Client (fetch)                             │    │
│  │  - Request/Response Handling                       │    │
│  │  - Error Handling & Retry Logic                    │    │
│  │  - Response Caching (optional)                     │    │
│  └────────────┬────────────────────────────────────────┘    │
│               │                                              │
│  ┌────────────▼──────────┐  ┌─────────────────────────┐    │
│  │    Utilities          │  │   Type Definitions      │    │
│  │  - tier-converter.ts  │  │  - api/types.ts         │    │
│  │  - cache.ts           │  │  - types/analysis.ts    │    │
│  │                       │  │  - types/problem.ts     │    │
│  └───────────────────────┘  └─────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTPS (Public API)
                      │
                ┌─────▼─────┐
                │ solved.ac │
                │   API     │
                └───────────┘

** ✅ = Phase 3 Keyless 아키텍처 구현 완료
** 🗑️ Claude API 제거됨 (Zero Configuration)
```

### 레이어 구조

```
┌────────────────────────────────────────────┐
│         Presentation Layer                 │
│      (MCP Protocol Interface)              │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│         Application Layer                  │
│    (Tool Handlers + Business Logic)        │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│         Service Layer                      │
│  (Hint Generation, Review Generation)      │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│         Integration Layer                  │
│      (External API Clients)                │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│         Infrastructure Layer               │
│   (HTTP, Caching, Error Handling)          │
└────────────────────────────────────────────┘
```

---

## 컴포넌트 상세 설명

### 1. MCP Server Core (`src/index.ts`)

**역할**: MCP 프로토콜 진입점, 도구 등록 및 라이프사이클 관리

**주요 기능**:
- MCP SDK를 사용한 서버 초기화
- 5개 도구 등록 및 메타데이터 정의
- 요청 라우팅 및 응답 반환
- 전역 에러 핸들링

**코드 구조 예시**:
```typescript
import { McpServer } from '@modelcontextprotocol/sdk';

const server = new McpServer({
  name: 'boj-study-assistant',
  version: '1.0.0'
});

// 도구 등록
server.tool(
  'search_problems',
  'Search BOJ problems with filters',
  SearchProblemsInputSchema,
  async (args) => {
    // 핸들러 로직
  }
);

// 서버 시작
server.run();
```

---

### 2. Tool Handlers (`src/tools/`)

각 도구는 독립적인 파일로 구현되며, MCP 도구 인터페이스를 준수합니다.

#### 구조
```
src/tools/
├── search-problems.ts    # 문제 검색 도구
├── get-problem.ts        # 문제 상세 조회 도구
├── search-tags.ts        # 태그 검색 도구
├── get-hint.ts           # 힌트 생성 도구
└── create-review.ts      # 복습 생성 도구
```

#### 공통 패턴
```typescript
// 1. Zod 스키마 정의
const InputSchema = z.object({
  problem_id: z.number().positive(),
  // ...
});

// 2. 타입 추론
type Input = z.infer<typeof InputSchema>;

// 3. 핸들러 함수
export async function handler(input: Input): Promise<Output> {
  // 1. 입력 검증 (Zod가 자동 수행)
  // 2. 비즈니스 로직 실행
  // 3. API 호출 또는 서비스 호출
  // 4. 응답 포맷팅
  // 5. 반환
}
```

---

### 3. API Client Layer (`src/api/`)

#### `solvedac-client.ts`
**역할**: solved.ac API와의 통신을 담당하는 HTTP 클라이언트

**주요 메서드**:
```typescript
class SolvedAcClient {
  private baseUrl = 'https://solved.ac/api/v3';

  // 문제 검색
  async searchProblems(params: SearchParams): Promise<SearchResult> {
    return this.request('/search/problem', params);
  }

  // 문제 상세 조회
  async getProblem(problemId: number): Promise<ProblemDetail> {
    return this.request('/problem/show', { problemId });
  }

  // 태그 검색
  async searchTags(query: string): Promise<TagResult> {
    return this.request('/search/tag', { query });
  }

  // 공통 요청 메서드
  private async request<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    // HTTP 요청 로직
    // - URL 구성
    // - Timeout 설정
    // - 에러 처리
    // - 재시도 로직
  }
}
```

**특징**:
- Singleton 패턴으로 인스턴스 공유
- 요청 타임아웃 설정 (10초)
- Exponential backoff 재시도 로직
- 응답 캐싱 지원 (선택사항)

#### `types.ts`
**역할**: solved.ac API 응답 타입 정의

```typescript
// API 응답 인터페이스
export interface SearchProblemResponse {
  count: number;
  items: Problem[];
}

export interface Problem {
  problemId: number;
  titleKo: string;
  level: number;
  tags: Tag[];
  acceptedUserCount: number;
  averageTries: number;
  // ...
}

export interface Tag {
  key: string;
  displayNames: DisplayName[];
  problemCount: number;
  // ...
}
```

---

### 4. Service Layer (`src/services/`)

#### `problem-analyzer.ts` (✅ Phase 3 완료 - Keyless)
**역할**: 문제 분석 및 구조화된 힌트 포인트 생성

**구현 상태**: 완료 (535 lines)

**아키텍처** (Keyless):
```typescript
export class ProblemAnalyzer {
  constructor(private apiClient: SolvedAcClient) {}

  /**
   * 문제 분석 및 힌트 포인트 생성
   */
  async analyze(
    problemId: number,
    includeSimilar = true
  ): Promise<ProblemAnalysis> {
    // 1. 문제 정보 조회
    const problem = await this.apiClient.getProblem(problemId);

    // 2. 난이도 컨텍스트 생성
    const difficulty = this.buildDifficultyContext(problem);

    // 3. 알고리즘 정보 생성
    const algorithm = this.buildAlgorithmInfo(problem);

    // 4. 힌트 포인트 생성 (레벨 1-3)
    const hintPoints = this.generateHintPoints(problem);

    // 5. 제약사항 추출
    const constraints = this.extractConstraints(problem);

    // 6. 주의사항 생성
    const gotchas = this.generateGotchas(problem);

    // 7. 유사 문제 추천
    const similarProblems = includeSimilar
      ? await this.findSimilarProblems(problem)
      : [];

    return {
      problem,
      difficulty,
      algorithm,
      hint_points: hintPoints,
      constraints,
      gotchas,
      similar_problems: similarProblems,
    };
  }

  /**
   * 힌트 포인트 생성 (정적 패턴 매핑)
   */
  private generateHintPoints(problem: Problem): HintPoint[] {
    const primaryTag = problem.tags[0]?.key || 'implementation';
    const pattern = HINT_PATTERNS[primaryTag] || HINT_PATTERNS['implementation'];

    return [
      // Level 1: 패턴 인식
      {
        level: 1,
        type: 'pattern',
        key: pattern.level1.key,
        detail: pattern.level1.detail,
      },
      // Level 2: 핵심 통찰
      {
        level: 2,
        type: 'insight',
        key: pattern.level2.key,
        detail: pattern.level2.detail,
        example: pattern.level2.example,
      },
      // Level 3: 전략 단계
      {
        level: 3,
        type: 'strategy',
        key: pattern.level3.key,
        steps: pattern.level3.steps,
      },
    ];
  }
}
```

**힌트 패턴 정적 매핑** (HINT_PATTERNS):
- **Level 1**: 알고리즘 카테고리 (key + detail)
  - 예: "동적 프로그래밍", "그리디 알고리즘", "그래프 탐색"
- **Level 2**: 핵심 통찰 (key + detail + example)
  - 예: "상태 정의와 점화식", "그리디 선택 전략"
- **Level 3**: 구현 단계 (key + steps[])
  - 예: ["1. 상태 정의", "2. 초기값 설정", "3. 점화식 구현", ...]

**지원 알고리즘**:
- `dp`, `greedy`, `graphs`, `math`, `implementation`, `string`, `data_structures` 등

**출력 형식** (JSON):
```json
{
  "problem": { /* 문제 메타데이터 */ },
  "difficulty": { "tier": "Silver II", "level": 9, ... },
  "algorithm": { "primary_tags": [...], "typical_approaches": [...] },
  "hint_points": [
    { "level": 1, "type": "pattern", "key": "동적 프로그래밍", ... },
    { "level": 2, "type": "insight", "key": "상태 정의와 점화식", ... },
    { "level": 3, "type": "strategy", "key": "Bottom-up 구현", ... }
  ],
  "constraints": [...],
  "gotchas": [...],
  "similar_problems": [...]
}
```

**장점**:
- ⚡ **빠른 응답**: < 500ms (LLM 호출 없음)
- ✅ **결정적 출력**: 같은 입력 → 같은 JSON
- 🧪 **테스트 안정성**: Snapshot 테스트 가능
- 💰 **비용 절감**: API 비용 0원
- 🔧 **유지보수 용이**: 힌트 패턴을 코드로 관리

#### `review-template-generator.ts` (✅ Phase 3 완료 - Keyless)
**역할**: 복습 템플릿 및 가이드 프롬프트 생성

**구현 상태**: 완료

**아키텍처**:
```typescript
class ReviewGenerator {
  private searchProblems?: (params: SearchParams) => Promise<{ items: Problem[] }>;

  constructor(searchProblems?: (...) => ...) {
    this.searchProblems = searchProblems;
  }

  // 복습 문서 생성
  async generate(
    problem: Problem,
    userInput: ReviewInput
  ): Promise<string> {
    // 1. 입력 검증
    this.validateInput(userInput);  // solution_approach 필수 확인

    // 2. 현재 날짜 가져오기
    const today = new Date().toISOString().split('T')[0];

    // 3. 관련 문제 추천
    const relatedProblems = await this.getRelatedProblems(problem);

    // 4. 마크다운 템플릿 구성
    let markdown = `# ${problem.problemId}. ${problem.titleKo}\n\n`;
    markdown += `## 문제 정보\n\n`;
    markdown += this.formatMetadata(problem);
    markdown += `\n## 풀이 접근법\n\n${userInput.solution_approach}\n\n`;
    // ... (시간/공간 복잡도, 인사이트, 어려웠던 점)
    markdown += `## 관련 문제\n\n${relatedProblems}\n\n`;
    markdown += `## 해결 날짜\n\n해결 날짜: ${today}\n`;

    return markdown;
  }

  // 관련 문제 찾기 (private)
  private async getRelatedProblems(problem: Problem): Promise<string> {
    if (problem.tags.length === 0) {
      return '관련 문제를 추천할 수 없습니다 (태그 정보 없음)';
    }

    if (!this.searchProblems) {
      return '관련 문제를 찾을 수 없습니다';
    }

    try {
      const firstTag = problem.tags[0].key;
      const levelMin = Math.max(1, problem.level - 2);
      const levelMax = Math.min(30, problem.level + 2);

      const result = await this.searchProblems({
        tag: firstTag,
        level_min: levelMin,
        level_max: levelMax
      });

      // 최대 5개, 현재 문제 제외
      const recommendations = result.items
        .slice(0, 5)
        .filter(p => p.problemId !== problem.problemId)
        .map(p => `- [${p.problemId}. ${p.titleKo}](https://www.acmicpc.net/problem/${p.problemId}) (${getTierBadge(p.level)})`)
        .join('\n');

      return recommendations || '관련 문제를 찾을 수 없습니다';
    } catch (error) {
      return '관련 문제를 찾을 수 없습니다';
    }
  }

  // 메타데이터 포맷팅
  private formatMetadata(problem: Problem): string {
    const tierBadge = getTierBadge(problem.level);
    const tags = problem.tags
      .map(tag => tag.displayNames.find(dn => dn.language === 'ko')?.name || tag.key)
      .join(', ');
    const acceptedCount = problem.acceptedUserCount.toLocaleString('ko-KR');
    const avgTries = problem.averageTries.toFixed(1);

    return `**티어**: ${tierBadge}\n` +
           `**태그**: ${tags}\n` +
           `**해결한 사람**: ${acceptedCount}명\n` +
           `**평균 시도**: ${avgTries}회\n` +
           `**문제 링크**: [BOJ ${problem.problemId}](https://www.acmicpc.net/problem/${problem.problemId})\n`;
  }
}
```

**입력 검증**:
- `solution_approach`: 필수, 최소 10자
- 기타 필드: 선택사항

**관련 문제 추천 로직**:
- 첫 번째 태그 기반 검색
- ±2 티어 범위
- 최대 5개 추천
- 현재 문제 제외

**에러 처리**:
- `ValidationError`: 입력 검증 실패 (solution_approach 누락 또는 짧음)

---

### 5. Utilities (`src/utils/`)

#### `tier-converter.ts`
**역할**: 레벨 숫자 ↔ 티어 이름 변환

```typescript
// 레벨 → 티어 변환
export function levelToTier(level: number): string {
  const tiers = [
    'Bronze V', 'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
    'Silver V', 'Silver IV', 'Silver III', 'Silver II', 'Silver I',
    'Gold V', 'Gold IV', 'Gold III', 'Gold II', 'Gold I',
    // ...
  ];
  return tiers[level - 1];
}

// 티어 → 레벨 범위 변환
export function tierToLevelRange(tier: string): [number, number] {
  const tierMap = {
    'Bronze': [1, 5],
    'Silver': [6, 10],
    'Gold': [11, 15],
    // ...
  };
  return tierMap[tier];
}

// 티어 뱃지 (이모지 포함)
export function getTierBadge(level: number): string {
  const emoji = getTierEmoji(level);
  const name = levelToTier(level);
  return `${emoji} ${name}`;
}
```

#### `cache.ts`
**역할**: 응답 캐싱 (선택사항)

```typescript
class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttl: number; // Time to live (ms)

  set(key: string, value: T): void {
    this.store.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    // TTL 확인
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  // LRU 방식 캐시 정리
  private evictOldest(): void {
    // 가장 오래된 항목 제거
  }
}
```

---

## 데이터 흐름

### 플로우 1: 문제 검색 (search_problems)

```
1. 사용자
   ↓ "Gold 티어 DP 문제 찾아줘"
2. Claude AI
   ↓ MCP 요청 생성
3. MCP Server (Tool Handler)
   ↓ { tag: "dp", level_min: 11, level_max: 15 }
4. API Client
   ↓ GET /search/problem?query=tier:g+dp
5. solved.ac API
   ↓ JSON 응답
6. API Client
   ↓ 응답 파싱 및 타입 변환
7. Tool Handler
   ↓ 티어 변환, 포맷팅
8. MCP Server
   ↓ MCP 응답 생성
9. Claude AI
   ↓ 자연어로 변환
10. 사용자
   ← "20개의 Gold DP 문제를 찾았습니다..."
```

### 플로우 2: 문제 분석 (analyze_problem) - ✅ Phase 3 Keyless 완료

```
1. 사용자
   ↓ "11053번 문제 분석해줘"
2. Claude Code
   ↓ MCP 요청 생성
3. MCP Server (analyze_problem handler)
   ↓ { problem_id: 11053, include_similar: true }
   ↓ Zod 스키마 검증
4. Tool Handler (analyze-problem.ts)
   ↓ AnalyzeProblemInputSchema.parse(input)
5. Problem Analyzer Service (problem-analyzer.ts)
   ↓ analyzer.analyze(11053, true)
6. API Client (solvedac-client)
   ↓ GET /problem/show?problemId=11053
7. solved.ac API
   ↓ 문제 메타데이터 반환 (JSON)
8. Problem Analyzer
   ↓ buildDifficultyContext(problem)
   ↓ buildAlgorithmInfo(problem)
   ↓ generateHintPoints(problem) ← 정적 패턴 매핑
   ↓   - HINT_PATTERNS['dp'] 조회
   ↓   - Level 1: "동적 프로그래밍" (패턴 인식)
   ↓   - Level 2: "상태 정의와 점화식" (핵심 통찰)
   ↓   - Level 3: "Bottom-up 구현" (전략 단계)
   ↓ extractConstraints(problem)
   ↓ generateGotchas(problem)
   ↓ findSimilarProblems(problem) ← solved.ac API 재호출
9. Problem Analyzer
   ↓ 구조화된 JSON 데이터 생성
   ↓ {
   ↓   problem: { problemId, titleKo, ... },
   ↓   difficulty: { tier, level, emoji, ... },
   ↓   algorithm: { primary_tags, typical_approaches, ... },
   ↓   hint_points: [
   ↓     { level: 1, type: "pattern", key: "동적 프로그래밍", ... },
   ↓     { level: 2, type: "insight", key: "상태 정의", ... },
   ↓     { level: 3, type: "strategy", steps: [...] }
   ↓   ],
   ↓   constraints: [...],
   ↓   gotchas: [...],
   ↓   similar_problems: [...]
   ↓ }
10. Tool Handler
   ↓ JSON.stringify(analysis, null, 2)
   ↓ MCP TextContent 응답: { type: 'text', text: JSON }
11. MCP Server
   ↓ MCP 프로토콜 응답 (< 500ms)
12. Claude Code (LLM)
   ↓ JSON 파싱
   ↓ 사용자 요청에 따라 자연어 변환
   ↓ 예: "레벨 2 힌트만 줘" → hint_points[1] 추출 후 자연어화
13. Claude Code
   ↓ 자연어로 변환된 메시지 생성
14. 사용자
   ← "이 문제는 동적 프로그래밍 문제입니다.
      dp[i]의 의미를 명확히 정의하고, 이전 상태에서
      현재 상태로 전이하는 점화식을 세워야 합니다.
      예시: dp[i] = max(dp[j]) + 1 (j < i, arr[j] < arr[i])"
```

**주요 컴포넌트**:
- `analyze-problem.ts` (69 lines): MCP 도구 핸들러
- `problem-analyzer.ts` (535 lines): 문제 분석 서비스
- 정적 데이터: `HINT_PATTERNS` (알고리즘별 힌트 패턴)

**핵심 차이점**:
- ❌ Claude API 호출 없음 → ⚡ 응답 시간 < 500ms
- ✅ 결정적 JSON 출력 → 🧪 테스트 안정성
- ✅ Zero Configuration → 🔧 API 키 불필요

### 플로우 3: 복습 템플릿 생성 (generate_review_template) - ✅ Phase 3 Keyless 완료

```
1. 사용자
   ↓ "1927번 문제 복습 문서 만들어줘"
2. Claude Code
   ↓ MCP 요청 생성
3. MCP Server (generate_review_template handler)
   ↓ { problem_id: 1927, user_notes: (optional) }
   ↓ Zod 스키마 검증
4. Tool Handler (generate-review-template.ts)
   ↓ GenerateReviewTemplateInputSchema.parse(input)
5. Review Template Generator Service (review-template-generator.ts)
   ↓ generator.generate(1927, user_notes)
6. API Client (solvedac-client)
   ↓ GET /problem/show?problemId=1927
7. solved.ac API
   ↓ 문제 메타데이터 반환
8. Review Template Generator
   ↓ buildProblemSummary(problem)
   ↓   - 문제 정보 (번호, 제목, 티어, 태그)
   ↓   - BOJ 링크, 통계
   ↓ generateMarkdownTemplate()
   ↓   - 마크다운 템플릿 구성
   ↓   - 빈 섹션 생성 (풀이, 복잡도, 인사이트 등)
   ↓ findRelatedProblems(problem) ← solved.ac API 재호출
   ↓   - 첫 번째 태그 기반
   ↓   - ±2 티어 범위
   ↓   - 최대 5개 추천
9. Review Template Generator
   ↓ createGuidePrompt()
   ↓   - 복습 작성 가이드 프롬프트 생성
   ↓   - Claude Code가 사용할 대화 프롬프트
   ↓ 구조화된 JSON 데이터 생성:
   ↓ {
   ↓   template: "# [1927] 최소 힙\n\n## 문제 정보\n...",
   ↓   problem_summary: { problemId, titleKo, tier, tags, ... },
   ↓   related_problems: [...],
   ↓   guide_prompt: "이 템플릿을 사용하여 복습 문서를 작성합니다..."
   ↓ }
10. Tool Handler
   ↓ JSON.stringify(template, null, 2)
   ↓ MCP TextContent 응답: { type: 'text', text: JSON }
11. MCP Server
   ↓ MCP 프로토콜 응답 (< 500ms)
12. Claude Code (LLM)
   ↓ JSON 파싱
   ↓ guide_prompt를 활용하여 대화형으로 복습 문서 작성
   ↓   - 사용자에게 풀이 접근법 질문
   ↓   - 시간/공간 복잡도 질문
   ↓   - 핵심 인사이트 질문
   ↓   - template에 사용자 답변 채워넣기
13. Claude Code
   ↓ 완성된 마크다운 문서 생성
14. 사용자
   ← 완성된 복습 문서 (마크다운)
   ← "# [1927] 최소 힙
      ## 문제 정보
      ...
      ## 풀이 접근법
      (사용자 입력)
      ## 관련 문제
      - [11279] 최대 힙
      - [11286] 절댓값 힙
      ..."
```

**주요 컴포넌트**:
- `generate-review-template.ts` (69 lines): MCP 도구 핸들러
- `review-template-generator.ts`: 템플릿 생성 서비스
- 템플릿 + 가이드 프롬프트 제공

**핵심 차이점**:
- ❌ 완성된 문서 생성 대신 → ✅ 템플릿 + 가이드 프롬프트 제공
- ✅ Claude Code가 대화형으로 복습 작성
- ✅ Zero Configuration (API 키 불필요)

---

## 기술 스택

### 런타임 환경
- **Node.js**: v18+ (ES2022 모듈 지원)
- **TypeScript**: v5.9.3 (strict mode)

### 핵심 라이브러리

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| `@modelcontextprotocol/sdk` | 1.26.0 | MCP 프로토콜 구현 |
| `zod` | 4.3.6 | 스키마 검증 |
| `node-fetch` | 3.x | HTTP 클라이언트 |
| `vitest` | 4.0.18 | 테스트 프레임워크 |
| `tsx` | 4.21.0 | TypeScript 실행 |

### 외부 API

| API | Base URL | 인증 | 용도 |
|-----|----------|------|------|
| solved.ac | `https://solved.ac/api/v3` | 불필요 | 문제 메타데이터 조회 |
| ~~Claude API~~ | ~~제거됨~~ | ~~API 키~~ | ~~Keyless 아키텍처로 제거~~ |

### 개발 도구
- **빌드**: TypeScript Compiler (tsc)
- **테스트**: vitest (watch mode 지원)
- **린트**: ESLint (선택사항)
- **포맷터**: Prettier (선택사항)

---

## 설계 결정사항

### 1. Stateless 아키텍처

**결정**: 서버는 상태를 유지하지 않음

**이유**:
- MCP 프로토콜이 기본적으로 stateless 요청-응답 모델
- 수평 확장 용이 (여러 인스턴스 실행 가능)
- 에러 복구 간단 (서버 재시작 시 영향 없음)

**트레이드오프**:
- 각 요청마다 API 호출 필요 → 캐싱으로 완화
- 사용자 세션 정보 없음 → 향후 필요 시 외부 스토리지 활용

### 2. 레이어 분리

**결정**: Tool Handlers, Services, API Client를 명확히 분리

**이유**:
- **관심사 분리**: 각 레이어는 단일 책임
- **테스트 용이성**: 각 레이어를 독립적으로 테스트
- **재사용성**: API Client는 여러 도구에서 공유
- **유지보수성**: 한 레이어 변경이 다른 레이어에 영향 최소화

**예시**:
```
Tool Handler (search_problems)
  → API Client (searchProblems)
    → solved.ac API

Tool Handler (get_hint)
  → API Client (getProblem) + Hint Generator Service
    → solved.ac API + Claude API
```

### 3. Zod를 통한 런타임 검증

**결정**: 모든 입력/출력에 Zod 스키마 사용

**이유**:
- **타입 안전성**: TypeScript 타입과 런타임 검증을 동시에 제공
- **명확한 API 계약**: 스키마가 곧 문서
- **자동 에러 메시지**: 유효성 검증 실패 시 명확한 에러

**예시**:
```typescript
const InputSchema = z.object({
  problem_id: z.number().positive(),
  hint_level: z.number().min(1).max(3)
});

// 자동 타입 추론
type Input = z.infer<typeof InputSchema>;

// 런타임 검증
const result = InputSchema.parse(userInput);  // 실패 시 ZodError 발생
```

### 4. 캐싱 전략

**결정**: 문제 메타데이터만 캐싱 (TTL: 1시간)

**이유**:
- **문제 메타데이터**: 거의 변경되지 않음 → 캐싱 효과 큼
- **검색 결과**: 자주 변경됨 → 캐싱하지 않음
- **힌트/복습**: 매번 새로 생성 → 캐싱 불필요

**구현**:
```typescript
// getProblem은 캐싱
const problem = await cachedClient.getProblem(1927);  // 캐시 활용

// searchProblems는 캐싱 안 함
const results = await client.searchProblems({ ... });  // 항상 최신 결과
```

### 5. 에러 처리 전략

**결정**: 계층별 에러 처리 + 사용자 친화적 메시지

**계층별 책임**:
- **API Client**: HTTP 에러, 타임아웃, 재시도
- **Tool Handler**: 비즈니스 로직 에러, 입력 검증
- **MCP Server**: 전역 에러, MCP 프로토콜 에러

**사용자 메시지**:
```typescript
// ❌ 기술적 에러 메시지
throw new Error('HTTP 404: Not Found');

// ✅ 사용자 친화적 메시지
throw new Error('해당 문제를 찾을 수 없습니다. 문제 번호를 확인해주세요.');
```

### 6. Keyless 아키텍처 도입 (Phase 3)

**결정**: MCP 서버는 결정적 데이터만 제공, 자연어 생성은 Claude Code 위임

**이유**:
- **사용자 경험**: API 키 설정 없이 즉시 사용 가능
- **테스트 안정성**: LLM Mock 불필요, Snapshot 테스트 가능
- **응답 속도**: < 500ms (LLM 호출 없음)
- **비용 절감**: Claude API 비용 0원
- **유지보수**: 힌트 패턴을 코드로 관리, 수정 용이

**Before (LLM 기반)**:
```
User → Claude Code → MCP Server → Claude API → LLM 힌트 → User
                                    (2-5초, API 비용)
```

**After (Keyless)**:
```
User → Claude Code → MCP Server → JSON 데이터 → Claude Code → User
                    (< 500ms, 무료)
```

**트레이드오프**:
- ❌ LLM의 맥락적 유연성 감소 → ✅ 힌트 패턴 일관성 향상
- ❌ 자연스러운 변형 감소 → ✅ 예측 가능한 출력
- ❌ 실시간 적응성 감소 → ✅ 테스트 및 디버깅 용이

### 7. 정적 힌트 패턴 매핑

**결정**: 알고리즘별 힌트 패턴을 `HINT_PATTERNS` 객체로 정의

**구조**:
```typescript
const HINT_PATTERNS: Record<string, HintPattern> = {
  dp: {
    level1: { key: '동적 프로그래밍', detail: '...' },
    level2: { key: '상태 정의와 점화식', detail: '...', example: '...' },
    level3: { key: 'Bottom-up 구현', steps: [...] },
  },
  greedy: { ... },
  graphs: { ... },
  // 8개 알고리즘 패턴 정의
};
```

**이유**:
- **일관성**: 같은 알고리즘에 대해 항상 같은 구조의 힌트
- **확장성**: 새 알고리즘 패턴 추가 용이
- **테스트 가능**: Snapshot 테스트로 힌트 품질 검증

### 8. 복습 템플릿 + 가이드 프롬프트

**결정**: 완성된 문서 대신 템플릿 + 가이드 프롬프트 제공

**이유**:
- **대화형 작성**: Claude Code가 사용자와 대화하며 복습 작성
- **유연성**: 사용자 입력에 따라 동적으로 섹션 채워넣기
- **Zero Configuration**: API 키 불필요

**출력 구조**:
```json
{
  "template": "# [1927] 최소 힙\n\n## 풀이 접근법\n...",
  "guide_prompt": "사용자에게 풀이 접근법을 질문하세요...",
  "related_problems": [...]
}
```

---

## 확장성 및 성능

### 성능 목표

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 문제 검색 응답 시간 | < 1.5초 | p95 latency |
| 문제 상세 조회 | < 0.5초 | 캐시 히트 시 |
| 힌트 생성 | < 5초 | LLM API 호출 포함 |
| 캐시 히트율 | > 70% | 로그 분석 |

### 최적화 전략

#### 1. 캐싱
```typescript
// 인메모리 LRU 캐시
class LRUCache<T> {
  private maxSize = 100;  // 최대 100개 문제 캐싱
  private ttl = 3600000;  // 1시간

  // 자주 조회되는 문제 우선 캐싱
  // 메모리 사용량 제한
}
```

#### 2. 병렬 처리
```typescript
// 여러 문제 상세 정보를 병렬로 조회
const problems = await Promise.all(
  problemIds.map(id => client.getProblem(id))
);
```

#### 3. 요청 Throttling
```typescript
// API 호출 간 최소 간격 유지
class ThrottledClient {
  private minInterval = 100;  // 100ms
  private lastRequestTime = 0;

  async request<T>(endpoint: string): Promise<T> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (elapsed < this.minInterval) {
      await sleep(this.minInterval - elapsed);
    }

    this.lastRequestTime = Date.now();
    return this.doRequest(endpoint);
  }
}
```

#### 4. 응답 압축
```typescript
// 큰 응답은 압축하여 전송
const response = {
  problems: largeArray,
  _compressed: true  // 클라이언트에 압축 힌트
};
```

### 확장성 고려사항

#### 수평 확장
- Stateless 설계로 인해 여러 인스턴스 실행 가능
- 로드 밸런서를 통한 요청 분산
- 공유 캐시 (Redis) 도입 시 더 효율적

#### 외부 의존성 관리
- solved.ac API 다운타임 대응:
  - 캐시된 데이터 제공
  - Graceful degradation (기능 축소 운영)
- Claude API 장애 대응:
  - 힌트 생성 실패 시 기본 템플릿 제공

#### 모니터링
```typescript
// 주요 지표 로깅
logger.info({
  event: 'api_request',
  endpoint: '/search/problem',
  duration: 234,  // ms
  cacheHit: true,
  statusCode: 200
});
```

---

## 배포 아키텍처

### 로컬 배포 (현재)

```
┌─────────────────────────────┐
│    사용자 PC                 │
│                              │
│  ┌──────────────────────┐   │
│  │  Claude Desktop       │   │
│  │  (MCP Client)         │   │
│  └──────────┬───────────┘   │
│             │ stdio          │
│  ┌──────────▼───────────┐   │
│  │  BOJ 학습 도우미      │   │
│  │  (MCP Server)         │   │
│  └──────────┬───────────┘   │
│             │ HTTPS          │
└─────────────┼───────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼──────┐  ┌─────────▼────┐
│ solved.ac│  │  Claude API  │
│   API    │  │              │
└──────────┘  └──────────────┘
```

### 향후 클라우드 배포 (선택사항)

```
┌─────────────────────────────┐
│    사용자 PC                 │
│  ┌──────────────────────┐   │
│  │  Claude Desktop       │   │
│  └──────────┬───────────┘   │
└─────────────┼───────────────┘
              │ WebSocket
              │
┌─────────────▼───────────────┐
│   Cloud (AWS/GCP)            │
│                              │
│  ┌──────────────────────┐   │
│  │  Load Balancer        │   │
│  └──────────┬───────────┘   │
│             │                │
│  ┌──────────▼───────────┐   │
│  │  MCP Server           │   │
│  │  (Multiple Instances) │   │
│  └──────────┬───────────┘   │
│             │                │
│  ┌──────────▼───────────┐   │
│  │  Redis (캐시)         │   │
│  └──────────────────────┘   │
└──────────────┬───────────────┘
               │
     ┌─────────┴─────────┐
     │                   │
┌────▼──────┐  ┌─────────▼────┐
│ solved.ac │  │  Claude API  │
└───────────┘  └──────────────┘
```

---

## 보안 고려사항

### API 키 관리
```typescript
// 환경 변수로 관리
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// ❌ 절대 하드코딩 금지
const API_KEY = 'sk-ant-...';  // 위험!
```

### 입력 검증
```typescript
// Zod를 통한 철저한 검증
const InputSchema = z.object({
  problem_id: z.number()
    .positive()
    .max(100000),  // 합리적인 범위 제한
});
```

### 에러 메시지
```typescript
// ✅ 사용자 친화적, 정보 노출 최소화
throw new Error('문제를 찾을 수 없습니다.');

// ❌ 시스템 정보 노출
throw new Error(`Database query failed: ${dbError.stack}`);
```

---

## 향후 개선 방향

### Phase 5: 개인화
- 사용자별 해결 기록 추적
- 약점 알고리즘 분석
- 맞춤형 문제 추천

### Phase 6: 고급 분석
- 제출 코드 분석
- 시간/공간 복잡도 자동 분석
- 최적화 제안

### Phase 7: 협업 기능
- 스터디 그룹 지원
- 풀이 공유 및 토론

---

**문서 작성자**: Project Planner
**최종 검토일**: 2026-02-13
