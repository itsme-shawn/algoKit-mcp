# 외부 API 통합 가이드

**버전**: 3.0
**마지막 업데이트**: 2026-02-14

---

## 목차

1. [solved.ac API](#solvedac-api)
2. [BOJ 웹 스크래핑](#boj-웹-스크래핑)
3. [에러 처리](#에러-처리)
4. [베스트 프랙티스](#베스트-프랙티스)

---

## solved.ac API

### 기본 정보
- **Base URL**: `https://solved.ac/api/v3`
- **인증**: API 키 불필요 (무료, 공개 API)
- **응답 형식**: JSON
- **문서**: https://solvedac.github.io/unofficial-documentation/

### 주요 엔드포인트

#### 1. 문제 검색
```
GET /search/problem
```

**쿼리 파라미터**:
- `query` (string): 검색어 또는 필터 (예: "tier:g dp")
- `page` (number): 페이지 번호 (기본: 1)
- `sort` (string): 정렬 기준 ("level", "id", "average_try")
- `direction` (string): 정렬 방향 ("asc", "desc")

**응답 구조**:
```typescript
interface SearchProblemResponse {
  count: number;
  items: Problem[];
}

interface Problem {
  problemId: number;
  titleKo: string;
  level: number;  // 1-30 (Bronze V ~ Ruby I)
  tags: Tag[];
  acceptedUserCount: number;
  averageTries: number;
}
```

**사용 예시**:
```typescript
const client = new SolvedAcClient();

// Gold 티어 DP 문제 검색
const result = await client.searchProblems({
  query: 'tier:g dp',
  sort: 'level',
  direction: 'asc'
});
```

#### 2. 문제 상세 조회
```
GET /problem/show?problemId={id}
```

**응답 구조**:
```typescript
interface ProblemDetail {
  problemId: number;
  titleKo: string;
  level: number;
  tags: Tag[];
  acceptedUserCount: number;
  averageTries: number;
  solvable: boolean;
}
```

**사용 예시**:
```typescript
const problem = await client.getProblem(1000);
console.log(problem.titleKo); // "A+B"
```

#### 3. 태그 검색
```
GET /search/tag?query={keyword}
```

**응답 구조**:
```typescript
interface SearchTagResponse {
  count: number;
  items: TagDetail[];
}

interface TagDetail {
  key: string;  // 'dp', 'greedy', etc.
  displayNames: DisplayName[];
  problemCount: number;
}
```

### 티어 시스템

| 레벨 | 티어 | 레벨 | 티어 |
|------|------|------|------|
| 1-5 | Bronze V-I | 16-20 | Platinum V-I |
| 6-10 | Silver V-I | 21-25 | Diamond V-I |
| 11-15 | Gold V-I | 26-30 | Ruby V-I |

### Rate Limiting

**권장 사항**:
- 요청 간 최소 100ms 간격
- 동시 요청 최대 5개
- 응답 캐싱 (TTL: 1시간)
- Exponential backoff 재시도

---

## BOJ 웹 스크래핑

### HTML 구조 (Phase 6)

BOJ 문제 페이지: `https://www.acmicpc.net/problem/{problemId}`

**주요 CSS Selector**:

| 섹션 | Selector | 설명 |
|------|----------|------|
| 문제 제목 | `#problem_title` | 문제 제목 |
| 문제 설명 | `#problem_description` | 본문 설명 |
| 입력 형식 | `#problem_input` | 입력 데이터 형식 |
| 출력 형식 | `#problem_output` | 출력 데이터 형식 |
| 예제 입력 | `#sample-input-{n}` | n번째 예제 입력 |
| 예제 출력 | `#sample-output-{n}` | n번째 예제 출력 |
| 시간 제한 | `#problem-info tbody tr td:nth-child(1)` | 시간 제한 |
| 메모리 제한 | `#problem-info tbody tr td:nth-child(2)` | 메모리 제한 |

### cheerio 파싱

**타입 정의**:
```typescript
interface ProblemContent {
  title: string;
  description: string;
  input: string;
  output: string;
  samples: Array<{
    input: string;
    output: string;
  }>;
  limits: {
    time: string;
    memory: string;
  };
}
```

**파싱 함수**:
```typescript
import * as cheerio from 'cheerio';

function parseBojProblemHtml(html: string): ProblemContent {
  const $ = cheerio.load(html);

  const title = $('#problem_title').text().trim();
  const description = $('#problem_description').text().trim();
  const input = $('#problem_input').text().trim();
  const output = $('#problem_output').text().trim();

  // 예제 입출력
  const samples = [];
  let i = 1;
  while (true) {
    const sampleInput = $(`#sample-input-${i}`).text().trim();
    const sampleOutput = $(`#sample-output-${i}`).text().trim();
    if (!sampleInput || !sampleOutput) break;
    samples.push({ input: sampleInput, output: sampleOutput });
    i++;
  }

  // 제한 정보
  const timeLimit = $('#problem-info tbody tr td:nth-child(1)').text().trim();
  const memoryLimit = $('#problem-info tbody tr td:nth-child(2)').text().trim();

  return {
    title,
    description,
    input,
    output,
    samples,
    limits: { time: timeLimit, memory: memoryLimit }
  };
}
```

### 주의사항

1. **HTML 엔티티**: `&lt;`, `&gt;`, `&nbsp;` 등 (cheerio가 자동 디코딩)
2. **공백 처리**: `.trim()` 사용하여 앞뒤 공백 제거
3. **예제 개수**: 문제마다 다름 (1개 이상)
4. **이미지/수식**: 현재는 텍스트만 추출

---

## 에러 처리

### 주요 에러 코드

| 코드 | 설명 | 원인 | 해결 방법 |
|------|------|------|----------|
| 400 | Bad Request | 잘못된 파라미터 | 파라미터 검증 |
| 404 | Not Found | 존재하지 않는 문제 | ID 확인 |
| 429 | Too Many Requests | Rate limit 초과 | 요청 빈도 줄이기 |
| 500 | Internal Server Error | API 서버 오류 | 재시도 |

### 재시도 로직 (Exponential Backoff)

```typescript
async function fetchWithRetry<T>(
  url: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return await response.json() as T;
      }

      // 재시도 가능한 에러 (5xx, 429)
      if (response.status >= 500 || response.status === 429) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }

  throw new Error('최대 재시도 횟수 초과');
}
```

### 사용자 친화적 에러 메시지

```typescript
function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('404')) {
      return '해당 문제를 찾을 수 없습니다. 문제 번호를 확인해주세요.';
    }
    if (error.message.includes('429')) {
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    }
    if (error.message.includes('timeout')) {
      return '네트워크 연결이 불안정합니다. 다시 시도해주세요.';
    }
  }
  return 'API 요청 중 오류가 발생했습니다.';
}
```

---

## 베스트 프랙티스

### 1. 캐싱 전략

```typescript
class CachedClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 3600000; // 1시간

  async getProblem(problemId: number): Promise<ProblemDetail> {
    const cacheKey = `problem:${problemId}`;
    const cached = this.cache.get(cacheKey);

    // 캐시 확인
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // API 호출
    const data = await this.fetchProblem(problemId);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  }
}
```

### 2. 병렬 요청

```typescript
// ✅ 좋은 예: 병렬 처리
async function getMultipleProblems(ids: number[]): Promise<ProblemDetail[]> {
  return Promise.all(ids.map(id => client.getProblem(id)));
}

// ❌ 나쁜 예: 순차 처리
async function getMultipleProblemsSlow(ids: number[]): Promise<ProblemDetail[]> {
  const results = [];
  for (const id of ids) {
    results.push(await client.getProblem(id));  // 느림!
  }
  return results;
}
```

### 3. 로깅

```typescript
async function requestWithLog<T>(endpoint: string): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fetch(endpoint);
    const duration = Date.now() - startTime;
    console.log(`[API] Success: ${endpoint} (${duration}ms)`);
    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed: ${endpoint} (${duration}ms)`, error);
    throw error;
  }
}
```

---

**참고 자료**:
- solved.ac 비공식 API 문서: https://solvedac.github.io/unofficial-documentation/
- BOJ: https://www.acmicpc.net
- cheerio 문서: https://cheerio.js.org/
