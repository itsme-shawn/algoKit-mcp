# AlgoKit-mcp

**백준(BOJ)과 프로그래머스 알고리즘 문제 학습을 돕는 MCP 서버 + Skill**

AI 기반 힌트 생성, 문제 분석, 복습 템플릿 제공으로 효율적인 알고리즘 학습을 지원합니다.

## 주요 기능

- 🔍 **문제 검색**: 난이도, 태그, 키워드로 문제 검색
- 💡 **단계별 힌트**: Level 1~3 단계별 맞춤 힌트 생성
- 📊 **문제 분석**: 알고리즘 분류, 난이도 분석, 학습 가이드
- 📝 **복습 템플릿**: 자동 생성되는 마크다운 복습 문서
- 🧪 **코드 분석**: 제출 코드의 시간/공간 복잡도 분석 및 개선 제안

## 설치

### Claude Code (추천)

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

## MCP 도구

### 백준 (BOJ)

| 도구 | 설명 |
|------|------|
| `search_problems` | 문제 검색 (티어, 태그, 키워드) |
| `get_problem` | 문제 상세 조회 |
| `search_tags` | 알고리즘 태그 검색 |
| `fetch_problem_content_boj` | 문제 본문 스크래핑 |
| `analyze_problem_boj` | 문제 분석 및 힌트 가이드 |
| `generate_hint_boj` | 3단계 힌트 생성 |
| `generate_review_template_boj` | 복습 템플릿 생성 |
| `analyze_code_submission_boj` | 코드 분석 및 피드백 |

### 프로그래머스 (Programmers)

| 도구 | 설명 |
|------|------|
| `search_programmers_problems` | 문제 검색 (난이도, 카테고리) |
| `get_programmers_problem` | 문제 상세 조회 |
| `fetch_problem_content_programmers` | 문제 본문 스크래핑 |
| `analyze_problem_programmers` | 문제 분석 |
| `generate_hint_programmers` | 힌트 생성 |
| `generate_review_template_programmers` | 복습 템플릿 |
| `analyze_code_submission_programmers` | 코드 분석 |

## MCP Skill (Claude Code 전용)

**Skill 이름**: `algo:`

플랫폼(BOJ/프로그래머스)을 자동으로 선택하여 자연스러운 학습 경험을 제공합니다.

### 설치 방법

```bash
# Skill 파일 복사 (프로젝트별)
cp skills/* /your/project/.claude/skills/

# 또는 전역 설정
cp skills/* ~/.claude/skills/
```

### 사용 예시

```
You: "백준 골드 난이도 DP 문제 3개 추천해줘"
Claude: [자동으로 BOJ search_problems 호출]

You: "이 문제 분석해줘: https://www.acmicpc.net/problem/1927"
Claude: [URL 파싱 → analyze_problem_boj 자동 호출]

You: "프로그래머스 Level 2 문제 찾아줘"
Claude: [search_programmers_problems 자동 호출]

You: "힌트 더 줘"
Claude: [이전 대화 분석 → 적절한 Level 힌트 제공]
```

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

**[GitHub](https://github.com/itsme-shawn/AlgoKit-mcp)** • **[Issues](https://github.com/itsme-shawn/algoKit-mcp/issues)** • **[NPM](https://www.npmjs.com/package/algokit-mcp-server)**


</div>
