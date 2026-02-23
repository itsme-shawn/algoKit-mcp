# algo:hint - 알고리즘 문제 힌트 생성

백준(BOJ)과 프로그래머스 문제를 분석하고 단계별 힌트를 제공하는 스킬입니다.

## 사용법

```
/algo:hint <문제식별자>
```

**예시:**
- `/algo:hint 1003` - 숫자만 입력 → 플랫폼 질문
- `/algo:hint https://school.programmers.co.kr/learn/courses/30/lessons/42748` - URL → 프로그래머스 확정
- `/algo:hint https://www.acmicpc.net/problem/1003` - URL → BOJ 확정

## 플랫폼 판별 규칙

| 입력 패턴 | 플랫폼 | 예시 |
|-----------|--------|------|
| `acmicpc.net` URL | BOJ | `https://www.acmicpc.net/problem/1003` |
| `school.programmers.co.kr` URL | Programmers | `https://school.programmers.co.kr/...` |
| **숫자만 입력** | **→ 반드시 되묻기** | `1003`, `42748` |

단, **대화 맥락에서 플랫폼이 이미 확인된 경우** (예: "백준 문제 풀고 있어", 직전에 BOJ 문제를 함께 논의 중)에는 되묻지 않고 그 플랫폼으로 진행합니다.

> ⚠️ **맥락이 없는 숫자 입력은 절대 임의로 플랫폼을 추정하지 않습니다.**

## 동작 방식

1. **플랫폼 판별**: 위 규칙 적용 → 불명확하면 즉시 되묻기
2. **MCP 도구 호출**: 플랫폼별 `analyze_problem_*` 실행
3. **분석 정보 수신**: 난이도, 태그, 힌트 가이드 프롬프트
4. **사용자 상황 파악**: 현재 진행 상황 분석
5. **단계별 힌트 제공** (한 번에 1개 레벨)

## MCP 도구 사용

### BOJ

```
algokit/analyze_problem_boj { problem_id: 1003 }
```

필요 시 문제 본문도 확인:
```
algokit/fetch_problem_content_boj { problem_id: 1003 }
```

### 프로그래머스

```
algokit/analyze_problem_programmers { problem_id: 42748 }
```

필요 시 문제 본문도 확인:
```
algokit/fetch_problem_content_programmers { problem_id: 42748 }
```

## 힌트 레벨 선택 가이드

사용자 상황을 파악하고 **단 1개 레벨만** 제공:

| 상황 | 레벨 | 판단 기준 |
|------|------|-----------|
| 처음 시도 / 막힘 | Level 1 | 코드 없음, "어떻게 시작?", "접근법?" |
| 일부 구현 완료 | Level 2 | 코드 작성 중, "더 필요해", "구현 막힘" |
| 정답 요청 | Level 3 | "정답", "풀이", "코드 보여줘" 명시 |

## 힌트 제공 프로세스

1. **상황 파악**:
   ```
   AI: 어디서 막히셨나요? 코드가 있으시면 보여주세요.
   ```

2. **Level 1 제공** (처음 막힌 경우):
   ```
   hint_levels[0].prompt를 활용해 접근법 안내
   ```

3. **Level 2 제공** (추가 요청 시):
   ```
   hint_levels[1].prompt를 활용해 핵심 로직 안내
   ```

4. **Level 3 제공** (명시적 요청 시):
   ```
   hint_levels[2].prompt를 활용해 상세 구현 가이드 제공
   ```

## 주의사항

- ❌ 3개 레벨 동시 제공 금지
- ✅ 사용자 상황 분석 후 1개 레벨만 선택
- ✅ 프롬프트 가이드를 활용해 문제별 맞춤 힌트 생성
- ✅ 사용자가 "더 힌트" 요청 시 다음 레벨로 진행
- ✅ 숫자만 입력된 경우 플랫폼 확인 후 진행
- ✅ 대화 맥락에서 플랫폼이 이미 확인된 경우 그 맥락 활용
- ❌ 맥락 없이 플랫폼 임의 추정 금지

## 관련 스킬

- `/algo:fetch` - 문제 본문 직접 확인
- `/algo:review` - 풀이 후 복습 템플릿 생성
- `/algo:search` - 유사 난이도 문제 검색
