# algo:code-review - 백준 코드 분석

백준 문제 풀이 코드를 분석하고 개선점을 제안하는 스킬입니다.

## 사용법

```
/algo:code-review <문제번호> [분석타입]
```

**예시:**
- `/algo:code-review 1003` - 전체 분석 (기본값)
- `/algo:code-review 1003 debug` - 디버깅 중심
- `/algo:code-review 1003 hint` - 힌트 중심
- `/algo:code-review 1003 review` - 코드 리뷰 중심

## 동작 방식

1. **사용자 코드 입력 요청**: 언어와 코드 받기
2. **문제 본문 크롤링**: `fetch_problem_content` 내부 호출
3. **MCP 도구 실행**: `analyze_code_submission` 사용
4. **분석 결과 제공**:
   - 문제 요구사항과 비교
   - 시간/공간 복잡도 분석
   - 개선점 제안
   - 디버깅 가이드

## MCP 도구 사용

반드시 다음 순서로 실행:

```bash
# 1. 스키마 확인 (필수)
mcp-cli info algokit/analyze_code_submission

# 2. 코드 분석 실행
mcp-cli call algokit/analyze_code_submission '{
  "problem_id": 1003,
  "code": "def fib(n):\\n    ...",
  "language": "python",
  "analysis_type": "full"
}'
```

## 분석 타입

| 타입 | 설명 | 포함 내용 |
|------|------|-----------|
| **full** | 전체 분석 (기본값) | 정확성, 복잡도, 개선점, 스타일 |
| **hint** | 힌트 제공 | 핵심 개념, 접근 방법, 방향 제시 |
| **debug** | 디버깅 중심 | 에러 원인, 로직 오류, 엣지 케이스 |
| **review** | 코드 리뷰 | 스타일, 가독성, 네이밍, 구조 |

## 지원 언어

- Python (`python`)
- C++ (`cpp`)
- JavaScript (`javascript`)
- Java (`java`)
- Go (`go`)

## 응답 예시

```json
{
  "problemInfo": {
    "problemId": 1003,
    "title": "피보나치 함수",
    "requirements": "0과 1이 각각 몇 번 호출되는지 계산",
    "constraints": {
      "timeLimit": "0.25초",
      "memoryLimit": "128 MB",
      "inputRange": "N ≤ 40"
    }
  },
  "codeMetadata": {
    "language": "python",
    "lines": 15,
    "estimatedComplexity": {
      "time": "O(n)",
      "space": "O(n)"
    }
  },
  "analysisPrompts": {
    "correctness": "코드가 문제 요구사항을 충족하는지...",
    "complexity": "시간복잡도와 공간복잡도를 분석하세요...",
    "improvements": "다음 개선 가능한 부분을 찾아주세요...",
    "debugging": "잠재적인 에러 케이스..."
  },
  "suggestedQuestions": [
    "메모이제이션을 적용했나요?",
    "N=0일 때 올바르게 처리하나요?",
    "시간 제한을 충족하나요?"
  ]
}
```

## 사용 시나리오

### 1. 제출 전 코드 검증
```
사용자: 이 코드 제출해도 될까?
AI: 코드를 보여주세요
[사용자 코드 제공]
AI: /cote:code-review 1003 실행 (analysis_type: full)
→ 정확성, 복잡도, 개선점 제공
```

### 2. 틀린 코드 디버깅
```
사용자: 이 코드가 왜 틀렸을까?
AI: 코드를 보여주세요
[사용자 코드 제공]
AI: /algo:code-review 1003 debug
→ 로직 오류, 엣지 케이스 분석
```

### 3. 코드 개선
```
사용자: 이 코드를 더 효율적으로 만들 수 있을까?
AI: /algo:code-review 1003 full
→ 복잡도 분석, 최적화 제안
```

### 4. 스타일 개선
```
사용자: 코드 리뷰 부탁해
AI: /algo:code-review 1003 review
→ 가독성, 네이밍, 구조 개선점
```

## 대화형 프로세스

1. **코드 요청**:
   ```
   AI: 분석할 코드를 보여주세요. 언어도 함께 알려주세요 (python/cpp/java/js/go)
   ```

2. **언어 확인**:
   ```
   사용자: [코드 붙여넣기]
   AI: Python 코드로 인식했습니다. 맞나요?
   ```

3. **분석 타입 선택**:
   ```
   AI: 어떤 분석이 필요하신가요?
   1. 전체 분석 (정확성 + 복잡도 + 개선점)
   2. 디버깅 (왜 틀렸는지)
   3. 힌트 (어떻게 풀어야 하는지)
   4. 코드 리뷰 (스타일 개선)
   ```

4. **MCP 도구 실행**:
   ```bash
   mcp-cli call algokit/analyze_code_submission '{...}'
   ```

5. **결과 제시**:
   ```
   ## 분석 결과

   ### ✅ 정확성
   - 문제 요구사항을 충족합니다

   ### ⏱️ 복잡도
   - 시간: O(n) - 제한 시간 충족 ✅
   - 공간: O(n)

   ### 💡 개선점
   1. 메모이제이션을 Bottom-up으로 변경하면 재귀 오버헤드 제거
   2. N=0 엣지 케이스 처리 추가 필요
   ```

## 분석 프롬프트 활용

MCP 도구는 **분석 가이드 프롬프트**를 반환합니다.
Claude Code가 이 프롬프트로 사용자 코드를 분석합니다.

```json
"analysisPrompts": {
  "correctness": "이 코드가 다음 요구사항을 충족하는지 확인하세요...",
  "complexity": "시간복잡도를 분석하고 제한 시간 내 실행 가능한지...",
  "improvements": "다음 관점에서 개선점을 찾아주세요..."
}
```

→ Claude Code가 프롬프트를 사용해 맞춤형 피드백 생성

## 주의사항

- ✅ 코드는 반드시 사용자에게 입력받기 (추측 금지)
- ✅ 언어 자동 인식 시 사용자에게 확인
- ✅ 분석 결과는 건설적이고 친절하게
- ✅ 개선점 제안 시 "왜"를 설명
- ❌ 코드를 함부로 완전히 재작성하지 않기
- ❌ 문제 정답을 바로 제공하지 않기 (hint 타입 제외)

## 에러 처리

| 에러 | 원인 | 해결 |
|------|------|------|
| 언어 미지원 | Python/C++/JS/Java/Go 외 언어 | 지원 언어로 변환 요청 |
| 코드 너무 짧음 | 1자 미만 | 전체 코드 요청 |
| 문제 없음 | 잘못된 문제 번호 | 문제 번호 확인 |

## 연계 스킬

- `/algo:fetch` - 문제 본문 크롤링 (내부 자동 호출)
- `/algo:hint` - 코드 없이 힌트만 받기
- `/algo:review` - 풀이 후 복습 문서 작성

## Phase 6 기능

이 스킬은 **Phase 6** 기능으로 구현 예정입니다:
- P6-005: CodeAnalyzer 서비스 구현
- P6-006: analyze_code_submission MCP 도구 구현
- P6-007: 분석 가이드 프롬프트 체계 설계

현재 상태: **개발 중** (index.ts에 미등록)

## 활용 예시

### Python DP 코드 분석
```python
# 사용자 코드
def fib(n):
    if n == 0: return [1, 0]
    if n == 1: return [0, 1]

    prev2 = [1, 0]
    prev1 = [0, 1]

    for i in range(2, n+1):
        curr = [prev1[0] + prev2[0], prev1[1] + prev2[1]]
        prev2 = prev1
        prev1 = curr

    return prev1

# AI 피드백 (full 분석)
✅ 정확성: Bottom-up DP 구현 정확
⏱️ 복잡도: O(n) 시간, O(1) 공간 - 최적 ✅
💡 개선점:
  - 변수명을 더 명확하게 (prev2 → zero_count_n_2)
  - n == 0, 1 케이스를 배열 초기화로 통합 가능
🎯 결론: 제출해도 좋습니다!
```
