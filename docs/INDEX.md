# 📚 AlgoKit 문서 인덱스

**마지막 업데이트**: 2026-02-16 (문서 정리 완료)
**총 문서**: 19개 (정리 전: 36개 → 정리 후: 19개, **47% 감소**)

---

## 🎯 빠른 시작

새로운 팀원이라면 다음 순서로 읽어보세요:

1. [README.md](../README.md) - 프로젝트 개요 및 설치
2. [CLAUDE.md](../CLAUDE.md) - Claude Code용 프로젝트 가이드
3. [PRD.md](01-planning/PRD.md) - 프로젝트 목적 및 비전
4. [ARCHITECTURE.md](02-development/ARCHITECTURE.md) - 시스템 구조

---

## 📋 기획 및 설계

### [PRD.md](01-planning/PRD.md)
- **제목**: 프로젝트 요구사항 정의 (Product Requirements Document)
- **목적**: BOJ + 프로그래머스 통합 학습 도우미의 비전, 문제점, 솔루션
- **주요 내용**:
  - 핵심 기능 (BOJ 8개 도구, 프로그래머스 2개 도구)
  - **통합 스킬 규칙** (섹션 6): 플랫폼 자동 선택 로직
  - 사용 예시, Phase별 개발 계획

### [SRS.md](01-planning/SRS.md)
- **제목**: 시스템 요구사항 명세 (Software Requirements Specification)
- **목적**: solved.ac API 조사 및 기술적 요구사항
- **주요 내용**: API 엔드포인트, 기능/비기능 요구사항, 제약 조건

### [rate-limiting.md](01-planning/rate-limiting.md)
- **제목**: Rate Limiting 설계 및 구현
- **목적**: solved.ac API 호출 제한 (Token Bucket 알고리즘)
- **주요 내용**: 설계, 구현, 테스트, 통합 가이드

### [lru-caching.md](01-planning/lru-caching.md)
- **제목**: LRU 캐싱 설계 및 구현
- **목적**: 메모리 효율적 캐싱 전략
- **주요 내용**: 설계, 구현, 성능 지표, 통합 가이드

---

## 🛠️ 개발 문서

### [ARCHITECTURE.md](02-development/ARCHITECTURE.md)
- **제목**: 시스템 아키텍처
- **목적**: 프롬프트 기반 아키텍처 (Phase 5), Keyless 설계
- **주요 내용**:
  - 아키텍처 진화 (Phase 1→5)
  - 시스템 구조 및 컴포넌트
  - 데이터 흐름
  - 웹 스크래핑 전략 (BOJ, Programmers)

### [TOOLS.md](02-development/TOOLS.md)
- **제목**: MCP 도구 레퍼런스
- **목적**: 모든 MCP 도구의 입출력 스키마 및 사용법
- **주요 내용**:
  - BOJ 도구 (analyze_problem, generate_hint, generate_review_template 등)
  - 프로그래머스 도구 (search_programmers_problems, get_programmers_problem)
  - CSS Selectors 및 사용 예시

### [EXTERNAL_API.md](02-development/EXTERNAL_API.md)
- **제목**: 외부 API 통합 가이드
- **목적**: solved.ac API 사용법
- **주요 내용**: 엔드포인트, 에러 처리, 캐싱, 코드 예제

---

## 📊 프로젝트 관리

### [TASKS.md](03-project-management/TASKS.md)
- **제목**: 현재 태스크 관리
- **목적**: Phase별 작업 항목 및 진행 상황 추적
- **주요 내용**: Phase 1-7 태스크, 상태, 우선순위, 인수 조건

### [tasks-backup-20260215.md](03-project-management/tasks-backup-20260215.md)
- **제목**: 태스크 백업 (2026-02-15)
- **목적**: 과거 태스크 기록 보존
- **참고**: 역사적 기록용, TASKS.md를 대신 참조하세요

---

## 🧪 테스트 문서

### [README.md](04-testing/README.md)
- **제목**: 테스트 개요
- **목적**: 테스트 전략 및 실행 방법

### Phase별 테스트 스펙

- [01-spec-phase1.md](04-testing/01-spec-phase1.md) - Phase 1 (검색 기능)
- [02-spec-phase2.md](04-testing/02-spec-phase2.md) - Phase 2 (태그 검색)
- [03-spec-phase3.md](04-testing/03-spec-phase3.md) - Phase 3 (Keyless 아키텍처)
- [test-spec-phase4-2.md](04-testing/test-spec-phase4-2.md) - Phase 4.2 (Rate Limiting)
- [test-spec-phase4-4.md](04-testing/test-spec-phase4-4.md) - Phase 4.4 (LRU 캐싱)
- [test-spec-phase7.md](04-testing/test-spec-phase7.md) - Phase 7 (프로그래머스 통합)

### [e2e-manual-test-guide.md](04-testing/e2e-manual-test-guide.md)
- **제목**: E2E 테스트 가이드
- **목적**: 수동 E2E 테스트 절차 및 시나리오

---

## 🔍 빠른 찾기

### 주제별 문서 찾기

**"프로젝트 목적이 뭔가요?"**
→ [PRD.md](01-planning/PRD.md) - 1.2 문제 정의

**"시스템 구조는 어떻게 되나요?"**
→ [ARCHITECTURE.md](02-development/ARCHITECTURE.md) - 시스템 구조

**"API를 어떻게 호출하나요?"**
→ [EXTERNAL_API.md](02-development/EXTERNAL_API.md) - 코드 예제

**"MCP 도구를 어떻게 사용하나요?"**
→ [TOOLS.md](02-development/TOOLS.md) - 도구별 사용법

**"현재 어떤 작업이 진행 중인가요?"**
→ [TASKS.md](03-project-management/TASKS.md) - 진행 상황

**"프로그래머스는 어떻게 스크래핑하나요?"**
→ [ARCHITECTURE.md](02-development/ARCHITECTURE.md) - 웹 스크래핑 전략

**"플랫폼 자동 선택은 어떻게 동작하나요?"**
→ [PRD.md](01-planning/PRD.md) - 섹션 6 통합 스킬 규칙
→ [.claude/skills/algokit.md](../.claude/skills/algokit.md) - 스킬 정의

**"Rate Limiting은 어떻게 구현하나요?"**
→ [rate-limiting.md](01-planning/rate-limiting.md) - 설계 및 구현

---

## 💡 역할별 필독 문서

### Project Manager
- **필수**: [PRD.md](01-planning/PRD.md), [TASKS.md](03-project-management/TASKS.md)
- **참고**: [SRS.md](01-planning/SRS.md)

### 개발자
- **필수**: [ARCHITECTURE.md](02-development/ARCHITECTURE.md), [TOOLS.md](02-development/TOOLS.md), [EXTERNAL_API.md](02-development/EXTERNAL_API.md)
- **참고**: [SRS.md](01-planning/SRS.md), 테스트 스펙 문서

### QA 엔지니어
- **필수**: 테스트 스펙 문서 (04-testing/), [e2e-manual-test-guide.md](04-testing/e2e-manual-test-guide.md)
- **참고**: [SRS.md](01-planning/SRS.md), [ARCHITECTURE.md](02-development/ARCHITECTURE.md)

### Technical Writer
- **필수**: 모든 문서
- **참고**: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📝 문서 작성 규칙

문서를 작성하거나 수정할 때는 [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하세요.

**핵심 원칙**:
- **명확성**: 기술 용어는 정의하고 사용
- **일관성**: 템플릿과 형식 준수
- **최신성**: 코드 변경 시 문서도 업데이트
- **접근성**: 누구나 이해할 수 있는 언어

---

## 🔄 최근 변경 이력

| 날짜 | 변경 내용 | 담당자 |
|------|-----------|--------|
| 2026-02-16 | 문서 대대적 정리 (36개 → 19개, 47% 감소) | technical-writer |
| 2026-02-16 | TOOLS.md에 프로그래머스 CSS Selectors 통합 | technical-writer |
| 2026-02-16 | ARCHITECTURE.md에 웹 스크래핑 전략 추가 | technical-writer |
| 2026-02-16 | 중복 문서 13개 삭제 (통합 완료) | technical-writer |
| 2026-02-16 | 구버전 테스트 결과 6개 삭제 | technical-writer |
| 2026-02-16 | 마케팅 폴더 삭제 (4개 파일) | technical-writer |
| 2026-02-15 | Rate Limiting 문서 통합 (design + implementation → rate-limiting.md) | technical-writer |
| 2026-02-15 | LRU 캐싱 문서 통합 | technical-writer |

---

## 🗂️ 정리 완료 (2026-02-16)

### 삭제된 문서 (19개)

**프로젝트 관리** (3개):
- task-programmers-url-parsing.md (완료된 태스크)
- documentation-cleanup-plan.md (작업 완료)
- document-organization-guide.md (INDEX.md에 통합)

**기획** (3개):
- rate-limiting-design.md (rate-limiting.md에 통합)
- programmers-analysis.md (분석 완료, 불필요)
- programmers-puppeteer-implementation.md (ARCHITECTURE.md에 핵심만 통합)

**개발** (3개):
- tools-reference.md (TOOLS.md와 중복)
- programmers-selectors.md (TOOLS.md에 통합)
- web-scraping-guide.md (ARCHITECTURE.md에 통합)

**테스트 결과** (6개):
- 01-results-phase1.md
- 02-results-phase2.md
- 03-results-phase3-red.md
- 03-results-phase3.md
- test-results-phase3-keyless.md
- coverage-recovery-report.md

**마케팅** (4개):
- 전체 폴더 삭제 (프로덕션 불필요)

### 통합 완료

1. **TOOLS.md**:
   - tools-reference.md 내용 병합
   - programmers-selectors.md의 CSS Selectors 추가

2. **ARCHITECTURE.md**:
   - web-scraping-guide.md 핵심 내용 통합
   - programmers-puppeteer-implementation.md 핵심만 추가

3. **rate-limiting.md**:
   - rate-limiting-design.md + rate-limiting-implementation.md 통합

4. **lru-caching.md**:
   - 설계 + 구현 통합 문서

---

## 💬 도움이 필요하신가요?

- **문서 작성**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **프로젝트 가이드**: [CLAUDE.md](../CLAUDE.md)
- **에이전트 정의**: [.claude/agents/](../.claude/agents/)

**문서 관련 문의**: technical-writer 에이전트에게 요청하세요.
