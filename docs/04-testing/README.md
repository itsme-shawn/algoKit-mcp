# 테스트 문서 가이드

**프로젝트**: cote-mcp-server (BOJ 학습 도우미 MCP Server)
**테스트 전략**: TDD (Test-Driven Development)
**마지막 업데이트**: 2026-02-13

---

## 📁 문서 구조

### 테스트 스펙 (Test Specifications)
각 Phase별 상세 테스트 케이스 정의

- `01-spec-phase1.md` - Phase 1: 기반 구축 테스트 스펙
- `02-spec-phase2.md` - Phase 2: 핵심 도구 테스트 스펙
- `03-spec-phase3.md` - Phase 3: 고급 기능 테스트 스펙

### 테스트 결과 (Test Results)
각 Phase별 테스트 실행 결과 및 커버리지

- `01-results-phase1.md` - Phase 1 테스트 결과
- `02-results-phase2.md` - Phase 2 테스트 결과
- `03-results-phase3.md` - Phase 3 테스트 결과
- `03-results-phase3-red.md` - Phase 3 TDD Red 단계 (실패하는 테스트)

---

## 🔄 TDD 워크플로우

### Red → Green → Refactor

```
┌─────────────────────────────────────────────────────────────┐
│ Phase N: 기능 구현                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1️⃣ RED: 실패하는 테스트 작성                                │
│     └─ 📄 0N-spec-phaseN.md 작성                            │
│     └─ ✍️  테스트 케이스 구현 (실패 예상)                    │
│     └─ 📊 0N-results-phaseN-red.md 작성                     │
│                                                              │
│  2️⃣ GREEN: 테스트 통과하는 최소 코드 작성                     │
│     └─ 💻 기능 구현                                          │
│     └─ ✅ 테스트 통과 확인                                   │
│     └─ 📊 0N-results-phaseN.md 업데이트                     │
│                                                              │
│  3️⃣ REFACTOR: 코드 개선                                      │
│     └─ ♻️  리팩토링                                          │
│     └─ ✅ 테스트 여전히 통과 확인                            │
│     └─ 📊 0N-results-phaseN.md 최종 업데이트                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase별 테스트 범위

### Phase 1: 기반 구축
**목표**: 프로젝트 구조, API 클라이언트, 유틸리티
**테스트 대상**:
- ✅ Tier Converter (티어 변환 유틸리티)
- ✅ solved.ac API 클라이언트 (기본 기능)

**문서**:
- 📄 스펙: `01-spec-phase1.md`
- 📊 결과: `01-results-phase1.md`

---

### Phase 2: 핵심 도구
**목표**: 문제 검색 및 조회 MCP 도구
**테스트 대상**:
- 🔲 search_problems (문제 검색)
- 🔲 get_problem (문제 상세 조회)
- 🔲 search_tags (태그 검색)
- 🔲 MCP 서버 통합

**문서**:
- 📄 스펙: `02-spec-phase2.md`
- 📊 결과: `02-results-phase2.md`

---

### Phase 3: 고급 기능
**목표**: 힌트 생성 및 복습 시스템
**테스트 대상**:
- ✅ HintGenerator (힌트 생성 서비스)
- ✅ ReviewGenerator (복습 생성 서비스)
- ✅ get-hint (힌트 도구)
- ✅ create-review (복습 도구)

**문서**:
- 📄 스펙: `03-spec-phase3.md`
- 📊 결과 (Red): `03-results-phase3-red.md`
- 📊 결과 (Green): `03-results-phase3.md`

---

## 🎯 테스트 커버리지 목표

| Phase | 목표 커버리지 | 현재 상태 |
|-------|-------------|----------|
| Phase 1 | 90%+ | ✅ 100% (61/61 통과) |
| Phase 2 | 85%+ | 🔲 미구현 |
| Phase 3 | 85%+ | ⚠️ 75% (39/52 통과) |

**전체 목표**: 85% 이상

---

## 📝 테스트 스펙 작성 가이드

### 스펙 문서 구조
```markdown
# Phase N: [Phase 이름] 테스트 스펙

## 개요
- 목표
- 테스트 대상
- 의존성

## TC-N.M.K: [테스트 케이스 이름]
**파일**: `tests/path/to/test.ts`
**타입**: Unit / Integration / E2E
**우선순위**: P0 / P1 / P2

### 테스트 시나리오
1. Given (전제 조건)
2. When (실행)
3. Then (예상 결과)

### 코드 예시
\`\`\`typescript
// 테스트 코드
\`\`\`

### 성공 기준
- [ ] 조건 1
- [ ] 조건 2
```

### 결과 문서 구조
```markdown
# Phase N: [Phase 이름] 테스트 결과

## 실행 정보
- 실행 일시
- 테스트 프레임워크
- 실행 명령어

## 테스트 결과 요약
- 전체 테스트: X개
- 성공: Y개
- 실패: Z개
- 커버리지: N%

## 상세 결과
### TC-N.M.K: [테스트 케이스 이름]
- 상태: ✅ PASS / ❌ FAIL
- 실행 시간: Xms
- 에러 메시지 (실패 시)
```

---

## 🛠️ 테스트 실행 명령어

### 전체 테스트 실행
```bash
npm test
```

### 특정 파일 테스트
```bash
npm test -- tests/path/to/test.test.ts
```

### 커버리지 포함 실행
```bash
npm test -- --coverage
```

### Watch 모드
```bash
npm test -- --watch
```

### 특정 테스트 케이스만 실행
```bash
npm test -- -t "테스트 케이스 이름"
```

---

## 📊 테스트 리포팅

### 자동 생성되는 보고서
- `coverage/` - 커버리지 리포트 (HTML)
- `.vitest/` - Vitest 실행 정보

### 수동 작성 문서
- `0N-results-phaseN.md` - Phase별 테스트 결과 요약
- `0N-results-phaseN-red.md` - TDD Red 단계 스냅샷

---

## ✅ 체크리스트

### 새 Phase 테스트 추가 시
- [ ] `0N-spec-phaseN.md` 작성
- [ ] 테스트 케이스 구현 (Red 단계)
- [ ] `0N-results-phaseN-red.md` 작성 (실패 확인)
- [ ] 기능 구현 (Green 단계)
- [ ] `0N-results-phaseN.md` 작성 (성공 확인)
- [ ] 리팩토링 및 최종 검증

### 테스트 실패 시
- [ ] 실패 원인 분석
- [ ] 버그 수정 또는 테스트 수정
- [ ] 재실행 및 결과 문서 업데이트
- [ ] 회귀 테스트 추가 (필요 시)

---

## 🔗 관련 문서

- [tasks.md](../03-project-management/tasks.md) - 개발 태스크 목록
- [workflow.md](../01-planning/workflow.md) - TDD + SDD 워크플로우
- [architecture.md](../01-planning/architecture.md) - 시스템 아키텍처

---

**문서 작성자**: qa-testing-agent
**검토자**: project-planner
