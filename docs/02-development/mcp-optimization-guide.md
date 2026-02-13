# MCP 서버 최적화 가이드

**프로젝트명**: cote-mcp: BOJ 학습 도우미 MCP Server
**작성일**: 2026-02-13

---

## 목적

프로젝트별로 필요한 MCP 서버만 활성화하여 토큰 사용량과 응답 시간을 최적화합니다.

---

## 현재 cote-mcp 프로젝트에 필요한 MCP 서버

### ✅ 필요한 MCP
- **serena**: 코드 분석, 심볼 검색, 리팩토링
- **context7**: API 문서 검색 (solved.ac, Claude API 등)
- **mcp-server-filesystem**: 파일 시스템 접근

### ❌ 불필요한 MCP (비활성화 권장)
- **TalkToFigma**: 디자인 작업 없음
- **playwright-mcp**: 웹 자동화 불필요
- **chrome-devtools-mcp**: 브라우저 디버깅 불필요
- **sequential-thinking**: 특수 사고 패턴 불필요

---

## MCP 서버 비활성화 방법

### 방법 1: Claude Code 세션 시작 시 플러그인 선택

Claude Code를 실행할 때 플러그인을 선택적으로 로드할 수 있습니다:

```bash
# 필요한 MCP만 활성화하여 실행
claude --plugins serena,context7,filesystem
```

### 방법 2: 프로젝트별 설정 파일 생성

`.claude/project.json` 파일을 생성하여 프로젝트별 MCP 설정:

```json
{
  "mcpServers": {
    "serena": {
      "enabled": true
    },
    "context7": {
      "enabled": true
    },
    "TalkToFigma": {
      "enabled": false
    },
    "playwright": {
      "enabled": false
    },
    "chrome-devtools": {
      "enabled": false
    }
  }
}
```

### 방법 3: 전역 설정에서 비활성화

`~/.claude/settings.json`에서 전역 비활성화:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "tmux",
  "model": "sonnet",
  "disabledPlugins": [
    "TalkToFigma",
    "playwright-mcp",
    "chrome-devtools-mcp"
  ]
}
```

---

## 예상 효과

### 토큰 절약
- **Before**: 각 MCP 서버당 ~2,000-8,000 토큰
- **After**: 필요한 3개 MCP만 사용
- **절약**: ~10,000-15,000 토큰 (30% 감소)

### 응답 시간 단축
- **Before**: 초기화 시 모든 MCP 로드 (5-10초)
- **After**: 필요한 MCP만 로드 (2-3초)
- **개선**: 50-70% 응답 시간 단축

---

## 프로젝트별 권장 MCP 조합

### 웹 개발 프로젝트
- serena (코드 분석)
- playwright-mcp (E2E 테스트)
- chrome-devtools-mcp (디버깅)

### 백엔드 API 프로젝트
- serena (코드 분석)
- context7 (API 문서)
- filesystem (파일 관리)

### 알고리즘/데이터 구조 프로젝트 (현재 프로젝트)
- serena (코드 분석)
- context7 (문서 검색)
- filesystem (파일 관리)

### 디자인 시스템 프로젝트
- TalkToFigma (디자인 통합)
- serena (코드 분석)
- filesystem (파일 관리)

---

## 수동 비활성화 (현재 세션)

현재 실행 중인 MCP 프로세스를 확인하고 종료:

```bash
# 실행 중인 MCP 프로세스 확인
ps aux | grep -i mcp | grep -v grep

# 불필요한 프로세스 종료 (PID 확인 후)
kill <PID>
```

**주의**: 이 방법은 현재 세션에만 적용되며, 다음 세션에서 다시 로드됩니다.

---

## 확인 방법

최적화 후 토큰 사용량 확인:

```bash
# Claude Code 실행 후 첫 응답에서 토큰 사용량 확인
# system-reminder에 "Token usage: X/200000" 표시
```

---

## 추가 최적화 팁

1. **Serena 설정 조정**
   - `~/.serena/config.yaml`에서 캐시 설정 조정
   - 프로젝트별 인덱싱 범위 제한

2. **Context7 API 키 설정**
   - API 키를 설정하여 응답 속도 향상
   - 무료 티어에서 프리미엄 티어로 업그레이드

3. **SuperClaude Skills 정리**
   - `~/.claude/skills/` 디렉토리에서 불필요한 skill 제거
   - 자주 사용하는 skill만 유지

---

## 참고 자료

- Claude Code 플러그인 문서: [링크]
- MCP 프로토콜 명세: [링크]
- Serena MCP 설정 가이드: [링크]
