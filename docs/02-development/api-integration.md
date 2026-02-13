# API 통합 가이드

**버전**: 1.1
**마지막 업데이트**: 2026-02-13

---

## 목차
1. [API 개요](#api-개요)
2. [solved.ac API](#solvedac-api)
   - [인증 및 제한사항](#인증-및-제한사항)
   - [엔드포인트 상세](#엔드포인트-상세)
   - [에러 처리](#에러-처리)
   - [코드 예제](#코드-예제)
3. [Claude API (힌트 생성)](#claude-api-힌트-생성)
   - [API 개요](#claude-api-개요)
   - [인증 방식](#인증-방식)
   - [힌트 생성 통합](#힌트-생성-통합)
   - [프롬프트 전략](#프롬프트-전략)
   - [에러 처리](#claude-api-에러-처리)
4. [베스트 프랙티스](#베스트-프랙티스)

---

## API 개요

본 프로젝트는 두 개의 외부 API와 통합됩니다:

1. **solved.ac API**: BOJ 문제 메타데이터 조회 (필수)
2. **Claude API**: AI 기반 힌트 생성 (선택사항)

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

## Claude API (힌트 생성)

### Claude API 개요

**목적**: 문제 메타데이터를 기반으로 AI 기반 단계별 힌트를 생성합니다.

### 기본 정보

- **Base URL**: `https://api.anthropic.com/v1`
- **프로토콜**: HTTPS
- **응답 형식**: JSON
- **문자 인코딩**: UTF-8
- **사용 모델**: `claude-3-5-sonnet-20241022` (기본값)

### 공식 문서

- Anthropic API 문서: https://docs.anthropic.com/
- SDK 문서: https://github.com/anthropics/anthropic-sdk-typescript

---

### 인증 방식

#### API 키 발급

1. Anthropic Console 접속: https://console.anthropic.com/
2. API Keys 메뉴에서 새 키 생성
3. 키를 안전하게 저장 (재확인 불가)

#### 환경 변수 설정

`.env` 파일에 다음 변수를 설정합니다:

```bash
# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=1024
CLAUDE_TEMPERATURE=0.7
CLAUDE_TIMEOUT=30000
```

#### 인증 헤더

API 요청 시 다음 헤더를 포함해야 합니다:

```typescript
const headers = {
  'x-api-key': process.env.ANTHROPIC_API_KEY,
  'anthropic-version': '2023-06-01',
  'content-type': 'application/json'
};
```

---

### 힌트 생성 통합

#### 아키텍처

```
User Request
    ↓
get_hint Tool Handler
    ↓
HintGenerator Service
    ↓ (프롬프트 구성)
Claude API
    ↓ (AI 응답)
HintGenerator Service
    ↓ (마크다운 포맷팅)
Tool Handler
    ↓
User Response
```

#### HintGenerator 클래스

`src/services/hint-generator.ts`에서 구현:

```typescript
import Anthropic from '@anthropic-ai/sdk';

class HintGenerator {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private timeout: number;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS || '1024', 10);
    this.temperature = parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7');
    this.timeout = parseInt(process.env.CLAUDE_TIMEOUT || '30000', 10);
  }

  async generateHint(
    problem: Problem,
    hintLevel: number,
    userContext?: string
  ): Promise<string> {
    // 1. 프롬프트 생성
    const prompt = this.buildPrompt(problem, hintLevel, userContext);

    // 2. Claude API 호출
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // 3. 텍스트 추출
    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.text || '';
  }
}
```

#### API 요청 예시

**엔드포인트**: `POST /v1/messages`

**요청 본문**:
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "temperature": 0.7,
  "messages": [
    {
      "role": "user",
      "content": "백준 온라인 저지 문제에 대한 힌트를 제공해주세요.\n\n**문제 정보**:\n- 제목: 가장 긴 증가하는 부분 수열\n- 난이도: Silver II\n- 태그: 다이나믹 프로그래밍\n\n**힌트 레벨 1: 문제 유형 인식**\n\n이 문제가 어떤 유형의 알고리즘 문제인지 간단히 설명해주세요..."
    }
  ]
}
```

**응답 구조**:
```json
{
  "id": "msg_01ABC...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "이 문제는 **동적 계획법(Dynamic Programming)** 문제입니다.\n\n부분 수열의 각 위치에서..."
    }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 234,
    "output_tokens": 156
  }
}
```

---

### 프롬프트 전략

#### 레벨별 프롬프트 차별화

**공통 구조**:
```
백준 온라인 저지 문제에 대한 힌트를 제공해주세요.

**문제 정보**:
- 제목: {titleKo}
- 난이도: {tier}
- 태그: {tags}

[사용자 컨텍스트 (있는 경우)]

**힌트 레벨 {level}: {레벨명}**

{레벨별 지시사항}

**출력 형식**: 마크다운 형식으로 작성해주세요.
```

#### 레벨 1: 문제 패턴 인식

**목적**: 문제의 알고리즘 유형을 식별

**프롬프트 전략**:
```typescript
if (hintLevel === 1) {
  prompt += `**힌트 레벨 1: 문제 유형 인식**\n\n`;
  prompt += `이 문제가 어떤 유형의 알고리즘 문제인지 간단히 설명해주세요.\n`;
  prompt += `구체적인 풀이는 제시하지 말고, 문제의 카테고리와 접근 방향만 안내해주세요.\n`;

  // 난이도 조정
  if (isBronze) {
    prompt += `초보자도 이해할 수 있도록 기본적인 용어를 사용해주세요.\n`;
  }

  prompt += `\n3-5문장으로 간결하게 작성해주세요.`;
}
```

**예상 응답**:
```markdown
이 문제는 **동적 계획법(Dynamic Programming)** 문제입니다.

부분 수열의 각 위치에서 "이전 원소들을 고려했을 때
여기까지의 최선의 선택"을 저장하는 방식으로 접근해보세요.

작은 부분 문제의 해를 저장하고, 이를 조합하여
더 큰 문제를 해결하는 방식을 고민해보세요.
```

#### 레벨 2: 핵심 통찰

**목적**: 문제 해결의 핵심 아이디어 제시

**프롬프트 전략**:
```typescript
if (hintLevel === 2) {
  prompt += `**힌트 레벨 2: 핵심 통찰**\n\n`;
  prompt += `이 문제를 어떻게 접근해야 하는지 핵심 아이디어를 제시해주세요.\n`;
  prompt += `알고리즘의 핵심 통찰과 주요 개념을 설명하되, 코드를 직접 제공하지 마세요.\n`;

  // 사용자 컨텍스트 반영
  if (userContext) {
    prompt += `사용자가 시도한 방법의 문제점을 지적하고, 더 나은 접근법을 제안해주세요.\n`;
  }

  prompt += `\n7-10문장으로 작성해주세요.`;
}
```

**예상 응답**:
```markdown
DP 배열을 다음과 같이 정의해봅시다:
**dp[i] = i번째 원소를 마지막으로 하는 가장 긴 증가 부분 수열의 길이**

각 위치 i에서, 이전 위치들(j < i)을 확인하며:
- arr[j] < arr[i]인 경우 (증가 조건 만족)
- dp[j]가 최대인 것을 찾습니다

점화식:
dp[i] = max(dp[j]) + 1 (단, j < i이고 arr[j] < arr[i])
```

#### 레벨 3: 상세 알고리즘 단계

**목적**: 구체적인 구현 단계 제공 (코드 제외)

**프롬프트 전략**:
```typescript
if (hintLevel === 3) {
  prompt += `**힌트 레벨 3: 상세 알고리즘 전략**\n\n`;
  prompt += `이 문제를 해결하기 위한 단계별 알고리즘 전략을 설명해주세요.\n`;
  prompt += `각 단계에서 무엇을 해야 하는지, 시간복잡도는 어떻게 되는지 상세히 안내해주세요.\n`;
  prompt += `코드를 직접 제공하지 마세요. 대신 의사 코드나 단계별 설명을 제공해주세요.\n`;

  // 고급 문제 처리
  if (isPlatinum) {
    prompt += `고급 알고리즘 기법과 최적화 방법도 함께 설명해주세요.\n`;
  }

  prompt += `\n단계별로 구분하여 작성해주세요.`;
}
```

**예상 응답**:
```markdown
**1단계: 초기화**
- n = 수열의 길이
- arr[] = 입력 수열
- dp[] = [1, 1, 1, ..., 1] (모두 1로 초기화)

**2단계: DP 배열 채우기**
for i in range(1, n):
    for j in range(0, i):
        if arr[j] < arr[i]:
            dp[i] = max(dp[i], dp[j] + 1)

**3단계: 최댓값 찾기**
answer = max(dp)

⏱️ 시간 복잡도: O(n²)
💾 공간 복잡도: O(n)
```

#### 난이도별 프롬프트 조정

**Bronze 티어 (레벨 1-5)**:
- 기본 용어 사용
- 더 자세한 설명
- 예시 포함

**Silver/Gold 티어 (레벨 6-15)**:
- 표준 알고리즘 용어
- 핵심만 간결하게

**Platinum+ 티어 (레벨 16+)**:
- 고급 기법 언급
- 최적화 방법 포함
- 복잡도 분석 강조

---

### Claude API 에러 처리

#### 주요 에러 코드

| 상태 코드 | 설명 | 원인 | 해결 방법 |
|----------|------|------|----------|
| `401 Unauthorized` | 인증 실패 | API 키 오류 | API 키 확인 및 재설정 |
| `429 Too Many Requests` | 요청 한도 초과 | Rate limit 도달 | 지수 백오프 재시도, 요청 빈도 줄이기 |
| `500 Internal Server Error` | 서버 오류 | Claude API 문제 | 재시도, 사용자에게 안내 |
| `timeout` | 요청 시간 초과 | 네트워크 또는 API 지연 | 타임아웃 증가, 재시도 |

#### 에러 처리 구현

```typescript
async generateHint(
  problem: Problem,
  hintLevel: number,
  userContext?: string
): Promise<string> {
  // API 키 확인
  if (!this.isConfigured()) {
    throw new ConfigurationError('API 키가 설정되지 않았습니다');
  }

  try {
    // 타임아웃 처리
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const response = await this.client.messages.create(
      {
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(problem, hintLevel, userContext)
          }
        ]
      },
      {
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    // 응답 추출
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new ClaudeAPIError('Invalid response format from Claude API');
    }

    return textContent.text;
  } catch (error: unknown) {
    // AbortError (타임아웃)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError('Claude API 응답 시간 초과');
    }

    // Anthropic SDK 에러
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; message?: string };

      if (apiError.status === 401) {
        throw new ClaudeAPIError('Claude API 인증 실패', 401, error);
      } else if (apiError.status === 429) {
        throw new ClaudeAPIError('Claude API 요청 한도 초과', 429, error);
      } else if (apiError.status >= 500) {
        throw new ClaudeAPIError('Claude API 서버 오류', apiError.status, error);
      }
    }

    // 기타 에러
    throw new ClaudeAPIError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined,
      error
    );
  }
}
```

#### 사용자 친화적 에러 메시지

```typescript
// Tool Handler에서 에러 변환
try {
  const hint = await hintGenerator.generateHint(problem, hint_level, user_context);
  return { type: 'text', text: hint };
} catch (error) {
  if (error instanceof ClaudeAPIError) {
    if (error.statusCode === 401) {
      throw new Error('힌트를 생성할 수 없습니다. API 키를 확인해주세요.');
    } else if (error.statusCode === 429) {
      throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
    } else {
      throw new Error('힌트를 생성할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  }
  throw error;
}
```

#### 재시도 로직 (선택사항)

```typescript
async generateHintWithRetry(
  problem: Problem,
  hintLevel: number,
  userContext?: string,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await this.generateHint(problem, hintLevel, userContext);
    } catch (error) {
      // 재시도 가능한 에러인지 확인
      if (
        error instanceof ClaudeAPIError &&
        (error.statusCode === 429 || error.statusCode >= 500)
      ) {
        if (attempt < maxRetries - 1) {
          // 지수 백오프
          const delay = Math.pow(2, attempt) * 1000;
          await sleep(delay);
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error('최대 재시도 횟수 초과');
}
```

---

### 비용 최적화

#### 토큰 사용량 최소화

**프롬프트 최적화**:
- 불필요한 설명 제거
- 핵심만 간결하게 구성
- 레벨별 프롬프트 길이 조정

**max_tokens 설정**:
```typescript
const maxTokensByLevel = {
  1: 512,   // 레벨 1: 짧은 힌트
  2: 1024,  // 레벨 2: 중간 힌트
  3: 1536   // 레벨 3: 상세 힌트
};
```

#### 캐싱 (향후 고려)

동일한 문제-레벨 조합에 대한 힌트 캐싱:
```typescript
const cacheKey = `hint:${problem.problemId}:${hintLevel}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const hint = await this.generateHint(problem, hintLevel, userContext);
await cache.set(cacheKey, hint, { ttl: 3600 }); // 1시간
return hint;
```

**주의**: `userContext`가 있는 경우 캐싱하지 않음 (개인화된 응답)

---

## 베스트 프랙티스

### 1. 효율적인 API 사용

**✅ 권장사항**:
- 자주 조회되는 데이터는 캐싱
- 불필요한 API 호출 최소화
- 페이지네이션 활용 (한 번에 모든 데이터 조회 금지)
- 에러 발생 시 재시도 로직 구현

**❌ 비권장사항**:
- 짧은 시간에 대량 요청
- 동일한 데이터 반복 조회
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
