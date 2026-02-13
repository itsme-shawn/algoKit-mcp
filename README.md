# cote-mcp-server

백준 온라인 저지(Baekjoon Online Judge) 알고리즘 문제 학습을 돕는 MCP(Model Context Protocol) 서버입니다.

## 기능

- 문제 검색 및 필터링 (티어, 태그, 키워드)
- 문제 상세 정보 조회
- 태그 검색
- 단계별 힌트 생성 (예정)
- 복습 문서 자동 생성 (예정)

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

## 프로젝트 구조

```
cote-mcp-server/
├── src/
│   ├── api/
│   │   ├── solvedac-client.ts  # solved.ac API 클라이언트
│   │   └── types.ts            # API 타입 정의
│   ├── utils/
│   │   ├── tier-converter.ts   # 티어 변환 유틸리티
│   │   └── cache.ts            # 캐싱 유틸리티
│   └── index.ts                # MCP 서버 진입점
├── tests/
│   ├── api/                    # API 테스트
│   ├── utils/                  # 유틸리티 테스트
│   └── __mocks__/              # Mock 데이터
├── docs/
│   ├── test-spec-phase1.md     # 테스트 스펙
│   └── test-report-phase1.md   # 테스트 결과 리포트
└── vitest.config.ts            # 테스트 설정
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

**현재 Phase**: Phase 1 - 기반 구축 ✅ 완료

- [x] 프로젝트 구조 설정
- [x] TypeScript 설정
- [x] solved.ac API 클라이언트 구현
- [x] 티어 변환 유틸리티
- [x] 캐싱 시스템
- [x] 단위 테스트 작성 (140개)
- [ ] Phase 2: MCP 도구 구현 (예정)

## 라이선스

ISC
