# 시스템 아키텍처

**BOJ 학습 도우미 MCP Server**
**버전**: 3.0 (Prompt-based Architecture)
**마지막 업데이트**: 2026-02-21

---

## 목차

1. [시스템 개요](#시스템-개요)
2. [아키텍처 진화](#아키텍처-진화)
3. [핵심 설계 원칙](#핵심-설계-원칙)
4. [시스템 구조](#시스템-구조)
5. [컴포넌트 상세](#컴포넌트-상세)
6. [데이터 흐름](#데이터-흐름)
7. [기술 스택](#기술-스택)
8. [설계 결정사항](#설계-결정사항)

---

## 시스템 개요

### 목적
BOJ 학습 도우미는 **MCP(Model Context Protocol)** 기반 서버로, Claude Code와 같은 AI 어시스턴트가 백준 온라인 저지 문제를 검색하고 학습을 지원할 수 있도록 도구를 제공합니다.

### 핵심 특징
- **프롬프트 기반 아키텍처**: 가이드 프롬프트 제공, LLM이 맞춤 힌트 생성
- **Zero Configuration**: API 키 불필요, 즉시 사용 가능
- **결정적 데이터**: 테스트 가능한 JSON 출력
- **빠른 응답**: < 500ms (프롬프트 생성만 수행)
- **MCP 프로토콜 표준 준수**: Inspector 호환

---

## 아키텍처 진화

### Phase 1-2: LLM 기반 아키텍처 (제거됨)
```
User → Claude Code → MCP Server → Claude API → LLM 생성 힌트 → User
                                  (2-5초, API 비용)
```

**문제점**:
- ❌ ANTHROPIC_API_KEY 필수
- ❌ 2-5초 응답 시간
- ❌ 테스트 불안정 (LLM Mock 필요)
- ❌ API 비용 발생

### Phase 3: Keyless 아키텍처
```
User → Claude Code → MCP Server → JSON (하드코딩 힌트) → Claude Code → User
                    (< 500ms, 무료)
```

**개선점**:
- ✅ Zero Configuration
- ✅ 빠른 응답 (< 500ms)
- ✅ 테스트 안정성 (Snapshot)
- ✅ 비용 절감 (100%)

**남은 문제**:
- ❌ 모든 DP 문제에 동일 힌트 (문제 특화 불가)
- ❌ 1,453줄 하드코딩 데이터
- ❌ 새 알고리즘 추가 시 6곳 수정 필요

### Phase 5: 프롬프트 기반 아키텍처 (현재)
```
User → Claude Code → MCP Server (JSON + Prompts) → Claude Code (LLM) → User
                    (< 500ms, 프롬프트만)          (맞춤 힌트 생성)
```

**최종 개선**:
- ✅ 문제별 맞춤 힌트 (문제 컨텍스트 반영)
- ✅ 코드 69% 감소 (1,834줄 → 570줄)
- ✅ 확장성 대폭 향상 (1곳만 수정)
- ✅ 여전히 Zero Configuration
- ✅ 여전히 결정적 출력 (프롬프트 구조 검증)

---

## 핵심 설계 원칙

### 1. Zero Configuration
```bash
# 사용자가 하는 일
npm install
npm run build
# 끝! API 키 설정 불필요
```

### 2. Separation of Concerns
```
┌─────────────────────┬───────────────────────────────────┐
│ MCP Server          │ 역할: 데이터 + 프롬프트 제공       │
│                     │ - 문제 메타데이터 조회             │
│                     │ - 가이드 프롬프트 생성             │
│                     │ - JSON 출력                       │
└─────────────────────┴───────────────────────────────────┘

┌─────────────────────┬───────────────────────────────────┐
│ Claude Code         │ 역할: 맞춤 힌트 생성               │
│                     │ - 프롬프트 실행                    │
│                     │ - 문제 특화 힌트 생성              │
│                     │ - 대화형 인터랙션                  │
└─────────────────────┴───────────────────────────────────┘
```

### 3. Deterministic Output (MCP Server)
```typescript
// MCP 서버 출력은 결정적 (테스트 가능)
const analysis1 = await analyzer.analyze(11053);
const analysis2 = await analyzer.analyze(11053);
// analysis1.hint_levels[0].prompt === analysis2.hint_levels[0].prompt
```

### 4. Fast Response
```
프롬프트 생성: < 500ms
힌트 생성 (LLM): Claude Code가 수행 (사용자 요청 시)
```

### 5. Cost Effective
- MCP 서버 API 비용: 0원
- Claude Code LLM 비용: Claude Desktop 무료 또는 API 사용자 부담

---

## 시스템 구조

### 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자                                │
└────────────────────────┬────────────────────────────────────┘
                         │ 자연어 대화
┌────────────────────────▼────────────────────────────────────┐
│                   Claude Code (AI Client)                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  프롬프트 기반 힌트 생성 (LLM)                        │  │
│  │  - MCP 서버로부터 프롬프트 + 메타데이터 수신          │  │
│  │  - 문제별 맞춤 힌트 생성                             │  │
│  │  - 대화형 복습 문서 작성                             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ MCP Protocol (JSON-RPC)
┌────────────────────────▼────────────────────────────────────┐
│                    MCP Server                                │
│               (BOJ 학습 도우미 - Prompt-based)               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                Tool Registry                          │  │
│  │  - search_problems                                   │  │
│  │  - get_problem                                       │  │
│  │  - search_tags                                       │  │
│  │  ✅ analyze_problem (메타 + 프롬프트)                 │  │
│  │  ✅ generate_review_template (템플릿 + 프롬프트)      │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                              │
│  ┌────────────▼──────────┐  ┌─────────────────────────┐    │
│  │    Tool Handlers      │  │   Service Layer         │    │
│  │  - search-problems.ts │  │  ✅ problem-analyzer.ts │    │
│  │  - get-problem.ts     │  │     (570 lines)         │    │
│  │  - search-tags.ts     │  │  ✅ review-template-    │    │
│  │  ✅ analyze-problem.ts│  │     generator.ts        │    │
│  │  ✅ generate-review-  │  │                         │    │
│  │     template.ts       │  │  (프롬프트 생성 로직)   │    │
│  └────────────┬──────────┘  └──────────┬──────────────┘    │
│               │                        │                    │
│  ┌────────────▼────────────────────────▼──────────────┐    │
│  │              API Client Layer                      │    │
│  │          (solvedac-client.ts)                      │    │
│  └────────────┬────────────────────────────────────────┘    │
└───────────────┼─────────────────────────────────────────────┘
                │ HTTPS (Public API)
          ┌─────▼─────┐
          │ solved.ac │
          │   API     │
          └───────────┘
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
│  (Prompt Generation, Template Generation)  │
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

## 컴포넌트 상세

### 1. MCP Server Core (`src/index.ts`)

**역할**: MCP 프로토콜 진입점, 도구 등록 및 라이프사이클 관리

**주요 기능**:
- MCP SDK를 사용한 서버 초기화
- 5개 도구 등록 (수동 JSON Schema)
- 요청 라우팅 및 응답 반환
- 전역 에러 핸들링

**JSON Schema 작성 방식** (2026-02-14 개선):
```typescript
// ✅ 수동 JSON Schema 작성 (MCP Inspector 호환)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: 'analyze_problem',
      description: 'BOJ 문제를 분석하고 3단계 힌트 가이드를 제공합니다',
      inputSchema: {
        type: 'object',
        properties: {
          problem_id: {
            type: 'number',
            description: 'BOJ 문제 번호 (예: 1000)'
          },
          include_similar: {
            type: 'boolean',
            description: '유사 문제 추천 포함 여부 (기본: true)'
          }
        },
        required: ['problem_id']
      }
    }]
  };
});
```

### 2. Service Layer (`src/services/`)

#### `problem-analyzer.ts` (Phase 5 완료)
**역할**: 문제 분석 및 가이드 프롬프트 생성

**구조 (570 lines)**:
```typescript
export class ProblemAnalyzer {
  async analyze(problemId: number): Promise<ProblemAnalysis> {
    // 1. 문제 정보 조회
    const problem = await this.apiClient.getProblem(problemId);

    // 2. 난이도 컨텍스트 생성
    const difficulty = this.buildDifficultyContext(problem);

    // 3. 태그 정보 생성
    const tagInfo = this.buildTagInfo(problem);

    // 4. 힌트 가이드 생성 (3단계)
    const hintLevels = buildHintGuides(problem);

    // 5. 유사 문제 추천
    const similarProblems = await this.findSimilarProblems(problem);

    return {
      problem,
      difficulty,
      tag_info: tagInfo,
      hint_levels: hintLevels,  // ← 가이드 프롬프트 배열
      similar_problems: similarProblems,
    };
  }
}
```

**힌트 가이드 구조** (`src/prompts/hint-guide.ts`):
```typescript
interface HintLevelGuide {
  level: 1 | 2 | 3;
  title: string;
  prompt: string;  // ← Claude Code가 실행할 프롬프트
}

// Level 1: 문제 분석
{
  level: 1,
  title: '문제 분석',
  prompt: `
    이 문제는 ${tag} 알고리즘 문제입니다.

    문제의 핵심 특징:
    - 난이도: ${tier}
    - 태그: ${tags.join(', ')}

    이 유형의 문제에서 가장 먼저 생각해야 할 것은...
  `
}
```

#### `review-template-generator.ts`
**역할**: 복습 템플릿 및 가이드 프롬프트 생성

**출력 구조**:
```typescript
interface ReviewTemplateOutput {
  template: string;           // 마크다운 템플릿
  problem_summary: object;    // 문제 요약
  related_problems: string[]; // 관련 문제
  guide_prompt: string;       // Claude Code 가이드 프롬프트
}
```

### 3. API Client Layer (`src/api/solvedac-client.ts`)

**역할**: solved.ac API 통신

**주요 메서드**:
```typescript
class SolvedAcClient {
  async searchProblems(params): Promise<SearchResult>
  async getProblem(problemId): Promise<ProblemDetail>
  async searchTags(query): Promise<TagResult>
}
```

---

## 데이터 흐름

### 플로우 1: 문제 분석 (analyze_problem) - Phase 5

```
1. 사용자
   ↓ "11053번 문제 분석해줘"
2. Claude Code
   ↓ MCP 요청
3. MCP Server (analyze_problem handler)
   ↓ { problem_id: 11053, include_similar: true }
4. Problem Analyzer
   ↓ solved.ac API 호출
   ↓ buildTagInfo(problem)
   ↓ buildHintGuides(problem) ← 가이드 프롬프트 생성
5. MCP Server
   ↓ JSON 응답 (< 500ms)
   {
     problem: { ... },
     difficulty: { tier: "Silver II", ... },
     tag_info: { primary: "DP", description: "..." },
     hint_levels: [
       { level: 1, title: "문제 분석", prompt: "..." },
       { level: 2, title: "핵심 아이디어", prompt: "..." },
       { level: 3, title: "상세 풀이", prompt: "..." }
     ],
     similar_problems: [...]
   }
6. Claude Code
   ↓ 사용자 코드 분석 (있다면)
   ↓ 적절한 레벨 자동 선택 (예: Level 1)
   ↓ hint_levels[0].prompt 실행
7. Claude Code (LLM)
   ↓ 문제별 맞춤 힌트 생성
8. 사용자
   ← "이 문제는 동적 프로그래밍 문제입니다.
      dp[i]는 i번째 원소를 마지막으로 하는 가장 긴 증가하는 부분 수열의 길이입니다.
      이전 상태에서 현재 상태로 전이하는 점화식:
      dp[i] = max(dp[j]) + 1 (j < i, arr[j] < arr[i])"
```

### 플로우 2: 복습 템플릿 생성 (generate_review_template)

```
1. 사용자
   ↓ "1927번 복습 문서 만들어줘"
2. Claude Code
   ↓ MCP 요청
3. MCP Server (generate_review_template handler)
4. Review Template Generator
   ↓ solved.ac API 호출
   ↓ buildMarkdownTemplate()
   ↓ createGuidePrompt()
5. MCP Server
   ↓ JSON 응답 (< 500ms)
   {
     template: "# [1927] 최소 힙\n\n## 문제 정보\n...",
     guide_prompt: "사용자에게 풀이 접근법을 질문하고...",
     related_problems: [...]
   }
6. Claude Code
   ↓ guide_prompt 실행
   ↓ 사용자와 대화하며 템플릿 채워넣기
7. 사용자
   ← 완성된 복습 문서 (마크다운)
```

---

## 기술 스택

### 런타임 환경
- **Node.js**: v18+ (ES2022)
- **TypeScript**: v5.9.3 (strict mode)

### 핵심 라이브러리

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| `@modelcontextprotocol/sdk` | 1.26.0 | MCP 프로토콜 |
| `zod` | 4.3.6 | 런타임 검증 |
| `vitest` | 4.0.18 | 테스트 |
| `cheerio` | 1.0.0 | HTML 파싱 (Phase 6) |

### 외부 API

| API | Base URL | 인증 | 용도 |
|-----|----------|------|------|
| solved.ac | `https://solved.ac/api/v3` | 불필요 | 문제 메타데이터 |

---

## 설계 결정사항

### 1. 프롬프트 기반 아키텍처 도입 (Phase 5)

**결정**: 하드코딩 힌트 → 가이드 프롬프트 + LLM 생성

**이유**:
- **문제 특화**: 모든 DP 문제 동일 힌트 → 문제별 맞춤 힌트
- **코드 규모**: 1,834줄 → 570줄 (69% 감소)
- **확장성**: 새 알고리즘 추가 시 6곳 수정 → 1곳 수정
- **사용자 경험**: 일반적 힌트 → 문제 컨텍스트 반영
- **유지보수**: 하드코딩 데이터 → 프롬프트 템플릿

**Before (Phase 3 Keyless)**:
```typescript
// 모든 DP 문제에 동일 힌트
HINT_PATTERNS['dp'] = {
  level1: { key: '동적 프로그래밍', detail: '...' },
  level2: { key: '상태 정의', detail: '...' },
  level3: { key: 'Bottom-up', steps: [...] }
};
```

**After (Phase 5 Prompt-based)**:
```typescript
// 프롬프트 템플릿 (문제별 맞춤)
buildHintGuides(problem) {
  return [{
    level: 1,
    title: '문제 분석',
    prompt: `
      이 문제는 ${problem.tags[0].name} 문제입니다.
      난이도: ${problem.tier}
      제목: ${problem.titleKo}

      이 유형의 문제에서...
    `
  }];
}
```

### 2. 수동 JSON Schema 작성 (2026-02-14)

**결정**: `zodToJsonSchema` 제거 → 표준 JSON Schema 직접 작성

**이유**:
- **호환성**: Zod v4와 zod-to-json-schema 호환 안 됨
- **MCP Inspector**: 엄격한 JSON Schema 검증
- **Zod 변환 불가**: `.transform()`, `.preprocess()` 표현 불가

**Tradeoffs**:
- ❌ 중복 정의 (Zod + JSON Schema)
- ✅ MCP Inspector 호환
- ✅ 표준 준수

### 3. Keyless 아키텍처 유지

**결정**: Zero Configuration 원칙 유지

**이유**:
- **사용자 경험**: API 키 설정 불필요
- **테스트 안정성**: 프롬프트 구조 Snapshot 테스트
- **응답 속도**: < 500ms (프롬프트만 생성)
- **비용 절감**: MCP 서버 API 비용 0원

---

## Phase별 개선 비교

| 항목 | Phase 3 (Keyless) | Phase 5 (Prompt-based) |
|------|-------------------|------------------------|
| 힌트 데이터 | 하드코딩 힌트 포인트 | 가이드 프롬프트 |
| 문제 특화 | 모든 DP 문제 동일 | 문제별 맞춤 힌트 |
| 코드 규모 | 1,834줄 | 570줄 (-69%) |
| 확장성 | 낮음 (6곳 수정) | 높음 (1곳 수정) |
| 사용자 경험 | 일반적 힌트 | 문제 컨텍스트 반영 |
| API 키 | 불필요 ✅ | 불필요 ✅ |
| 응답 시간 | < 500ms ✅ | < 500ms ✅ |
| 테스트 | Snapshot ✅ | Snapshot ✅ |

---

## 웹 스크래핑 전략

### BOJ (백준 온라인 저지)

**특징**:
- 정적 HTML 페이지 (SSR)
- cheerio 기반 파싱
- robots.txt 허용 (`/problem/` 경로)

**Rate Limiting**:
- 요청 간격: 3초
- 재시도: 최대 2회
- 타임아웃: 10초

**캐싱**:
- TTL: 30일 (문제 본문 거의 변경 없음)
- LRU 캐시: 50개 항목

**User-Agent**:
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...
```
**근거**: BOJ는 브라우저 요청을 기대하며, Rate Limiting + 장기 캐싱으로 서버 부하 최소화

### Programmers (프로그래머스)

**아키텍처**:
- **검색**: 내부 JSON API (`GET /api/v2/school/challenges/`) 사용
- **문제 상세**: SSR → cheerio 사용 (빠르고 가벼움)

**검색 (내부 JSON API)**:
- 인증 불필요 (공개 API)
- 응답 시간: < 1초
- 캐싱: TTL 30분
- Puppeteer 의존성 없음

**문제 상세 (cheerio)**:
- 정적 HTML 파싱
- 응답 시간: 500ms-1초
- 캐싱: TTL 30일

**Rate Limiting**:
- 검색: 초당 1회 (보수적)
- 문제 상세: 초당 5회

**윤리적 스크래핑 원칙**:
1. robots.txt 준수
2. 적절한 요청 간격 (Rate Limiting)
3. 캐싱 최대 활용 (불필요한 요청 방지)
4. 비상업적 사용 (교육 목적)

**참고 문서**:
- [Web Scraping 가이드](web-scraping-guide.md) (삭제 예정 - 내용 통합 완료)
- [프로그래머스 아키텍처](programmers-puppeteer-implementation.md) (삭제 예정 - 핵심만 통합)

---

**문서 작성자**: technical-writer
**최종 검토일**: 2026-02-16
