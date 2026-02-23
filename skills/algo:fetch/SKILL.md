# algo:fetch - 알고리즘 문제 본문 크롤링

백준(BOJ)과 프로그래머스 문제의 전문을 가져오는 스킬입니다.

## 사용법

```
/algo:fetch <문제식별자>
```

**예시:**
- `/algo:fetch 1003` - 숫자만 입력 → 플랫폼 질문
- `/algo:fetch https://www.acmicpc.net/problem/1003` - URL → BOJ 확정
- `/algo:fetch https://school.programmers.co.kr/learn/courses/30/lessons/42748` - URL → 프로그래머스 확정

## 플랫폼 판별 규칙

| 입력 패턴 | 플랫폼 | 예시 |
|-----------|--------|------|
| `acmicpc.net` URL | BOJ | `https://www.acmicpc.net/problem/1003` |
| `school.programmers.co.kr` URL | Programmers | `https://school.programmers.co.kr/...` |
| **숫자만 입력** | **→ 반드시 되묻기** | `1003`, `42748` |

단, **대화 맥락에서 플랫폼이 이미 확인된 경우** (예: "백준 1003번 풀고 있어")에는 되묻지 않고 그 플랫폼으로 진행합니다.

> ⚠️ **맥락이 없는 숫자 입력은 절대 임의로 플랫폼을 추정하지 않습니다.**

## 동작 방식

1. **플랫폼 판별**: 위 규칙 적용 → 불명확하면 즉시 되묻기
2. **MCP 도구 호출**: 플랫폼별 `fetch_problem_content_*` 실행
3. **구조화된 데이터 반환**:
   - 문제 제목, 설명
   - 입출력 형식
   - 예제 입출력
   - 시간/메모리 제한 (BOJ) 또는 제한사항 (Programmers)
   - 메타데이터

## MCP 도구 사용

### BOJ

```
algokit/fetch_problem_content_boj { problem_id: 1003 }
```

크롤링 대상: `https://www.acmicpc.net/problem/{ID}`

### 프로그래머스

```
# 숫자 ID로
algokit/fetch_problem_content_programmers { problem_id: 42748 }

# URL로
algokit/fetch_problem_content_programmers {
  problem_id: "https://school.programmers.co.kr/learn/courses/30/lessons/42748"
}
```

크롤링 대상: `https://school.programmers.co.kr/learn/courses/30/lessons/{ID}`

## 크롤링 제한사항

| 항목 | BOJ | Programmers |
|------|-----|-------------|
| 타임아웃 | 10초 | 10초 |
| 재시도 | 최대 2회 | 최대 2회 |
| 캐시 | 30일 | 30일 |

## 에러 처리

| 에러 | 원인 | 해결 |
|------|------|------|
| NOT_FOUND | 문제 번호가 없음 | 번호/URL 확인 |
| TIMEOUT | 10초 초과 | 재시도 |
| PARSE_ERROR | HTML 구조 변경 | 이슈 리포트 |

## 사용 시나리오

1. **문제 풀이 전 확인**: 입출력 예제, 제한 조건 파악
2. **문제 복습 시 참조**: 요구사항 재확인
3. **코드 분석 시 비교**: `/algo:code-review`와 연계

## 주의사항

- ✅ 숫자만 입력된 경우 플랫폼 확인 후 진행
- ✅ 대화 맥락에서 플랫폼이 이미 확인된 경우 그 맥락 활용
- ✅ 문제 본문 필요 시에만 사용 (서버 부하 최소화)
- ❌ 맥락 없이 플랫폼 임의 추정 금지
- ⚠️ 웹사이트 HTML 구조 변경 시 파싱 실패 가능

## 관련 스킬

- `/algo:hint` - 문제 힌트 생성 (내부적으로 fetch 활용)
- `/algo:code-review` - 코드와 문제 요구사항 비교 분석
- `/algo:review` - 복습 템플릿 생성
