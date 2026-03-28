# AlgoKit-mcp

**AI 에이전트와 함께하는 알고리즘 학습 MCP 툴킷 (백준, 프로그래머스 지원)**

AI 기반 힌트 생성, 문제 분석, 복습 템플릿 제공으로 효율적인 알고리즘 학습을 지원합니다.

## 주요 기능

- 🔍 **문제 검색**: 난이도, 태그, 키워드로 문제 검색
- 💡 **단계별 힌트**: Level 1~3 단계별 맞춤 힌트 생성
- 📊 **문제 분석**: 알고리즘 분류, 난이도 분석, 학습 가이드
- 📝 **복습 템플릿**: 자동 생성되는 마크다운 복습 문서
- 🧪 **코드 분석**: 제출 코드의 시간/공간 복잡도 분석 및 개선 제안

## 설치

### Claude Code (Plugin) — MCP + Skills 원클릭 설치

```
/plugin marketplace add itsme-shawn/AlgoKit-mcp
/plugin install algokit@AlgoKit-mcp
```

이 명령 하나로 **MCP 서버와 6개 Skills가 모두 설치**됩니다.

#### MCP만 별도 설치 (Skills 없이)

```bash
# CLI
claude mcp add --scope user algokit -- npx -y algokit-mcp@latest

# 또는 수동: ~/.claude.json 에 추가
```

```json
{
  "mcpServers": {
    "algokit": {
      "command": "npx",
      "args": ["-y", "algokit-mcp@latest"]
    }
  }
}
```

---

### Codex

Codex에게 아래 문장을 입력하세요:

```
Fetch and follow instructions from https://raw.githubusercontent.com/itsme-shawn/AlgoKit-mcp/refs/heads/master/.codex/INSTALL.md
```

또는 수동으로 MCP 설정:

```toml
# .codex/config.toml
[mcp.servers.algokit]
command = "npx"
args = ["-y", "algokit-mcp@latest"]
```

---

### Gemini CLI

```bash
gemini extensions install https://github.com/itsme-shawn/AlgoKit-mcp
```

또는 수동으로 MCP 설정:

```json
// .gemini/settings.json
{
  "mcpServers": {
    "algokit": {
      "command": "npx",
      "args": ["-y", "algokit-mcp@latest"]
    }
  }
}
```

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
MCP 서버 첫 기동 시 감지된 에이전트에 자동으로 설치됩니다.

| Skill | 기능 | 사용 예시 |
|-------|------|----------|
| `algo:search` | 문제 검색 | `/algo:search 골드 DP 문제 추천해줘` |
| `algo:fetch` | 문제 본문 크롤링 | `/algo:fetch 11726` |
| `algo:hint` | 단계별 힌트 | `/algo:hint 11726` |
| `algo:code-review` | 코드 분석/피드백 | `/algo:code-review @11726.py` |
| `algo:blank` | 빈칸 연습 코드 생성 | `/algo:blank @11726.py` |
| `algo:review` | 복습 문서 생성 | `/algo:review 11726` |

> 자연어로 질문해도 AI가 맥락을 파악하여 MCP 도구를 자동 호출합니다.
> Skill(`/algo:*`)을 사용하면 의도가 더 명확해져 정확한 응답을 받을 수 있습니다.

---

## 사용 시나리오

> 모든 결과는 AlgoKit MCP 서버를 실제 호출하여 얻은 데이터입니다.

### 1. 문제 검색

#### User:
```
BOJ에서 실버상위~골드 난이도 DP 문제 찾아줘
```

Skill 사용 시,
```
/algo:search BOJ에서 실버상위~골드 난이도 DP 문제 찾아줘
```

#### AI Agent:

```
⏺ Skill(algo:search)
  ⎿  Successfully loaded skill

⏺ BOJ에서 실버 상위~골드 난이도 DP 문제를 검색하겠습니다.

⏺ algokit - search_problems_boj (MCP)
  (tags: "dp", level_min: "8", level_max: "15", sort: "level", direction: "asc")

     **총 1909개 문제** (1페이지)

⏺ 총 1,909개의 DP 문제가 Silver III ~ Gold I 범위에 있습니다.

  Silver III (실버 3)

  ┌───────┬────────────────┬──────────┐
  │ 번호  │      제목      │  해결자  │
  ├───────┼────────────────┼──────────┤
  │ 1463  │ 1로 만들기     │ 87,355명 │
  ├───────┼────────────────┼──────────┤
  │ 9095  │ 1, 2, 3 더하기 │ 72,673명 │
  ├───────┼────────────────┼──────────┤
  │ 11726 │ 2×n 타일링     │ 65,411명 │
  ├───────┼────────────────┼──────────┤
  │ 2579  │ 계단 오르기    │ 64,700명 │
  ├───────┼────────────────┼──────────┤
  │ 14501 │ 퇴사           │ 42,532명 │
  └───────┴────────────────┴──────────┘

  다음 페이지에서 Silver II ~ Gold 난이도 문제도 볼까요?
```

---

### 2. 문제 내용 요약

#### User:
```
BOJ 11726 문제 내용 요약해줘
```

Skill 사용 시,
```
/algo:fetch 11726
```

#### AI Agent:

```
⏺ algokit - fetch_problem_content_boj (MCP)(problem_id: 11726)

⏺ BOJ 11726 - 2×n 타일링

  2×n 크기의 직사각형을 1×2, 2×1 타일로 빈틈없이 채우는 방법의 수를
  구하는 문제입니다.

  ┌─────────────┬──────────────────────────────────┐
  │    항목     │               내용               │
  ├─────────────┼──────────────────────────────────┤
  │ 입력        │ 정수 n (1 ≤ n ≤ 1,000)           │
  ├─────────────┼──────────────────────────────────┤
  │ 출력        │ 방법의 수를 10,007로 나눈 나머지 │
  ├─────────────┼──────────────────────────────────┤
  │ 시간/메모리 │ 1초 / 256MB                      │
  └─────────────┴──────────────────────────────────┘

  예제: n=2 → 2, n=9 → 55
```

---

### 3. 힌트 받기

#### User:
```
이 문제, 접근에 대한 힌트를 줘
```

Skill 사용 시,
```
/algo:hint 11726
```

#### AI Agent:

```
⏺ algokit - analyze_problem_boj (MCP)(problem_id: 11726)

⏺ BOJ 11726 — 2×n 타일링 (Silver III)

  Level 1 힌트: 문제 분석

  작은 경우부터 직접 그려보세요. n=1, n=2, n=3, n=4일 때 2×n 직사각형을
  채우는 방법이 각각 몇 가지인지 손으로 나열해 보면, 이전 결과들이 다음
  결과를 만드는 데 재활용되는 패턴이 보일 겁니다.

  "n번째를 채우려면 직전에 어떤 상태에서 올 수 있는가?"를 생각해 보세요.

  ---
  더 구체적인 힌트가 필요하면 말씀해 주세요!
```

> MCP 서버가 구조화된 데이터 + 가이드 프롬프트를 반환하면,
> Claude가 문제에 맞는 자연어 분석을 생성합니다.

---

### 4. 힌트 더 받기

#### User:
```
잘 안 풀리네. 힌트를 좀 더 줘
```

#### AI Agent:

```
⏺ Level 2 힌트: 핵심 아이디어

  이 문제는 다이나믹 프로그래밍(DP) 문제입니다.

  핵심은 2×n 직사각형의 맨 오른쪽 열을 채우는 방법이 딱 두 가지뿐이라는
  점입니다:

  1. 세로 타일 1개 (2×1) → 나머지는 2×(n-1) 채우기
  2. 가로 타일 2개 (1×2 두 개) → 나머지는 2×(n-2) 채우기

  즉, f(n)을 구하려면 f(n-1)과 f(n-2)만 알면 됩니다.

  ---
  더 상세한 풀이 가이드가 필요하면 말씀해 주세요.
```

사용자 상황에 따라 **한 번에 1개 레벨만** 제공:

| Level | 시점 | 제공 내용 |
|-------|------|----------|
| Level 1 | 처음 시도할 때 | 알고리즘명 없이 구조적 특징만 암시 |
| Level 2 | "더 알려줘" 요청 시 | 알고리즘 유형 명시 + 핵심 아이디어 |
| Level 3 | "정답 알려줘" 요청 시 | 단계별 전략 + 의사코드 수준 설명 |

---

### 5. 빈칸 힌트

#### User:
```
정답 코드에 빈 칸을 뚫어서 힌트를 줘
11726_blank.py 에 작성해줘
```

Skill 사용 시,
```
/algo:blank @11726.py
```

#### AI Agent:

```
⏺ algokit - fetch_problem_content_boj (MCP)(problem_id: 11726)

⏺ Write(11726_blank.py)
  ⎿  Wrote 26 lines to 11726_blank.py
       1 # BOJ 11726 - 2×n 타일링
       2 # https://www.acmicpc.net/problem/11726
       3 #
       4 # 점화식 힌트:
       5 #   - 맨 오른쪽에 세로 타일 1개 → f(n-1)
       6 #   - 맨 오른쪽에 가로 타일 2개 → f(n-2)
       7
       8 n = int(input())
       9
      10 # TODO 1: dp 배열 초기화 (크기: n+1, 초깃값: 0)
      11 dp = ____
      12
      13 # TODO 2: 기저 조건 설정
      14 dp[1] = ____
      15 dp[2] = ____
      16
      17 # TODO 3: 점화식을 이용해 dp[3] ~ dp[n] 채우기
      18 for i in range(3, n + 1):
      19     dp[i] = ____
      20
      21 # TODO 4: 결과 출력 (10007로 나눈 나머지)
      22 print(____)

⏺ 11726_blank.py에 빈칸 버전을 작성했습니다. 총 4개의 TODO가 있습니다:

  ┌──────┬─────────────────────────────────────────────────┐
  │ TODO │                      힌트                       │
  ├──────┼─────────────────────────────────────────────────┤
  │ 1    │ dp 배열을 어떤 크기로, 어떻게 초기화할지        │
  ├──────┼─────────────────────────────────────────────────┤
  │ 2    │ dp[1]과 dp[2]의 기저값 (직접 손으로 세어보세요) │
  ├──────┼─────────────────────────────────────────────────┤
  │ 3    │ dp[i] = ? — Level 2 힌트에서 알려드린 점화식!   │
  ├──────┼─────────────────────────────────────────────────┤
  │ 4    │ 최종 출력 시 모듈러 연산을 어디서 적용할지      │
  └──────┴─────────────────────────────────────────────────┘

  빈칸을 ____ 부분에 채워보세요. 막히면 말씀해 주세요!
```

---

### 6. 코드 리뷰

#### User:
```
@BOJ/10000~/11726/11726.py
내 풀이를 보고 리뷰해줘
```

Skill 사용 시,
```
/algo:code-review @11726.py
```

#### AI Agent:

```
⏺ Skill(algo:code-review)
  ⎿  Successfully loaded skill

⏺ algokit - analyze_code_submission_boj (MCP)
  (problem_id: 11726, language: "python", analysis_type: "review")

⏺ BOJ 11726 - 2×n 타일링 코드 리뷰

  ✅ 정확성

  피보나치 점화식 dp[i] = dp[i-1] + dp[i-2]를 정확히 적용했고,
  모듈러 연산도 올바르게 처리했습니다. 정답 코드입니다.

  ⏱️  복잡도

  - 시간: O(n) — 최적
  - 공간: O(n) (고정 1001 크기 배열)

  💡 개선 포인트

  1. 배열 크기 고정 (1001)
  n + 1 크기로 잡는 게 의도가 더 명확합니다.

  2. 공간 최적화 가능
  이전 두 값만 사용하므로 변수 두 개로 줄일 수 있습니다:
  a, b = 1, 2
  for _ in range(3, n + 1):
      a, b = b, (a + b) % 10007

  총평

  DP 기본 문제를 깔끔하게 풀었습니다. 점화식 도출, 모듈러 처리,
  입력 최적화 모두 잘 적용되어 수정할 부분이 거의 없는 코드입니다.
```

---

### 7. 복습 정리

#### User:
```
복습 문서 만들어줘
```

Skill 사용 시,
```
/algo:review 11726
```

#### AI Agent:

```
⏺ Skill(algo:review)
  ⎿  Successfully loaded skill

⏺ algokit - generate_review_template_boj (MCP)
  (problem_id: 11726, user_notes: "피보나치 점화식 dp[i] = dp[i-1] +
  dp[i-2] 활용, 모듈러 연산 10007, O(n) 시간/공간")

⏺ Write(BOJ/10000~/11726/11726_REVIEW.md)
  ⎿  Wrote 142 lines to BOJ/10000~/11726/11726_REVIEW.md

⏺ BOJ/10000~/11726/11726_REVIEW.md 파일을 생성했습니다.

  주요 내용:
  - 핵심아이디어: 마지막 열 배치 기준 경우 분리 → 피보나치 점화식
  - 데이터 흐름 추적: n=9 예시로 단계별 dp 값 변화
  - 공간 최적화 풀이: 변수 2개로 O(1) 공간 버전 추가
  - 실수 포인트: n=1 IndexError, 모듈러 타이밍, dp[0] 초기값 혼동
  - 관련 문제: 11727 (타일링 2), 1010 (다리 놓기), 9625 (BABBA)
```

---

### 전체 워크플로우

```
검색 → 문제 요약 → 힌트 → 추가 힌트 → 빈칸 힌트 → 코드 리뷰 → 복습 정리
  1        2         3        4          5           6          7
```

하나의 문제에 대해 **탐색부터 복습까지** 전 과정을 지원합니다.

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
