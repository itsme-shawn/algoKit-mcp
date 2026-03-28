---
name: algo:code-review
description: 백준(BOJ) 또는 프로그래머스 풀이 코드 분석 및 피드백. 정확성·복잡도 검토, 디버깅, 코드 리뷰가 필요할 때 사용.
---

# algo:code-review - 알고리즘 코드 분석

백준(BOJ)과 프로그래머스 문제 풀이 코드를 분석하고 개선점을 제안하는 스킬입니다.

## 사용법

```
/algo:code-review <문제식별자> [분석타입]
```

**예시:**
- `/algo:code-review boj 1003` - BOJ 1003번 풀이 분석
- `/algo:code-review programmers 42748 ` - 프로그래머스 42748번 풀이 분석
- `/algo:code-review 1003` - 숫자만 입력 → 플랫폼 질문
- `/algo:code-review https://www.acmicpc.net/problem/1003` - URL → BOJ 확정, 전체 분석
- `/algo:code-review https://school.programmers.co.kr/learn/courses/30/lessons/42748 debug` - URL → 프로그래머스, 디버깅

## 플랫폼 판별 규칙

| 입력 패턴 | 플랫폼 | 예시 |
|-----------|--------|------|
| `acmicpc.net` URL | BOJ | `https://www.acmicpc.net/problem/1003` |
| `school.programmers.co.kr` URL | Programmers | `https://school.programmers.co.kr/...` |
| **숫자만 입력** | **→ 반드시 되묻기** | `1003`, `42748` |

단, **대화 맥락에서 플랫폼이 이미 확인된 경우** (예: "백준 1003번 풀다가 막혔어")에는 되묻지 않고 그 플랫폼으로 진행합니다.

> ⚠️ **맥락이 없는 숫자 입력은 절대 임의로 플랫폼을 추정하지 않습니다.**

## 동작 방식

1. **플랫폼 판별**: 위 규칙 적용 → 불명확하면 즉시 되묻기
2. **사용자 코드 입력 요청**: 언어와 코드 받기
3. **MCP 도구 실행**: 플랫폼별 `analyze_code_submission_*` 사용
4. **분석 결과 제공**:
   - 문제 요구사항과 비교
   - 시간/공간 복잡도 분석
   - 개선점 제안
   - 디버깅 가이드

## MCP 도구 사용

### BOJ

```
algokit/analyze_code_submission_boj {
  problem_id: 1003,
  code: "def fib(n):\n    ...",
  language: "python",
  analysis_type: "full"
}
```

### 프로그래머스

```
algokit/analyze_code_submission_programmers {
  problem_id: 42748,
  code: "def solution(array, commands):\n    ...",
  language: "python",
  analysis_type: "full"
}
```

## 분석 타입

| 타입 | 설명 | 포함 내용 |
|------|------|-----------|
| `full` | 전체 분석 (기본값) | 정확성, 복잡도, 개선점, 스타일 |
| `hint` | 힌트 제공 | 핵심 개념, 접근 방법, 방향 제시 |
| `debug` | 디버깅 중심 | 에러 원인, 로직 오류, 엣지 케이스 |
| `review` | 코드 리뷰 | 스타일, 가독성, 네이밍, 구조 |


## 대화형 프로세스

1. **코드 요청**:
   ```
   AI: 분석할 코드를 보여주세요. 언어도 함께 알려주세요 (python/cpp/java/js/go)
   ```

2. **분석 타입 선택** (미지정 시):
   ```
   AI: 어떤 분석이 필요하신가요?
   1. 전체 분석 (정확성 + 복잡도 + 개선점)
   2. 디버깅 (왜 틀렸는지)
   3. 힌트 (어떻게 풀어야 하는지)
   4. 코드 리뷰 (스타일 개선)
   ```

3. **MCP 도구 실행 및 결과 제시**:
   ```
   ## 분석 결과

   ### ✅ 정확성
   - 문제 요구사항을 충족합니다

   ### ⏱️ 복잡도
   - 시간: O(n) ✅
   - 공간: O(n)

   ### 💡 개선점
   1. ...
   ```

## 주의사항

- ✅ 코드는 반드시 사용자에게 입력받기 (추측 금지)
- ✅ 숫자만 입력된 경우 플랫폼 확인 후 진행
- ✅ 대화 맥락에서 플랫폼이 이미 확인된 경우 그 맥락 활용
- ✅ 분석 결과는 건설적이고 친절하게
- ✅ 개선점 제안 시 "왜"를 설명
- ❌ 맥락 없이 플랫폼 임의 추정 금지
- ❌ 코드를 함부로 완전히 재작성하지 않기
- ❌ `hint` 타입 외에는 문제 정답 직접 제공 금지

## 에러 처리

| 에러 | 원인 | 해결 |
|------|------|------|
| 언어 미지원 | 지원 언어 외 | 지원 언어로 변환 요청 |
| 코드 없음 | 코드 미제공 | 전체 코드 요청 |
| 문제 없음 | 잘못된 번호 | 번호/URL 확인 |

## 관련 스킬

- `/algo:fetch` - 문제 본문 크롤링 (내부 자동 호출)
- `/algo:hint` - 코드 없이 힌트만 받기
- `/algo:review` - 풀이 후 복습 문서 작성
