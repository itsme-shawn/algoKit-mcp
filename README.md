# AlgoKit-mcp

**AI 에이전트와 함께하는 알고리즘 학습 MCP 툴킷 (백준, 프로그래머스 지원)**

**[Landing Page](https://algokit-mcp.vercel.app/)** | **[NPM](https://www.npmjs.com/package/algokit-mcp)** | **[GitHub](https://github.com/itsme-shawn/AlgoKit-mcp)**

AI 기반 힌트 생성, 문제 분석, 복습 템플릿 제공으로 효율적인 알고리즘 학습을 지원합니다.

## 주요 기능

- 🔍 **문제 검색**: 난이도, 태그, 키워드로 문제 검색
- 💡 **단계별 힌트**: Level 1~3 단계별 맞춤 힌트 생성
- 📊 **문제 분석**: 알고리즘 분류, 난이도 분석, 학습 가이드
- 📝 **복습 템플릿**: 자동 생성되는 마크다운 복습 문서
- 🧪 **코드 분석**: 제출 코드의 시간/공간 복잡도 분석 및 개선 제안

## 설치

> 플랫폼별로 설치 방법이 다릅니다. Claude Code 는 Plugin 마켓플레이스를 지원하고, Codex와 Gemini는 수동 설정이 필요합니다.

### Claude Code (Plugin Marketplace)

마켓플레이스를 등록하고 플러그인을 설치하세요:

```
/plugin marketplace add itsme-shawn/AlgoKit-mcp
```

```
/plugin install algokit-mcp@algokit-plugin
```

```
/reload-plugins
```

이 명령으로 **MCP 서버와 6개 Skills가 모두 설치**됩니다.

#### 자연어 설치

Claude Code에서 아래 문장을 그대로 입력해도 됩니다:

```
algokit-mcp 플러그인을 마켓플레이스에서 설치해줘
```

#### MCP만 별도 설치 (Skills 없이)

```bash
claude mcp add --scope user algokit -- npx -y algokit-mcp@latest
```

---

### Codex

Codex에게 아래 문장을 입력하세요:

```
이 지시사항 대로 설치해줘 : https://raw.githubusercontent.com/itsme-shawn/AlgoKit-mcp/refs/heads/master/.codex/INSTALL.md
```

---

### Gemini CLI

Gemini CLI에게 아래 문장을 입력하세요:

```
이 지시사항 대로 설치해줘 : https://raw.githubusercontent.com/itsme-shawn/AlgoKit-mcp/refs/heads/master/.gemini/INSTALL.md
```

---

### 수동 설치 (모든 플랫폼)

<details>
<summary>MCP 설정 직접 편집하기</summary>

**Claude Code** (`~/.claude.json`):
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

**Codex** (`~/.codex/config.toml`):
```toml
[mcp.servers.algokit]
command = "npx"
args = ["-y", "algokit-mcp@latest"]
```

**Gemini CLI** (`~/.gemini/settings.json`):
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

</details>


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

> 자연어로 질문해도 AI가 맥락을 파악하여 Skill을 자동 호출합니다.
> Skill(`/algo:*`)을 사용하면 의도가 더 명확해져 정확한 응답을 받을 수 있습니다.

<details>
<summary><b>Skills 상세 설명</b></summary>

#### `algo:search` — 문제 검색

난이도, 태그, 키워드로 백준/프로그래머스 문제를 검색합니다. 플랫폼 키워드(`백준`, `프로그래머스`)가 없으면 어떤 플랫폼인지 되묻습니다.

- BOJ: 티어(브론즈~루비), 태그(`dp`, `graph` 등), 정렬 옵션 지원
- 프로그래머스: 레벨(1~5), 인기순/최신순 정렬 지원
- 검색 후 `/algo:hint`, `/algo:review` 등 후속 스킬 연계 제안

#### `algo:fetch` — 문제 본문 크롤링

문제 전문(설명, 입출력 형식, 예제, 제한 조건)을 가져옵니다. URL 입력 시 플랫폼 자동 판별, 숫자만 입력 시 플랫폼 확인 후 진행합니다.

- BOJ: `acmicpc.net` 크롤링 (시간/메모리 제한 포함)
- 프로그래머스: `school.programmers.co.kr` 크롤링 (제한사항 포함)
- 캐시 30일, 재시도 최대 2회

#### `algo:hint` — 단계별 힌트

문제를 분석하고 사용자 상황에 맞는 **1개 레벨의 힌트만** 제공합니다. 한 번에 모든 힌트를 보여주지 않고, 대화를 통해 점진적으로 안내합니다.

| Level | 시점 | 내용 |
|-------|------|------|
| Level 1 | 처음 막혔을 때 | 알고리즘명 없이 구조적 특징만 암시 |
| Level 2 | "더 알려줘" 요청 | 알고리즘 유형 + 핵심 아이디어 |
| Level 3 | "정답 알려줘" 요청 | 단계별 전략 + 의사코드 수준 설명 |

#### `algo:blank` — 빈칸 연습 코드 생성

완성된 풀이 코드의 핵심 로직을 `____`로 가린 연습 파일을 생성합니다. 원본 파일은 수정하지 않고 `_blank` 접미사 파일을 새로 만듭니다.

- 빈칸 대상: 점화식, 자료구조 초기화, 핵심 조건문, 방문 처리 등
- `// TODO N: 설명` 주석으로 무엇을 채워야 하는지 안내 (정답은 미제공)
- import, 클래스 시그니처, main 블록은 그대로 유지

#### `algo:code-review` — 코드 분석/피드백

풀이 코드의 정확성, 시간/공간 복잡도를 분석하고 개선점을 제안합니다.

| 분석 타입 | 내용 |
|-----------|------|
| `full` (기본) | 정확성 + 복잡도 + 개선점 + 스타일 |
| `debug` | 에러 원인, 로직 오류, 엣지 케이스 |
| `hint` | 핵심 개념, 접근 방향 |
| `review` | 스타일, 가독성, 네이밍, 구조 |

#### `algo:review` — 복습 문서 생성

풀이를 마친 후 학습 내용을 정리하는 마크다운 복습 문서(`_REVIEW.md`)를 생성합니다. MCP 서버가 템플릿과 가이드 프롬프트를 제공하고, AI가 사용자와 대화하며 섹션별로 작성합니다.

- 포함 내용: 문제 요약, 사고흐름, 핵심아이디어, 풀이 코드 + 로직 설명, 데이터 흐름 추적, 실수 포인트, 관련 문제
- 사용자 코드 기반 맞춤형 분석

</details>

---

## 사용 시나리오

> 모든 결과는 AlgoKit MCP 서버를 실제 호출하여 얻은 데이터입니다.

하나의 문제에 대해 **탐색부터 복습까지** 전 과정을 지원합니다.

| 단계 | 기능 | Skill |
|:---:|------|-------|
| 1 | 문제 검색 | `algo:search` |
| 2 | 문제 요약 | `algo:fetch` |
| 3 | 단계별 힌트 | `algo:hint` |
| 4 | 빈칸 힌트 | `algo:blank` |
| 5 | 코드 리뷰 | `algo:code-review` |
| 6 | 복습 정리 | `algo:review` |

---

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

### 3. 단계별 힌트

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

#### 힌트 더 받기

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

### 4. 빈칸 힌트

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

### 5. 코드 리뷰

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

### 6. 복습 정리

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
```

<!-- 아래는 생성된 REVIEW.md의 실제 내용입니다. -->
<!-- MCP 서버가 템플릿 + 가이드 프롬프트를 제공하고, AI가 사용자와 대화하며 작성합니다. -->

<details>
<summary><b>생성된 복습 문서 예시 보기</b></summary>

````markdown
#### BOJ 11726 — 2×n 타일링

https://www.acmicpc.net/problem/11726

**문제 정보**

| 항목 | 내용 |
|------|------|
| 핵심 요구사항 | 2×n 직사각형을 1×2, 2×1 타일로 채우는 방법의 수를 10,007로 나눈 나머지 출력 |
| 입력 크기 | 1 ≤ n ≤ 1,000 |
| 시간/메모리 | 1초 / 256MB |
| 티어 | Silver III |
| 태그 | 다이나믹 프로그래밍 |
| 해결자 수 | 65,411명 (평균 시도 2.7회) |

**사고흐름**

- **첫 인상**: n이 작아질수록 경우의 수가 줄어드는 구조 → 작은 문제로 분할 가능
- **자료구조/알고리즘 선택**: DP (Bottom-Up)
- **선택 근거**: dp[n]을 구하기 위해 이전 상태(dp[n-1], dp[n-2])만 필요 → 점화식 도출 가능
- **특이 조건 처리**: 모듈러 연산을 매 단계 적용하여 오버플로우 방지
- **시간 복잡도 검증**: O(n) = O(1000) → 충분

**핵심아이디어**

2×n 타일링의 마지막 열 배치를 기준으로 경우를 나누면 피보나치 점화식이 도출된다. 마지막에 세로 타일(1×2) 1개를 놓으면 dp[n-1], 가로 타일(2×1) 2개를 놓으면 dp[n-2]가 되어 **dp[n] = dp[n-1] + dp[n-2]**.

**풀이 1 (내 코드)**

```python
import sys
read = sys.stdin.readline

n = int(read())
dp = [0] * (1001)

dp[1], dp[2] = 1, 2
for i in range(3, n + 1):
    dp[i] = (dp[i - 1] + dp[i - 2]) % 10007
print(dp[n])
```

핵심 포인트:
- 배열을 1001 크기로 고정하여 n=1일 때 dp[2] 초기화 시 IndexError 방지
- 매 단계에서 % 10007 적용하여 중간 값 오버플로우 방지

**데이터 흐름 추적** (n = 9):

```
dp[1] = 1
dp[2] = 2
dp[3] = dp[2] + dp[1] = 3
dp[4] = dp[3] + dp[2] = 5
dp[5] = dp[4] + dp[3] = 8
dp[6] = dp[5] + dp[4] = 13
dp[7] = dp[6] + dp[5] = 21
dp[8] = dp[7] + dp[6] = 34
dp[9] = dp[8] + dp[7] = 55  ← 출력
```

**풀이 2 (공간 최적화)**

```python
import sys
read = sys.stdin.readline

n = int(read())

if n == 1:
    print(1)
else:
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, (a + b) % 10007
    print(b)
```

이전 두 값만 사용하므로 변수 2개로 O(1) 공간 달성.

**자주 하는 실수**

- n=1일 때 배열 크기 부족으로 IndexError
- 모듈러 연산을 마지막에만 적용 → 중간 값 오버플로우 (C++/Java)
- dp[0] 초기값 설정 혼동 (0 vs 1)

**관련 문제**

- 11727 — 2×n 타일링 2 (2×2 타일 추가)
- 1010 — 다리 놓기 (Silver V, 조합 + DP)
- 9625 — BABBA (Silver V, 피보나치 변형)
````

</details>

---

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



## Q&A

<details>
<summary><b>MCP가 뭔가요?</b></summary>

MCP(Model Context Protocol)는 AI 에이전트가 외부 도구를 호출할 수 있게 해주는 표준 프로토콜입니다. AlgoKit은 **로컬 MCP 서버**로 동작합니다. `npx`로 설치하면 사용자의 로컬 머신에서 실행되며, 별도의 원격 서버나 계정이 필요 없습니다.

```
사용자 → AI 에이전트 → AlgoKit MCP 서버 (로컬) → solved.ac API / 웹 스크래핑
                ↓
        자연어 응답 생성
```

사용자는 MCP를 직접 다룰 필요 없이, AI에게 자연어로 요청하면 됩니다.

</details>

<details>
<summary><b>API 키가 필요한가요?</b></summary>

아니요. AlgoKit은 사용 중인 AI 에이전트(Claude Code, Codex, Gemini 등)를 그대로 활용하는 MCP 서버이므로, 별도의 API 키나 로그인 없이 바로 사용할 수 있습니다.

</details>

<details>
<summary><b>어떤 AI 에이전트를 지원하나요?</b></summary>

| 에이전트 | 지원 방식 |
|----------|-----------|
| **Claude Code** | Plugin Marketplace (자동 설치) |
| **Codex** | 설치 스크립트 제공 |
| **Gemini CLI** | 설치 스크립트 제공 |
| 기타 MCP 호환 에이전트 | 수동 설정 가능 |

</details>

<details>
<summary><b>Skill과 MCP 도구의 차이가 뭔가요?</b></summary>

- **MCP 도구**: AlgoKit 서버가 제공하는 개별 기능 단위 (예: `search_problems_boj`, `analyze_problem_boj`)
- **Skill** (`/algo:*`): 여러 MCP 도구를 조합해 하나의 워크플로우로 묶은 것 (예: `/algo:hint`는 내부적으로 `analyze_problem` + `fetch_problem_content`를 조합)

Skill을 사용하면 AI가 최적의 도구를 자동으로 선택하고 조합합니다. 자연어로 질문해도 동일한 결과를 얻을 수 있지만, Skill을 명시하면 의도가 더 정확하게 전달됩니다.

</details>

<details>
<summary><b>프로그래머스도 지원하나요?</b></summary>

네. 프로그래머스도 지원합니다.

</details>

<details>
<summary><b>오프라인에서도 사용할 수 있나요?</b></summary>

아니요. AlgoKit은 solved.ac API와 BOJ/프로그래머스 웹사이트에서 실시간으로 데이터를 가져오므로 인터넷 연결이 필요합니다.

</details>

<details>
<summary><b>ChatGPT나 Claude에 직접 물어보는 것과 뭐가 다른가요?</b></summary>

AI에게 직접 알고리즘 문제를 질문하면 학습 데이터에 의존하기 때문에, 문제 정보가 부정확하거나 존재하지 않는 문제를 지어내는 경우가 있습니다. 웹 검색을 사용하더라도 공식 출처가 아닌 블로그 등에서 데이터를 가져오는 경우가 많아 정확도가 보장되지 않습니다.

AlgoKit은 **공식 데이터 소스**(solved.ac API, BOJ/프로그래머스 웹사이트)에서 직접 실시간 데이터를 가져와 AI에게 전달하므로, 항상 정확한 문제 정보를 기반으로 응답합니다.

| | AI에 직접 질문 | AlgoKit 사용 |
|---|---|---|
| 데이터 소스 | 학습 데이터 또는 블로그 등 비공식 출처 | solved.ac API, BOJ/프로그래머스 공식 사이트 |
| 문제 정보 | 부정확하거나 존재하지 않는 문제 생성 가능 | 실시간 크롤링 (항상 최신, 정확) |
| 난이도/태그 | 부정확하거나 누락 | solved.ac 기준 정확한 데이터 |
| 힌트 제공 | 한 번에 전체 풀이 노출 위험 | Level 1→2→3 단계별 제공 |
| 복습 지원 | 매번 수동 요청 | 구조화된 복습 문서 자동 생성 |
| 학습 워크플로우 | 없음 | 검색→힌트→빈칸→리뷰→복습 일관된 흐름 |

</details>

---

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

**[Landing Page](https://algokit-mcp.vercel.app/)** • **[GitHub](https://github.com/itsme-shawn/AlgoKit-mcp)** • **[Issues](https://github.com/itsme-shawn/algoKit-mcp/issues)** • **[NPM](https://www.npmjs.com/package/algokit-mcp)**


</div>
