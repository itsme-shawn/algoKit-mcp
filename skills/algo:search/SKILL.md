# algo:search - 알고리즘 문제 검색

백준(BOJ)과 프로그래머스 문제를 검색하고 추천하는 스킬입니다.

## 사용법

```
/algo:search [옵션]
```

**예시:**
- `/algo:search` - 대화형 검색 시작 (플랫폼 질문)
- `/algo:search 백준 DP 골드` - BOJ DP 골드 검색
- `/algo:search 프로그래머스 레벨 2` - 프로그래머스 레벨 2 검색

## 플랫폼 판별 규칙

| 입력 패턴 | 플랫폼 | 예시 |
|-----------|--------|------|
| "백준", "boj" 키워드 포함 | BOJ | `백준 DP 골드` |
| BOJ 티어명 포함 (브론즈/실버/골드/플래티넘/다이아/루비) | BOJ | `골드 5`, `실버 3` |
| "프로그래머스", "pg", "lv", "레벨" 키워드 포함 | Programmers | `프로그래머스 레벨 2` |
| **플랫폼 키워드 없음** | **→ 반드시 되묻기** | `DP 문제 추천해줘` |

> ⚠️ **플랫폼을 특정할 수 없는 입력은 절대 임의로 추정하지 않습니다.**

## 동작 방식

1. **플랫폼 판별**: 위 규칙 적용 → 불명확하면 즉시 되묻기
2. **검색 의도 파악**: 난이도, 태그, 키워드 추출
3. **MCP 도구 호출**
4. **결과 제공**: 정렬된 문제 목록
5. **후속 작업 제안**: `/algo:hint`, `/algo:review` 연계

## MCP 도구 사용

### BOJ 문제 검색

```
# 난이도 검색 (골드 5 = level 11)
algokit/search_problems_boj { level_min: 11, level_max: 11, page: 1 }

# 태그 + 난이도 검색
algokit/search_problems_boj { tags: ["dp"], level_min: 11, level_max: 15 }

# 태그 검색 (키워드 → 태그 변환)
algokit/search_tags_boj { query: "다이나믹" }

# 특정 문제 상세 조회
algokit/get_problem_boj { problem_id: 1003 }
```

### 프로그래머스 문제 검색

```
# 레벨 검색
algokit/search_problems_programmers { levels: [2], order: "popular", limit: 10 }

# 복수 레벨
algokit/search_problems_programmers { levels: [1, 2], order: "recent", limit: 20 }

# 특정 문제 상세 조회
algokit/get_problem_programmers { problem_id: 42748 }
# 또는 URL로 조회
algokit/get_problem_programmers { problem_id: "https://school.programmers.co.kr/learn/courses/30/lessons/42748" }
```

## BOJ 난이도(티어) 매핑

| 레벨 | 티어 | 레벨 | 티어 |
|------|------|------|------|
| 1-5 | Bronze V-I | 16-20 | Platinum V-I |
| 6-10 | Silver V-I | 21-25 | Diamond V-I |
| 11-15 | Gold V-I | 26-30 | Ruby V-I |

## 대화형 검색 프로세스

1. **의도 파악**:
   ```
   사용자: "DP 문제 추천해줘"
   AI: 어떤 플랫폼의 문제를 찾으시나요? (백준 / 프로그래머스)
   ```
   단, 직전 대화에서 이미 플랫폼이 확인된 경우(예: "백준 문제 풀고 있어")에는 되묻지 않고 그대로 활용합니다.

2. **조건 확인**:
   ```
   AI: 난이도는 어느 정도가 좋으신가요?
   사용자: "골드 정도"
   ```

3. **검색 실행 및 결과 제시**:
   ```
   찾은 문제 목록:
   | 번호 | 제목 | 난이도 |
   |------|------|--------|
   | 1003 | 피보나치 함수 | Silver III |
   ```

4. **후속 작업 제안**:
   ```
   힌트가 필요하시면 /algo:hint 1003 을 실행하세요
   ```

## 주의사항

- ✅ 플랫폼 불명확 시 반드시 확인 후 진행
- ✅ 직전 대화에서 플랫폼이 이미 언급된 경우 그 맥락을 활용
- ✅ 사용자 레벨에 맞는 난이도 추천
- ✅ 다른 스킬과 연계 제안 (`/algo:hint`, `/algo:review`)
- ❌ 결과 과다 반환 금지 (limit: 10~20 권장)
- ❌ 플랫폼 임의 추정 금지 (맥락이 없는 경우)

## 관련 스킬

- `/algo:hint` - 검색한 문제의 힌트 생성
- `/algo:fetch` - 문제 본문 상세 확인
- `/algo:review` - 풀이 후 복습 문서 생성
