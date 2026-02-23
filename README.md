# AlgoKit-mcp

**AI 에이전트와 함께하는 알고리즘 학습 MCP 툴킷 (백준, 프로그래머스 지원)**

AI 기반 힌트 생성, 문제 분석, 복습 템플릿 제공으로 효율적인 알고리즘 학습을 지원합니다.

## 주요 기능

- 🔍 **문제 검색**: 난이도, 태그, 키워드로 문제 검색
- 💡 **단계별 힌트**: Level 1~3 단계별 맞춤 힌트 생성
- 📊 **문제 분석**: 알고리즘 분류, 난이도 분석, 학습 가이드
- 📝 **복습 템플릿**: 자동 생성되는 마크다운 복습 문서
- 🧪 **코드 분석**: 제출 코드의 시간/공간 복잡도 분석 및 개선 제안

## 플랫폼별 설정 경로

| 항목 | Claude Code | Codex | Gemini CLI |
|------|-------------|-------|------------|
| **Skills 기능명** | Skills | Agent Skills | Agent Skills |
| **Skills 호출** | `/skill-name` | `$skill-name` or 자동 | 모델 자율 판단 |
| **MCP 설정 (프로젝트)** | `.mcp.json` | `.codex/config.toml` | `.gemini/settings.json` |
| **MCP 설정 (전역)** | `~/.claude.json` | `~/.codex/config.toml` | `~/.gemini/settings.json` |
| **Skills (프로젝트)** | `.claude/skills/` | `.codex/skills/` | `.gemini/skills/` |
| **Skills (전역)** | `~/.claude/skills/` | `~/.codex/skills/` | `~/.gemini/skills/` |

> Skills는 MCP 서버 첫 기동 시 감지된 플랫폼에 자동 설치됩니다.

---

## 설치

> **Skills 자동 설치**: MCP 서버 첫 기동 시 설치된 AI 에이전트를 자동으로 감지하여 Skills를 설치합니다.

### Claude Code

#### 자동 설치

```bash
# 전역 설정 (모든 프로젝트에서 사용)
claude mcp add --scope user algokit -- npx -y algokit-mcp

# 프로젝트 설정 (.mcp.json 생성)
claude mcp add --scope project algokit -- npx -y algokit-mcp


```

#### 수동 설치

`~/.claude.json` (전역) 편집:

```json
{
  "mcpServers": {
    "algokit": {
      "command": "npx",
      "args": ["-y", "algokit-mcp"]
    }
  }
}
```

또는 프로젝트 루트에 `.mcp.json` 생성 ([예시](.claude/examples/claude-code-config.json)):

```json
{
  "mcpServers": {
    "algokit": {
      "command": "npx",
      "args": ["-y", "algokit-mcp"]
    }
  }
}
```

#### Skills 위치

| 등록 방식 | Skills 위치 |
|----------|------------|
| `--scope user` (전역) | `~/.claude/skills/` |
| `--scope project` (`.mcp.json` 있음) | `<프로젝트>/.claude/skills/` |


---

### Codex

#### 자동 설치

```bash
# 전역 설치
codex mcp add algokit -- npx -y algokit-mcp
```

#### 수동 설치

`~/.codex/config.toml` (전역) 또는 `.codex/config.toml` (프로젝트) 편집 ([예시](.claude/examples/codex-config.toml)):

```toml
[mcp.servers.algokit]
command = "npx"
args = ["-y", "algokit-mcp"]
```

#### Skills 위치

| 등록 방식 | Skills 위치 |
|----------|------------|
| 프로젝트 (`.codex/` 있음) | `<프로젝트>/.codex/skills/` |
| 전역 (`~/.codex/` 있음) | `~/.codex/skills/` |

---

### Gemini CLI

#### 자동 설치

```bash
# 전역 설치
gemini mcp add algokit -- npx -y algokit-mcp
```

#### 수동 설치

`~/.gemini/settings.json` (전역) 또는 `.gemini/settings.json` (프로젝트) 편집 ([예시](.claude/examples/gemini-config.json)):

```json
{
  "mcpServers": {
    "algokit": {
      "command": "npx",
      "args": ["-y", "algokit-mcp"]
    }
  }
}
```

#### Skills 위치

| 등록 방식 | Skills 위치 |
|----------|------------|
| 프로젝트 (`.gemini/` 있음) | `<프로젝트>/.gemini/skills/` |
| 전역 (`~/.gemini/` 있음) | `~/.gemini/skills/` |

## MCP 도구

### 백준 (BOJ)

| 도구 | 설명 |
|------|------|
| `search_problems_boj` | 문제 검색 (티어, 태그, 키워드) |
| `get_problem_boj` | 문제 상세 조회 |
| `search_tags_boj` | 알고리즘 태그 검색 |
| `fetch_problem_content_boj` | 문제 본문 스크래핑 |
| `analyze_problem_boj` | 문제 분석 및 힌트 가이드 |
| `generate_hint_boj` | 3단계 힌트 생성 |
| `generate_review_template_boj` | 복습 템플릿 생성 |
| `analyze_code_submission_boj` | 코드 분석 및 피드백 |

### 프로그래머스 (Programmers)

| 도구 | 설명 |
|------|------|
| `search_problems_programmers` | 문제 검색 (난이도, 카테고리) |
| `get_problem_programmers` | 문제 상세 조회 |
| `fetch_problem_content_programmers` | 문제 본문 스크래핑 |
| `analyze_problem_programmers` | 문제 분석 |
| `generate_hint_programmers` | 힌트 생성 |
| `generate_review_template_programmers` | 복습 템플릿 |
| `analyze_code_submission_programmers` | 코드 분석 |

## Skills

**Skill 이름**: `algo:` (BOJ/프로그래머스 자동 선택)

Claude Code, Codex, Gemini CLI 모두 동일한 `algo:` Skills를 지원합니다.
MCP 서버 첫 기동 시 감지된 에이전트에 자동으로 설치되며, 수동으로도 설치할 수 있습니다.

### 수동 설치

```bash
# Claude Code
cp -r skills/* ~/.claude/skills/          # 전역
cp -r skills/* .claude/skills/            # 프로젝트

# Codex
cp -r skills/* ~/.codex/skills/           # 전역
cp -r skills/* .codex/skills/             # 프로젝트

# Gemini CLI
cp -r skills/* ~/.gemini/skills/          # 전역
cp -r skills/* .gemini/skills/            # 프로젝트
```

### 사용 예시

#### `algo:search` - 문제 검색

```
You: "골드 난이도 DP 문제 추천해줘"

Claude: "백준에서 골드 티어의 DP 문제를 검색했습니다.

**추천 문제 3개:**
1. 🥇 [G5] 12865번 - 평범한 배낭 (✅ 16,234명)
2. 🥇 [G4] 9251번 - LCS (✅ 13,892명)
3. 🥇 [G3] 1932번 - 정수 삼각형 (✅ 18,234명)

어떤 문제부터 시작하시겠어요?"
```

```
You: "https://www.acmicpc.net/problem/1927"

Claude: "백준 1927번 '최소 힙' 문제를 조회했습니다.

**문제 정보:**
- 난이도: 🥈 Silver I
- 분류: 자료구조, 우선순위 큐
- 해결: 28,456명 | 정답률: 47.2%

본문을 보시겠어요? (/algo:fetch)"
```

#### `algo:hint` - 단계별 힌트

```
You: "1927번 힌트 줘"

Claude: "**💡 Level 1 힌트 (접근 방향)**

이 문제는 **우선순위 큐(Priority Queue)** 자료구조를 사용합니다.
Python의 `heapq` 모듈 또는 C++의 `priority_queue`를 활용하면
O(log N) 시간에 최솟값을 찾을 수 있어요.

더 구체적인 힌트가 필요하신가요?"
```

```
You: "더 구체적으로 알려줘"

Claude: "**💡 Level 2 힌트 (구현 방법)**

1. **최소 힙** 사용 (Python: heapq, C++: priority_queue<int, greater<int>>)
2. x가 0이 아니면 → `heappush(x)`
3. x가 0이면 → `heappop()` (빈 경우 0 출력)

시간복잡도: O(N log N)
공간복잡도: O(N)

코드 예시를 보시겠어요? (/algo:hint 정답)"
```

#### `algo:code-review` - 코드 분석

```
You: "1927번 내 코드 분석해줘"
You: [Python 코드 붙여넣기]

Claude: "코드를 분석했습니다! ✨

**✅ 좋은 점:**
- heapq 모듈을 올바르게 사용
- 시간복잡도 O(N log N) 달성

**⚠️ 개선 가능:**
1. `sys.stdin.readline()` 사용 → 입력 속도 개선 (30% 빠름)
2. 빈 힙 체크를 `if heap:` 대신 `if len(heap):`로 명시

**예상 성능:**
- 현재: 약 300ms
- 개선 후: 약 200ms

수정 코드를 보여드릴까요?"
```

#### `algo:review` - 복습 템플릿

```
You: "1927번 복습 문서 만들어줘"

Claude: "복습 템플릿을 생성했습니다! 📝

# 백준 1927번 - 최소 힙

## 문제 요약
최솟값을 빠르게 찾는 자료구조 구현

## 핵심 알고리즘
- **우선순위 큐** (최소 힙)
- 삽입: O(log N), 삭제: O(log N)

## 풀이 과정
1. heapq 모듈 import
2. 입력에 따라 push/pop 수행
...

이 템플릿을 파일로 저장하시겠어요?"
```

---

## 학습 워크플로우

### 새 문제 접근하기

```
1. You: "골드 3~5 DP 문제 추천"
   → Claude: [문제 3개 추천]

2. You: "1932번 본문 보여줘"
   → Claude: [문제 본문 표시]

3. You: "힌트 줘"
   → Claude: [Level 1 힌트]

4. You: "더 구체적으로"
   → Claude: [Level 2 힌트]
```

### 풀이 후 복습하기

```
1. You: "1932번 내 코드 분석해줘" + [코드]
   → Claude: [시간복잡도, 개선점 제시]

2. You: "복습 문서 만들어줘"
   → Claude: [마크다운 템플릿 생성]
```

---

## 사용 방법

### 일반 사용 (자연스러운 대화)
```
You: "골드 DP 문제 추천해줘"
→ Claude가 맥락 파악 → MCP 도구 자동 호출 → 결과 제공
```

### Skill 사용 (명시적 호출, 권장)
```
You: "/algo:search 골드 DP 문제 추천해줘"
→ Skill이 의도 명확히 파악 → 더 정확한 MCP 도구 선택
```

**차이점**: 둘 다 MCP 도구를 호출하지만, Skill 사용 시 더 명시적이고 정확한 응답을 받을 수 있습니다.

## 개발

### 빌드 및 테스트

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 테스트
npm test

# 개발 모드
npm run dev
```

### 프로젝트 구조

```
src/
├── api/           # solved.ac API, BOJ/프로그래머스 scrapping
├── tools/         # MCP 도구 (15개)
├── services/      # 비즈니스 로직
├── prompts/       # 힌트 가이드 프롬프트
└── utils/         # 유틸리티 (캐싱, Rate Limiting)
```

## 기술 스택

- **Runtime**: Node.js (>=18.0.0)
- **Language**: TypeScript 5.9
- **MCP SDK**: @modelcontextprotocol/sdk v1.26.0
- **Validation**: Zod
- **Testing**: Vitest

## 라이선스

MIT

---

<div align="center">

**[GitHub](https://github.com/itsme-shawn/AlgoKit-mcp)** • **[Issues](https://github.com/itsme-shawn/algoKit-mcp/issues)** • **[NPM](https://www.npmjs.com/package/algokit-mcp)**


</div>
