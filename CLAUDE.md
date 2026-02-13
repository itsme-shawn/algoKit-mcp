# cote-mcp-server : 코딩테스트 어시스턴트 MCP Server

## 프로젝트 개요

백준 온라인 저지(BOJ) 알고리즘 문제 학습을 돕는 MCP 서버.
**백준 ID 기반으로 풀이 이력을 분석하고, 학습 리포트와 문제별 복기 피드백 파일을 자동 생성**

**프로젝트 이름**: `cote-mcp`
**스킬 Prefix**: `cote:`

---

## 핵심 기능

### 1. 필수 기능 ✅
- **analyze_problem**: 문제 분석 및 구조화된 힌트 데이터 제공 (Phase 3 완료)
- **generate_review_template**: 복습 템플릿 및 가이드 프롬프트 생성 (Phase 3 완료)

### 2. 부가 기능 ✅
- **search_problems**: 필터 기반 문제 검색 (Phase 1-2 완료)
- **get_problem**: 문제 상세 정보 조회 (Phase 1-2 완료)
- **search_tags**: 알고리즘 태그 검색 (Phase 1-2 완료)

### 3. 향후 계획
- **analyze_user**: 백준 ID로 전체 풀이 이력 분석 → `{boj_id}_learning_report.md` (Phase 4)

---

## 기술 스택

- **MCP SDK**: `@modelcontextprotocol/sdk` v1.26.0
- **TypeScript**: 5.9.3
- **Node.js**: ES2022
- **Zod**: 스키마 검증
- **solved.ac API**: BOJ 문제 데이터
- **vitest**: 테스팅

---

## 프로젝트 구조

```
cote-mcp/
├── src/
│   ├── index.ts                   # MCP 서버 진입점
│   ├── api/                       # solved.ac API 클라이언트
│   ├── tools/                     # MCP 도구들
│   ├── services/                  # 비즈니스 로직
│   └── utils/                     # 유틸리티
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
7. **/gitcommit** 실행 → 커밋 계획 작성 → 사용자 승인

**상세 워크플로우**: `docs/01-planning/workflow.md` 참조

---

## Git 작업 방식

### 커밋 프로세스
1. 작업 단위 분리
2. `stash/commit/YYYYMMDD_to_commit.md` 계획 파일 생성
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

## Keyless 아키텍처

**Phase 3에서 도입된 설계 원칙**:

### 원칙
- **MCP 서버**: 결정적(Deterministic) 데이터만 제공
- **Claude Code**: 자연어 생성 담당
- **Zero Configuration**: API 키 불필요
- **테스트 안정성**: LLM Mock 불필요

### 데이터 흐름
```
User → Claude Code → cote-mcp (JSON) → Claude Code → User (자연어)
```

### 장점
1. **사용자 경험**: API 키 설정 없이 즉시 사용 가능
2. **개발 효율**: 테스트 안정성 향상 (결정적 출력)
3. **응답 속도**: LLM 호출 없이 < 500ms 응답
4. **유지보수**: 힌트 패턴 수정이 코드 레벨에서 가능

### 구현 예시
**analyze_problem**:
- MCP 서버: `ProblemAnalysis` JSON 반환 (힌트 포인트 3단계 포함)
- Claude Code: Level 2 힌트 요청 시 `hint_points[1]`을 자연어로 변환

**generate_review_template**:
- MCP 서버: 템플릿 + 가이드 프롬프트 반환
- Claude Code: 프롬프트로 사용자와 대화하며 복습 문서 작성

---

## 빠른 참조

- **프로젝트 목적**: [docs/01-planning/PRD.md](docs/01-planning/PRD.md)
- **시스템 구조**: [docs/01-planning/architecture.md](docs/01-planning/architecture.md)
- **API 사용법**: [docs/02-development/api-integration.md](docs/02-development/api-integration.md)
- **MCP 도구**: [docs/02-development/tools-reference.md](docs/02-development/tools-reference.md)
- **현재 작업**: [docs/03-project-management/tasks.md](docs/03-project-management/tasks.md)

---
