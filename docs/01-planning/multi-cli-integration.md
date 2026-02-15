# AlgoKit Multi-CLI 통합 설계

**버전**: 1.1
**작성일**: 2026-02-16
**최종 수정**: 2026-02-16
**작성자**: project-planner
**상태**: 구현 중 (Phase 2 완료 ✅)

---

## 목차

1. [개요](#개요)
2. [CLI별 MCP 지원 현황](#cli별-mcp-지원-현황)
3. [Skill vs MCP 비교](#skill-vs-mcp-비교)
4. [통합 전략](#통합-전략)
5. [CLI별 설정 방법](#cli별-설정-방법)
6. [사용자 경험 설계](#사용자-경험-설계)
7. [구현 로드맵](#구현-로드맵)
8. [FAQ](#faq)

---

## 개요

### 목적

AlgoKit MCP 서버를 Claude Code, Codex CLI, Gemini CLI 등 여러 AI CLI 도구에서 사용할 수 있도록 통합 전략을 수립합니다.

### 핵심 질문과 답변

**Q1. Skill은 Claude Code 전용인가?**
✅ **예**, Skill은 Claude Code 전용 기능입니다. Codex CLI와 Gemini CLI는 Skill을 지원하지 않습니다.

**Q2. MCP만으로 충분한 UX를 제공할 수 있는가?**
✅ **예**, MCP 서버의 도구 설명(description)을 충분히 상세하게 작성하면, Skill 없이도 AI가 적절한 도구를 선택할 수 있습니다.

**Q3. CLI별로 별도 패키지가 필요한가?**
✅ **아니오**, 단일 MCP 서버로 모든 CLI를 지원 가능합니다. 설정 파일(`config.toml` 또는 MCP 설정 JSON)만 각 CLI별로 추가하면 됩니다.

---

## CLI별 MCP 지원 현황

### 1. Claude Code (Anthropic)

**MCP 지원**: ✅ 완전 지원
**Skill 지원**: ✅ 완전 지원 (Claude Code 전용)
**설정 위치**: `~/.claude/` 또는 `.claude/` (프로젝트별)

**특징**:
- MCP 서버를 STDIO 또는 HTTP로 연결 가능
- Skill은 Markdown 기반 명령어/워크플로우 정의 (`.claude/skills/`)
- MCP 도구 자동 승인 옵션 (세션 스코프)
- MCP + Skill 조합으로 최고의 UX 제공

**현재 상태**:
- ✅ MCP 서버 구현 완료 (10개 도구)
- ✅ Skill 구현 완료 (`.claude/skills/algokit.md`)
- ✅ 플랫폼 자동 선택 규칙 (BOJ vs 프로그래머스)

**참고 문서**:
- [Skills vs MCP: when to pick which](https://metacircuits.substack.com/p/the-285-billion-question-skills-vs)
- [Understanding Claude Code's Full Stack](https://alexop.dev/posts/understanding-claude-code-full-stack/)

---

### 2. Codex CLI (OpenAI)

**MCP 지원**: ✅ 완전 지원
**Skill 지원**: ❌ 미지원
**설정 위치**: `~/.codex/config.toml` 또는 `.codex/config.toml` (프로젝트별)

**특징**:
- MCP 서버를 STDIO 또는 Streamable HTTP로 연결 가능
- MCP 액션 캐싱 지원 (반복 로드 지연 감소)
- 세션 스코프 "Allow and remember" 옵션 (2026년 2월 업데이트)
- MCP 도구 설명(description)을 기반으로 자동 선택

**설정 예시** (`~/.codex/config.toml`):
```toml
[[mcp.servers]]
name = "algokit"
command = "node"
args = ["/path/to/cote-mcp-server/build/index.js"]
```

**참고 문서**:
- [Model Context Protocol - OpenAI Codex](https://developers.openai.com/codex/mcp/)
- [Codex MCP Wrapper | Awesome MCP Servers](https://mcpservers.org/servers/teabranch/agentic-developer-mcp)

---

### 3. Gemini CLI (Google)

**MCP 지원**: ✅ 완전 지원
**Skill 지원**: ❌ 미지원 (단, FastMCP 프롬프트를 Slash 명령으로 사용 가능)
**설정 위치**: `~/.gemini/config.json` 또는 프로젝트별 설정

**특징**:
- FastMCP 통합으로 로컬 STDIO MCP 서버 쉽게 설치 가능
- FastMCP 프롬프트를 Slash 명령(예: `/promptname`)으로 사용
- Google Cloud 서비스용 원격 MCP 서버 지원
- MCP 도구를 통해 외부 API, 데이터베이스 연결

**설정 예시** (FastMCP 설치):
```bash
# FastMCP로 algokit 설치 (추후 지원 시)
fastmcp install gemini-cli algokit

# 또는 수동 설정
gemini config add-mcp-server algokit node /path/to/cote-mcp-server/build/index.js
```

**참고 문서**:
- [Gemini CLI 🤝 FastMCP](https://developers.googleblog.com/gemini-cli-fastmcp-simplifying-mcp-server-development/)
- [MCP servers with the Gemini CLI](https://geminicli.com/docs/tools/mcp-server/)
- [How to Build an MCP Server with Gemini CLI and Go](https://codelabs.developers.google.com/cloud-gemini-cli-mcp-go)

---

## Skill vs MCP 비교

### 핵심 차이

| 항목 | MCP Server | Skill (Claude Code 전용) |
|------|-----------|--------------------------|
| **역할** | AI의 신경계 (외부 세계 연결) | AI의 플레이북 (절차적 지식) |
| **형식** | 실행 가능한 코드 (TypeScript, Python 등) | Markdown 기반 지시사항 |
| **실행** | 프로그래밍 방식 (동일 입력 → 동일 출력) | LLM 해석 (자연어 기반) |
| **용도** | 데이터 조회, API 호출, 도구 실행 | 워크플로우 정의, 사용법 가이드 |
| **지원 범위** | 모든 MCP 클라이언트 (Claude, Codex, Gemini 등) | Claude Code만 |
| **설정 복잡도** | 높음 (Node/Python 설치, JSON 설정) | 낮음 (Markdown 파일 작성) |

### 상호 보완 관계

**MCP는 연결을, Skill은 사용법을 제공합니다.**

```
MCP: "백준 문제를 검색할 수 있습니다"
     → 도구: search_problems(query, level_min, level_max, tag, ...)

Skill: "사용자가 '코테 문제 추천해줘'라고 하면:
        1. BOJ search_problems 호출 (기본)
        2. 결과 제공
        3. '프로그래머스도 보시겠어요?' 제안
        4. 사용자가 '네'라고 하면 Programmers 검색"
```

### AlgoKit의 사용 사례

**Claude Code (MCP + Skill)**:
- MCP 서버: 10개 도구 제공 (search_problems, analyze_problem 등)
- Skill: 플랫폼 자동 선택 규칙, 사용 시나리오, 단계별 힌트 전략

**Codex/Gemini (MCP만)**:
- MCP 서버: 동일한 10개 도구 제공
- 도구 설명(description)에 사용법 및 시나리오 포함
- AI가 도구 설명을 기반으로 적절한 도구 선택

---

## 통합 전략

### 설계 원칙

#### 1. **단일 MCP 서버 (Single Server)**
- 하나의 MCP 서버 구현으로 모든 CLI 지원
- 플랫폼별 분기 없이 표준 MCP 프로토콜만 사용

#### 2. **상세한 도구 설명 (Rich Description)**
- 각 도구의 `description`과 `inputSchema`를 매우 상세하게 작성
- Skill 없이도 AI가 적절한 도구를 선택할 수 있도록 가이드

**예시**:
```typescript
{
  name: 'analyze_problem',
  description: `
    BOJ 문제를 분석하고 3단계 힌트 가이드를 제공합니다.

    사용 시나리오:
    - "11053번 문제 분석해줘" → { problem_id: 11053 }
    - "이 문제 어떻게 접근해야 할지 막막해" → analyze_problem 호출

    출력: 난이도 컨텍스트, 태그 정보, 3단계 힌트 프롬프트, 유사 문제 추천

    힌트 레벨:
    - Level 1: 문제 분석 (알고리즘 유형, 문제 특징)
    - Level 2: 핵심 아이디어 (상태 정의, 점화식, 자료구조)
    - Level 3: 상세 풀이 (단계별 구현 전략)
  `,
  inputSchema: {
    type: 'object',
    properties: {
      problem_id: {
        type: 'number',
        description: 'BOJ 문제 번호 (예: 1000, 11053, 1927)'
      },
      include_similar: {
        type: 'boolean',
        description: '유사 문제 추천 포함 여부 (기본: true)',
        default: true
      }
    },
    required: ['problem_id']
  }
}
```

#### 3. **Skill은 선택사항 (Optional Enhancement)**
- Claude Code 사용자에게만 Skill 제공
- Skill 없이도 기본 기능은 모두 사용 가능
- Skill은 고급 워크플로우 및 플랫폼 자동 선택을 위한 부가 기능

#### 4. **문서화 전략**
- README.md: CLI별 설치 및 설정 방법 안내
- CLI별 사용 가이드 제공 (기능 차이 명시)
- Skill 활성화 방법 (Claude Code 전용) 별도 섹션

---

### 지원 범위 정의

| 기능 | Claude Code | Codex CLI | Gemini CLI |
|------|-------------|-----------|------------|
| **핵심 MCP 도구** | ✅ 전체 | ✅ 전체 | ✅ 전체 |
| search_problems | ✅ | ✅ | ✅ |
| get_problem | ✅ | ✅ | ✅ |
| search_tags | ✅ | ✅ | ✅ |
| analyze_problem | ✅ | ✅ | ✅ |
| generate_review_template | ✅ | ✅ | ✅ |
| fetch_problem_content | ✅ | ✅ | ✅ |
| search_programmers_problems | ✅ | ✅ | ✅ |
| get_programmers_problem | ✅ | ✅ | ✅ |
| analyze_code_submission | ✅ | ✅ | ✅ |
| health_check | ✅ | ✅ | ✅ |
| **Skill (워크플로우)** | ✅ | ❌ | ❌ |
| 플랫폼 자동 선택 | ✅ | ⚠️ 수동 | ⚠️ 수동 |
| 단계별 힌트 가이드 | ✅ | ⚠️ 수동 | ⚠️ 수동 |
| 통합 검색 (BOJ+프로그래머스) | ✅ | ⚠️ 수동 | ⚠️ 수동 |

**범례**:
- ✅ 완전 지원
- ⚠️ 수동: 사용자가 명시적으로 도구 선택 필요 (예: "analyze_problem 도구로 11053번 분석해줘")
- ❌ 미지원

---

## CLI별 설정 방법

### 1. Claude Code

#### MCP 서버 설정

**프로젝트별 설정** (권장):
```bash
# 1. 프로젝트 디렉토리에서
mkdir -p .claude

# 2. MCP 설정 (JSON 형식)
cat > .claude/mcp_config.json <<EOF
{
  "mcpServers": {
    "algokit": {
      "command": "node",
      "args": ["/path/to/cote-mcp-server/build/index.js"],
      "env": {}
    }
  }
}
EOF
```

**전역 설정**:
```bash
# ~/.claude/mcp_config.json
{
  "mcpServers": {
    "algokit": {
      "command": "node",
      "args": ["/absolute/path/to/cote-mcp-server/build/index.js"]
    }
  }
}
```

#### Skill 설정 (선택사항)

```bash
# 프로젝트별
cp /path/to/cote-mcp-server/.claude/skills/algokit.md .claude/skills/

# 전역
cp /path/to/cote-mcp-server/.claude/skills/algokit.md ~/.claude/skills/
```

**Skill 활성화 확인**:
```bash
claude-code
# 대화창에서
/skills list
# → algokit이 표시되어야 함
```

---

### 2. Codex CLI

#### MCP 서버 설정

**프로젝트별 설정** (`.codex/config.toml`):
```toml
[[mcp.servers]]
name = "algokit"
command = "node"
args = ["/path/to/cote-mcp-server/build/index.js"]
```

**전역 설정** (`~/.codex/config.toml`):
```toml
[[mcp.servers]]
name = "algokit"
command = "node"
args = ["/absolute/path/to/cote-mcp-server/build/index.js"]
```

#### 설정 확인

```bash
codex mcp list
# → algokit이 표시되어야 함

codex mcp tools algokit
# → 10개 도구 목록 확인
```

#### 사용 예시

```bash
codex chat
# 대화창에서
> "BOJ 1000번 문제 정보 알려줘"
# Codex가 get_problem 도구 자동 호출

> "Silver 티어의 DP 문제 찾아줘"
# Codex가 search_problems 도구 호출
# 파라미터: { query: "dp", level_min: 6, level_max: 10 }
```

---

### 3. Gemini CLI

#### MCP 서버 설정

**수동 설정**:
```bash
# Gemini CLI 설정 디렉토리
mkdir -p ~/.gemini

# MCP 서버 추가 (설정 방식은 Gemini CLI 버전에 따라 다를 수 있음)
gemini config add-mcp-server algokit \
  --command "node" \
  --args "/path/to/cote-mcp-server/build/index.js"
```

**FastMCP 통합** (추후 지원 시):
```bash
# FastMCP 서버로 패키징 후
fastmcp install gemini-cli algokit
```

#### 설정 확인

```bash
gemini mcp list
# → algokit이 표시되어야 함

gemini mcp info algokit
# → 10개 도구 및 설명 확인
```

#### 사용 예시

```bash
gemini chat
# 대화창에서
> "백준 1927번 문제 분석해줘"
# Gemini가 analyze_problem 도구 호출

> "프로그래머스 42576번 문제 정보 알려줘"
# Gemini가 get_programmers_problem 도구 호출
```

---

## 사용자 경험 설계

### 기능 차이 명확화

#### Claude Code (최고 UX)

**Skill 있을 때**:
- ✅ 플랫폼 자동 선택 (사용자가 "백준" 또는 "프로그래머스" 명시 불필요)
- ✅ URL 자동 파싱 (도메인 기반 플랫폼 식별)
- ✅ 통합 검색 (BOJ + 프로그래머스 병렬 검색 후 통합 테이블)
- ✅ 단계별 힌트 전략 (Level 1-3 자동 선택)

**예시**:
```
사용자: "피보나치 문제 찾아줘"
Claude: [BOJ + 프로그래머스 자동 검색]
        | 플랫폼 | 문제 번호 | 제목 | 난이도 |
        |--------|----------|------|--------|
        | 백준 | 1003 | 피보나치 함수 | Silver III |
        | 프로그래머스 | 12945 | 피보나치 수 | Level 2 |
```

**Skill 없을 때**:
- ✅ 모든 MCP 도구 사용 가능
- ⚠️ 플랫폼 명시 필요 (예: "백준에서 DP 문제 찾아줘")
- ⚠️ 도구 직접 호출 (예: "search_problems 도구로 검색해줘")

---

#### Codex CLI / Gemini CLI (기본 UX)

**지원 기능**:
- ✅ 모든 MCP 도구 사용 가능
- ✅ AI가 도구 설명 기반으로 적절한 도구 자동 선택
- ⚠️ 플랫폼 명시 권장 (예: "백준 1000번", "프로그래머스 42576번")
- ⚠️ 통합 검색 없음 (BOJ 또는 프로그래머스 중 하나만 검색)

**예시** (Codex CLI):
```
사용자: "백준 1000번 문제 정보 알려줘"
Codex: [get_problem 도구 자동 호출]
       문제 번호: 1000
       제목: A+B
       난이도: Bronze V
       ...

사용자: "Silver 티어 DP 문제 찾아줘"
Codex: [search_problems 도구 호출]
       { tag: "dp", level_min: 6, level_max: 10 }
```

**예시** (Gemini CLI):
```
사용자: "프로그래머스 42576번 분석해줘"
Gemini: [get_programmers_problem 도구 호출]
        제목: 완주하지 못한 선수
        카테고리: 해시
        난이도: Level 1
        ...
```

---

### 도구 설명 현황

**✅ 현재 상태: 매우 우수**

AlgoKit의 10개 MCP 도구는 이미 충분히 상세한 설명을 가지고 있습니다:

| 도구 | Description 길이 | 평가 |
|------|------------------|------|
| 기본 도구 (search_problems, get_problem, search_tags) | 1-2줄 | ✅ 간결하고 명확 |
| **generate_hint** | **203줄** | 🌟 매우 상세 (3단계 힌트 전략, 상황 판단 로직) |
| fetch_problem_content | 15줄 | ✅ 사용 시나리오, 제한사항 포함 |
| analyze_code_submission | 19줄 | ✅ 4가지 분석 타입 상세 설명 |
| 프로그래머스 도구 | 20-21줄 | ✅ BOJ와 차이점까지 명시 |

**특히 우수한 도구**:
- `generate_hint`: 203줄의 상세 가이드 (Claude Code가 어떻게 힌트를 선택해야 하는지 명시)
- `fetch_problem_content`: 힌트 제외 명시, 성능 정보
- `analyze_code_submission`: 4가지 분석 타입 (코드 리뷰, 시간복잡도, 시험 케이스, 최적화) 상세 설명
- 프로그래머스 도구: BOJ와의 차이점, 제한사항, 성능 경고 포함

**결론**: **추가 개선 불필요** - 현재 상태로도 Codex CLI와 Gemini CLI에서 충분히 사용 가능합니다.

---

## 구현 로드맵

### ~~Phase 1: 도구 설명 개선~~ ❌ **불필요 (스킵)**

**결론**: 조사 결과, 10개 MCP 도구의 description이 이미 충분히 상세함을 확인했습니다.
- 기본 도구: 간결하고 명확
- 고급 도구: 15-203줄의 상세 가이드 포함
- 추가 개선 불필요

**이유**: Phase 1 작업 없이도 Codex CLI와 Gemini CLI에서 충분히 사용 가능

---

### Phase 2: CLI별 설정 가이드 작성 ✅ **완료**

**목표**: 사용자가 각 CLI에서 AlgoKit을 쉽게 설정할 수 있도록 안내

**완료된 작업**:
- ✅ README.md 개선
  - CLI별 설치 및 설정 방법 섹션 추가
  - Skill 설정 (Claude Code 전용) 별도 섹션
  - 기능 차이 표 추가
  - 빠른 설정 가이드 (예시 파일 참조)
- ✅ 설정 예시 파일 제공
  - `.claude/examples/claude-code-config.json`
  - `.claude/examples/codex-config.toml`
  - `.claude/examples/gemini-config.json`
  - `.claude/examples/README.md` (상세 설명)
- ✅ 트러블슈팅 가이드
  - 공통 설정 오류
  - CLI별 주의사항
  - 설치 확인 방법

**산출물**:
- ✅ 업데이트된 README.md (300+ 줄 추가)
- ✅ `.claude/examples/` 디렉토리 (4개 파일)

**소요 시간**: 1일 (2026-02-16)

---

### Phase 3: 통합 테스트 (1주) 🚧 **다음 단계**

**목표**: 각 CLI에서 AlgoKit이 정상 작동하는지 검증

**작업 항목**:
- [ ] Claude Code 테스트
  - MCP 도구 전체 동작 확인
  - Skill 활성화 후 플랫폼 자동 선택 검증
  - 통합 검색 (BOJ + 프로그래머스) 테스트
- [ ] Codex CLI 테스트
  - MCP 설정 및 도구 목록 확인
  - 주요 시나리오 테스트 (문제 검색, 분석, 복습)
  - 도구 자동 선택 정확도 평가
- [ ] Gemini CLI 테스트
  - MCP 설정 및 도구 목록 확인
  - 주요 시나리오 테스트
  - FastMCP 통합 가능성 검토

**산출물**:
- 테스트 보고서 (CLI별)
- 발견된 이슈 목록 및 해결 방안

**예상 소요 시간**: 5-7일

---

### Phase 4: FastMCP 패키징 (선택사항, 2주) 📋 **향후 고려**

**목표**: Gemini CLI 사용자를 위한 간편 설치 지원

**작업 항목**:
- [ ] FastMCP 서버 래퍼 작성
- [ ] PyPI 패키지 배포 (Python 사용자용)
- [ ] `fastmcp install gemini-cli algokit` 지원
- [ ] 문서 업데이트

**산출물**:
- FastMCP 패키지 (Python)
- 설치 가이드

**예상 소요 시간**: 10-14일

---

### 전체 타임라인 (수정됨)

```
~~Phase 1: 도구 설명 개선~~ ❌ 스킵 (불필요)

Phase 2: CLI별 설정 가이드 ✅ 완료 (1일)
  ├─ README.md 개선
  ├─ 예시 파일 작성 (3개 + README)
  └─ 트러블슈팅 가이드

Phase 3: 통합 테스트 🚧 다음 단계 (1주)
  ├─ Day 1-2: Claude Code 테스트
  ├─ Day 3-4: Codex CLI 테스트
  └─ Day 5-7: Gemini CLI 테스트 + 보고서 작성

Phase 4 (선택사항): FastMCP 패키징 📋 향후 계획 (2주)
  └─ 사용자 피드백에 따라 결정

총 예상 기간: 1-2주 (Phase 2-3)
- Phase 2: ✅ 완료 (1일)
- Phase 3: 🚧 진행 예정 (1주)
```

---

## FAQ

### Q1. Skill 없이 Claude Code를 사용하면 어떻게 되나요?

**A**: 모든 MCP 도구는 정상적으로 작동하지만, 다음 기능이 제한됩니다:
- ❌ 플랫폼 자동 선택 (사용자가 "백준" 또는 "프로그래머스" 명시 필요)
- ❌ URL 자동 파싱 (URL 제공 시 플랫폼 수동 지정)
- ❌ 통합 검색 (BOJ와 프로그래머스 중 하나만 검색)
- ✅ 모든 MCP 도구 직접 호출 가능

**권장**: Skill 설정을 통해 최고의 UX 제공

---

### Q2. Codex CLI나 Gemini CLI에서 플랫폼 자동 선택이 불가능한가요?

**A**: 기술적으로는 가능하지만, 현재 AlgoKit은 Skill을 통해 구현되어 있습니다.

**대안**:
- **도구 설명 개선**: description에 플랫폼 선택 가이드 포함
  ```typescript
  description: `
    사용자가 "백준" 또는 "BOJ"를 언급하면 이 도구를 사용하세요.
    프로그래머스 문제는 search_programmers_problems 도구를 사용하세요.
  `
  ```
- **향후 확장**: Codex/Gemini용 플러그인 또는 래퍼 스크립트 개발

---

### Q3. 하나의 MCP 서버로 여러 CLI를 동시에 지원할 수 있나요?

**A**: ✅ 예, 가능합니다.

MCP 프로토콜은 표준 JSON-RPC 기반이므로, 서버는 클라이언트를 구분하지 않습니다.
각 CLI는 독립적으로 MCP 서버에 연결하며, 서버는 동일한 도구 목록을 제공합니다.

**주의사항**:
- 동시 실행 시 Rate Limiting 공유 (solved.ac API 제한)
- 캐싱은 프로세스별 독립적 (각 CLI가 별도 서버 인스턴스 실행)

---

### Q4. 프로그래머스 검색이 느린데 개선 방법이 있나요?

**A**: 프로그래머스 검색은 Puppeteer 기반이므로 3-5초 소요됩니다.

**현재 최적화**:
- 브라우저 인스턴스 재사용 (BrowserPool)
- 검색 결과 캐싱 (TTL 30분)

**추가 개선 방안** (향후):
- 백그라운드 검색 큐
- 검색 결과 프리페칭
- 프로그래머스 API 사용 (공식 API 출시 시)

---

### Q5. 여러 CLI를 동시에 사용하는 사용자를 위한 권장 사항은?

**A**: 각 CLI의 강점을 활용하는 것을 권장합니다.

**권장 조합**:
- **Claude Code**: 일상적인 코테 학습 (Skill 활용, 플랫폼 자동 선택)
- **Codex CLI**: 코드 작성 및 디버깅 (OpenAI Codex 모델 강점)
- **Gemini CLI**: 데이터 분석 및 시각화 (Google Cloud 통합)

**설정**:
- 각 CLI별 MCP 설정 파일 작성 (중복 설정 가능)
- 프로젝트별 설정 (`.claude/`, `.codex/`, `.gemini/`) 권장

---

### Q6. AlgoKit을 다른 MCP 클라이언트(예: Cursor, Windsurf)에서도 사용할 수 있나요?

**A**: ✅ 예, MCP 프로토콜을 지원하는 모든 클라이언트에서 사용 가능합니다.

**추가 설정**:
- 각 클라이언트의 MCP 설정 방법 확인 (문서 참조)
- 표준 STDIO 또는 HTTP 전송 방식 지원

**참고**:
- [MCP Clients - Hugging Face Course](https://huggingface.co/learn/mcp-course/en/unit1/mcp-clients)

---

## 참고 문서

### MCP 프로토콜
- [Model Context Protocol Architecture](https://modelcontextprotocol.io/specification/2025-06-18/architecture)
- [15 Best Practices for Building MCP Servers](https://thenewstack.io/15-best-practices-for-building-mcp-servers-in-production/)
- [Configure MCP Servers for Multiple Connections](https://mcpcat.io/guides/configuring-mcp-servers-multiple-simultaneous-connections/)

### Claude Code
- [Skills vs MCP: when to pick which](https://metacircuits.substack.com/p/the-285-billion-question-skills-vs)
- [Understanding Claude Code's Full Stack](https://alexop.dev/posts/understanding-claude-code-full-stack/)
- [Extending Claude's capabilities with skills and MCP](https://claude.com/blog/extending-claude-capabilities-with-skills-mcp-servers)

### Codex CLI
- [Model Context Protocol - OpenAI Codex](https://developers.openai.com/codex/mcp/)
- [Command line options - Codex CLI](https://developers.openai.com/codex/cli/reference/)

### Gemini CLI
- [Gemini CLI 🤝 FastMCP](https://developers.googleblog.com/gemini-cli-fastmcp-simplifying-mcp-server-development/)
- [MCP servers with the Gemini CLI](https://geminicli.com/docs/tools/mcp-server/)
- [Announcing official MCP support for Google services](https://cloud.google.com/blog/products/ai-machine-learning/announcing-official-mcp-support-for-google-services)

---

**문서 작성자**: project-planner
**최종 검토일**: 2026-02-16

## Sources

- [Model Context Protocol - OpenAI Codex](https://developers.openai.com/codex/mcp/)
- [Codex MCP Wrapper | Awesome MCP Servers](https://mcpservers.org/servers/teabranch/agentic-developer-mcp)
- [Gemini CLI 🤝 FastMCP](https://developers.googleblog.com/gemini-cli-fastmcp-simplifying-mcp-server-development/)
- [MCP servers with the Gemini CLI](https://geminicli.com/docs/tools/mcp-server/)
- [How to Build an MCP Server with Gemini CLI and Go](https://codelabs.developers.google.com/cloud-gemini-cli-mcp-go)
- [Skills vs MCP: when to pick which](https://metacircuits.substack.com/p/the-285-billion-question-skills-vs)
- [Understanding Claude Code's Full Stack](https://alexop.dev/posts/understanding-claude-code-full-stack/)
- [Extending Claude's capabilities with skills and MCP](https://claude.com/blog/extending-claude-capabilities-with-skills-mcp-servers)
- [Model Context Protocol Architecture](https://modelcontextprotocol.io/specification/2025-06-18/architecture)
- [15 Best Practices for Building MCP Servers](https://thenewstack.io/15-best-practices-for-building-mcp-servers-in-production/)
- [Configure MCP Servers for Multiple Connections](https://mcpcat.io/guides/configuring-mcp-servers-multiple-simultaneous-connections/)
