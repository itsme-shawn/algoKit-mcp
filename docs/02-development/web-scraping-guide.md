# Web Scraping 가이드

**프로젝트명**: cote-mcp-server
**버전**: 1.0
**작성일**: 2026-02-15
**마지막 업데이트**: 2026-02-16
**작성자**: project-planner, technical-writer

---

## 목차

1. [윤리적 스크래핑 정책](#윤리적-스크래핑-정책)
2. [구현 가이드](#구현-가이드)
3. [플랫폼별 가이드](#플랫폼별-가이드)
4. [모니터링 및 에러 처리](#모니터링-및-에러-처리)

---

## 윤리적 스크래핑 정책

### 기본 원칙

1. **robots.txt 준수**
   - 모든 플랫폼의 robots.txt 확인 및 준수
   - Disallow 경로는 절대 크롤링하지 않음

2. **Rate Limiting**
   - 과도한 요청으로 서버 부하 방지
   - BOJ: 3초 간격
   - 향후 플랫폼: 초당 5회 이하

3. **User-Agent 명시**
   - 명확한 식별 정보 제공
   - 연락처 포함 (이메일 또는 GitHub)

4. **캐싱 활용**
   - 불필요한 반복 요청 방지
   - TTL: 문제 본문 30일, 메타데이터 1시간

5. **비상업적 사용**
   - 교육 및 학습 목적으로만 사용
   - 데이터 재판매 금지

### robots.txt 확인

**BOJ** (`https://www.acmicpc.net/robots.txt`):
```
User-agent: *
Disallow: /submit/
Disallow: /status/
Allow: /problem/
```
- ✅ `/problem/` 경로 허용 → 문제 본문 스크래핑 가능
- ❌ `/submit/`, `/status/` 차단 → 제출 정보 스크래핑 불가

**Programmers** (`https://programmers.co.kr/robots.txt`):
```
User-agent: *
Allow: /
Disallow: /users
Disallow: /managers
```
- ✅ `/learn/challenges` 허용 → 문제 목록 스크래핑 가능
- ❌ `/users` 차단 → 사용자 정보 스크래핑 불가

---

## 구현 가이드

### User-Agent 정책

**표준 User-Agent 형식**:
```
<ProjectName>/<Version> (<Contact>; +<ProjectURL>)
```

**cote-mcp 서버 User-Agent**:
```typescript
const USER_AGENT = 'cote-mcp/1.0 (Educational bot; +https://github.com/your-repo)';
```

**구현 예시**:

```typescript
// src/api/boj-scraper.ts
export class BOJScraper {
  private static readonly USER_AGENT = 
    'cote-mcp/1.0 (Educational bot; +https://github.com/your-repo)';

  private static readonly REQUEST_CONFIG = {
    headers: {
      'User-Agent': BOJScraper.USER_AGENT,
      'Accept': 'text/html',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
    timeout: 10000, // 10초
  };

  async fetchProblemContent(problemId: number): Promise<string> {
    const url = `https://www.acmicpc.net/problem/${problemId}`;
    
    // Rate Limiting 적용
    await this.ensureRequestInterval();

    try {
      const response = await fetch(url, BOJScraper.REQUEST_CONFIG);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`[BOJScraper] Failed to fetch problem ${problemId}:`, error);
      throw error;
    }
  }
}
```

### Rate Limiting 구현

**BOJ 스크래핑 간격**:

```typescript
export class BOJScraper {
  private static readonly REQUEST_INTERVAL = 3000; // 3초
  private lastRequestTime: number = 0;

  /**
   * 요청 간격 보장 (3초)
   */
  private async ensureRequestInterval(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (elapsed < BOJScraper.REQUEST_INTERVAL) {
      const waitTime = BOJScraper.REQUEST_INTERVAL - elapsed;
      console.info(`[BOJScraper] Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }
}
```

### 캐싱 전략

**TTL 설정**:

| 데이터 타입 | TTL | 근거 |
|------------|-----|------|
| 문제 본문 | 30일 | 문제 내용 거의 변경 없음 |
| 문제 메타데이터 | 1시간 | 제출 수, 정답률 변동 가능 |
| 태그 정보 | 1주일 | 태그 추가/수정 드뭄 |

**LRU 캐시 사용**:

```typescript
import { LRUCache } from '../utils/lru-cache.js';

export class BOJScraper {
  private cache: LRUCache<string, string>;

  constructor() {
    this.cache = new LRUCache(50, 30 * 24 * 60 * 60 * 1000); // 50개, 30일
  }

  async fetchProblemContent(problemId: number): Promise<string> {
    const cacheKey = `problem_${problemId}`;
    
    // 캐시 확인
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.info(`[BOJScraper] Cache hit: ${problemId}`);
      return cached;
    }

    // 캐시 미스 → 스크래핑
    console.info(`[BOJScraper] Cache miss: ${problemId}, fetching...`);
    const content = await this._fetchFromWeb(problemId);
    
    // 캐싱
    this.cache.set(cacheKey, content);
    
    return content;
  }
}
```

---

## 플랫폼별 가이드

### BOJ (백준 온라인 저지)

**특징**:
- 정적 HTML 페이지
- robots.txt 허용
- Rate Limiting: 3초 간격

**구현 파일**: `src/api/boj-scraper.ts`

**주요 메서드**:
- `fetchProblemContent(problemId)`: 문제 본문 가져오기
- `parseProblemContent(html)`: HTML 파싱

**에러 처리**:

```typescript
async fetchProblemContent(problemId: number): Promise<string> {
  try {
    // ... (fetch 로직)
  } catch (error) {
    if (error.message.includes('403')) {
      throw new ScrapingError('Access forbidden (IP blocked?)');
    }
    if (error.message.includes('404')) {
      throw new ScrapingError(`Problem ${problemId} not found`);
    }
    throw error;
  }
}
```

### Programmers (향후 계획)

**특징**:
- SPA 구조 (React/Vue)
- Puppeteer/Playwright 필요
- Rate Limiting: 초당 5회

**구현 계획**:
- Phase 7 POC 실험 (1주)
- Phase 7 본격 개발 (3주)
- 파일: `src/api/programmers-scraper.ts`

**주요 메서드 (예정)**:
- `searchProblems(params)`: 문제 검색
- `fetchProblemDetail(problemId)`: 문제 상세 조회

---

## 모니터링 및 에러 처리

### 에러 타입

```typescript
export class ScrapingError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public platform?: string
  ) {
    super(message);
    this.name = 'ScrapingError';
  }
}
```

### 에러 처리 전략

| HTTP Status | 의미 | 대응 |
|-------------|------|------|
| **403** | Forbidden | IP 차단 가능, Rate Limiting 강화 필요 |
| **404** | Not Found | 문제 ID 오류, 사용자에게 명확한 메시지 |
| **429** | Too Many Requests | Rate Limiting 초과, 대기 후 재시도 |
| **500** | Server Error | 플랫폼 서버 문제, 나중에 재시도 |

### 로깅

**로그 레벨**:

```typescript
// 정상 동작
console.info('[BOJScraper] Fetching problem 1000...');

// 캐시 히트
console.info('[BOJScraper] Cache hit: 1000');

// Rate Limiting 대기
console.info('[BOJScraper] Waiting 3000ms...');

// 에러 발생
console.error('[BOJScraper] Failed to fetch problem 1000:', error);
```

### 성능 모니터링

**추적 메트릭**:

```typescript
interface ScrapingStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  averageResponseTime: number; // ms
}
```

**캐시 히트율 계산**:

```typescript
const hitRate = (cacheHits / totalRequests) * 100;
console.info(`[BOJScraper] Cache hit rate: ${hitRate.toFixed(2)}%`);
```

---

## 변경 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|----------|
| 2026-02-15 | project-planner | 최초 작성 (정책 및 구현 가이드) |
| 2026-02-16 | technical-writer | 3개 문서 통합 (policy-review + policy + user-agent) |

---

**작성자**: project-planner, technical-writer
**상태**: ✅ 완료
**관련 파일**: `/src/api/boj-scraper.ts`
