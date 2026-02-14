# 프로그래머스 Puppeteer 기반 구현 계획서

**작성일**: 2026-02-15
**담당**: project-manager
**Phase**: Phase 7
**예상 기간**: 2-3주
**아키텍처**: 하이브리드 (검색: Puppeteer, 문제 상세: cheerio)

---

## 📋 Executive Summary

사용자 요청에 따라 프로그래머스 통합을 **Puppeteer 기반 하이브리드 아키텍처**로 구현합니다.

### 핵심 의사결정 (Key Decisions)

1. **검색 페이지**: ❌ cheerio 불가능 (SPA) → ✅ Puppeteer 사용
2. **문제 상세 페이지**: ✅ cheerio 가능 (SSR) → ✅ cheerio 사용 (빠르고 가벼움)
3. **하이브리드 아키텍처**: 상황에 따라 최적 도구 선택

### 성능 목표 (Performance Targets)

| 기능 | 최초 요청 | 캐시 히트 | 방법 |
|------|----------|----------|------|
| 검색 (Puppeteer) | 3-5초 | <100ms | 30분 TTL |
| 문제 상세 (cheerio) | 500ms-1초 | <50ms | 30일 TTL |
| 메모리 사용량 | 최대 600MB | - | 브라우저 인스턴스 재사용 |

---

## 1. 아키텍처 설계 (Architecture Design)

### 1.1. 하이브리드 아키텍처 개요

```
사용자
  │
  ▼
MCP 도구
  │
  ├─ search_programmers_problems ────► ProgrammersScraper (Puppeteer) ─┐
  │                                                                     │
  └─ get_programmers_problem ────────► ProgrammersScraper (cheerio) ───┤
                                                                         │
                                                                         ▼
                                                                    Cache (LRU)
                                                                         │
                                                                         ▼
                                                                  프로그래머스 서버
```

**핵심 원칙**:
- **검색 페이지**: SPA → Puppeteer 필수
- **문제 상세**: SSR → cheerio 사용 (빠르고 가벼움)
- **캐싱 최대화**: 느린 Puppeteer 요청 최소화

---

### 1.2. 파일 구조 (File Structure)

```
src/
├── api/
│   ├── solvedac-client.ts           # 기존 (BOJ)
│   ├── boj-scraper.ts                # 기존 (BOJ)
│   ├── programmers-scraper.ts        # 🆕 Puppeteer + cheerio
│   └── types.ts                      # 공통 + Programmers 타입
│
├── utils/
│   ├── html-parser.ts                # 기존 (BOJ) + 🆕 Programmers
│   ├── rate-limiter.ts               # 기존 (재사용)
│   ├── browser-pool.ts               # 🆕 Puppeteer 인스턴스 관리
│   └── tier-converter.ts             # 기존 (BOJ)
│
├── services/
│   ├── problem-analyzer.ts           # 멀티 플랫폼 지원으로 확장
│   └── review-template-generator.ts  # 멀티 플랫폼 지원으로 확장
│
└── tools/
    ├── search-problems.ts            # platform 파라미터 추가
    ├── get-problem.ts                # platform 파라미터 추가
    └── analyze-problem.ts            # platform 파라미터 추가
```

---

### 1.3. 클래스 다이어그램 (Class Diagram)

```typescript
/**
 * 프로그래머스 스크래퍼 (하이브리드)
 */
class ProgrammersScraper {
  // Puppeteer 관련
  private browserPool: BrowserPool;

  // 공통
  private cache: LRUCache;
  private searchRateLimiter: RateLimiter;  // 검색용 (느림)
  private detailRateLimiter: RateLimiter;  // 상세용 (빠름)

  // 검색 (Puppeteer)
  async searchProblems(options: SearchOptions): Promise<SearchResult>

  // 문제 상세 (cheerio)
  async getProblem(problemId: string): Promise<ProblemContent>

  // 헬퍼
  private async fetchWithPuppeteer(url: string): Promise<string>
  private async fetchWithCheerio(url: string): Promise<string>
}

/**
 * Puppeteer 브라우저 풀
 */
class BrowserPool {
  private browsers: Browser[];
  private maxSize: number = 2;

  async acquire(): Promise<Browser>
  async release(browser: Browser): Promise<void>
  async closeAll(): Promise<void>
}
```

---

## 2. 기술 스펙 (Technical Specifications)

### 2.1. TypeScript 타입 정의

```typescript
/**
 * 프로그래머스 검색 옵션
 */
export interface ProgrammersSearchOptions {
  /** 난이도 필터 (0-5) */
  levels?: number[];

  /** 카테고리 필터 */
  categories?: string[];

  /** 정렬 기준 */
  order?: 'recent' | 'accuracy' | 'popular';

  /** 페이지 번호 (1부터 시작) */
  page?: number;

  /** 페이지당 항목 수 (기본값: 20) */
  limit?: number;

  /** 검색 키워드 */
  query?: string;
}

/**
 * 프로그래머스 검색 결과
 */
export interface ProgrammersSearchResult {
  problems: ProgrammersProblemSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
  metadata: {
    fetchedAt: string;
    source: 'puppeteer';
  };
}

/**
 * 프로그래머스 문제 요약 (검색 결과)
 */
export interface ProgrammersProblemSummary {
  problemId: string;
  title: string;
  level: number;              // 0-5
  category: string;           // "PCCE 기출문제", "코딩 기초 트레이닝" 등
  solvedCount: string;        // "16,721명"
  successRate: string;        // "72%"
  url: string;                // 절대 URL
}

/**
 * 프로그래머스 문제 상세
 */
export interface ProgrammersProblemContent {
  problemId: string;
  title: string;
  description: string;
  level: number;
  category: string;
  constraints?: string;
  examples: ProblemExample[];
  testCases?: string;         // 테스트 케이스 구성 (테이블)
  metadata: {
    fetchedAt: string;
    source: 'cheerio';
    cacheExpiresAt: string;   // 30일 후
  };
}

/**
 * 입출력 예제
 */
export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}
```

---

### 2.2. CSS Selector 정의

**검색 페이지** (Puppeteer):
```typescript
const PROGRAMMERS_SEARCH_SELECTORS = {
  /** 문제 테이블 행 */
  problemRows: 'table tbody tr',

  /** 제목 링크 */
  titleLink: 'td:nth-child(2) a',

  /** 카테고리 */
  category: 'td:nth-child(2) div:last-child',

  /** 난이도 */
  level: 'td:nth-child(3)',

  /** 풀이 수 */
  solvedCount: 'td:nth-child(4)',

  /** 정답률 */
  successRate: 'td:nth-child(5)',

  /** 페이지네이션 */
  pagination: 'nav[aria-label="pagination"]',
} as const;
```

**문제 상세 페이지** (cheerio):
```typescript
const PROGRAMMERS_PROBLEM_SELECTORS = {
  /** 제목 */
  title: 'article h6 + h4',

  /** 카테고리 */
  category: 'ol.breadcrumb li:last-child',

  /** 문제 설명 섹션 */
  description: 'article > div > div:first-child',

  /** 제한사항 */
  constraints: 'h5:contains("제한사항") + ul',

  /** 입출력 예제 테이블 */
  examplesTable: 'h5:contains("입출력 예") + table',

  /** 입출력 예 설명 */
  examplesExplanation: 'h5:contains("입출력 예 설명") + *',

  /** 테스트 케이스 구성 */
  testCasesTable: 'h5:contains("테스트 케이스 구성 안내") + table',
} as const;
```

---

### 2.3. Rate Limiting 전략

**검색 요청** (Puppeteer, 느림):
```typescript
const searchRateLimiter = new RateLimiter({
  capacity: 3,          // 버스트 최대 3회
  refillRate: 1,        // 초당 1회 (보수적)
  maxWaitTime: 10000,   // 최대 10초 대기
});
```

**문제 상세 요청** (cheerio, 빠름):
```typescript
const detailRateLimiter = new RateLimiter({
  capacity: 10,         // 버스트 최대 10회
  refillRate: 5,        // 초당 5회
  maxWaitTime: 5000,    // 최대 5초 대기
});
```

**캐싱 전략**:
- 검색 결과: TTL 30분, LRU 50개
- 문제 상세: TTL 30일, LRU 100개 (BOJ와 동일)

---

## 3. Task 분해 및 일정 (Task Breakdown)

### Phase 7 전체 일정: 2-3주

| ID | Task | 소요 | 우선순위 | 의존성 |
|----|------|------|----------|--------|
| **P7-001** | Puppeteer 설치 및 BrowserPool 구현 | 1일 | P0 | - |
| **P7-002** | ProgrammersScraper (검색, Puppeteer) | 3일 | P0 | P7-001 |
| **P7-003** | ProgrammersScraper (문제 상세, cheerio) | 2일 | P0 | - |
| **P7-004** | HTML 파서 구현 | 2일 | P0 | P7-002, P7-003 |
| **P7-005** | MCP 도구 구현 | 2일 | P1 | P7-004 |
| **P7-006** | Rate Limiting 및 캐싱 | 1일 | P1 | P7-002, P7-003 |
| **P7-007** | 테스트 코드 작성 | 3일 | P0 | P7-002 ~ P7-006 |
| **P7-008** | 문서 업데이트 | 1일 | P2 | P7-007 |

**총 예상 기간**: 15일 (3주)

---

### Task 7.1: Puppeteer 설치 및 BrowserPool 구현 (1일)

**목표**: Puppeteer 인스턴스 관리 및 재사용 메커니즘 구축

**세부 태스크**:
1. **의존성 추가** (1시간)
   ```bash
   npm install puppeteer@22.0.0
   npm install --save-dev @types/puppeteer@5.4.7
   ```

2. **BrowserPool 클래스 구현** (4시간)
   - 파일: `src/utils/browser-pool.ts`
   - 기능:
     - 최대 2개 브라우저 인스턴스 관리
     - acquire/release 메서드
     - 자동 재시작 (메모리 누수 방지)
     - 타임아웃 처리

3. **Puppeteer 설정** (2시간)
   ```typescript
   const browser = await puppeteer.launch({
     headless: true,
     args: [
       '--no-sandbox',
       '--disable-setuid-sandbox',
       '--disable-dev-shm-usage',  // 메모리 절약
     ],
   });
   ```

4. **단위 테스트** (1시간)
   - acquire/release 동작 확인
   - 최대 인스턴스 수 제한 확인
   - 메모리 누수 검증

**인수 조건**:
- [x] BrowserPool 클래스 구현 완료
- [x] 브라우저 인스턴스 재사용 동작 확인
- [x] 메모리 사용량 600MB 이내
- [x] 단위 테스트 5개 이상 통과

**예상 산출물**: 150줄 코드, 5개 테스트

---

### Task 7.2: ProgrammersScraper (검색, Puppeteer) (3일)

**목표**: Puppeteer 기반 검색 페이지 스크래핑 구현

**Day 1: 기본 구조 (4시간)**
- 파일: `src/api/programmers-scraper.ts`
- ProgrammersScraper 클래스 생성
- searchProblems() 메서드 뼈대
- URL 생성 로직

**Day 2: 파싱 로직 (4시간)**
- Puppeteer page.evaluate()로 DOM 추출
- CSS selector 기반 데이터 파싱
- 페이지네이션 처리
- 에러 처리 (타임아웃, 파싱 실패)

**Day 3: 캐싱 및 테스트 (4시간)**
- LRU 캐시 통합 (TTL 30분)
- Rate Limiter 통합
- 단위 테스트 10개
- 통합 테스트 5개

**구현 예시**:
```typescript
async searchProblems(options: ProgrammersSearchOptions): Promise<ProgrammersSearchResult> {
  const cacheKey = this.buildSearchCacheKey(options);

  // 캐시 확인
  const cached = this.cache.get<ProgrammersSearchResult>(cacheKey);
  if (cached) return cached;

  // Rate Limiting
  await this.searchRateLimiter.acquire();

  // Puppeteer로 검색 페이지 스크래핑
  const browser = await this.browserPool.acquire();
  try {
    const page = await browser.newPage();
    const url = this.buildSearchUrl(options);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // DOM 추출
    const problems = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        const titleCell = cells[1];
        const link = titleCell.querySelector('a');

        return {
          problemId: link?.href.split('/').pop() || '',
          title: link?.textContent?.trim() || '',
          level: parseInt(cells[2]?.textContent?.match(/\d+/)?.[0] || '0'),
          category: titleCell.querySelector('div:last-child')?.textContent?.trim() || '',
          solvedCount: cells[3]?.textContent?.trim() || '',
          successRate: cells[4]?.textContent?.trim() || '',
          url: link?.href || '',
        };
      });
    });

    await page.close();

    const result: ProgrammersSearchResult = {
      problems,
      pagination: { /* ... */ },
      metadata: { fetchedAt: new Date().toISOString(), source: 'puppeteer' },
    };

    // 캐싱
    this.cache.set(cacheKey, result, 30 * 60 * 1000); // 30분
    return result;
  } finally {
    await this.browserPool.release(browser);
  }
}
```

**인수 조건**:
- [x] 검색 파라미터 모두 동작 (levels, categories, order, page, query)
- [x] 페이지네이션 정상 동작
- [x] 빈 결과 처리
- [x] 단위 테스트 10개 통과
- [x] 통합 테스트 5개 통과
- [x] 평균 응답 시간 5초 이내

**예상 산출물**: 250줄 코드, 15개 테스트

---

### Task 7.3: ProgrammersScraper (문제 상세, cheerio) (2일)

**목표**: cheerio 기반 문제 상세 페이지 파싱 구현 (BOJScraper 패턴 재사용)

**Day 1: 기본 구조 (4시간)**
- getProblem() 메서드 구현
- fetch로 HTML 가져오기 (BOJScraper 패턴 재사용)
- 에러 처리 (NOT_FOUND, TIMEOUT, NETWORK_ERROR)
- 요청 간 간격 제어

**Day 2: 파싱 로직 (4시간)**
- cheerio로 HTML 파싱
- CSS selector 기반 데이터 추출
- 입출력 예제 파싱
- 테스트 케이스 구성 파싱
- 단위 테스트 10개

**구현 예시**:
```typescript
async getProblem(problemId: string): Promise<ProgrammersProblemContent> {
  const cacheKey = `problem:${problemId}`;

  // 캐시 확인
  const cached = this.cache.get<ProgrammersProblemContent>(cacheKey);
  if (cached) return cached;

  // Rate Limiting
  await this.detailRateLimiter.acquire();

  // cheerio로 HTML 가져오기 (BOJScraper 패턴)
  const url = `https://school.programmers.co.kr/learn/courses/30/lessons/${problemId}`;
  const html = await this.fetchWithTimeout(url);

  // HTML 파싱 (별도 파서로 위임)
  const content = parseProgrammersProblemContent(html, problemId);

  // 캐싱 (30일)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  content.metadata.cacheExpiresAt = expiresAt.toISOString();
  this.cache.set(cacheKey, content, 30 * 24 * 60 * 60 * 1000);

  return content;
}

private async fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 ...',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ProgrammersFetchError('HTTP error', 'NETWORK_ERROR');
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ProgrammersFetchError('Timeout', 'TIMEOUT');
    }
    throw error;
  }
}
```

**인수 조건**:
- [x] 모든 필드 파싱 확인 (제목, 본문, 제한사항, 예제)
- [x] 존재하지 않는 문제 ID 에러 처리
- [x] 단위 테스트 10개 통과
- [x] 통합 테스트 5개 통과
- [x] 평균 응답 시간 1초 이내

**예상 산출물**: 180줄 코드, 15개 테스트

---

### Task 7.4: HTML 파서 구현 (2일)

**목표**: cheerio 기반 프로그래머스 HTML 파싱 로직 구현

**Day 1: 파서 함수 구현 (4시간)**
- 파일: `src/utils/html-parser.ts` 확장
- parseProgrammersProblemContent() 함수
- CSS selector 기반 추출 로직
- 입출력 예제 파싱

**Day 2: 테스트 및 문서화 (4시간)**
- 단위 테스트 15개
- CSS selector 문서화
- 에러 케이스 처리

**구현 예시**:
```typescript
/**
 * 프로그래머스 문제 페이지 HTML 파싱
 */
export function parseProgrammersProblemContent(
  html: string,
  problemId: string
): ProgrammersProblemContent {
  const $ = cheerio.load(html);

  // 제목
  const title = $('article h6 + h4').text().trim();
  if (!title) {
    throw new HtmlParseError('제목을 찾을 수 없습니다', 'title');
  }

  // 카테고리
  const category = $('ol.breadcrumb li:last-child').text().trim();

  // 난이도 (문제 설명에서 추출)
  const levelMatch = html.match(/Lv\.\s*(\d+)/);
  const level = levelMatch ? parseInt(levelMatch[1]) : 0;

  // 문제 설명
  const descriptionEl = $('article > div > div:first-child');
  const description = descriptionEl.html() || '';

  // 제한사항
  const constraintsEl = $('h5:contains("제한사항")').next('ul');
  const constraints = constraintsEl.html() || '';

  // 입출력 예제
  const examples = parseExamples($);

  // 테스트 케이스 구성
  const testCases = parseTestCases($);

  const now = new Date();
  return {
    problemId,
    title,
    description,
    level,
    category,
    constraints,
    examples,
    testCases,
    metadata: {
      fetchedAt: now.toISOString(),
      source: 'cheerio',
      cacheExpiresAt: '',
    },
  };
}

function parseExamples($: cheerio.CheerioAPI): ProblemExample[] {
  const examples: ProblemExample[] = [];
  const table = $('h5:contains("입출력 예")').next('table');

  table.find('tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 2) {
      examples.push({
        input: $(cells[0]).text().trim(),
        output: $(cells[1]).text().trim(),
      });
    }
  });

  return examples;
}
```

**인수 조건**:
- [x] 모든 필드 파싱 함수 구현
- [x] 에러 케이스 처리 (필수 필드 누락)
- [x] 단위 테스트 15개 통과
- [x] CSS selector 문서화

**예상 산출물**: 200줄 코드, 15개 테스트

---

### Task 7.5: MCP 도구 구현 (2일)

**목표**: 프로그래머스 전용 MCP 도구 구현

**Day 1: 도구 구현 (4시간)**
- `search_programmers_problems` 도구
- `get_programmers_problem` 도구
- Zod 스키마 정의
- ProgrammersScraper 클래스 호출

**Day 2: 통합 및 테스트 (4시간)**
- MCP 서버에 도구 등록
- 통합 테스트 10개
- E2E 테스트 3개

**구현 예시**:
```typescript
// src/tools/search-programmers-problems.ts
import { z } from 'zod';
import { ProgrammersScraper } from '../api/programmers-scraper.js';

const SearchProgrammersProblemsInputSchema = z.object({
  levels: z.array(z.number().int().min(0).max(5)).optional(),
  categories: z.array(z.string()).optional(),
  order: z.enum(['recent', 'accuracy', 'popular']).optional().default('recent'),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(20),
  query: z.string().optional(),
});

server.tool(
  'search_programmers_problems',
  '프로그래머스 문제 검색',
  SearchProgrammersProblemsInputSchema,
  async (args) => {
    const scraper = new ProgrammersScraper();
    const result = await scraper.searchProblems(args);

    return {
      type: 'text',
      text: JSON.stringify(result, null, 2),
    };
  }
);
```

**인수 조건**:
- [x] 2개 MCP 도구 구현 완료
- [x] Zod 스키마 정의
- [x] 통합 테스트 10개 통과
- [x] E2E 테스트 3개 통과

**예상 산출물**: 150줄 코드, 13개 테스트

---

### Task 7.6: Rate Limiting 및 캐싱 (1일)

**목표**: Rate Limiter 및 LRU 캐시 통합

**세부 태스크** (8시간):
1. **Rate Limiter 생성** (2시간)
   - 검색용 Rate Limiter (초당 1회)
   - 문제 상세용 Rate Limiter (초당 5회)
   - ProgrammersScraper에 통합

2. **LRU 캐시 통합** (2시간)
   - 검색 결과 캐싱 (TTL 30분, 최대 50개)
   - 문제 상세 캐싱 (TTL 30일, 최대 100개)
   - 캐시 통계 수집

3. **User-Agent 설정** (1시간)
   - 브라우저 User-Agent 설정
   - fetch User-Agent 설정

4. **테스트** (3시간)
   - Rate Limiting 동작 확인
   - 캐시 히트율 측정
   - 100회 연속 요청 안정성 테스트

**인수 조건**:
- [x] Rate Limiter 정상 동작
- [x] 캐시 히트율 70% 이상
- [x] IP 차단 방지 확인 (100회 연속 요청)
- [x] 단위 테스트 8개 통과

**예상 산출물**: 100줄 코드, 8개 테스트

---

### Task 7.7: 테스트 코드 작성 (3일)

**목표**: 포괄적인 테스트 커버리지 확보

**Day 1: 단위 테스트 (4시간)**
- BrowserPool 테스트 (5개)
- ProgrammersScraper 테스트 (15개)
- HTML 파서 테스트 (15개)

**Day 2: 통합 테스트 (4시간)**
- 검색 플로우 테스트 (10개)
- 문제 상세 플로우 테스트 (10개)
- 캐싱 동작 테스트 (5개)

**Day 3: E2E 테스트 (4시간)**
- MCP 도구 통합 테스트 (5개)
- 성능 벤치마크 (3개)
- 메모리 누수 테스트 (2개)

**테스트 구조**:
```typescript
// tests/api/programmers-scraper.test.ts
describe('ProgrammersScraper', () => {
  describe('searchProblems', () => {
    it('should return search results with default options', async () => {
      const scraper = new ProgrammersScraper();
      const result = await scraper.searchProblems({});

      expect(result.problems).toBeInstanceOf(Array);
      expect(result.pagination.currentPage).toBe(1);
    });

    it('should filter by levels', async () => {
      const scraper = new ProgrammersScraper();
      const result = await scraper.searchProblems({ levels: [0, 1] });

      result.problems.forEach(p => {
        expect([0, 1]).toContain(p.level);
      });
    });

    // ... 13개 추가 테스트
  });

  describe('getProblem', () => {
    it('should return problem content', async () => {
      const scraper = new ProgrammersScraper();
      const content = await scraper.getProblem('389632');

      expect(content.title).toBeTruthy();
      expect(content.description).toBeTruthy();
      expect(content.examples).toBeInstanceOf(Array);
    });

    // ... 9개 추가 테스트
  });
});
```

**인수 조건**:
- [x] 단위 테스트 35개 이상 통과
- [x] 통합 테스트 25개 이상 통과
- [x] E2E 테스트 10개 이상 통과
- [x] 테스트 커버리지 80% 이상
- [x] 모든 CI/CD 체크 통과

**예상 산출물**: 600줄 코드, 70개 테스트

---

### Task 7.8: 문서 업데이트 (1일)

**목표**: 프로그래머스 통합 관련 문서 업데이트

**세부 태스크** (8시간):
1. **API 통합 가이드** (2시간)
   - `docs/02-development/api-integration.md` 업데이트
   - 프로그래머스 스크래핑 방법 설명
   - CSS selector 문서화

2. **도구 레퍼런스** (2시간)
   - `docs/02-development/TOOLS.md` 업데이트
   - search_programmers_problems 도구 설명
   - get_programmers_problem 도구 설명
   - 사용 예시 추가

3. **아키텍처 문서** (2시간)
   - `docs/01-planning/architecture.md` 업데이트
   - 하이브리드 아키텍처 설명
   - Puppeteer vs cheerio 선택 기준

4. **CLAUDE.md 업데이트** (2시간)
   - 멀티 플랫폼 지원 명시
   - 프로그래머스 제약사항 설명
   - 사용 가이드 추가

**인수 조건**:
- [x] 모든 문서 업데이트 완료
- [x] 사용 예시 검증
- [x] 마크다운 문법 유효성 확인

**예상 산출물**: 4개 문서 업데이트

---

## 4. 리스크 관리 (Risk Management)

### 4.1. 리스크 식별 및 대응

| 리스크 | 발생 가능성 | 영향도 | 대응 방안 |
|--------|-------------|--------|----------|
| **R1: Puppeteer 메모리 사용량 과다** | 🟡 중간 | 🟡 중간 | BrowserPool로 인스턴스 재사용, 타임아웃 후 자동 종료 |
| **R2: HTML 구조 변경** | 🟡 중간 (3개월) | 🔴 높음 | CSS selector 추상화, 버전 관리, 알림 시스템 |
| **R3: 느린 응답 속도** | 🔴 높음 (Puppeteer) | 🟡 중간 | 적극적 캐싱 (30분), 병렬 처리 제한 |
| **R4: Rate Limiting 위반** | 🟢 낮음 | 🔴 높음 | 요청 간 5초 간격, 재시도 로직, 캐시 우선 |
| **R5: Puppeteer 설치 실패** | 🟢 낮음 | 🟡 중간 | 상세 설치 가이드, 환경 별 테스트 |

---

### 4.2. 세부 대응 방안

#### R1: Puppeteer 메모리 사용량 과다 (350-600MB)

**대응**:
1. **브라우저 인스턴스 재사용**: BrowserPool로 최대 2개 인스턴스만 유지
2. **자동 재시작**: 100회 요청마다 브라우저 재시작
3. **리소스 차단**: 이미지, CSS, 폰트 로딩 차단
4. **타임아웃 설정**: 10초 타임아웃 후 페이지 강제 종료

```typescript
// 리소스 차단 설정
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
    req.abort();
  } else {
    req.continue();
  }
});
```

**모니터링**:
- 메모리 사용량 로깅
- 브라우저 재시작 횟수 추적

---

#### R2: HTML 구조 변경 (파싱 실패)

**대응**:
1. **CSS selector 추상화**: selector를 별도 파일로 관리
2. **버전 관리**: selector 변경 이력 기록
3. **Fallback 로직**: 메인 selector 실패 시 대체 selector 시도
4. **알림 시스템**: 파싱 실패 시 즉시 알림

```typescript
// Fallback 로직 예시
const PROGRAMMERS_PROBLEM_SELECTORS = {
  title: ['article h6 + h4', 'article h4', '.problem-title'],  // 우선순위
};

function parseTitle($: cheerio.CheerioAPI): string {
  for (const selector of PROGRAMMERS_PROBLEM_SELECTORS.title) {
    const title = $(selector).text().trim();
    if (title) return title;
  }
  throw new HtmlParseError('제목을 찾을 수 없습니다', 'title');
}
```

**모니터링**:
- 파싱 성공률 추적 (>95% 유지)
- 주간 파싱 테스트 자동 실행

---

#### R3: 느린 응답 속도 (3-5초)

**대응**:
1. **적극적 캐싱**: 검색 결과 30분 TTL, 문제 상세 30일 TTL
2. **병렬 처리 제한**: 최대 2개 동시 Puppeteer 요청
3. **페이지 사전 로딩**: 인기 문제 사전 캐싱
4. **응답 시간 모니터링**: 95 percentile < 5초 유지

**최적화 전략**:
- 검색 결과 캐싱으로 2차 요청부터 <100ms
- 문제 상세는 cheerio 사용으로 500ms-1초

---

#### R4: Rate Limiting 위반 (IP 차단)

**대응**:
1. **보수적 Rate Limiting**: 검색 초당 1회, 문제 상세 초당 5회
2. **재시도 로직**: 429 에러 시 지수 백오프 (1초, 2초, 4초)
3. **캐시 우선**: 항상 캐시를 먼저 확인
4. **User-Agent 설정**: 정상 브라우저로 인식

```typescript
// 재시도 로직
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.statusCode === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1초, 2초, 4초
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

#### R5: Puppeteer 설치 실패 (환경 의존성)

**대응**:
1. **상세 설치 가이드**: README에 환경별 가이드 추가
2. **환경 별 테스트**: macOS, Linux, Docker에서 테스트
3. **Fallback**: Puppeteer 실패 시 에러 메시지와 함께 수동 입력 안내

---

## 5. 기존 코드와의 통합 (Integration with Existing Code)

### 5.1. BOJScraper 패턴 재사용

**기존 BOJScraper**:
```typescript
// src/api/boj-scraper.ts
export class BOJScraper {
  private lastRequestTime = 0;

  async fetchProblemPage(problemId: number): Promise<string> {
    await this._ensureRequestInterval();  // 윤리적 스크래핑
    const html = await this._fetchWithTimeout(url);
    this.lastRequestTime = Date.now();
    return html;
  }
}
```

**ProgrammersScraper 적용**:
```typescript
// src/api/programmers-scraper.ts
export class ProgrammersScraper {
  private lastDetailRequestTime = 0;  // cheerio 요청용

  async getProblem(problemId: string): Promise<ProgrammersProblemContent> {
    // BOJScraper 패턴 재사용
    await this._ensureRequestInterval();
    const html = await this._fetchWithTimeout(url);
    this.lastDetailRequestTime = Date.now();

    // cheerio 파싱
    return parseProgrammersProblemContent(html, problemId);
  }

  private async _ensureRequestInterval(): Promise<void> {
    const elapsed = Date.now() - this.lastDetailRequestTime;
    const minInterval = 1000; // 1초 간격 (BOJ는 3초)
    if (elapsed < minInterval) {
      await this._delay(minInterval - elapsed);
    }
  }
}
```

---

### 5.2. html-parser.ts 확장

**기존 구조**:
```typescript
// src/utils/html-parser.ts
const BOJ_SELECTORS = { /* ... */ };
export function parseProblemContent(html: string, problemId: number): ProblemContent {
  // BOJ 파싱 로직
}
```

**프로그래머스 추가**:
```typescript
// src/utils/html-parser.ts
const PROGRAMMERS_SELECTORS = { /* ... */ };

export function parseProgrammersProblemContent(
  html: string,
  problemId: string
): ProgrammersProblemContent {
  // 프로그래머스 파싱 로직
}

// 공통 유틸리티 재사용
function parseExamples($: cheerio.CheerioAPI, selectors: any): ProblemExample[] {
  // 공통 로직
}
```

---

### 5.3. rate-limiter.ts 활용

**기존 Rate Limiter**:
```typescript
// src/utils/rate-limiter.ts
export const solvedAcLimiter = new RateLimiter({
  capacity: 10,
  refillRate: 10,
  maxWaitTime: 5000,
});
```

**프로그래머스 추가**:
```typescript
// src/utils/rate-limiter.ts
export const programmersSearchLimiter = new RateLimiter({
  capacity: 3,
  refillRate: 1,      // 초당 1회 (Puppeteer, 느림)
  maxWaitTime: 10000,
});

export const programmersDetailLimiter = new RateLimiter({
  capacity: 10,
  refillRate: 5,      // 초당 5회 (cheerio, 빠름)
  maxWaitTime: 5000,
});
```

---

### 5.4. problem-analyzer.ts 멀티 플랫폼 확장

**기존 구조**:
```typescript
// src/services/problem-analyzer.ts
export class ProblemAnalyzer {
  async analyzeProblem(problem: Problem): Promise<ProblemAnalysis> {
    // BOJ 전용 분석 로직
  }
}
```

**멀티 플랫폼 지원**:
```typescript
// src/services/problem-analyzer.ts
export class ProblemAnalyzer {
  async analyzeProblem(
    problem: Problem | ProgrammersProblemContent,
    platform: 'boj' | 'programmers'
  ): Promise<ProblemAnalysis> {
    if (platform === 'programmers') {
      return this.analyzeProgrammersProblem(problem as ProgrammersProblemContent);
    }
    return this.analyzeBojProblem(problem as Problem);
  }

  private analyzeProgrammersProblem(problem: ProgrammersProblemContent): ProblemAnalysis {
    // 카테고리 기반 분석 (태그 없음)
    const tags = this.extractTagsFromCategory(problem.category);
    const hintGuide = this.buildHintGuide(tags, problem.level);
    // ...
  }
}
```

---

## 6. 성능 벤치마크 (Performance Benchmark)

### 6.1. 목표 성능

| 기능 | 최초 요청 | 캐시 히트 | 메모리 |
|------|----------|----------|--------|
| 검색 (Puppeteer) | 3-5초 | <100ms | +400MB |
| 문제 상세 (cheerio) | 500ms-1초 | <50ms | +50MB |
| 전체 시스템 | - | - | 최대 600MB |

### 6.2. 벤치마크 시나리오

**시나리오 1: 검색 + 문제 상세 조회**
```typescript
// 최초 요청 (캐시 없음)
const start1 = Date.now();
const searchResult = await scraper.searchProblems({ levels: [1] });
const problem = await scraper.getProblem(searchResult.problems[0].problemId);
const elapsed1 = Date.now() - start1;
// 예상: 4-6초

// 2차 요청 (캐시 히트)
const start2 = Date.now();
const searchResult2 = await scraper.searchProblems({ levels: [1] });
const problem2 = await scraper.getProblem(searchResult.problems[0].problemId);
const elapsed2 = Date.now() - start2;
// 예상: <150ms
```

**시나리오 2: 병렬 요청 (10개)**
```typescript
const promises = Array(10).fill(null).map((_, i) =>
  scraper.getProblem(`${i}`)
);
const start = Date.now();
await Promise.all(promises);
const elapsed = Date.now() - start;
// 예상: 2-3초 (Rate Limiting + 병렬)
```

---

## 7. 산출물 요약 (Deliverables Summary)

### 7.1. 코드 산출물

| 파일 | 라인 수 | 설명 |
|------|---------|------|
| `src/utils/browser-pool.ts` | 150 | Puppeteer 인스턴스 관리 |
| `src/api/programmers-scraper.ts` | 430 | 검색 + 문제 상세 |
| `src/utils/html-parser.ts` | +200 | cheerio 파서 (확장) |
| `src/tools/search-programmers-problems.ts` | 80 | MCP 도구 |
| `src/tools/get-programmers-problem.ts` | 70 | MCP 도구 |
| `src/api/types.ts` | +100 | TypeScript 타입 |
| `tests/**/*.test.ts` | 600 | 테스트 코드 |
| **총계** | **1,630** | **신규 코드** |

---

### 7.2. 테스트 산출물

| 테스트 종류 | 개수 | 설명 |
|-------------|------|------|
| 단위 테스트 | 35 | BrowserPool, Scraper, Parser |
| 통합 테스트 | 25 | 검색 + 문제 상세 플로우 |
| E2E 테스트 | 10 | MCP 도구 통합 |
| **총계** | **70** | **테스트 케이스** |

**목표 커버리지**: 80% 이상

---

### 7.3. 문서 산출물

1. **구현 계획서** (이 문서): `programmers-puppeteer-implementation.md`
2. **테스트 스펙**: `test-spec-phase7.md`
3. **API 통합 가이드**: `api-integration.md` (업데이트)
4. **도구 레퍼런스**: `TOOLS.md` (업데이트)
5. **아키텍처 문서**: `architecture.md` (업데이트)
6. **CLAUDE.md**: 멀티 플랫폼 지원 명시 (업데이트)

---

## 8. 일정 및 마일스톤 (Schedule & Milestones)

### Week 1 (Day 1-5)
- **Day 1**: Task 7.1 (Puppeteer + BrowserPool)
- **Day 2-4**: Task 7.2 (검색, Puppeteer)
- **Day 5**: Task 7.3 시작 (문제 상세, cheerio)

**마일스톤 1**: Puppeteer 검색 동작 확인 ✅

---

### Week 2 (Day 6-10)
- **Day 6**: Task 7.3 완료 (문제 상세, cheerio)
- **Day 7-8**: Task 7.4 (HTML 파서)
- **Day 9-10**: Task 7.5 (MCP 도구)

**마일스톤 2**: MCP 도구 통합 완료 ✅

---

### Week 3 (Day 11-15)
- **Day 11**: Task 7.6 (Rate Limiting + 캐싱)
- **Day 12-14**: Task 7.7 (테스트 코드)
- **Day 15**: Task 7.8 (문서 업데이트)

**마일스톤 3**: Phase 7 완료 ✅

---

## 9. 다음 단계 (Next Steps)

### Phase 7 완료 후

1. **Phase 4 나머지 완료**: Task 4.3 (로깅/모니터링)
2. **Phase 8 검토**: LeetCode 통합 vs 프로그래머스 공식 API 요청
3. **프로덕션 배포**: npm 패키지 배포 준비

---

## 10. 참고 자료 (References)

### 기술 문서
- [Puppeteer 공식 문서](https://pptr.dev/)
- [cheerio 공식 문서](https://cheerio.js.org/)
- [LRU Cache 구현](https://github.com/isaacs/node-lru-cache)

### 프로젝트 문서
- [프로그래머스 통합 재평가](programmers-integration-reevaluation.md)
- [Phase 7 태스크](../../03-project-management/tasks.md#phase-7)
- [BOJScraper 구현](../../src/api/boj-scraper.ts)

---

**작성자**: project-manager
**검토자**: 사용자 승인 필요
**다음 단계**: Phase 7 시작 승인 후 Task 7.1 착수
