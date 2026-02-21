# AlgoKit : 코딩테스트 어시스턴트 MCP Server

## 프로젝트 개요

백준 온라인 저지(BOJ)와 프로그래머스(Programmers) 알고리즘 문제 학습을 돕는 통합 MCP 서버.
**플랫폼을 자동으로 선택하여 문제 검색, 분석, 힌트 생성, 복습 템플릿 제공**

**프로젝트 이름**: `algokit`
**통합 스킬**: `algokit` (BOJ + 프로그래머스 자동 라우팅)
- **스킬 정의**: `.claude/skills/algokit.md`
- **동작 방식**: Claude Code가 사용자 입력을 분석하여 적절한 플랫폼 자동 선택

---

## 핵심 기능

### 1. BOJ 도구 ✅

#### 기본 조회
- **search_problems**: 필터 기반 BOJ 문제 검색
- **get_problem**: BOJ 문제 상세 정보 조회
- **search_tags**: 알고리즘 태그 검색

#### 학습 지원 (Phase 5 완료)
- **analyze_problem_boj**: BOJ 문제 분석 및 힌트 가이드 프롬프트 제공
  - 3단계 힌트 가이드, 난이도 컨텍스트, 태그 정보
  - **프롬프트 기반**: 가이드 프롬프트 제공 (< 500ms), Claude Code가 힌트 생성

- **generate_hint_boj**: BOJ 문제 힌트 생성
  - 단계별 힌트 제공 (Level 1-3)
  - 프롬프트 기반 맞춤형 힌트

- **generate_review_template_boj**: BOJ 문제 복습 템플릿 생성
  - 마크다운 템플릿, 문제 분석 정보, 관련 문제 추천
  - **프롬프트 기반**: 템플릿 + 가이드 제공, Claude Code가 대화형으로 복습 작성

#### 코드 분석 (Phase 6 완료)
- **fetch_problem_content_boj**: BOJ 문제 본문 스크래핑
- **analyze_code_submission_boj**: BOJ 코드 분석 및 피드백

### 2. 프로그래머스 도구

#### 기본 조회 (Phase 7 완료) ✅
- **search_programmers_problems**: 프로그래머스 문제 검색 (내부 JSON API, < 1초)
- **get_programmers_problem**: 프로그래머스 문제 상세 조회 (cheerio, 1-2초)

#### 학습 지원 (Phase 7+ 구현 예정) 🚧
- **analyze_problem_programmers**: 프로그래머스 문제 분석 (스텁)
- **generate_hint_programmers**: 프로그래머스 힌트 생성 (스텁)
- **generate_review_template_programmers**: 프로그래머스 복습 템플릿 (스텁)

#### 코드 분석 (Phase 7+ 구현 예정) 🚧
- **fetch_problem_content_programmers**: 프로그래머스 문제 본문 (스텁)
- **analyze_code_submission_programmers**: 프로그래머스 코드 분석 (스텁)

### 4. 향후 계획 (Phase 4) 🚧 진행 중
- **Rate Limiting**: ✅ 구현 완료 (Token Bucket 알고리즘)
  - 산출물: `src/utils/rate-limiter.ts` (300줄), 테스트 24개 통과
  - 문서: `docs/01-planning/rate-limiting.md` (설계+구현 통합)
- **캐싱 최적화**: ✅ 구현 완료 (LRU 캐싱)
  - 산출물: `src/utils/lru-cache.ts` (304줄), `src/utils/cache-stats.ts` (107줄), 테스트 31개 통과
  - 성능: O(1) get/set/delete, 메모리 < 500KB (100개 항목 기준)
  - 문서: `docs/01-planning/lru-caching.md` (설계+구현 통합)
- **로깅/모니터링**: 📋 대기 중 (구조화된 로깅 및 메트릭 수집)
- **analyze_user**: 백준 ID로 전체 풀이 이력 분석 (Phase 7+)

---

## 기술 스택

- **MCP SDK**: `@modelcontextprotocol/sdk` v1.26.0
- **TypeScript**: 5.9.3
- **Node.js**: ES2022 (>=18.0.0)
- **Zod**: 4.3.6 (스키마 검증)
- **solved.ac API**: BOJ 문제 메타데이터 (무료, 인증 불필요)
- **vitest**: 4.0.18 (테스팅)
- ~~**@anthropic-ai/sdk**~~: 제거됨 (Keyless 아키텍처)
- ~~**puppeteer**~~: 제거됨 (프로그래머스 내부 JSON API로 교체)

---

## 프로젝트 구조

```
algokit/
├── src/
│   ├── index.ts                   # MCP 서버 진입점
│   ├── api/
│   │   ├── solvedac-client.ts     # BOJ API 클라이언트
│   │   ├── boj-scraper.ts         # BOJ 스크래퍼
│   │   └── programmers-scraper.ts # 프로그래머스 스크래퍼 (fetch + cheerio)
│   ├── tools/                     # MCP 도구들
│   ├── services/                  # 비즈니스 로직
│   └── utils/                     # 유틸리티
│       ├── html-parser.ts         # HTML 파싱 (BOJ + 프로그래머스)
│       └── url-parser.ts          # URL 파싱 (프로그래머스)
├── tests/                         # 테스트 코드
└── docs/                          # 상세 문서
    ├── INDEX.md                   # 문서 탐색 가이드
    ├── 01-planning/               # 기획 및 설계
    ├── 02-development/            # 개발 가이드
    ├── 03-project-management/     # 프로젝트 관리
    └── 04-testing/                # 테스트 문서
```

---

## 개발 워크플로우 (TDD + SDD)

### Phase 1: 계획 및 스펙
1. **스펙 정의** (project-planner + qa-testing-agent)
   - 구현 계획서 작성
   - 테스트 케이스 정의

### Phase 2: TDD 구현
2. **🔴 Red**: 실패하는 테스트 작성 (qa-testing-agent)
3. **🟢 Green**: 테스트 통과 코드 작성 (fullstack-developer)
4. **🔵 Refactor**: 코드 개선 (fullstack-developer)

### Phase 3: 검토 및 문서화
5. **문서 검토** (technical-writer)
6. **Plan 재정립** (project-planner)

### Phase 4: 커밋
7. **사용자가 `/gitcommit` 명시적으로 요청할 때만 실행** → 커밋 계획 작성 → 사용자 승인
   - ❌ gitcommit을 자동으로 실행하지 말 것
   - ❌ 작업 완료 후 자동으로 커밋하지 말 것
   - ✅ 사용자가 명시적으로 "커밋해줘", "/gitcommit" 등으로 요청할 때만 실행

**상세 워크플로우**: `docs/01-planning/workflow.md` 참조

---

## Git 작업 방식

### ⚠️ gitcommit 사용 규칙

**gitcommit은 사용자의 명시적 요청이 있을 때만 실행합니다.**

- ❌ 자동 실행 금지: 작업 완료 후 자동으로 커밋하지 말 것
- ❌ 자동 트리거 금지: 특정 조건(예: 모든 테스트 통과)을 만족해도 자동으로 실행하지 말 것
- ✅ 명시적 요청 필수: 사용자가 다음 중 하나로 요청할 때만 실행
  - "커밋해줘"
  - "/gitcommit"
  - "변경사항을 커밋하고 싶어"
  - 기타 명시적인 커밋 의도 표현

**예시**:
```
❌ 나쁜 예:
AI가 작업을 완료한 후: "완료되었습니다. 이제 커밋할게요."
AI가 gitcommit 자동 실행

✅ 좋은 예:
AI가 작업을 완료한 후: "작업이 완료되었습니다. 필요하시면 '/gitcommit'으로 커밋해주세요."
사용자: "/gitcommit"
AI가 gitcommit 실행
```

### 커밋 프로세스
1. 작업 단위 분리
2. `stash/commit/YYYYMMDD_<num>_commit_plan.md` 계획 파일 생성
3. 사용자 승인 후 커밋 실행
4. **AI는 절대 `git push` 하지 않음**

### 커밋 메시지 양식
```
[타입] 간결한 설명

- 주요 변경사항 1
- 주요 변경사항 2
```

**타입**: `[feat]`, `[fix]`, `[chore]`, `[refactor]`, `[docs]`, `[test]`

**상세 규칙**: `docs/03-project-management/git-guide.md` 참조

---

## 문서 체계

- **INDEX.md**: 문서 탐색 가이드
- **CONTRIBUTING.md**: 문서 작성 규칙
- **01-planning/**: PRD, SRS, architecture
- **02-development/**: API 통합, 도구 레퍼런스
- **03-project-management/**: tasks, git guide
- **04-testing/**: 테스트 스펙 및 결과

---

## 핵심 설계 패턴

### MCP 도구 구조
```typescript
const InputSchema = z.object({ field: z.string() });

server.tool("tool_name", "설명", InputSchema, async (args) => {
  // 1. 입력 검증
  // 2. API/서비스 호출
  // 3. 응답 포맷팅
  // 4. 구조화된 출력 반환
});
```

### 티어 시스템
- 1-5: Bronze V-I
- 6-10: Silver V-I
- 11-15: Gold V-I
- 16-20: Platinum V-I
- 21-25: Diamond V-I
- 26-30: Ruby V-I

---

## 프롬프트 기반 아키텍처

**Phase 5에서 도입된 설계 원칙** (Phase 3 Keyless 아키텍처 개선):

### 원칙
- **MCP 서버**: 결정적 데이터 + 가이드 프롬프트 제공
- **Claude Code**: 가이드 프롬프트로 문제별 맞춤 힌트 생성
- **Zero Configuration**: API 키 불필요
- **테스트 안정성**: 프롬프트 구조 검증 (Snapshot 테스트)

### 데이터 흐름
```
User → Claude Code → algokit (JSON + Prompts) → Claude Code (LLM) → User (맞춤 힌트)
```

### 장점
1. **사용자 경험**: 문제마다 고유한 맥락 반영 힌트
2. **개발 효율**: 코드 규모 69% 감소 (1,834줄 → 570줄)
3. **응답 속도**: 프롬프트 생성 < 500ms
4. **확장성**: 새 알고리즘 추가 시 1곳만 수정 (프롬프트)
5. **품질**: LLM의 추론 능력 활용 (단순 매칭 → 문맥 이해)

### 구현 예시
**analyze_problem**:
- MCP 서버: `ProblemAnalysis` JSON 반환 (힌트 가이드 프롬프트 포함)
- Claude Code: Level 2 힌트 요청 시 `hint_levels[1].prompt`로 문제별 맞춤 힌트 생성

**generate_review_template**:
- MCP 서버: 템플릿 + 가이드 프롬프트 반환
- Claude Code: 프롬프트로 사용자와 대화하며 복습 문서 작성

### Phase 3 → Phase 5 변화
| 항목 | Phase 3 (Keyless) | Phase 5 (프롬프트 기반) |
|------|-------------------|-------------------------|
| 힌트 데이터 | 하드코딩 힌트 포인트 | 가이드 프롬프트 |
| 문제 특화 | 모든 DP 문제 동일 힌트 | 문제별 맞춤 힌트 |
| 코드 규모 | 1,834줄 | 570줄 (-69%) |
| 확장성 | 낮음 (6곳 수정) | 높음 (1곳 수정) |

---

## 빠른 참조

### 기획 및 설계
- **프로젝트 목적**: [docs/01-planning/PRD.md](docs/01-planning/PRD.md)
- **시스템 구조**: [docs/01-planning/architecture.md](docs/01-planning/architecture.md) (Keyless, 프롬프트 기반)
- **Rate Limiting**: [docs/01-planning/rate-limiting.md](docs/01-planning/rate-limiting.md) (설계+구현)
- **LRU 캐싱**: [docs/01-planning/lru-caching.md](docs/01-planning/lru-caching.md) (설계+구현)
- **Programmers 분석**: [docs/01-planning/programmers-analysis.md](docs/01-planning/programmers-analysis.md) (향후 계획)

### 개발 가이드
- **API 사용법**: [docs/02-development/api-integration.md](docs/02-development/api-integration.md)
- **MCP 도구**: [docs/02-development/tools-reference.md](docs/02-development/tools-reference.md)
- **Web Scraping**: [docs/02-development/web-scraping-guide.md](docs/02-development/web-scraping-guide.md) (윤리적 스크래핑)

### 프로젝트 관리
- **현재 작업**: [docs/03-project-management/tasks.md](docs/03-project-management/tasks.md)

---

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
