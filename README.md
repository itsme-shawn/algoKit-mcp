# AlgoKit

백준 온라인 저지(Baekjoon Online Judge) 및 프로그래머스(Programmers) 알고리즘 문제 학습을 돕는 MCP(Model Context Protocol) 서버입니다.

## 지원 플랫폼

- ✅ **백준 온라인 저지 (BOJ)**: 문제 검색, 상세 조회, 본문 스크래핑, 코드 분석
- ✅ **프로그래머스 (Programmers)**: 문제 검색, 상세 조회

## 기능

### BOJ 도구
- 문제 검색 및 필터링 (티어, 태그, 키워드)
- 문제 상세 정보 조회
- 태그 검색
- 문제 본문 스크래핑 (HTML 파싱)
- 단계별 힌트 생성
- 복습 문서 자동 생성
- 코드 분석 및 피드백

### 프로그래머스 도구
- 문제 검색 (난이도, 카테고리, 정렬, 키워드)
- 문제 상세 조회 (제목, 설명, 제한사항, 예제)

## 설치

```bash
npm install
```

## 개발

### 빌드

```bash
npm run build
```

### 개발 모드 실행

```bash
npm run dev
```

### 테스트

#### 전체 테스트 실행
```bash
npm test
```

#### 워치 모드 (개발 중)
```bash
npm run test:watch
```

#### 커버리지 포함 실행
```bash
npm test -- --coverage
```

#### 특정 파일만 실행
```bash
npm test tests/utils/tier-converter.test.ts
```

### 현재 테스트 상태

- ✅ **140개 테스트 모두 통과**
- ✅ **커버리지 96.27%** (목표: 80%)
- ✅ Phase 1 기반 구축 완료

| 메트릭 | 달성률 |
|--------|--------|
| Statements | 96.27% |
| Branches | 92.53% |
| Functions | 97.05% |
| Lines | 96.66% |

## MCP 도구 목록

### BOJ (백준)
- `search_problems`: 문제 검색 (티어, 태그, 키워드)
- `get_problem`: 문제 상세 조회
- `search_tags`: 알고리즘 태그 검색
- `fetch_problem_content`: 문제 본문 스크래핑 (HTML)
- `analyze_problem`: 문제 메타데이터 분석
- `generate_hint`: 3단계 힌트 가이드 생성
- `generate_review_template`: 복습 템플릿 생성
- `analyze_code_submission`: 코드 분석 및 피드백

### 프로그래머스 (Programmers)
- `search_programmers_problems`: 문제 검색 (난이도, 카테고리, 정렬, 키워드)
- `get_programmers_problem`: 문제 상세 조회 (제목, 설명, 제한사항, 예제)

## 프로젝트 구조

```
AlgoKit/
├── src/
│   ├── api/
│   │   ├── solvedac-client.ts      # solved.ac API 클라이언트
│   │   ├── boj-scraper.ts          # BOJ 스크래퍼
│   │   ├── programmers-scraper.ts  # 프로그래머스 스크래퍼
│   │   └── types.ts                # API 타입 정의
│   ├── tools/
│   │   ├── search-problems.ts
│   │   ├── get-problem.ts
│   │   ├── search-tags.ts
│   │   ├── fetch-problem-content.ts
│   │   ├── analyze-problem.ts
│   │   ├── generate-hint.ts
│   │   ├── generate-review-template.ts
│   │   ├── analyze-code-submission.ts
│   │   ├── search-programmers-problems.ts  # 프로그래머스 검색
│   │   └── get-programmers-problem.ts      # 프로그래머스 상세
│   ├── utils/
│   │   ├── tier-converter.ts       # 티어 변환 유틸리티
│   │   ├── lru-cache.ts            # LRU 캐시
│   │   ├── rate-limiter.ts         # Rate Limiting
│   │   ├── html-parser.ts          # HTML 파싱 (BOJ + 프로그래머스)
│   │   └── url-parser.ts           # URL 파싱 (프로그래머스)
│   └── index.ts                    # MCP 서버 진입점
├── tests/
│   ├── api/                        # API 테스트
│   ├── tools/                      # 도구 테스트
│   ├── utils/                      # 유틸리티 테스트
│   └── __mocks__/                  # Mock 데이터
├── docs/
│   ├── INDEX.md                    # 문서 탐색 가이드
│   ├── 01-planning/                # 기획 및 설계
│   ├── 02-development/             # 개발 가이드
│   ├── 03-project-management/      # 프로젝트 관리
│   └── 04-testing/                 # 테스트 문서
└── vitest.config.ts                # 테스트 설정
```

## 기술 스택

- **Runtime**: Node.js (ES2022)
- **Language**: TypeScript 5.9.3
- **MCP SDK**: @modelcontextprotocol/sdk v1.26.0
- **Validation**: Zod v4.3.6
- **Testing**: vitest v4.0.18

## 티어 시스템

백준 문제는 1-30 스케일로 평가됩니다:

| 레벨 | 티어 | 색상 |
|------|------|------|
| 1-5 | Bronze V-I | 🟤 |
| 6-10 | Silver V-I | ⚪ |
| 11-15 | Gold V-I | 🟡 |
| 16-20 | Platinum V-I | 🟢 |
| 21-25 | Diamond V-I | 🔵 |
| 26-30 | Ruby V-I | 🔴 |

### ✨ 직관적인 티어 입력 (NEW)

문제 검색 시 **숫자(1-30)** 또는 **티어 문자열** 형식을 모두 지원합니다:

```typescript
// 방법 1: 숫자 형식
{ level_min: 8, level_max: 15 }

// 방법 2: 한글 티어명 + 숫자
{ level_min: "실버 3", level_max: "골드 1" }

// 방법 3: 영문 티어명 + 로마 숫자
{ level_min: "Silver III", level_max: "Gold I" }

// 방법 4: 축약형
{ level_min: "실 3", level_max: "골 1" }

// 방법 5: 혼용
{ level_min: 8, level_max: "골드 1" }
```

**지원하는 티어명**:
- 한글: 브론즈/실버/골드/플래티넘/다이아몬드/루비
- 축약형: 브/실/골/플래/플/다이아/다/루
- 영문: Bronze/Silver/Gold/Platinum/Diamond/Ruby
- 대소문자 무관

**등급 표기**:
- 숫자: 1, 2, 3, 4, 5 (5가 가장 낮음)
- 로마 숫자: I, II, III, IV, V (V가 가장 낮음)

## 문서

- [테스트 스펙](docs/test-spec-phase1.md)
- [테스트 결과 리포트](docs/test-report-phase1.md)
- [프로젝트 가이드](CLAUDE.md)

## 개발 현황

**현재 Phase**: Phase 7 - 프로그래머스 통합 진행 중 🚧

### 완료된 Phase
- ✅ Phase 1: 기반 구축 (solved.ac API, 티어 변환, 캐싱)
- ✅ Phase 2: 핵심 도구 (문제 검색, 상세 조회, 태그 검색)
- ✅ Phase 3: 고급 기능 (Keyless 아키텍처)
- ✅ Phase 5: 프롬프트 기반 아키텍처 (힌트, 복습)
- ✅ Phase 6: BOJ 문제 본문 스크래핑 및 코드 분석
- 🚧 Phase 4: 완성도 & 최적화 (진행 중 - Rate Limiting ✅, LRU 캐싱 ✅)

### 진행 중 Phase
- 🚧 **Phase 7: 프로그래머스 통합** (62.5% 완료)
  - ✅ Task 7.2: 검색 기능 (Puppeteer)
  - ✅ Task 7.3: 문제 상세 조회 (cheerio)
  - ✅ Task 7.5: MCP 도구 구현 (2개)
  - 📋 Task 7.7: 테스트 코드 작성
  - 📋 Task 7.8: 문서 업데이트

### 전체 진행률
- 90% 완료 (32/35 태스크)

## 라이선스

ISC
