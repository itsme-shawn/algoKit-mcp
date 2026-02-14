# algo:search - 백준 문제 검색

백준 온라인 저지(BOJ) 문제를 검색하고 추천하는 스킬입니다.

## 사용법

```
/algo:search [옵션]
```

**예시:**
- `/algo:search` - 대화형 검색 시작
- `/algo:search 다이나믹 프로그래밍` - DP 태그 검색
- `/algo:search 골드 5` - 골드 5 난이도 검색

## 동작 방식

1. **검색 의도 파악**: 사용자 요구사항 분석
2. **MCP 도구 선택**:
   - `search_problems`: 문제 검색
   - `search_tags`: 알고리즘 태그 검색
   - `get_problem`: 특정 문제 상세 조회
3. **결과 제공**: 정렬된 문제 목록
4. **추가 작업 제안**: 힌트/복습 스킬 연계

## MCP 도구 사용

### 1. 문제 검색 (search_problems)

```bash
# 스키마 확인
mcp-cli info algokit/search_problems

# 난이도 검색 (골드 5 = 티어 11)
mcp-cli call algokit/search_problems '{
  "query": "*s.11",
  "limit": 10,
  "sort": "level"
}'

# 태그 검색 (DP)
mcp-cli call algokit/search_problems '{
  "query": "#dp",
  "limit": 10
}'

# 미해결 문제 (solved:false)
mcp-cli call algokit/search_problems '{
  "query": "!solved",
  "limit": 10
}'
```

### 2. 태그 검색 (search_tags)

```bash
# 스키마 확인
mcp-cli info algokit/search_tags

# 태그 검색
mcp-cli call algokit/search_tags '{
  "query": "dynamic"
}'
```

### 3. 문제 상세 조회 (get_problem)

```bash
# 스키마 확인
mcp-cli info algokit/get_problem

# 문제 정보
mcp-cli call algokit/get_problem '{
  "problemId": 1003
}'
```

## 검색 쿼리 문법

solved.ac API 쿼리 문법 사용:

| 쿼리 | 설명 | 예시 |
|------|------|------|
| `#tag` | 태그 검색 | `#dp`, `#greedy` |
| `*s.level` | 난이도 검색 | `*s.11` (골드 5) |
| `!solved` | 미해결 문제 | `!solved` |
| `tier:start..end` | 티어 범위 | `tier:11..15` |

### 난이도(티어) 매핑

| 티어 | 이름 | 티어 | 이름 |
|------|------|------|------|
| 1-5 | Bronze V-I | 16-20 | Platinum V-I |
| 6-10 | Silver V-I | 21-25 | Diamond V-I |
| 11-15 | Gold V-I | 26-30 | Ruby V-I |

## 응답 예시

```json
{
  "items": [
    {
      "problemId": 1003,
      "titleKo": "피보나치 함수",
      "level": 8,
      "tags": [
        { "key": "dp", "displayNames": [{ "name": "다이나믹 프로그래밍" }] }
      ],
      "acceptedUserCount": 50000,
      "averageTries": 2.5
    }
  ],
  "count": 1
}
```

## 대화형 검색 프로세스

1. **의도 파악**:
   ```
   사용자: "DP 문제 추천해줘"
   AI: 난이도는 어느 정도가 좋으신가요?
   ```

2. **검색 실행**:
   ```bash
   mcp-cli call algokit/search_problems '{"query": "#dp tier:11..13", "limit": 5}'
   ```

3. **결과 제시**:
   ```
   찾은 문제 5개:
   1. [1003] 피보나치 함수 (Silver III)
   2. [9184] 신나는 함수 실행 (Silver II)
   ...
   ```

4. **후속 작업 제안**:
   ```
   힌트가 필요하시면 /algo:hint 1003 을 실행하세요
   ```

## 추천 시나리오

### 1. 초보자용 문제
```bash
mcp-cli call algokit/search_problems '{
  "query": "tier:6..8 #implementation",
  "limit": 10,
  "sort": "solved"
}'
```

### 2. 특정 알고리즘 연습
```bash
mcp-cli call algokit/search_problems '{
  "query": "#dp tier:11..15",
  "limit": 10,
  "sort": "level"
}'
```

### 3. 비슷한 난이도 문제
```bash
mcp-cli call algokit/search_problems '{
  "query": "tier:11",
  "limit": 10,
  "sort": "random"
}'
```

## 주의사항

- ✅ 사용자 레벨 파악 후 적절한 난이도 추천
- ✅ 검색 결과 정렬 옵션 활용 (level, solved, random)
- ✅ 다른 스킬과 연계 제안 (/algo:hint, /algo:review)
- ❌ 너무 많은 결과 반환 금지 (limit: 10~20 권장)

## 관련 스킬

- `/algo:hint` - 검색한 문제의 힌트 생성
- `/algo:review` - 풀이 후 복습 문서 생성
