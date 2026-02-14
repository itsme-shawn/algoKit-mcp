# algo:fetch - 백준 문제 본문 크롤링

백준 온라인 저지(BOJ) 웹페이지에서 문제 전문을 크롤링하는 스킬입니다.

## 사용법

```
/algo:fetch <문제번호>
```

**예시:**
- `/algo:fetch 1003` - 피보나치 함수 문제 본문 가져오기
- `/algo:fetch 11729` - 하노이 탑 문제 본문 가져오기

## 동작 방식

1. **MCP 도구 호출**: `algokit/fetch_problem_content` 사용
2. **BOJ 크롤링**: https://www.acmicpc.net/problem/{ID}에서 HTML 파싱
3. **구조화된 데이터 반환**:
   - 문제 제목, 설명
   - 입출력 형식
   - 예제 입출력
   - 시간/메모리 제한
   - 메타데이터

## MCP 도구 사용

반드시 다음 순서로 실행:

```bash
# 1. 스키마 확인 (필수)
mcp-cli info algokit/fetch_problem_content

# 2. 문제 본문 크롤링
mcp-cli call algokit/fetch_problem_content '{"problem_id": 1003}'
```

## 응답 예시

```json
{
  "problemId": 1003,
  "title": "피보나치 함수",
  "description": "다음 소스는 N번째 피보나치 수를 구하는 C++ 함수이다...",
  "inputFormat": "첫째 줄에 테스트 케이스의 개수 T가 주어진다...",
  "outputFormat": "각 테스트 케이스마다 0이 출력되는 횟수와...",
  "examples": [
    {
      "input": "3\n0\n1\n3",
      "output": "1 0\n0 1\n1 2"
    }
  ],
  "limits": {
    "timeLimit": "0.25초 (추가 시간 없음)",
    "memoryLimit": "128 MB"
  },
  "metadata": {
    "fetchedAt": "2026-02-15T00:00:00.000Z",
    "sourceUrl": "https://www.acmicpc.net/problem/1003"
  }
}
```

## 사용 시나리오

### 1. 문제 풀이 전 문제 확인
```
사용자: 1003번 문제가 뭐야?
AI: /algo:fetch 1003 실행 → 문제 설명 요약
```

### 2. 문제 복습 시 내용 참조
```
사용자: 이 문제 다시 풀어보려고 하는데
AI: /algo:fetch 실행 → 입출력 예제 제시
```

### 3. 코드 분석 시 요구사항 비교
```
/algo:fetch로 문제 요구사항 확인
→ /algo:code-review로 코드가 요구사항 충족하는지 검증
```

### 4. 예제 입출력 확인
```
사용자: 예제 입력이 뭐였더라?
AI: /algo:fetch 실행 → examples 섹션 제공
```

## 크롤링 제한사항

| 항목 | 설정 |
|------|------|
| 타임아웃 | 10초 |
| 재시도 | 최대 2회 |
| 캐시 | 30일 (Phase 6-3 예정) |
| 대상 URL | https://www.acmicpc.net/problem/{ID} |

## 에러 처리

| 에러 타입 | 원인 | 해결 방법 |
|-----------|------|-----------|
| NOT_FOUND | 문제 번호가 존재하지 않음 | 문제 번호 확인 |
| TIMEOUT | 10초 내 응답 없음 | 재시도 또는 네트워크 확인 |
| NETWORK_ERROR | 네트워크 연결 실패 | 인터넷 연결 확인 |
| PARSE_ERROR | HTML 구조 변경 | 이슈 리포트 |

## 주의사항

- ✅ 문제 본문이 필요할 때만 사용 (API 부하 최소화)
- ✅ 크롤링 결과는 구조화된 JSON으로 제공
- ✅ 예제 입출력은 배열로 제공 (여러 개 가능)
- ⚠️ BOJ 웹사이트 HTML 구조 변경 시 파싱 실패 가능

## 연계 스킬

- `/algo:hint` - 문제 힌트 생성
- `/algo:code-review` - 코드 분석 (문제 본문과 비교)
- `/algo:review` - 복습 템플릿 생성

## Phase 6 기능

이 스킬은 **Phase 6** 기능으로 구현 예정입니다:
- P6-002: BOJ 페이지 크롤러 구현
- P6-003: HTML 파서 구현
- P6-004: fetch_problem_content MCP 도구 구현
- P6-005: 캐싱 레이어 추가 (30일)

현재 상태: **개발 중** (index.ts에 미등록)
