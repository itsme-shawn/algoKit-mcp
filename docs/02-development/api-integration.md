# API 통합 가이드

**버전**: 2.0
**마지막 업데이트**: 2026-02-13 (Keyless 아키텍처 전환)

---

## 목차
1. [API 개요](#api-개요)
2. [solved.ac API](#solvedac-api)
   - [인증 및 제한사항](#인증-및-제한사항)
   - [엔드포인트 상세](#엔드포인트-상세)
   - [에러 처리](#에러-처리)
   - [코드 예제](#코드-예제)
3. [베스트 프랙티스](#베스트-프랙티스)

---

## API 개요

본 프로젝트는 **solved.ac API**만을 사용합니다:

- **solved.ac API**: BOJ 문제 메타데이터 조회 (필수, 무료)

**Keyless 아키텍처**: Phase 3부터 Claude API 통합을 제거하고, LLM 호출은 Claude Code가 담당합니다. MCP 서버는 결정적(deterministic) 데이터만 제공합니다.

---

## solved.ac API

### 기본 정보
- **Base URL**: `https://solved.ac/api/v3`
- **프로토콜**: HTTPS
- **응답 형식**: JSON
- **문자 인코딩**: UTF-8

### 주요 특징
- ✅ **무료**: 인증 없이 사용 가능
- ✅ **공개 API**: 누구나 접근 가능
- ⚠️ **CORS 제한**: 서버 측에서만 호출 가능 (브라우저 직접 호출 불가)
- ⚠️ **Rate Limit**: 공식 문서화되지 않음 (합리적 사용 권장)

### 공식 문서
- 비공식 문서: https://solvedac.github.io/unofficial-documentation/
- GitHub 저장소: https://github.com/solvedac/unofficial-documentation

---

## 인증 및 제한사항

### 인증
**API 키 불필요**: solved.ac API는 인증 없이 사용 가능합니다.

```typescript
// 헤더 설정 예시
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

### Rate Limiting
**공식 제한사항**: 명시되지 않음

**권장 사항**:
- 요청 간 최소 100ms 간격 유지
- 동시 요청 수 제한 (최대 5개)
- 응답 캐싱 활용 (TTL: 1시간)
- 재시도 로직 구현 (exponential backoff)

**Rate Limit 초과 시**:
- HTTP 상태 코드: `429 Too Many Requests`
- 응답 본문: `{"error": "Too many requests"}`
- 해결 방법: 요청 빈도 줄이기, 캐싱 강화

### CORS 제한
solved.ac API는 **서버 측에서만** 호출 가능합니다.

```javascript
// ❌ 브라우저에서 직접 호출 불가
fetch('https://solved.ac/api/v3/search/problem')
  .then(/* ... */);  // CORS 에러 발생

// ✅ Node.js 서버에서 호출
import fetch from 'node-fetch';
fetch('https://solved.ac/api/v3/search/problem')
  .then(/* ... */);  // 정상 작동
```

---

## 엔드포인트 상세

### 1. 문제 검색 (Search Problems)

#### 엔드포인트
```
GET /search/problem
```

#### 설명
키워드, 태그, 난이도 등으로 BOJ 문제를 검색합니다.

#### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `query` | string | 선택 | 검색어 (제목, 번호, 태그) | "이분 탐색", "1927" |
| `page` | number | 선택 | 페이지 번호 (기본값: 1) | 2 |
| `sort` | string | 선택 | 정렬 기준 | "level", "id", "average_try" |
| `direction` | string | 선택 | 정렬 방향 | "asc", "desc" |

**참고**: 티어 필터링은 쿼리 문자열에 특수 문법 사용
- 예: `tier:g` (Gold 티어)
- 예: `tier:g3..g1` (Gold III ~ Gold I)

#### 요청 예시

**1. 키워드 검색**
```http
GET /search/problem?query=이분%20탐색&page=1
```

**2. 난이도 필터링 (Gold 티어)**
```http
GET /search/problem?query=tier:g
```

**3. 정렬 옵션**
```http
GET /search/problem?query=dp&sort=level&direction=asc
```

#### 응답 구조

**성공 응답 (200 OK)**
```json
{
  "count": 22,
  "items": [
    {
      "problemId": 1920,
      "titleKo": "수 찾기",
      "titles": [
        {
          "language": "ko",
          "languageDisplayName": "한국어",
          "title": "수 찾기",
          "isOriginal": true
        }
      ],
      "level": 9,
      "acceptedUserCount": 89234,
      "averageTries": 1.8,
      "tags": [
        {
          "key": "binary_search",
          "isMeta": false,
          "bojTagId": 12,
          "problemCount": 789,
          "displayNames": [
            {
              "language": "ko",
              "name": "이분 탐색",
              "short": "이분 탐색"
            },
            {
              "language": "en",
              "name": "Binary Search",
              "short": "binary search"
            }
          ],
          "aliases": []
        }
      ],
      "isSolvable": true,
      "isPartial": false,
      "acceptedUserCountDelta": 123,
      "averageTryDelta": 0.02,
      "official": true,
      "sprout": false
    }
  ]
}
```

#### 응답 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `count` | number | 총 검색 결과 개수 |
| `items` | array | 문제 목록 |
| `items[].problemId` | number | BOJ 문제 번호 |
| `items[].titleKo` | string | 한글 제목 |
| `items[].level` | number | 난이도 레벨 (1-30) |
| `items[].acceptedUserCount` | number | 해결한 사용자 수 |
| `items[].averageTries` | number | 평균 시도 횟수 |
| `items[].tags` | array | 알고리즘 태그 목록 |
| `items[].isSolvable` | boolean | 풀이 가능 여부 |

#### TypeScript 인터페이스

```typescript
interface SearchProblemResponse {
  count: number;
  items: Problem[];
}

interface Problem {
  problemId: number;
  titleKo: string;
  titles: Title[];
  level: number;  // 1-30
  acceptedUserCount: number;
  averageTries: number;
  tags: Tag[];
  isSolvable: boolean;
  isPartial: boolean;
  acceptedUserCountDelta: number;
  averageTryDelta: number;
  official: boolean;
  sprout: boolean;
}

interface Title {
  language: string;
  languageDisplayName: string;
  title: string;
  isOriginal: boolean;
}

interface Tag {
  key: string;
  isMeta: boolean;
  bojTagId: number;
  problemCount: number;
  displayNames: DisplayName[];
  aliases: Alias[];
}

interface DisplayName {
  language: string;
  name: string;
  short: string;
}
```

---

### 2. 문제 상세 조회 (Get Problem)

#### 엔드포인트
```
GET /problem/show
```

#### 설명
특정 문제의 상세 메타데이터를 조회합니다.

#### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `problemId` | number | **필수** | BOJ 문제 번호 | 1000 |

#### 요청 예시

```http
GET /problem/show?problemId=1927
```

#### 응답 구조

**성공 응답 (200 OK)**
```json
{
  "problemId": 1927,
  "titleKo": "최소 힙",
  "titles": [
    {
      "language": "ko",
      "languageDisplayName": "한국어",
      "title": "최소 힙",
      "isOriginal": true
    }
  ],
  "level": 9,
  "solvable": true,
  "acceptedUserCount": 73425,
  "averageTries": 1.8,
  "tags": [
    {
      "key": "data_structures",
      "isMeta": false,
      "bojTagId": 175,
      "problemCount": 2847,
      "displayNames": [
        {
          "language": "ko",
          "name": "자료 구조",
          "short": "자료 구조"
        }
      ],
      "aliases": []
    },
    {
      "key": "priority_queue",
      "isMeta": false,
      "bojTagId": 59,
      "problemCount": 456,
      "displayNames": [
        {
          "language": "ko",
          "name": "우선순위 큐",
          "short": "우선순위 큐"
        }
      ],
      "aliases": []
    }
  ],
  "isLevelLocked": false,
  "averageTryDelta": 0.01,
  "official": true,
  "sprout": false,
  "givesNoRating": false,
  "isPartial": false
}
```

#### TypeScript 인터페이스

```typescript
interface ProblemDetail {
  problemId: number;
  titleKo: string;
  titles: Title[];
  level: number;
  solvable: boolean;
  acceptedUserCount: number;
  averageTries: number;
  tags: Tag[];
  isLevelLocked: boolean;
  averageTryDelta: number;
  official: boolean;
  sprout: boolean;
  givesNoRating: boolean;
  isPartial: boolean;
}
```

#### BOJ 링크 생성

```typescript
function getBojLink(problemId: number): string {
  return `https://www.acmicpc.net/problem/${problemId}`;
}

// 예시: https://www.acmicpc.net/problem/1927
```

---

### 3. 태그 검색 (Search Tags)

#### 엔드포인트
```
GET /search/tag
```

#### 설명
키워드로 알고리즘 태그를 검색합니다.

#### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `query` | string | **필수** | 검색 키워드 | "dynamic", "그래프" |
| `page` | number | 선택 | 페이지 번호 (기본값: 1) | 1 |

#### 요청 예시

**1. 한글 키워드**
```http
GET /search/tag?query=다이나믹
```

**2. 영문 키워드**
```http
GET /search/tag?query=dynamic
```

#### 응답 구조

**성공 응답 (200 OK)**
```json
{
  "count": 3,
  "items": [
    {
      "key": "dp",
      "isMeta": false,
      "bojTagId": 25,
      "problemCount": 2847,
      "displayNames": [
        {
          "language": "ko",
          "name": "다이나믹 프로그래밍",
          "short": "다이나믹 프로그래밍"
        },
        {
          "language": "en",
          "name": "Dynamic Programming",
          "short": "dp"
        },
        {
          "language": "ja",
          "name": "動的計画法",
          "short": "動的計画法"
        }
      ],
      "aliases": [
        {
          "alias": "동적계획법"
        },
        {
          "alias": "동적 계획법"
        },
        {
          "alias": "다이나믹프로그래밍"
        }
      ]
    }
  ]
}
```

#### 응답 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `count` | number | 총 검색 결과 개수 |
| `items` | array | 태그 목록 |
| `items[].key` | string | 태그 키 (고유 식별자) |
| `items[].bojTagId` | number | BOJ 태그 ID |
| `items[].problemCount` | number | 해당 태그의 문제 개수 |
| `items[].displayNames` | array | 다국어 표시명 |
| `items[].aliases` | array | 태그 별칭 목록 |

#### TypeScript 인터페이스

```typescript
interface SearchTagResponse {
  count: number;
  items: TagDetail[];
}

interface TagDetail {
  key: string;
  isMeta: boolean;
  bojTagId: number;
  problemCount: number;
  displayNames: DisplayName[];
  aliases: Alias[];
}

interface Alias {
  alias: string;
}
```

---

## 에러 처리

### 에러 응답 구조

```json
{
  "error": "에러 메시지",
  "statusCode": 400,
  "message": "상세 설명"
}
```

### 주요 에러 코드

| 상태 코드 | 설명 | 원인 | 해결 방법 |
|----------|------|------|----------|
| `400 Bad Request` | 잘못된 요청 | 유효하지 않은 파라미터 | 파라미터 형식 확인 |
| `404 Not Found` | 리소스 없음 | 존재하지 않는 문제 ID | 문제 ID 검증 |
| `429 Too Many Requests` | 요청 제한 초과 | 너무 많은 요청 | 요청 빈도 줄이기 |
| `500 Internal Server Error` | 서버 오류 | API 서버 문제 | 재시도, 로깅 |
| `503 Service Unavailable` | 서비스 일시 중단 | 유지보수 중 | 나중에 재시도 |

### 에러 처리 전략

#### 1. 유효성 검증 (클라이언트 측)
```typescript
function validateProblemId(problemId: number): void {
  if (!Number.isInteger(problemId) || problemId <= 0) {
    throw new Error('문제 ID는 양의 정수여야 합니다.');
  }
}

function validateLevel(level: number): void {
  if (level < 1 || level > 30) {
    throw new Error('레벨은 1-30 범위여야 합니다.');
  }
}
```

#### 2. 재시도 로직 (Exponential Backoff)
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

      // 재시도 가능한 에러
      if (response.status >= 500 || response.status === 429) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`재시도 ${attempt + 1}/${maxRetries} (${delay}ms 후)`);
        await sleep(delay);
        continue;
      }

      // 재시도 불가능한 에러
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }

  throw new Error('최대 재시도 횟수 초과');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

#### 3. 사용자 친화적 에러 메시지
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

## 코드 예제

### API 클라이언트 구현

#### 기본 구조
```typescript
import fetch from 'node-fetch';

class SolvedAcClient {
  private baseUrl = 'https://solved.ac/api/v3';
  private timeout = 10000; // 10초

  private async request<T>(
    endpoint: string,
    params?: Record<string, string | number>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as T;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('요청 시간 초과');
      }
      throw error;

    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 문제 검색
  async searchProblems(params: SearchParams): Promise<SearchProblemResponse> {
    return this.request<SearchProblemResponse>('/search/problem', params);
  }

  // 문제 상세 조회
  async getProblem(problemId: number): Promise<ProblemDetail> {
    return this.request<ProblemDetail>('/problem/show', { problemId });
  }

  // 태그 검색
  async searchTags(query: string): Promise<SearchTagResponse> {
    return this.request<SearchTagResponse>('/search/tag', { query });
  }
}

export default SolvedAcClient;
```

#### 캐싱 추가
```typescript
class CachedSolvedAcClient extends SolvedAcClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 3600000; // 1시간

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheTTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async getProblem(problemId: number): Promise<ProblemDetail> {
    const cacheKey = this.getCacheKey('/problem/show', { problemId });

    // 캐시 확인
    const cached = this.getFromCache<ProblemDetail>(cacheKey);
    if (cached) {
      console.log('캐시 히트:', problemId);
      return cached;
    }

    // API 호출
    const data = await super.getProblem(problemId);
    this.setCache(cacheKey, data);

    return data;
  }
}
```

### 사용 예시

#### 1. 문제 검색
```typescript
const client = new SolvedAcClient();

// Gold 티어 DP 문제 검색
const result = await client.searchProblems({
  query: 'tier:g dp',
  sort: 'level',
  direction: 'asc',
  page: 1
});

console.log(`총 ${result.count}개 문제 발견`);
result.items.forEach(problem => {
  console.log(`[${problem.problemId}] ${problem.titleKo} (레벨 ${problem.level})`);
});
```

#### 2. 문제 상세 조회
```typescript
const problemId = 1927;
const problem = await client.getProblem(problemId);

console.log(`제목: ${problem.titleKo}`);
console.log(`난이도: 레벨 ${problem.level}`);
console.log(`태그: ${problem.tags.map(t => t.displayNames[0].name).join(', ')}`);
console.log(`해결자 수: ${problem.acceptedUserCount}명`);
console.log(`평균 시도: ${problem.averageTries}회`);
console.log(`링크: https://www.acmicpc.net/problem/${problemId}`);
```

#### 3. 태그 검색
```typescript
const tags = await client.searchTags('그래프');

console.log('그래프 관련 태그:');
tags.items.forEach(tag => {
  const koreanName = tag.displayNames.find(d => d.language === 'ko')?.name;
  console.log(`- ${koreanName} (${tag.key}): ${tag.problemCount}개 문제`);
});
```

---

## 베스트 프랙티스

### 1. solved.ac API 효율적 사용

**✅ 권장사항**:
- 자주 조회되는 문제 메타데이터는 캐싱 (TTL: 1시간)
- 불필요한 API 호출 최소화
- 페이지네이션 활용 (한 번에 모든 데이터 조회 금지)
- 에러 발생 시 재시도 로직 구현 (exponential backoff)
- 요청 간 최소 100ms 간격 유지 (rate limiting 회피)

**❌ 비권장사항**:
- 짧은 시간에 대량 요청 (rate limit 초과)
- 동일한 데이터 반복 조회 (캐싱 활용 필요)
- 에러 무시 및 무한 재시도

### 2. 성능 최적화

```typescript
// ✅ 좋은 예: 병렬 요청
async function getMultipleProblems(ids: number[]): Promise<ProblemDetail[]> {
  return Promise.all(ids.map(id => client.getProblem(id)));
}

// ❌ 나쁜 예: 순차 요청
async function getMultipleProblemsSlow(ids: number[]): Promise<ProblemDetail[]> {
  const results = [];
  for (const id of ids) {
    results.push(await client.getProblem(id));  // 느림!
  }
  return results;
}
```

### 3. 에러 복구

```typescript
async function robustGetProblem(problemId: number): Promise<ProblemDetail | null> {
  try {
    return await client.getProblem(problemId);
  } catch (error) {
    console.error(`문제 ${problemId} 조회 실패:`, error);

    // 대체 동작: 캐시된 데이터 반환, 기본값 등
    return getCachedProblem(problemId) || null;
  }
}
```

### 4. 로깅

```typescript
class LoggingSolvedAcClient extends SolvedAcClient {
  private logger = console;

  private async request<T>(endpoint: string, params?: any): Promise<T> {
    const startTime = Date.now();
    const url = `${endpoint}?${new URLSearchParams(params)}`;

    try {
      this.logger.info(`[API] 요청: ${url}`);
      const result = await super.request<T>(endpoint, params);
      const duration = Date.now() - startTime;
      this.logger.info(`[API] 성공: ${url} (${duration}ms)`);
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[API] 실패: ${url} (${duration}ms)`, error);
      throw error;
    }
  }
}
```

---

## 부록: 레벨-티어 매핑표

| 레벨 | 티어 | 색상 |
|------|------|------|
| 1 | Bronze V | 🟤 |
| 2 | Bronze IV | 🟤 |
| 3 | Bronze III | 🟤 |
| 4 | Bronze II | 🟤 |
| 5 | Bronze I | 🟤 |
| 6 | Silver V | ⚪ |
| 7 | Silver IV | ⚪ |
| 8 | Silver III | ⚪ |
| 9 | Silver II | ⚪ |
| 10 | Silver I | ⚪ |
| 11 | Gold V | 🟡 |
| 12 | Gold IV | 🟡 |
| 13 | Gold III | 🟡 |
| 14 | Gold II | 🟡 |
| 15 | Gold I | 🟡 |
| 16 | Platinum V | 🔵 |
| 17 | Platinum IV | 🔵 |
| 18 | Platinum III | 🔵 |
| 19 | Platinum II | 🔵 |
| 20 | Platinum I | 🔵 |
| 21 | Diamond V | 💎 |
| 22 | Diamond IV | 💎 |
| 23 | Diamond III | 💎 |
| 24 | Diamond II | 💎 |
| 25 | Diamond I | 💎 |
| 26 | Ruby V | 🔴 |
| 27 | Ruby IV | 🔴 |
| 28 | Ruby III | 🔴 |
| 29 | Ruby II | 🔴 |
| 30 | Ruby I | 🔴 |

---

**참고 자료**:
- solved.ac 공식 사이트: https://solved.ac
- 비공식 API 문서: https://solvedac.github.io/unofficial-documentation/
- BOJ: https://www.acmicpc.net
