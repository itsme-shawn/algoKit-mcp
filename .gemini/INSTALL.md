# AlgoKit MCP - Gemini CLI 설치 가이드

## 1. MCP 서버 설정 (전역)

`~/.gemini/settings.json` 에 추가:

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

## 2. Skills 설치 (전역)

```bash
git clone https://github.com/itsme-shawn/AlgoKit-mcp.git /tmp/algokit-mcp
mkdir -p ~/.gemini/skills
cp -r /tmp/algokit-mcp/skills/algo:* ~/.gemini/skills/
rm -rf /tmp/algokit-mcp
```

### 프로젝트 설치 (선택)

```bash
# .gemini/settings.json 에 MCP 설정 추가
# .gemini/skills/ 에 스킬 복사
git clone https://github.com/itsme-shawn/AlgoKit-mcp.git /tmp/algokit-mcp
mkdir -p .gemini/skills
cp -r /tmp/algokit-mcp/skills/algo:* .gemini/skills/
rm -rf /tmp/algokit-mcp
```

## 설치 확인

Gemini CLI에서 다음을 입력하여 동작을 확인하세요:

```
골드 난이도 DP 문제 찾아줘
```
