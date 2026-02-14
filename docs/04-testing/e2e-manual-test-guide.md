# E2E 수동 테스트 가이드

**프로젝트**: cote-mcp: BOJ 학습 도우미 MCP Server
**작성일**: 2026-02-14
**마지막 업데이트**: 2026-02-14 (MCP Inspector 호환성 개선)

---

## 목차
1. [MCP Inspector란?](#mcp-inspector란)
2. [테스트 방법](#테스트-방법)
3. [테스트 시나리오](#테스트-시나리오)
4. [문제 해결](#문제-해결)

---

## MCP Inspector란?

**MCP Inspector**는 Anthropic에서 제공하는 **MCP 서버 개발 및 디버깅 도구**입니다.

### 주요 기능
1. **서버 연결 테스트**: MCP 서버가 올바르게 실행되는지 확인
2. **도구 탐색**: 서버가 제공하는 모든 tools/resources/prompts 목록 확인
3. **인터랙티브 테스트**: 각 도구를 실제로 호출하고 응답 확인
4. **실시간 디버깅**: 요청/응답 JSON을 실시간으로 확인
5. **스키마 검증**: 입력 스키마 확인

### 왜 MCP Inspector가 중요한가?

**MCP Inspector = 표준 스펙 준수 체크**

- **MCP Inspector**: 공식 MCP 프로토콜 구현 테스트 도구
- **Claude Code**: 자연어 처리로 스키마 부족을 보완 (추가 기능)

**Inspector에서 작동 = 표준 준수 = 다른 모든 MCP 클라이언트에서도 작동**

---

## 테스트 방법

### 방법 1: MCP Inspector 사용 (추천) ⭐

#### 1단계: MCP Inspector 설치
```bash
npm install -g @modelcontextprotocol/inspector
```

#### 2단계: 서버 빌드
```bash
npm run build
```

#### 3단계: Inspector 실행
```bash
# 프로젝트 루트에서
npx @modelcontextprotocol/inspector node dist/index.js
```

#### 4단계: 브라우저에서 테스트
1. 브라우저가 자동으로 열림 (보통 `http://localhost:5173`)
2. 왼쪽 사이드바에서 도구 목록 확인:
   - `search_problems`
   - `get_problem`
   - `search_tags`
   - `analyze_problem`
   - `generate_review_template`
   - `health_check`

3. 각 도구 클릭 → 입력 폼 작성 → **Execute** 버튼 클릭
4. 오른쪽에서 응답 JSON 확인

#### 5단계: 실제 테스트 예시

**예시 1: 문제 검색**
```json
{
  "level_min": 11,
  "level_max": 15,
  "tag": "dp"
}
```

**예시 2: 문제 분석**
```json
{
  "problem_id": 1003
}
```

**예시 3: 복습 템플릿 생성**
```json
{
  "problem_id": 1003,
  "user_notes": "DP 배열 정의가 헷갈렸음"
}
```

---

### 방법 2: Claude Desktop 연동 테스트

#### 1단계: Claude Desktop 설정
`~/Library/Application Support/Claude/claude_desktop_config.json` 파일 수정:

```json
{
  "mcpServers": {
    "cote-mcp": {
      "command": "node",
      "args": [
        "/Users/shawn/dev/projects/cote-mcp-server/dist/index.js"
      ]
    }
  }
}
```

#### 2단계: Claude Desktop 재시작

#### 3단계: 대화로 테스트
```
"골드 난이도의 DP 문제 5개를 검색해줘"
"백준 1003번 문제를 분석해줘"
"백준 1003번 문제의 복습 템플릿을 생성해줘"
```

---

### 방법 3: 직접 stdio 테스트 (고급)

#### 테스트 스크립트 작성
```bash
# 초기화 + 도구 목록
cat > /tmp/test-mcp.json << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
EOF

# 실행
cat /tmp/test-mcp.json | node dist/index.js
```

#### 도구 호출 테스트
```bash
cat > /tmp/test-call.json << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"health_check","arguments":{}}}
EOF

cat /tmp/test-call.json | node dist/index.js
```

---

## 테스트 시나리오

### 시나리오 1: 문제 검색 → 분석 → 복습

1. **문제 검색**: `search_problems`
   ```json
   {
     "level_min": 11,
     "level_max": 15,
     "tag": "dp",
     "page": 1
   }
   ```

2. **문제 상세 조회**: `get_problem`
   ```json
   {
     "problem_id": 1003
   }
   ```

3. **문제 분석**: `analyze_problem`
   ```json
   {
     "problem_id": 1003,
     "include_similar": true
   }
   ```

4. **복습 템플릿 생성**: `generate_review_template`
   ```json
   {
     "problem_id": 1003,
     "user_notes": "피보나치 DP 문제"
   }
   ```

### 시나리오 2: 태그 탐색 → 문제 상세

1. **태그 검색**: `search_tags`
   ```json
   {
     "query": "그래프"
   }
   ```

2. **태그로 문제 검색**: `search_problems`
   ```json
   {
     "tag": "graphs",
     "level_min": 6,
     "level_max": 10
   }
   ```

3. **문제 상세 조회**: `get_problem`
   ```json
   {
     "problem_id": 1260
   }
   ```

### 시나리오 3: 에러 핸들링 테스트

1. **잘못된 문제 ID**: `get_problem`
   ```json
   {
     "problem_id": 99999999
   }
   ```
   → 예상: "문제를 찾을 수 없습니다" 에러

2. **잘못된 티어 범위**: `search_problems`
   ```json
   {
     "level_min": 20,
     "level_max": 10
   }
   ```
   → 예상: "level_min은 level_max보다 작거나 같아야 합니다" 에러

3. **잘못된 티어 문자열**: `search_problems`
   ```json
   {
     "level_min": "잘못된티어"
   }
   ```
   → 예상: 티어 파싱 에러

---

## 문제 해결

### Inspector가 실행되지 않을 때

```bash
# 빌드 파일 확인
ls -la dist/index.js

# 빌드 재시도
npm run build

# 권한 문제 확인
chmod +x dist/index.js
```

### 포트가 이미 사용 중일 때

```bash
# 실행 중인 Inspector 프로세스 확인
ps aux | grep inspector | grep -v grep

# 프로세스 종료
pkill -f "mcp-inspector"

# 다시 실행
npx @modelcontextprotocol/inspector node dist/index.js
```

### Claude Desktop 연동 안 될 때

1. **설정 파일 경로 확인**
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **JSON 문법 검증**
   - 쉼표, 괄호 확인
   - 경로가 절대 경로인지 확인

3. **Claude Desktop 로그 확인**
   ```bash
   tail -f ~/Library/Logs/Claude/mcp*.log
   ```

4. **빌드 파일 경로 확인**
   ```bash
   # package.json의 "main" 필드와 일치하는지 확인
   ls -la dist/index.js
   ```

### API 응답이 느릴 때

- solved.ac API는 무료 티어라 가끔 느릴 수 있음
- Inspector의 타임아웃 설정 확인
- 네트워크 연결 확인

---

## 각 방법의 장단점

| 방법 | 장점 | 단점 | 추천 상황 |
|------|------|------|-----------|
| **MCP Inspector** | GUI, 실시간 디버깅, 스키마 자동 표시 | 별도 설치 필요 | **개발 중 빠른 테스트** |
| **Claude Desktop** | 실제 사용 환경, 자연어 테스트 | 설정 필요, 디버깅 어려움 | **최종 사용자 시나리오 검증** |
| **stdio 스크립트** | 자동화 가능, 세밀한 제어 | 직접 코드 작성 필요 | **CI/CD 통합, 반복 테스트** |

---

## MCP Inspector 호환성 개선 (2026-02-14)

### 문제점
- `zodToJsonSchema`가 Zod v4와 호환되지 않아 빈 객체 `{}` 반환
- MCP Inspector에서 입력 폼이 표시되지 않음
- Claude Code는 자연어 처리로 보완했지만 표준 위반

### 해결 방법
1. ❌ **Zod `.transform()` 제거**: JSON Schema로 변환 불가능
2. ✅ **수동 JSON Schema 작성**: 표준 JSON Schema 객체 직접 작성
3. ✅ **입력 변환을 핸들러로 이동**: 티어 문자열 → 숫자 변환 로직

### 결과
- ✅ MCP Inspector에서 입력 스키마 정상 표시
- ✅ 모든 도구 파라미터 자동 완성
- ✅ 표준 MCP 프로토콜 준수

### 예시: search_problems 스키마

**Before** (작동하지 않음):
```typescript
export const SearchProblemsInputSchema = z.object({
  level_min: z.union([
    z.number().int().min(1).max(30),
    z.string().transform((val) => parseTierString(val))  // ❌ 변환 불가
  ]).optional()
});
```

**After** (표준 준수):
```typescript
// src/index.ts
inputSchema: {
  type: 'object',
  properties: {
    level_min: {
      oneOf: [
        { type: 'number', minimum: 1, maximum: 30 },
        { type: 'string' }  // ✅ 변환은 핸들러에서
      ],
      description: '최소 난이도 (숫자 1-30 또는 "실버 3", "Gold I" 형식)'
    }
  }
}
```

```typescript
// src/tools/search-problems.ts
export async function searchProblems(input: SearchProblemsInput): Promise<string> {
  // 티어 문자열을 숫자로 변환
  let level_min: number | undefined;
  if (input.level_min !== undefined) {
    level_min = typeof input.level_min === 'string'
      ? parseTierString(input.level_min)  // ✅ 핸들러에서 변환
      : input.level_min;
  }
  // ...
}
```

---

## 다음 단계

- [ ] CI/CD 파이프라인에 MCP Inspector 테스트 통합
- [ ] 자동화 테스트 스크립트 작성 (`test-all-tools.sh`)
- [ ] 성능 벤치마크 테스트 추가

---

**작성자**: Technical Writer
**최종 검토일**: 2026-02-14
