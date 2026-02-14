# 개발 태스크 목록 및 상태 관리

**프로젝트**: BOJ 학습 도우미 MCP Server
**마지막 업데이트**: 2026-02-15 (Phase 4 Rate Limiting 구현 완료)
**현재 Phase**: Phase 4 진행 중 (Task 4.2 완료 ✅, Task 4.3-4.4 대기 중)
**다음 단계**: Phase 4 (완성도 & 최적화) - 로깅/모니터링, 캐싱 최적화

---

## 상태 범례

- ✅ **DONE**: 완료
- 🚧 **IN_PROGRESS**: 진행 중
- 📋 **TODO**: 예정
- ⏸️ **BLOCKED**: 블로킹됨 (의존성 대기)
- 🔄 **REVIEW**: 리뷰 중

---

## Phase 1: 기반 구축 (Foundation)
**목표**: 프로젝트 구조 설정 및 API 통합
**우선순위**: 🔴 높음
**예상 기간**: 1-2주

### Task 1.1: 프로젝트 구조 및 TypeScript 설정
**상태**: ✅ DONE
**담당**: Developer
**설명**: MCP SDK 기반 프로젝트 초기 설정

**완료 항목**:
- [x] npm 프로젝트 초기화
- [x] package.json 구성 (dependencies, scripts)
- [x] tsconfig.json 설정 (strict mode, ES2022)
- [x] 디렉토리 구조 생성 (src/, tests/, docs/)
- [x] 빌드 스크립트 설정

**인수 조건 (Acceptance Criteria)**:
- [x] `npm run build` 정상 작동
- [x] TypeScript 컴파일 에러 없음
- [x] 기본 디렉토리 구조 완성

---

### Task 1.2: solved.ac API 클라이언트 구현
**상태**: ✅ DONE
**담당**: fullstack-developer agent
**우선순위**: P0 (최우선)
**완료일**: 2026-02-13

**세부 태스크**:
- [x] HTTP 클라이언트 라이브러리 선택 (fetch 사용)
- [x] `src/api/solvedac-client.ts` 생성
- [x] API 응답 타입 정의 (`src/api/types.ts`)
- [x] 주요 엔드포인트 메서드 구현:
  - [x] `searchProblems(query, filters)` - 문제 검색
  - [x] `getProblem(problemId)` - 문제 상세 조회
  - [x] `searchTags(query)` - 태그 검색
- [x] 에러 처리 및 재시도 로직 구현 (MAX_RETRIES=3)
- [x] 요청 타임아웃 설정 (10초)
- [x] 기본 캐싱 메커니즘 구현 (TTL 1시간)

**API 엔드포인트**:
```typescript
// 구현할 메서드 인터페이스
interface SolvedAcClient {
  searchProblems(params: SearchParams): Promise<SearchResult>;
  getProblem(problemId: number): Promise<Problem>;
  searchTags(query: string): Promise<Tag[]>;
}
```

**인수 조건**:
- [x] 모든 API 메서드가 정상 작동
- [x] 네트워크 에러 시 적절한 예외 발생 (ProblemNotFoundError, NetworkError, TimeoutError, RateLimitError)
- [x] TypeScript 타입 검사 통과
- [x] 단위 테스트 작성

**참고 문서**:
- `docs/02-development/api-integration.md` 참조
- solved.ac API 공식 문서: https://solvedac.github.io/unofficial-documentation/

**구현 완료**: SolvedAcClient 클래스 구현 완료 (캐싱, 재시도, 타임아웃 포함)

---

### Task 1.3: 티어/레벨 유틸리티 구현
**상태**: ✅ DONE
**담당**: fullstack-developer agent
**우선순위**: P1
**완료일**: 2026-02-13

**세부 태스크**:
- [x] `src/utils/tier-converter.ts` 생성
- [x] 레벨 숫자 → 티어 이름 변환 함수
  ```typescript
  levelToTier(level: number): string  // 15 → "Gold I"
  ```
- [x] 티어 이름 → 레벨 범위 변환 함수
  ```typescript
  tierToLevelRange(tier: string): [number, number]  // "Gold" → [11, 15]
  ```
- [x] 티어 색상/이모지 헬퍼
  ```typescript
  getTierBadge(level: number): string  // 15 → "🟡 Gold I"
  ```
- [x] 유효성 검증 함수 (level 범위 1-30)

**인수 조건**:
- [x] 모든 티어 (Bronze ~ Ruby) 변환 가능
- [x] 유효하지 않은 입력 시 명확한 에러 발생
- [x] 단위 테스트 작성

**구현 완료**: TIER_NAMES 상수 정의 및 모든 변환 함수 구현

---

## Phase 2: 핵심 도구 (Core Tools)
**목표**: 문제 검색 및 조회 도구 구현
**우선순위**: 🔴 높음
**예상 기간**: 2-3주

### Task 2.1: `search_problems` 도구 구현
**상태**: ✅ DONE
**담당**: Developer
**우선순위**: P0
**완료일**: 2026-02-13

**세부 태스크**:
- [x] `src/tools/search-problems.ts` 생성
- [x] Zod 스키마 정의 (입력 파라미터)
- [x] MCP 도구 핸들러 구현
- [x] API 클라이언트 호출 및 응답 포맷팅
- [x] 페이지네이션 처리
- [x] 에러 처리 (유효하지 않은 필터, API 실패 등)
- [x] 응답 포맷 구현 (문제 ID, 제목, 티어, 태그, 통계 포함)

**인수 조건**:
- [x] 모든 필터 옵션 정상 작동
- [x] 빈 결과 시 적절한 메시지 반환
- [x] 페이지네이션 정확함
- [x] 통합 테스트 통과

**구현 완료**: `search_problems` 도구 완전 구현 및 MCP 서버 등록

---

### Task 2.2: `get_problem` 도구 구현
**상태**: ✅ DONE
**담당**: Developer
**우선순위**: P0
**완료일**: 2026-02-13

**세부 태스크**:
- [x] `src/tools/get-problem.ts` 생성
- [x] Zod 스키마 정의
- [x] API 클라이언트 호출 (getProblem)
- [x] BOJ 링크 생성 (`https://www.acmicpc.net/problem/{id}`)
- [x] 응답 포맷팅 (메타데이터, 티어 변환, 태그, 통계)
- [x] 캐싱 구현 (API 클라이언트 레벨)

**인수 조건**:
- [x] 유효한 문제 ID로 정확한 정보 반환
- [x] 존재하지 않는 문제 ID는 명확한 에러
- [x] 모든 필수 필드 포함
- [x] 단위 테스트 및 통합 테스트 통과

**구현 완료**: `get_problem` 도구 완전 구현 및 MCP 서버 등록

---

### Task 2.3: `search_tags` 도구 구현
**상태**: ✅ DONE
**담당**: Developer
**우선순위**: P1
**완료일**: 2026-02-13

**세부 태스크**:
- [x] `src/tools/search-tags.ts` 생성
- [x] Zod 스키마 정의
- [x] API 클라이언트 호출 (searchTags)
- [x] 응답 포맷팅 (태그 키, 표시명, 문제 개수)
- [x] 다국어 처리 (한글 우선)

**인수 조건**:
- [x] 키워드로 관련 태그 검색 가능
- [x] 빈 결과 시 적절한 메시지
- [x] 단위 테스트 통과

**구현 완료**: `search_tags` 도구 완전 구현 및 MCP 서버 등록

---

### Task 2.4: MCP 서버 통합
**상태**: ✅ DONE
**담당**: Developer
**우선순위**: P0
**완료일**: 2026-02-13

**세부 태스크**:
- [x] `src/index.ts`에 모든 도구 등록
- [x] 도구 메타데이터 작성 (설명, 스키마)
- [x] 로컬 테스트 설정 (Claude Desktop 연동)
- [x] 에러 로깅 추가
- [x] README 업데이트 (설치 및 사용법)

**인수 조건**:
- [x] Claude Desktop에서 5개 도구 모두 인식
- [x] 각 도구가 정상 작동
- [x] 에러 발생 시 명확한 메시지

**구현 완료**: 모든 MCP 도구가 서버에 등록되고 정상 작동

---

## Phase 3: 고급 기능 (Advanced Features) ✅ **완료**
**목표**: 힌트 생성 및 복습 시스템 (Keyless 아키텍처)
**우선순위**: 🟡 중간
**예상 기간**: 3-4주
**실제 소요**: 3주
**완료일**: 2026-02-13

**주요 변경사항**:
- ❌ Claude API 통합 제거 (`@anthropic-ai/sdk` 의존성 제거)
- ✅ Keyless 아키텍처 도입: MCP 서버는 결정적 데이터만 제공
- ✅ `analyze_problem`, `generate_review_template` 도구 구현
- ✅ `ProblemAnalyzer`, `ReviewTemplateGenerator` 서비스 구현
- ✅ 3단계 힌트 포인트 데이터 구조 설계
- ✅ 복습 템플릿 + 가이드 프롬프트 생성

---

### Task 3.1: ~~힌트 생성 서비스 구현~~ → ProblemAnalyzer 구현
**상태**: ✅ DONE
**담당**: fullstack-developer
**우선순위**: P1
**완료일**: 2026-02-13
**의존성**: Task 2.2 (문제 메타데이터 조회)

**구현 내역 (Keyless 아키텍처)**:
- [x] `src/services/problem-analyzer.ts` 생성 (590 lines)
- [x] 3단계 힌트 포인트 데이터 구조 설계
  - Level 1: 문제 패턴 인식 (pattern)
  - Level 2: 핵심 통찰 (insight)
  - Level 3: 상세 알고리즘 단계 (strategy)
- [x] 태그 기반 힌트 패턴 매핑 (정적 데이터)
- [x] 난이도 컨텍스트 생성 (티어, 백분위)
- [x] 알고리즘 정보 생성 (접근법, 복잡도 추정)
- [x] 제약사항 및 주의사항 분석
- [x] 유사 문제 추천 로직
- [x] ~~Claude API 통합~~ → 제거 (Keyless)

**프롬프트 예시**:
```typescript
// Level 1 프롬프트
`문제 정보:
- 제목: ${problem.title}
- 난이도: ${problem.tier}
- 태그: ${problem.tags.join(', ')}

사용자에게 이 문제가 어떤 유형의 알고리즘 문제인지 알려주세요.
구체적인 풀이는 제시하지 말고, 어떤 방향으로 접근해야 하는지만 안내하세요.`
```

**검증 결과**:
- [x] 3가지 레벨의 힌트 포인트가 명확히 구분됨
- [x] 태그 기반으로 30개 이상의 알고리즘 패턴 지원
- [x] 난이도에 따른 컨텍스트 조정
- [x] 결정적 출력 (동일 입력 → 동일 출력)
- [x] 테스트 통과 (단위 + 통합)

---

### Task 3.2: ~~`get_hint`~~ → `analyze_problem` 도구 구현
**상태**: ✅ DONE
**담당**: fullstack-developer
**우선순위**: P1
**완료일**: 2026-02-13
**의존성**: Task 3.1

**구현 내역**:
- [x] `src/tools/analyze-problem.ts` 생성 (69 lines)
- [x] Zod 스키마 정의
  ```typescript
  const AnalyzeProblemInputSchema = z.object({
    problem_id: z.number().int().positive(),
    include_similar: z.boolean().optional().default(true)
  });
  ```
- [x] ProblemAnalyzer 서비스 호출
- [x] JSON 응답 반환 (MCP TextContent)
- [x] 에러 처리 (Zod 검증, ProblemNotFoundError)

**검증 결과**:
- [x] 구조화된 JSON 데이터 반환 확인
- [x] include_similar 플래그 정상 동작
- [x] 에러 메시지 사용자 친화적

---

### Task 3.3: ~~`review-generator`~~ → `ReviewTemplateGenerator` 구현
**상태**: ✅ DONE
**담당**: fullstack-developer
**우선순위**: P1
**완료일**: 2026-02-13
**의존성**: Task 2.2, Task 3.1

**구현 내역**:
- [x] `src/services/review-template-generator.ts` 생성 (242 lines)
- [x] 마크다운 템플릿 설계 (8개 섹션)
- [x] 문제 메타데이터 자동 삽입
- [x] 태그 설명 및 일반적 접근법 제공
- [x] 관련 문제 추천 로직 (같은 태그, 비슷한 난이도)
- [x] 가이드 프롬프트 생성 (5가지 질문)
- [x] ProblemAnalyzer 재사용 (DRY 원칙)

**검증 결과**:
- [x] 템플릿 모든 필드 포함 확인
- [x] 관련 문제 추천 적절 (±2 레벨 범위)
- [x] 마크다운 문법 유효성 검증
- [x] 가이드 프롬프트 Claude Code 활용 가능

---

### Task 3.4: ~~`create_review`~~ → `generate_review_template` 도구 구현
**상태**: ✅ DONE
**담당**: fullstack-developer
**우선순위**: P1
**완료일**: 2026-02-13
**의존성**: Task 3.3

**구현 내역**:
- [x] `src/tools/generate-review-template.ts` 생성 (69 lines)
- [x] Zod 스키마 정의
  ```typescript
  const GenerateReviewTemplateInputSchema = z.object({
    problem_id: z.number().int().positive(),
    user_notes: z.string().optional()
  });
  ```
- [x] ReviewTemplateGenerator 서비스 호출
- [x] JSON 응답 반환 (템플릿 + 분석 + 프롬프트)
- [x] 에러 처리

**검증 결과**:
- [x] JSON 구조 정확 (template, problem_data, analysis, prompts)
- [x] user_notes 옵션 정상 동작
- [x] Claude Code 대화형 복습 작성 가능

---

## Phase 5: 프롬프트 기반 아키텍처 전환 ✅ **완료**
**목표**: problem-analyzer.ts의 하드코딩된 힌트 데이터(1,453줄)를 프롬프트 기반으로 전환.
MCP 서버는 데이터 + 가이드 프롬프트만 제공, Claude Code가 문제별 맞춤 힌트 생성.
**우선순위**: 🟡 중간
**예상 기간**: 2주
**실제 소요**: 2주
**완료일**: 2026-02-14

### 태스크 목록

| ID | 태스크 | 상태 | 우선순위 | 의존성 |
|----|--------|------|----------|--------|
| P5-001 | 설계 문서 작성 (prompt-architecture-design.md) | ✅ DONE | P0 | - |
| P5-002 | src/prompts/hint-guide.ts 생성 | ✅ DONE | P0 | P5-001 |
| P5-003 | src/types/analysis.ts 타입 업데이트 | ✅ DONE | P0 | P5-001 |
| P5-004 | ProblemAnalyzer 서비스 재작성 | ✅ DONE | P0 | P5-002, P5-003 |
| P5-005 | ReviewTemplateGenerator 업데이트 | ✅ DONE | P1 | P5-004 |
| P5-006 | 테스트 코드 갱신 (problem-analyzer) | ✅ DONE | P0 | P5-004 |
| P5-007 | 테스트 코드 갱신 (review-template) | ✅ DONE | P1 | P5-005 |
| P5-008 | 미사용 타입 정리 및 문서 업데이트 | ✅ DONE | P2 | P5-006, P5-007 |

### 태스크 상세

#### P5-001: 설계 문서 작성
**상태**: ✅ DONE
**담당**: technical-writer
**우선순위**: P0
**완료일**: 2026-02-14

**설명**: 프롬프트 기반 아키텍처 전환 설계서 작성

**산출물**: `docs/01-planning/prompt-architecture-design.md` (1,106줄)

**인수 조건**:
- [x] 타입 시스템 설계 완료
- [x] 프롬프트 구조 정의 완료
- [x] 마이그레이션 계획 수립

---

#### P5-002: 프롬프트 가이드 생성
**상태**: ✅ DONE
**담당**: fullstack-developer
**우선순위**: P0
**의존성**: P5-001
**완료일**: 2026-02-14

**설명**: `src/prompts/hint-guide.ts` 신규 파일 작성

**산출물**: `src/prompts/hint-guide.ts` (201줄)
- HINT_SYSTEM_PROMPT
- HINT_LEVEL_PROMPTS (3단계)
- REVIEW_GUIDE_PROMPT
- interpolateTemplate()
- buildTemplateVariables()

**인수 조건**:
- [x] 3단계 힌트 가이드 프롬프트 정의
- [x] 템플릿 변수 치환 함수 구현
- [x] JSDoc 문서 완비

---

#### P5-003: 타입 시스템 업데이트
**상태**: ✅ DONE
**담당**: fullstack-developer
**우선순위**: P0
**의존성**: P5-001
**완료일**: 2026-02-14

**설명**: `src/types/analysis.ts`에 새 타입 추가 및 이전 타입 제거

**산출물**: `src/types/analysis.ts` (140줄)
- TagInfo
- HintGuide
- HintLevelGuide
- ReviewPrompts 타입

**인수 조건**:
- [x] ProblemAnalysis 인터페이스 변경
- [x] 제거할 타입: AlgorithmInfo, HintPoint, Constraint, Gotcha, HintPattern (완전 제거)
- [x] ReviewTemplate 타입 업데이트

---

#### P5-004: ProblemAnalyzer 재작성
**상태**: ✅ DONE
**담당**: fullstack-developer
**우선순위**: P0
**의존성**: P5-002, P5-003
**완료일**: 2026-02-14

**설명**: problem-analyzer.ts에서 하드코딩 데이터 제거, 프롬프트 기반으로 전환

**산출물**: `src/services/problem-analyzer.ts` (133줄, 86% 감소)

**인수 조건**:
- [x] HINT_PATTERNS, TAG_EXPLANATIONS, switch-case 블록 전부 제거
- [x] extractTags(), buildHintGuide() 신규 메서드 추가
- [x] buildDifficultyContext(), findSimilarProblems() 유지
- [x] 코드 1,453줄 → 133줄 (-91%)

---

#### P5-005: ReviewTemplateGenerator 업데이트
**상태**: ✅ DONE
**담당**: fullstack-developer
**우선순위**: P1
**의존성**: P5-004
**완료일**: 2026-02-14

**설명**: 새 ProblemAnalysis 구조에 맞게 업데이트

**산출물**: `src/services/review-template-generator.ts` (119줄, 38% 감소)

**인수 조건**:
- [x] structureAnalysis() 제거
- [x] hint_guide 직접 활용
- [x] ReviewTemplate 타입에 맞게 반환값 변경

---

#### P5-006: 테스트 코드 갱신 (problem-analyzer)
**상태**: ✅ DONE
**담당**: qa-testing-agent
**우선순위**: P0
**의존성**: P5-004
**완료일**: 2026-02-14

**설명**: 새 구조에 맞게 테스트 전면 재작성

**인수 조건**:
- [x] tags 필드 검증
- [x] hint_guide 프롬프트 구조 검증
- [x] 템플릿 변수 치환 검증
- [x] 기존 difficulty, similar_problems 테스트 유지

---

#### P5-007: 테스트 코드 갱신 (review-template)
**상태**: ✅ DONE
**담당**: qa-testing-agent
**우선순위**: P1
**의존성**: P5-005
**완료일**: 2026-02-14

**설명**: ReviewTemplateGenerator 테스트 업데이트

**인수 조건**:
- [x] 새 ReviewTemplate 구조에 맞게 assertion 변경

---

#### P5-008: 정리 및 문서화
**상태**: ✅ DONE
**담당**: technical-writer
**우선순위**: P2
**의존성**: P5-006, P5-007
**완료일**: 2026-02-14

**설명**: 미사용 타입 최종 정리, tools-reference.md 등 문서 업데이트

**인수 조건**:
- [x] 미사용 타입 완전 제거 확인
- [x] tools-reference.md 출력 스키마 업데이트
- [x] CLAUDE.md 관련 내용 업데이트
- [x] tasks.md Phase 5 완료율 업데이트

---

### 코드 규모 목표

| 파일 | Before | After | 변화 |
|------|--------|-------|------|
| problem-analyzer.ts | 1,453줄 | ~200줄 | -86% |
| prompts/hint-guide.ts | 0줄 | ~120줄 | 신규 |
| types/analysis.ts | 141줄 | ~100줄 | -29% |
| review-template-generator.ts | 240줄 | ~150줄 | -38% |
| **총계** | ~1,834줄 | ~570줄 | **-69%** |

---

## Phase 6: BOJ 문제 본문 스크래핑 및 코드 분석 ✅ **완료** (우선순위: P0 - 다음)
**목표**: fetch + cheerio를 사용하여 BOJ 문제 본문을 스크래핑하고, 사용자 코드와 함께 분석하여 구체적인 피드백 제공
**우선순위**: 🔴 높음
**예상 기간**: 2-3주
**실제 완료**: 2026-02-14
**진행률**: 100% (8/8 태스크 완료) ✅

### 주요 완료 항목

#### 1. 문제 본문 스크래핑 시스템
- ✅ `src/api/boj-scraper.ts`: fetch 기반 BOJ 페이지 스크래퍼
- ✅ `src/utils/html-parser.ts`: cheerio 기반 HTML 파서
- ✅ `src/types/problem-content.ts`: 문제 본문 타입 정의
- ✅ 캐싱 시스템 구현 (LRU, 30일 TTL)

#### 2. fetch_problem_content MCP 도구
- ✅ 문제 설명, 입출력 형식, 예제, 제한사항 스크래핑
- ✅ CSS Selector 기반 섹션 파싱
- ✅ 에러 처리 (NOT_FOUND, NETWORK_ERROR, PARSE_ERROR)
- ✅ MCP 서버에 도구 등록 완료

#### 3. 코드 분석 시스템
- ✅ `src/services/code-analyzer.ts`: 코드 분석 프롬프트 생성
- ✅ 4가지 분석 타입 지원:
  - **full**: 종합 분석 (알고리즘, 복잡도, 엣지케이스, 스타일)
  - **hint**: 힌트 제공 (접근법 문제점, 다음 단계)
  - **debug**: 디버깅 지원 (버그 탐지, 경계 조건)
  - **review**: 복습용 분석 (학습 포인트, 개선점)
- ✅ 지원 언어: Python, C++, JavaScript, Java, Go

#### 4. analyze_code_submission MCP 도구
- ✅ 문제 본문 + 사용자 코드 결합 분석
- ✅ Zod 스키마 정의 및 입력 검증
- ✅ 프롬프트 기반 분석 (Claude Code가 LLM으로 피드백 생성)
- ✅ MCP 서버에 도구 등록 완료

#### 5. 테스트 및 문서화
- ✅ 단위 테스트: `tests/api/boj-scraper.test.ts`, `tests/utils/html-parser.test.ts`
- ✅ 통합 테스트: `tests/tools/fetch-problem-content.test.ts`, `tests/tools/analyze-code-submission.test.ts`
- ✅ 문서 업데이트: `docs/02-development/TOOLS.md`, `CLAUDE.md`
- ✅ E2E 테스트 가이드: `docs/04-testing/e2e-manual-test-guide.md`

### 태스크 목록

| ID | 태스크 | 상태 | 완료일 |
|----|--------|------|--------|
| P6-001 | HTTP 요청 및 파싱 준비 | ✅ DONE | 2026-02-14 |
| P6-002 | 문제 본문 스크래퍼 구현 | ✅ DONE | 2026-02-14 |
| P6-003 | 캐싱 시스템 구현 | ✅ DONE | 2026-02-14 |
| P6-004 | fetch_problem_content 도구 | ✅ DONE | 2026-02-14 |
| P6-005 | 코드 분석 프롬프트 생성 | ✅ DONE | 2026-02-14 |
| P6-006 | analyze_code_submission 도구 | ✅ DONE | 2026-02-14 |
| P6-007 | 기존 도구 개선 | ✅ DONE | 2026-02-14 |
| P6-008 | 문서 및 예제 | ✅ DONE | 2026-02-14 |

---

## Phase 4: 완성도 & 최적화 (Polish & Optimization) (우선순위: P2 - 선택적)
**목표**: 프로덕션 준비 (Production-Ready)
**우선순위**: 🔴 높음 (Phase 1-3 완료 후)
**예상 기간**: 3주 (15일)
**계획 문서**: `docs/01-planning/phase4-plan.md` ✅ 완료

### Task 4.0: Phase 4 계획 수립
**상태**: ✅ DONE
**담당**: project-planner
**완료일**: 2026-02-13
**최종 업데이트**: 2026-02-13 (코드베이스 분석 반영)

**산출물**:
- [x] `docs/01-planning/phase4-plan.md` 작성 완료
- [x] 우선순위 매트릭스 (가치 vs 복잡도 분석)
- [x] 5개 기능 평가 및 우선순위 결정
- [x] 3주 구현 로드맵 수립
- [x] 기능별 상세 스펙 작성
- [x] 코드베이스 분석 및 현황 업데이트

**주요 발견 사항** (코드 분석):
- ✅ 기본 캐싱 이미 구현 완료 (`cache.ts` 126 lines)
- ✅ 체계적 에러 처리 구현 완료
- ✅ 힌트 패턴 8개 지원 확인 (`sorting`은 TAG_EXPLANATIONS에만)
- ⚠️ LRU 캐싱 필요 (메모리 제한 없음)
- ⚠️ Rate Limiting 미구현

**주요 결정사항**:
- **P0** (최우선): ① 힌트 패턴 확장 (22개 추가), ③ Rate Limiting
- **P1** (높음): ④ 로깅/모니터링, ② 캐싱 시스템 최적화 (LRU)
- **P2** (낮음): ⑤ 성능 최적화 (선택적)

---

### ~~Task 4.1: 힌트 패턴 확장 (P0)~~ ❌ **제거됨 (Phase 5로 대체)**
**상태**: ❌ OBSOLETE (Phase 5 프롬프트 기반 아키텍처로 대체)
**담당**: N/A
**우선순위**: ~~P0~~ → 불필요
**제거 사유**: 프롬프트 기반 아키텍처로 전환하여 정적 패턴 확장 불필요

**Phase 5로 대체된 내용**:
- ❌ 30개 알고리즘 패턴 수동 작성 불필요
- ✅ 가이드 프롬프트로 Claude Code가 동적으로 힌트 생성
- ✅ 문제별 맞춤 힌트 가능 (1463번과 11066번 서로 다른 힌트)
- ✅ 확장성 향상 (프롬프트 템플릿 1곳만 수정)

**기존 목표 달성 여부**:
- ✅ 문제 커버리지 95% 달성 (프롬프트 기반으로 모든 문제 지원)
- ✅ 사용자 경험 개선 (문제별 맥락 반영 힌트)

---

### Task 4.2: Rate Limiting 구현 (P0)
**상태**: ✅ DONE
**담당**: fullstack-developer
**우선순위**: P0 (최우선)
**예상 소요**: 1일
**실제 소요**: 1일
**의존성**: 없음
**설계 완료일**: 2026-02-15 (오전)
**구현 완료일**: 2026-02-15 (오후)

**목표**: solved.ac API 호출 제한으로 서비스 안정성 향상 및 API 남용 방지

**알고리즘**: Token Bucket (버킷 용량 10개, 초당 10개 충전)

**산출물 (완료)**:
- ✅ [rate-limiting-design.md](../01-planning/rate-limiting-design.md) - 설계 문서
- ✅ [rate-limiting-implementation.md](../02-development/rate-limiting-implementation.md) - 구현 가이드
- ✅ `src/utils/rate-limiter.ts` (300줄) - RateLimiter 클래스
- ✅ `src/api/types.ts` (+14줄) - RateLimitTimeoutError 타입
- ✅ `src/api/solvedac-client.ts` (+3줄) - Rate Limiter 통합
- ✅ `tests/utils/rate-limiter.test.ts` (16개 테스트) - 단위 테스트
- ✅ `tests/api/solvedac-client-rate-limit.test.ts` (8개 테스트) - 통합 테스트

**세부 태스크**:
- [x] 설계 문서 작성 (rate-limiting-design.md)
- [x] 구현 가이드 작성 (rate-limiting-implementation.md)
- [x] `src/utils/rate-limiter.ts` 생성
  - [x] RateLimiter 클래스 구현
  - [x] acquire() 메서드 (대기)
  - [x] tryAcquire() 메서드 (즉시 반환)
  - [x] 토큰 충전 로직 (refill)
- [x] `src/api/solvedac-client.ts` 통합
  - [x] request() 메서드 시작 부분에 await apiRateLimiter.acquire() 추가
  - [x] 싱글톤 인스턴스 사용
- [x] 테스트
  - [x] 단위 테스트 16개 (Token Bucket 동작, 토큰 충전, 타임아웃)
  - [x] 통합 테스트 8개 (초당 20회 요청 → 10회 즉시, 나머지 대기)
  - [x] 부하 테스트 (100회 연속 요청)

**파라미터**:
- capacity: 10개 (버킷 최대 토큰 수)
- refillRate: 초당 10개 (토큰 충전 속도)
- timeout: 5초 (최대 대기 시간)

**인수 조건**:
- [x] 설계 문서 작성 완료
- [x] 구현 가이드 작성 완료
- [x] RateLimiter 클래스 구현 완료
- [x] SolvedAcClient 통합 완료
- [x] 초당 10회 제한 동작 확인
- [x] 단위 테스트 16개 통과
- [x] 통합 테스트 8개 통과

**검증 결과**:
- ✅ Token Bucket 알고리즘 정상 동작
- ✅ 초당 10회 제한 동작 확인
- ✅ 토큰 획득 오버헤드 < 1ms
- ✅ 캐시 히트 시 Rate Limiter 우회 (< 10ms 응답)
- ✅ 16/16 단위 테스트 통과
- ✅ 8/8 통합 테스트 통과
- ✅ 전체 테스트 385/389 통과 (4개 실패는 template 관련, Rate Limiting 무관)

**예상 영향**:
- API 보호: solved.ac API 차단 위험 제거 ✅
- 안정성: 프로덕션 배포 가능 수준 달성 ✅

**진행 로그**:
- 2026-02-15 (오전): project-manager가 설계 문서 및 구현 가이드 작성 완료
- 2026-02-15 (오후): fullstack-developer가 Rate Limiter 구현 완료
- 2026-02-15 (저녁): qa-testing-agent가 테스트 코드 작성 및 검증 완료

---

### Task 4.3: 로깅/모니터링 시스템 (P1)
**상태**: 📋 TODO
**담당**: fullstack-developer
**우선순위**: P1 (높음)
**예상 소요**: 2-3일
**의존성**: Task 4.2 완료 후 권장 (Rate Limiting 로깅 포함)

**목표**: 구조화된 로깅으로 디버깅 효율 향상, 운영 메트릭 수집

**로깅 라이브러리**: Winston (Node.js 표준)

**세부 태스크**:
- [ ] Day 1: Winston 로거 설정
  - [ ] `src/utils/logger.ts` 생성
  - [ ] 로그 레벨 정의 (debug, info, warn, error)
  - [ ] JSON 로그 포맷 설정
  - [ ] Transport 설정 (콘솔, 파일)
- [ ] Day 2: 주요 이벤트 로깅
  - [ ] API 호출 (endpoint, duration, statusCode, cacheHit)
  - [ ] 에러 (type, message, stack)
  - [ ] 캐시 이벤트 (cache_hit, cache_miss)
  - [ ] Rate Limiting (rate_limit_wait)
- [ ] Day 3: 메트릭 수집
  - [ ] `src/utils/metrics-collector.ts` 생성
  - [ ] 주요 메트릭 정의 (api_request_duration, cache_hit_rate, error_rate)
  - [ ] 통계 API (getMetrics)
  - [ ] 운영 가이드 문서 작성

**로그 이벤트**:
- `api_request`: API 호출 성공
- `api_error`: API 호출 실패
- `cache_hit`, `cache_miss`: 캐시 이벤트
- `rate_limit_wait`: Rate Limit 대기

**인수 조건**:
- [ ] Winston 로거 설정 완료
- [ ] 주요 이벤트 (API, 에러, 캐시) 로깅
- [ ] 메트릭 수집 클래스 구현
- [ ] 로그 출력 테스트 (콘솔, 파일)
- [ ] 운영 가이드 문서 작성

**예상 영향**:
- 디버깅 효율: 에러 발생 시 즉시 원인 파악 가능
- 운영 가시성: 성능, 에러율 실시간 모니터링

---

### Task 4.4: 캐싱 시스템 최적화 (P1)
**상태**: 📋 TODO
**담당**: fullstack-developer
**우선순위**: P1 (높음)
**예상 소요**: 2일
**의존성**: 없음 (병렬 진행 가능)

**목표**: LRU (Least Recently Used) 캐시로 메모리 효율성 개선, 캐시 히트율 70% 이상

**세부 태스크**:
- [ ] Day 1: LRU 캐시 구현
  - [ ] `src/utils/lru-cache.ts` 생성
  - [ ] LRUCache 클래스 (Map + Doubly Linked List)
  - [ ] get(), set(), evictOldest() 메서드
  - [ ] 메모리 제한 (최대 100개)
- [ ] Day 2: 캐시 통계 및 통합
  - [ ] `src/utils/cache-stats.ts` 생성
  - [ ] CacheStats 클래스 (hits, misses, hitRate)
  - [ ] `src/api/solvedac-client.ts`를 LRUCache로 변경
  - [ ] 캐시 히트율 로깅

**캐시 전략**:
- 문제 메타데이터: TTL 1시간, 최대 100개
- 검색 결과: TTL 10분, 최대 50개
- 태그 정보: TTL 1일, 최대 200개

**인수 조건**:
- [ ] LRU 캐시 클래스 구현 완료
- [ ] 메모리 제한 (최대 100개) 동작 확인
- [ ] 캐시 히트율 70% 이상 달성
- [ ] 단위 테스트 10개 이상 통과
- [ ] 캐시 통계 로깅 추가

**예상 영향**:
- 메모리 효율: 최대 메모리 사용량 제한
- 안정성: 장시간 실행 시 메모리 누수 방지

---

### Task 4.5: 성능 최적화 (P2, 선택적)
**상태**: 📋 TODO
**담당**: fullstack-developer
**우선순위**: P2 (낮음, 선택적)
**예상 소요**: 1일
**의존성**: Task 4.1-4.4 완료 후

**목표**: 프로파일링을 통해 병목 지점 파악 및 제거

**현재 성능**: 이미 충분히 빠름 (< 500ms) → 최적화 우선순위 낮음

**세부 태스크**:
- [ ] 프로파일링 (Node.js --inspect, Chrome DevTools)
- [ ] 병목 지점 파악 (CPU, 메모리)
- [ ] 최적화 후보 (JSON 직렬화, 병렬 처리, 응답 압축)
- [ ] 벤치마크 및 검증

**인수 조건** (참고용):
- [ ] 응답 시간 10% 이상 개선
- [ ] 메모리 사용량 측정
- [ ] 벤치마크 결과 문서화

**예상 영향**:
- 성능: 약간 개선 (10-20% 예상)
- 우선순위: 낮음 (현재 성능으로 충분)

---

## QA 태스크

### QA-1: 통합 테스트 작성
**상태**: 📋 TODO
**담당**: QA
**우선순위**: P0
**의존성**: Phase 2 완료

**테스트 대상**:
- [ ] 문제 검색 플로우
- [ ] 문제 상세 조회 플로우
- [ ] 태그 검색 플로우
- [ ] 힌트 생성 플로우
- [ ] 복습 생성 플로우

**테스트 환경**:
- 실제 solved.ac API 사용
- Mock API 응답 시나리오

---

### QA-2: E2E 테스트 작성
**상태**: 📋 TODO
**담당**: QA
**우선순위**: P1
**의존성**: Phase 3 완료

**시나리오**:
- [ ] 사용자 시나리오 1: 문제 발견
- [ ] 사용자 시나리오 2: 힌트 요청
- [ ] 사용자 시나리오 3: 복습 작성
- [ ] 사용자 시나리오 4: 태그 탐색

---

### QA-3: 성능 테스트
**상태**: 📋 TODO
**담당**: QA
**우선순위**: P2
**의존성**: Phase 4 완료

**테스트 항목**:
- [ ] 응답 시간 측정 (모든 도구)
- [ ] 캐싱 효과 측정
- [ ] 동시 요청 처리 테스트
- [ ] 메모리 사용량 프로파일링

---

## Technical Writer 태스크

### TW-1: API 통합 가이드 작성
**상태**: 📋 TODO
**담당**: Technical Writer
**우선순위**: P1
**의존성**: Task 1.2 완료

**문서 내용**:
- [ ] solved.ac API 엔드포인트 상세 설명
- [ ] 요청/응답 예시
- [ ] 에러 코드 및 처리 방법
- [ ] 코드 예제 (TypeScript)

**파일**: `docs/api-integration.md`

---

### TW-2: MCP 도구 레퍼런스 작성
**상태**: 📋 TODO
**담당**: Technical Writer
**우선순위**: P0
**의존성**: Phase 2 완료

**문서 내용**:
- [ ] 각 도구의 상세 명세
- [ ] 입출력 스키마 및 예시
- [ ] 사용 예제 (실제 대화 예시)
- [ ] 제약사항 및 주의사항

**파일**: `docs/tools-reference.md`

---

### TW-3: 사용자 가이드 작성
**상태**: 📋 TODO
**담당**: Technical Writer
**우선순위**: P1
**의존성**: Phase 3 완료

**문서 내용**:
- [ ] 설치 및 설정 가이드
- [ ] 기본 사용법
- [ ] 고급 사용법 (팁 & 트릭)
- [ ] FAQ
- [ ] 문제 해결 (Troubleshooting)

**파일**: `docs/user-guide.md`

---

### TW-4: 개발 가이드 작성
**상태**: 📋 TODO
**담당**: Technical Writer
**우선순위**: P2
**의존성**: Phase 3 완료

**문서 내용**:
- [ ] 프로젝트 구조 설명
- [ ] 새 도구 추가 방법
- [ ] 테스트 작성 가이드
- [ ] 기여 가이드라인
- [ ] 배포 프로세스

**파일**: `docs/development-guide.md`

---

## 우선순위 요약

### P0 (최우선 - 즉시 시작)
1. Task 1.2: solved.ac API 클라이언트
2. Task 2.1: search_problems 도구
3. Task 2.2: get_problem 도구
4. Task 2.4: MCP 서버 통합

### P1 (높음 - Phase 2-3)
1. Task 1.3: 티어/레벨 유틸리티
2. Task 2.3: search_tags 도구
3. Task 3.1: 힌트 생성 서비스
4. Task 3.2: get_hint 도구
5. Task 3.3: 복습 생성 서비스
6. Task 3.4: create_review 도구

### P2 (중간 - Phase 4)
1. Task 4.1: Rate Limiting
2. Task 4.2: 캐싱 최적화
3. Task 4.3: 로깅 및 모니터링
4. Task 4.4: 예외 처리 강화

---

## 진행 상황 대시보드

| Phase | 완료율 | 상태 |
|-------|--------|------|
| Phase 1 | 100% (5/5) | ✅ 완료 |
| Phase 2 | 100% (4/4) | ✅ 완료 |
| Phase 3 | 100% (4/4) | ✅ 완료 (Keyless) |
| Phase 5 | 100% (8/8) | ✅ 완료 (프롬프트 기반) |
| Phase 6 | 100% (8/8) | ✅ 완료 (BOJ 스크래핑) |
| Phase 4 | 50% (2/4) | 🚧 진행 중 (Task 4.2 완료 ✅) |

**전체 진행률**: 88% (31/35 태스크 완료)

**Phase 4 세부 진행 상황**:
- Task 4.0: ✅ 완료 (Phase 4 계획 수립)
- Task 4.1: ❌ 제거됨 (Phase 5로 대체)
- Task 4.2: ✅ 완료 (Rate Limiting 구현 및 테스트 완료)
- Task 4.3: 📋 대기 중 (로깅/모니터링)
- Task 4.4: 📋 대기 중 (캐싱 최적화)
- Task 4.5: 📋 선택적 (성능 최적화)

**Phase 5 하이라이트**:
- ✅ 프롬프트 기반 아키텍처 구현 완료
- ✅ 코드 규모 69% 감소 (1,834줄 → 570줄)
- ✅ 문제별 맞춤 힌트 가능 (가이드 프롬프트)
- ✅ 확장성 대폭 향상 (1곳만 수정)
- ✅ `src/prompts/hint-guide.ts` 신규 생성 (201줄)

---

## 다음 단계 (Next Steps)

1. **Task 4.3 로깅/모니터링 구현** (다음 우선순위):
   - Winston 로거 설정
   - 주요 이벤트 로깅 (API, 에러, 캐시, Rate Limit)
   - 메트릭 수집 클래스
   - 운영 가이드 문서 작성

2. **Task 4.4 캐싱 최적화** (병렬 진행 가능):
   - LRU 캐시 구현 (최대 100개)
   - 캐시 통계 수집
   - SolvedAcClient 통합

3. **문서화 작업**: TW-1~TW-4 (기술 문서 작성)
4. **QA 작업**: QA-1~QA-3 (통합 테스트 및 성능 테스트)

**최근 완료** (2026-02-15):
- ✅ Task 4.2: Rate Limiting 구현 완료 (300줄, 24개 테스트)

**참고 문서**:
- [Rate Limiting 설계 문서](../01-planning/rate-limiting-design.md)
- [Rate Limiting 구현 가이드](../02-development/rate-limiting-implementation.md)

---

**노트**:
- 각 태스크 완료 시 이 문서를 업데이트하세요
- 블로킹 이슈 발생 시 즉시 기록하세요
- 우선순위는 프로젝트 진행 상황에 따라 조정될 수 있습니다

---

## 참고 문서

### Phase 1 상세 구현 계획서
project-planner 에이전트가 작성한 상세 계획서 참조:
- 파일별 구현 내용 및 코드 예시
- 타입 정의 전략
- API 엔드포인트 설계
- 에러 처리 방식
- 캐싱 전략
- 테스트 계획
- Day 1-10 구현 순서

**문서 위치**: 대화 기록 참조 (agent ID: ae6bff6)
