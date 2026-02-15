# AlgoKit

백준 온라인 저지(Baekjoon Online Judge) 및 프로그래머스(Programmers) 알고리즘 문제 학습을 돕는 **통합 MCP(Model Context Protocol) 서버**입니다.

**통합 스킬 `algokit`**을 통해 플랫폼을 자동으로 선택하여, 사용자는 BOJ와 프로그래머스를 구분하지 않고 자연스럽게 학습할 수 있습니다.

## 지원 플랫폼

- ✅ **백준 온라인 저지 (BOJ)**: 문제 검색, 상세 조회, 본문 스크래핑, 힌트 생성, 복습 템플릿, 코드 분석
- ✅ **프로그래머스 (Programmers)**: 문제 검색, 상세 조회

## 통합 스킬: 플랫폼 자동 선택

**스킬명**: `algokit`

사용자 입력을 분석하여 BOJ와 프로그래머스 중 적절한 플랫폼을 자동으로 선택합니다.

### 자동 선택 규칙

1. **명시적 플랫폼 지정**: "백준 1000번", "프로그래머스 42576번" → 자동 처리
2. **URL 제공**: `https://www.acmicpc.net/problem/1000` → BOJ 자동 인식
3. **번호만 제공**: "1000번" → 플랫폼 선택 요청
4. **일반 추천**: "코테 문제 추천해줘" → BOJ 기본 + 프로그래머스 옵션 제안
5. **문제명 검색**: "피보나치 문제" → 두 플랫폼 모두 검색 후 통합 결과 제공

**상세 규칙**: [PRD.md](docs/01-planning/PRD.md) 섹션 6 참조

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

## 설치 및 설정

### 1. 패키지 설치

```bash
# 저장소 클론
git clone https://github.com/your-org/algokit.git
cd algokit

# 의존성 설치
npm install

# 빌드
npm run build
```

### 2. CLI별 설정

AlgoKit은 **Claude Code**, **Codex CLI**, **Gemini CLI** 모두에서 사용 가능합니다.

#### 🎯 Claude Code (추천)

**특징**:
- ✅ **Skill 지원**: 플랫폼 자동 선택 (BOJ ↔ 프로그래머스)
- ✅ **자연어 인터페이스**: "백준 문제 추천해줘" → 자동 처리
- ✅ **URL 자동 파싱**: `acmicpc.net` URL 제공 시 자동 인식

**설정 방법**:

1. MCP 서버 설정 (`~/.config/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "algokit": {
      "command": "node",
      "args": ["/path/to/algokit/build/index.js"]
    }
  }
}
```

2. Skill 파일 복사 (선택사항이지만 **강력 권장**):
```bash
# Skill 파일을 프로젝트 디렉토리에 복사
cp .claude/skills/algokit.md /your/project/.claude/skills/

# 또는 전역 설정
cp .claude/skills/algokit.md ~/.claude/skills/
```

3. Claude Code 재시작

**사용 예시**:
```
You: "백준 골드 난이도 DP 문제 3개 추천해줘"
Claude: [자동으로 search_problems 호출, BOJ 플랫폼 선택]

You: "이 문제 분석해줘: https://www.acmicpc.net/problem/1927"
Claude: [URL 파싱 → analyze_problem(1927) 자동 호출]

You: "프로그래머스에서 Level 2 문제 찾아줘"
Claude: [search_programmers_problems 자동 호출]
```

---

#### 🔧 Codex CLI (OpenAI)

**특징**:
- ✅ **MCP 완전 지원**: 모든 10개 도구 사용 가능
- ⚠️ **Skill 미지원**: 플랫폼 수동 선택 필요
- ⚠️ **도구 이름 명시**: 사용자가 MCP 도구를 직접 지정

**설정 방법**:

1. Codex 설정 파일 (`~/.codex/config.toml` 또는 `.codex/config.toml`):
```toml
[mcp.servers.algokit]
command = "node"
args = ["/path/to/algokit/build/index.js"]
```

2. Codex CLI 재시작

**사용 예시** (수동 호출):
```bash
# BOJ 문제 검색
You: "백준 문제 검색해줘"
Codex: [도구 목록 제시]
You: "search_problems를 사용해서 level_min: 11, level_max: 15로 검색"

# 프로그래머스 문제 상세 조회
You: "get_programmers_problem를 사용해서 42576번 조회"

# 힌트 생성
You: "analyze_problem으로 1927번 분석"
```

**제한사항**:
- URL 자동 파싱 불가 → 사용자가 문제 번호 추출 필요
- 플랫폼 자동 선택 불가 → "백준" vs "프로그래머스" 명시 필요
- 병렬 검색 불가 → 각 플랫폼을 순차적으로 검색

---

#### 🌐 Gemini CLI (Google)

**특징**:
- ✅ **MCP 완전 지원**: 모든 10개 도구 사용 가능
- ⚠️ **Skill 미지원**: 플랫폼 수동 선택 필요
- ✅ **FastMCP 통합**: 간편 설치 지원 (예정)

**설정 방법**:

1. Gemini 설정 파일 (`~/.gemini/config.json` 또는 프로젝트별):
```json
{
  "mcpServers": {
    "algokit": {
      "command": "node",
      "args": ["/path/to/algokit/build/index.js"]
    }
  }
}
```

2. Gemini CLI 재시작

**사용 예시** (수동 호출):
```bash
# BOJ 문제 검색
You: "search_problems 도구로 DP 문제 검색"

# 프로그래머스 문제 검색
You: "search_programmers_problems로 Level 2 문제 찾기"

# 문제 분석
You: "analyze_problem 도구로 1927번 백준 문제 분석"
```

**제한사항**: Codex CLI와 동일

---

### 3. CLI별 기능 비교

| 기능 | Claude Code | Codex CLI | Gemini CLI |
|------|-------------|-----------|------------|
| **MCP 도구 (10개)** | ✅ | ✅ | ✅ |
| **Skill (자동 라우팅)** | ✅ | ❌ | ❌ |
| **플랫폼 자동 선택** | ✅ | ❌ | ❌ |
| **URL 자동 파싱** | ✅ | ❌ | ❌ |
| **병렬 검색** | ✅ | ❌ | ❌ |
| **자연어 인터페이스** | ✅ 완전 지원 | ⚠️ 부분 지원 | ⚠️ 부분 지원 |
| **추천 사용 대상** | 🌟 모든 사용자 | 고급 사용자 | 고급 사용자 |

---

### 💡 빠른 설정 (예시 파일 제공)

설정 예시 파일이 준비되어 있습니다!

**위치**: [`.claude/examples/`](./.claude/examples/)

| CLI | 설정 파일 | 복사 대상 |
|-----|----------|-----------|
| Claude Code | `claude-code-config.json` | `~/.config/Claude/claude_desktop_config.json` |
| Codex CLI | `codex-config.toml` | `~/.codex/config.toml` |
| Gemini CLI | `gemini-config.json` | `~/.gemini/config.json` |

**빠른 시작**:
```bash
# 1. 예시 파일 복사 (Codex CLI 예시)
cp .claude/examples/codex-config.toml ~/.codex/config.toml

# 2. 파일 열기
nano ~/.codex/config.toml

# 3. 경로 수정: /absolute/path/to/algokit/build/index.js → 실제 경로

# 4. CLI 재시작
```

상세한 설명은 [`.claude/examples/README.md`](./.claude/examples/README.md) 참조

---

### 4. 설치 확인

MCP 서버가 정상적으로 등록되었는지 확인:

**Claude Code**:
```bash
# MCP Inspector로 테스트
npx @modelcontextprotocol/inspector node build/index.js
```

**Codex CLI**:
```bash
# MCP 도구 목록 확인
mcp-cli tools algokit
```

**Gemini CLI**:
```bash
# 설정 확인
gemini config list
```

### 5. 트러블슈팅

#### "MCP 서버를 찾을 수 없습니다"
- 빌드가 완료되었는지 확인: `npm run build`
- 설정 파일의 경로가 절대 경로인지 확인
- CLI 재시작

#### "도구가 동작하지 않습니다"
- MCP Inspector로 직접 테스트: `npx @modelcontextprotocol/inspector node build/index.js`
- 에러 로그 확인: `stderr` 출력 체크
- Node.js 버전 확인: `>=18.0.0` 필요

#### Codex/Gemini에서 플랫폼 선택이 안 됩니다
- 정상입니다! Skill 미지원 CLI에서는 사용자가 명시적으로 도구를 지정해야 합니다.
- 해결책: Claude Code 사용 또는 도구 이름 직접 지정

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
