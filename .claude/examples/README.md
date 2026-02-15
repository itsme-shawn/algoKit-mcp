# AlgoKit CLI 설정 예시

이 디렉토리에는 각 CLI별 MCP 서버 설정 예시 파일이 포함되어 있습니다.

## 📁 파일 목록

### 1. `claude-code-config.json`
**대상**: Claude Code 사용자
**위치**: `~/.config/Claude/claude_desktop_config.json` (기존 파일에 병합)
**특징**: Skill 지원, 플랫폼 자동 선택

### 2. `codex-config.toml`
**대상**: Codex CLI 사용자
**위치**: `~/.codex/config.toml` 또는 `.codex/config.toml`
**특징**: MCP만 지원, 수동 도구 선택

### 3. `gemini-config.json`
**대상**: Gemini CLI 사용자
**위치**: `~/.gemini/config.json` 또는 프로젝트별 설정
**특징**: MCP만 지원, 수동 도구 선택

## 🚀 사용 방법

### Claude Code

1. 기존 설정 파일 열기:
```bash
# macOS/Linux
open ~/.config/Claude/claude_desktop_config.json

# 또는 직접 편집
nano ~/.config/Claude/claude_desktop_config.json
```

2. `claude-code-config.json` 내용을 기존 파일의 `mcpServers` 섹션에 추가

3. **절대 경로 수정**: `/absolute/path/to/algokit/build/index.js`를 실제 경로로 변경

4. Claude Code 재시작

### Codex CLI

1. 설정 파일 복사:
```bash
cp .claude/examples/codex-config.toml ~/.codex/config.toml
```

2. **절대 경로 수정**: 파일 내 경로를 실제 AlgoKit 경로로 변경

3. Codex CLI 재시작

### Gemini CLI

1. 설정 파일 복사:
```bash
cp .claude/examples/gemini-config.json ~/.gemini/config.json
```

2. **절대 경로 수정**: 파일 내 경로를 실제 AlgoKit 경로로 변경

3. Gemini CLI 재시작

## ⚠️ 주의사항

### 경로 설정
- **반드시 절대 경로 사용** (예: `/Users/shawn/projects/algokit/build/index.js`)
- 상대 경로나 `~` 경로는 동작하지 않을 수 있음
- `pwd` 명령어로 현재 디렉토리 확인 가능

### 빌드 필수
설정 전에 반드시 빌드를 완료해야 합니다:
```bash
cd /path/to/algokit
npm install
npm run build
```

### macOS 경로 예시
```
/Users/username/dev/algokit/build/index.js
```

### Linux 경로 예시
```
/home/username/projects/algokit/build/index.js
```

### Windows 경로 예시
```json
{
  "command": "node",
  "args": ["C:\\Users\\username\\projects\\algokit\\build\\index.js"]
}
```
※ Windows는 백슬래시를 이중으로 입력 (`\\`)

## 🔍 설치 확인

### Claude Code
MCP Inspector로 직접 테스트:
```bash
npx @modelcontextprotocol/inspector node build/index.js
```

### Codex CLI
도구 목록 확인:
```bash
mcp-cli tools algokit
```

### Gemini CLI
설정 확인:
```bash
gemini config list
```

## 📚 추가 도움말

상세한 설치 가이드는 [README.md](../../README.md#설치-및-설정) 참조
