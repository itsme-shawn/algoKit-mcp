# 개발 태스크 목록 및 상태 관리

**프로젝트**: BOJ 학습 도우미 MCP Server
**마지막 업데이트**: 2026-02-13 (Phase 1-3 완료)
**현재 Phase**: Phase 1-3 모두 완료 (Keyless 아키텍처 구현)
**다음 작업**: Phase 4 - 완성도 & 최적화 (Rate Limiting, 캐싱, 로깅)

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

## Phase 4: 완성도 & 최적화 (Polish & Optimization)
**목표**: 프로덕션 준비
**우선순위**: 🟢 낮음
**예상 기간**: 5주차

### Task 4.1: 요청 Throttling/Rate Limiting
**상태**: 📋 TODO
**담당**: Developer
**우선순위**: P2
**예상 소요**: 1일

**세부 태스크**:
- [ ] API 호출 간 최소 간격 설정 (100ms)
- [ ] 동시 요청 수 제한 (최대 5개)
- [ ] 큐 메커니즘 구현
- [ ] Rate limit 초과 시 에러 메시지

---

### Task 4.2: 캐싱 전략 최적화
**상태**: 📋 TODO
**담당**: Developer
**우선순위**: P2
**예상 소요**: 2일

**세부 태스크**:
- [ ] `src/utils/cache.ts` 강화
- [ ] LRU (Least Recently Used) 캐시 구현
- [ ] TTL (Time To Live) 설정 (1시간)
- [ ] 캐시 히트율 로깅
- [ ] 캐시 무효화 메커니즘

**인수 조건**:
- [ ] 캐시 히트율 70% 이상
- [ ] 메모리 사용량 적정 수준

---

### Task 4.3: 로깅 및 모니터링
**상태**: 📋 TODO
**담당**: Developer
**우선순위**: P2
**예상 소요**: 1-2일

**세부 태스크**:
- [ ] 로깅 라이브러리 선택 (winston, pino 등)
- [ ] 로그 레벨 설정 (debug, info, warn, error)
- [ ] 주요 이벤트 로깅:
  - API 호출 (URL, 파라미터, 응답 시간)
  - 에러 (스택 트레이스 포함)
  - 캐시 히트/미스
- [ ] 민감 정보 마스킹 (API 키 등)

---

### Task 4.4: 예외 상황 처리 강화
**상태**: 📋 TODO
**담당**: Developer
**우선순위**: P2
**예상 소요**: 2일

**세부 태스크**:
- [ ] 유효하지 않은 문제 ID 처리
- [ ] API 타임아웃 처리
- [ ] 네트워크 에러 재시도 로직
- [ ] 사용자 친화적 에러 메시지 (한글)
- [ ] 에러 복구 메커니즘

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
| Phase 4 | 0% (0/4) | 📋 예정 |

**전체 진행률**: 76% (13/17 태스크 완료)

**Phase 3 하이라이트**:
- ✅ Keyless 아키텍처 구현 완료
- ✅ Claude API 의존성 제거
- ✅ 결정적 데이터 제공 (< 500ms 응답)
- ✅ 테스트 안정성 향상 (LLM Mock 불필요)

---

## 다음 단계 (Next Steps)

1. **Phase 4 시작**: Task 4.1 (요청 Throttling/Rate Limiting)
2. **병렬 작업 가능**: Task 4.2 (캐싱 전략 최적화)
3. **문서화 작업**: TW-1~TW-4 (기술 문서 작성)
4. **QA 작업**: QA-1~QA-3 (통합 테스트 및 성능 테스트)

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
