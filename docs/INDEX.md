# 📚 문서 인덱스

**cote-mcp: BOJ 학습 도우미 MCP Server**
**마지막 업데이트**: 2026-02-14

---

## 문서 구조 개요

이 디렉토리는 프로젝트의 모든 공식 문서를 포함합니다. 문서는 용도에 따라 분류되어 있으며, 각 문서의 대상 독자와 목적이 명확히 정의되어 있습니다.

```
docs/
├── INDEX.md                      # 📍 이 파일 - 문서 탐색 가이드
├── CONTRIBUTING.md               # ✍️ 문서 작성 규칙
│
├── 01-planning/                  # 📋 기획 및 설계
│   ├── PRD.md                   # 제품 요구사항 문서
│   ├── SRS.md                   # 소프트웨어 요구사항 명세
│   └── architecture.md          # 시스템 아키텍처
│
├── 02-development/               # 🛠️ 개발 가이드
│   ├── api-integration.md       # API 통합 가이드
│   └── tools-reference.md       # MCP 도구 레퍼런스
│
├── 03-project-management/        # 📊 프로젝트 관리
│   └── tasks.md                 # 개발 태스크 및 상태
│
└── 04-testing/                   # 🧪 테스트 문서
    ├── test-spec-phase1.md      # Phase 1 테스트 스펙
    └── test-results-phase1.md   # Phase 1 테스트 결과 통합본
```

---

## 📋 1. 기획 및 설계 문서

프로젝트의 비전, 요구사항, 시스템 설계를 정의하는 문서들입니다.

### [PRD.md](01-planning/PRD.md)
- **제목**: Product Requirements Document
- **대상 독자**: PM, 개발자, 이해관계자
- **목적**: 제품의 목표, 문제 정의, 솔루션 방향성 명시
- **주요 내용**:
  - 프로젝트 비전 및 한 줄 정의
  - 현재 BOJ 학습의 문제점 분석
  - 핵심 기능 및 부가 기능
  - 사용 예시 시나리오
  - Phase별 개발 계획

### [SRS.md](01-planning/SRS.md)
- **제목**: Software Requirement Specification
- **대상 독자**: 개발자, QA 엔지니어
- **목적**: 기술적 요구사항 및 API 명세 정의
- **주요 내용**:
  - solved.ac API 조사 및 엔드포인트 상세
  - 기능별 요구사항
  - 비기능적 요구사항 (성능, 보안, 확장성)
  - 제약 조건

### [architecture.md](01-planning/architecture.md)
- **제목**: 시스템 아키텍처 문서
- **대상 독자**: 개발자, 시스템 설계자
- **목적**: 시스템 구조 및 컴포넌트 관계 설명
- **주요 내용**:
  - 전체 시스템 다이어그램 (Mermaid)
  - 컴포넌트 상세 설명
  - 데이터 흐름
  - 기술 스택 및 설계 결정사항
  - 확장성 및 성능 전략

### [development-plan.md](01-planning/development-plan.md) 🆕
- **제목**: 개발 계획서 (통합 로드맵)
- **대상 독자**: PM, 개발자, 전체 팀
- **목적**: Phase별 개발 계획 통합 관리
- **주요 내용**:
  - Phase 1-3 완료 현황 요약
  - Phase 4 확장 기능 계획 (상세)
  - Phase 5 프롬프트 기반 전환 계획
  - 향후 로드맵 (Phase 6-7)

### [keyless-architecture.md](01-planning/keyless-architecture.md)
- **제목**: Keyless MCP 아키텍처 문서 (통합본)
- **대상 독자**: 개발자, 시스템 설계자
- **목적**: Phase 3 Keyless 아키텍처 설계 및 검증 결과
- **주요 내용**:
  - 아키텍처 원칙 (Zero Configuration, Deterministic Output)
  - 변경 이유 및 근거 (LLM 기반 vs Keyless)
  - 시스템 아키텍처 다이어그램
  - 데이터 구조 설계 (ProblemAnalysis, ReviewTemplate)
  - 데이터 흐름 (Sequence Diagram)
  - 구현 상태 및 검증 결과
  - Tradeoffs 분석 (5개 측면 비교)

### [prompt-architecture-design.md](01-planning/prompt-architecture-design.md)
- **제목**: 프롬프트 기반 아키텍처 설계서
- **대상 독자**: 개발자, 시스템 설계자
- **목적**: 하드코딩 힌트 → 프롬프트 기반 전환 설계 (Phase 5)
- **주요 내용**:
  - Before/After 데이터 흐름 (Mermaid)
  - 타입 시스템 변경 (제거/추가/유지)
  - 프롬프트 시스템 설계 (3단계 힌트 가이드)
  - 서비스 변경 설계 (1,453줄 → ~200줄, 86% 감소)
  - 마이그레이션 계획 및 Breaking Changes

---

## 🛠️ 2. 개발 가이드

개발자가 프로젝트를 작업할 때 참고하는 실용적 가이드입니다.

### [api-integration.md](02-development/api-integration.md)
- **제목**: solved.ac API 통합 가이드
- **대상 독자**: 백엔드 개발자
- **목적**: API 사용법 및 베스트 프랙티스 제공
- **주요 내용**:
  - API 개요 및 인증
  - 엔드포인트 상세 (파라미터, 응답 형식)
  - 에러 처리 전략
  - 코드 예제
  - 캐싱 및 레이트 리밋 처리

### [tools-reference.md](02-development/tools-reference.md)
- **제목**: MCP 도구 레퍼런스
- **대상 독자**: MCP 도구 개발자, Claude 사용자
- **목적**: MCP 도구의 입출력 스키마 및 사용법 문서화
- **주요 내용**:
  - 도구 개요 및 목록
  - 각 도구의 입력 스키마
  - 출력 형식 및 예시
  - 사용 시나리오

---

## 📊 3. 프로젝트 관리

프로젝트 진행 상황, 태스크, 마일스톤을 추적하는 문서입니다.

### [tasks.md](03-project-management/tasks.md)
- **제목**: 개발 태스크 목록 및 상태 관리
- **대상 독자**: PM, 개발자, QA
- **목적**: 작업 항목 및 진행 상황 실시간 추적
- **주요 내용**:
  - Phase별 태스크 목록
  - 태스크 상태 (✅ DONE, 🚧 IN_PROGRESS, 📋 TODO)
  - 우선순위 및 담당자
  - 인수 조건 (Acceptance Criteria)
  - 블로커 및 의존성

**업데이트 주기**: 매일 (개발 진행 시)
**담당 에이전트**: project-planner, fullstack-developer

---

## 🧪 4. 테스트 문서

테스트 계획, 실행, 결과를 기록하는 문서입니다.

### [test-spec-phase1.md](04-testing/test-spec-phase1.md)
- **제목**: Phase 1 테스트 스펙
- **대상 독자**: QA 엔지니어, 개발자
- **목적**: 테스트 케이스 및 검증 기준 정의
- **주요 내용**:
  - 테스트 목표 및 범위
  - 테스트 케이스 목록 (입력, 예상 출력, 검증 조건)
  - Edge Case 및 에러 시나리오
  - 커버리지 목표

### [test-results-phase1.md](04-testing/test-results-phase1.md)
- **제목**: Phase 1 테스트 결과 통합본
- **대상 독자**: PM, QA, 개발자
- **목적**: 테스트 실행 결과 및 품질 메트릭 리포트
- **주요 내용**:
  - 테스트 실행 요약 (통과율, 실행 시간)
  - 커버리지 분석
  - 발견된 이슈 및 해결 내역
  - Phase 완료 체크리스트
  - 다음 단계 권장사항

**참고**: 이 문서는 다음 파일들을 통합한 것입니다:
- `phase1-completion.md` (구현 완료 보고서)
- `test-report-phase1.md` (테스트 결과)
- `TEST_SUMMARY.md` (테스트 요약)

---

## 📖 문서 읽기 가이드

### 신규 팀원을 위한 추천 순서
1. **프로젝트 이해**: [CLAUDE.md](../CLAUDE.md) → [PRD.md](01-planning/PRD.md)
2. **시스템 파악**: [architecture.md](01-planning/architecture.md)
3. **개발 시작**: [api-integration.md](02-development/api-integration.md)
4. **작업 할당**: [tasks.md](03-project-management/tasks.md)

### 역할별 중요 문서

| 역할 | 필수 문서 | 참고 문서 |
|------|-----------|-----------|
| **Project Manager** | PRD, tasks.md | SRS, test-results-phase1.md |
| **개발자** | architecture.md, api-integration.md, tools-reference.md | SRS, test-spec-phase1.md |
| **QA 엔지니어** | test-spec-phase1.md, test-results-phase1.md | SRS, architecture.md |
| **기술 문서 작성자** | 모든 문서 | CONTRIBUTING.md |

### 에이전트별 문서 책임

| 에이전트 | 작성/업데이트 책임 문서 |
|----------|------------------------|
| **project-planner** | PRD, SRS, tasks.md |
| **fullstack-developer** | architecture.md, api-integration.md, tools-reference.md |
| **qa-testing-agent** | test-spec-phase1.md, test-results-phase1.md |
| **technical-writer** | 모든 문서 (리뷰, 개선, 일관성 유지) |

---

## 🔍 문서 검색 팁

### 특정 정보를 찾고 싶을 때

**"이 프로젝트가 왜 만들어졌나요?"**
→ [PRD.md](01-planning/PRD.md) - 1.2 문제 정의

**"MCP 서버 구조는 어떻게 되나요?"**
→ [architecture.md](01-planning/architecture.md) - 2. 아키텍처 다이어그램

**"solved.ac API 어떻게 호출하나요?"**
→ [api-integration.md](02-development/api-integration.md) - 5. 코드 예제

**"search_problems 도구 어떻게 사용하나요?"**
→ [tools-reference.md](02-development/tools-reference.md) - search_problems

**"현재 어떤 작업이 진행 중인가요?"**
→ [tasks.md](03-project-management/tasks.md) - Phase 1

**"테스트 커버리지가 얼마나 되나요?"**
→ [test-results-phase1.md](04-testing/test-results-phase1.md) - 커버리지 분석

---

## 📝 문서 작성 규칙

문서를 새로 작성하거나 수정할 때는 [CONTRIBUTING.md](CONTRIBUTING.md)의 가이드라인을 따라주세요.

**핵심 원칙**:
- **명확성**: 기술 용어는 최초 사용 시 정의
- **일관성**: 동일한 템플릿과 형식 사용
- **최신성**: 코드 변경 시 관련 문서 동시 업데이트
- **접근성**: 누구나 이해할 수 있는 언어 사용

---

## 🔄 문서 업데이트 이력

| 날짜 | 변경 내용 | 담당자 |
|------|-----------|--------|
| 2026-02-14 | 01-planning 문서 통합 및 재구성 | technical-writer |
| 2026-02-14 | - development-plan.md 신설 (Phase 통합 관리) | technical-writer |
| 2026-02-14 | - keyless-architecture.md 통합 (3개 → 1개) | technical-writer |
| 2026-02-14 | - phase4-plan.md, phase4-summary.md 제거 | technical-writer |
| 2026-02-13 | 문서 체계 재구성 및 INDEX.md 작성 | technical-writer |
| 2026-02-13 | Phase 1 테스트 문서 통합 | technical-writer |
| 2026-02-13 | 디렉토리 구조 개편 (카테고리별 분류) | technical-writer |

---

## 💡 도움이 필요하신가요?

- **문서 작성 가이드**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **프로젝트 전체 가이드**: [CLAUDE.md](../CLAUDE.md)
- **에이전트 정의**: [.claude/agents/](../.claude/agents/)

**문서 관련 문의**: technical-writer 에이전트에게 요청하세요.
