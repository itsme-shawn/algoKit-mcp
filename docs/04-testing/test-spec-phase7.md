# Phase 7 테스트 스펙: 프로그래머스 Puppeteer 통합

**작성일**: 2026-02-15
**담당**: qa-testing-agent
**Phase**: Phase 7
**테스트 범위**: 프로그래머스 스크래핑 (Puppeteer + cheerio)
**예상 테스트 수**: 70개 (단위 35, 통합 25, E2E 10)

---

## 📋 테스트 전략 (Testing Strategy)

### 테스트 피라미드

```
        E2E (10)
    /----------------\
   |  통합 테스트 (25) |
  /--------------------\
 |   단위 테스트 (35)   |
/------------------------\
```

**비율**: 단위 50% | 통합 36% | E2E 14%

---

## 1. 단위 테스트 (Unit Tests) - 35개

### 1.1. BrowserPool 테스트 (5개)

**파일**: `tests/utils/browser-pool.test.ts`

```typescript
describe('BrowserPool', () => {
  it('should create browser instance', async () => {
    const pool = new BrowserPool({ maxSize: 2 });
    const browser = await pool.acquire();

    expect(browser).toBeDefined();
    await pool.release(browser);
  });

  it('should reuse browser instances', async () => {
    const pool = new BrowserPool({ maxSize: 2 });
    const browser1 = await pool.acquire();
    await pool.release(browser1);

    const browser2 = await pool.acquire();
    expect(browser2).toBe(browser1); // 동일 인스턴스 재사용
  });

  it('should limit maximum browser instances', async () => {
    const pool = new BrowserPool({ maxSize: 2 });
    const browser1 = await pool.acquire();
    const browser2 = await pool.acquire();

    // 3번째 요청은 대기
    const promise = pool.acquire();
    await expect(promise).rejects.toThrow('Timeout');

    await pool.release(browser1);
    await pool.release(browser2);
  });

  it('should restart browser after threshold', async () => {
    const pool = new BrowserPool({ maxSize: 1, restartThreshold: 2 });
    const browser1 = await pool.acquire();
    await pool.release(browser1);

    // 2회 사용 후 재시작
    await pool.acquire();
    await pool.release(browser1);

    const browser2 = await pool.acquire();
    expect(browser2).not.toBe(browser1); // 새 인스턴스
  });

  it('should close all browsers', async () => {
    const pool = new BrowserPool({ maxSize: 2 });
    const browser = await pool.acquire();
    await pool.closeAll();

    expect(browser.isConnected()).toBe(false);
  });
});
```

---

### 1.2. ProgrammersScraper 테스트 (검색) (10개)

**파일**: `tests/api/programmers-scraper-search.test.ts`

```typescript
describe('ProgrammersScraper.searchProblems', () => {
  let scraper: ProgrammersScraper;

  beforeEach(() => {
    scraper = new ProgrammersScraper();
  });

  it('should return search results with default options', async () => {
    const result = await scraper.searchProblems({});

    expect(result.problems).toBeInstanceOf(Array);
    expect(result.problems.length).toBeGreaterThan(0);
    expect(result.pagination.currentPage).toBe(1);
  });

  it('should filter by single level', async () => {
    const result = await scraper.searchProblems({ levels: [0] });

    result.problems.forEach(p => {
      expect(p.level).toBe(0);
    });
  });

  it('should filter by multiple levels', async () => {
    const result = await scraper.searchProblems({ levels: [0, 1] });

    result.problems.forEach(p => {
      expect([0, 1]).toContain(p.level);
    });
  });

  it('should filter by category', async () => {
    const result = await scraper.searchProblems({ categories: ['PCCE 기출문제'] });

    result.problems.forEach(p => {
      expect(p.category).toBe('PCCE 기출문제');
    });
  });

  it('should sort by recent', async () => {
    const result = await scraper.searchProblems({ order: 'recent' });

    expect(result.problems[0]).toBeDefined();
    // 최신 문제가 먼저 표시됨
  });

  it('should paginate results', async () => {
    const page1 = await scraper.searchProblems({ page: 1 });
    const page2 = await scraper.searchProblems({ page: 2 });

    expect(page1.problems[0].problemId).not.toBe(page2.problems[0].problemId);
  });

  it('should search by query', async () => {
    const result = await scraper.searchProblems({ query: '두 수의 합' });

    expect(result.problems.length).toBeGreaterThan(0);
    // 검색어가 제목에 포함되어야 함
  });

  it('should return empty results for impossible filters', async () => {
    const result = await scraper.searchProblems({
      levels: [0],
      query: '!@#$%^&*()_+',
    });

    expect(result.problems.length).toBe(0);
  });

  it('should cache search results', async () => {
    const start1 = Date.now();
    await scraper.searchProblems({ levels: [0] });
    const elapsed1 = Date.now() - start1;

    const start2 = Date.now();
    await scraper.searchProblems({ levels: [0] });
    const elapsed2 = Date.now() - start2;

    expect(elapsed2).toBeLessThan(elapsed1 / 10); // 캐시가 10배 이상 빠름
  });

  it('should handle timeout errors', async () => {
    // 타임아웃 시뮬레이션
    const scraper = new ProgrammersScraper({ timeout: 100 });

    await expect(scraper.searchProblems({})).rejects.toThrow('Timeout');
  });
});
```

---

### 1.3. ProgrammersScraper 테스트 (문제 상세) (10개)

**파일**: `tests/api/programmers-scraper-problem.test.ts`

```typescript
describe('ProgrammersScraper.getProblem', () => {
  let scraper: ProgrammersScraper;

  beforeEach(() => {
    scraper = new ProgrammersScraper();
  });

  it('should return problem content', async () => {
    const content = await scraper.getProblem('389632');

    expect(content.title).toBeTruthy();
    expect(content.description).toBeTruthy();
    expect(content.examples).toBeInstanceOf(Array);
  });

  it('should parse title correctly', async () => {
    const content = await scraper.getProblem('389632');

    expect(content.title).toBe('문자열과 알파벳과 쿼리');
  });

  it('should parse level correctly', async () => {
    const content = await scraper.getProblem('340205'); // Lv. 0 문제

    expect(content.level).toBe(0);
  });

  it('should parse category correctly', async () => {
    const content = await scraper.getProblem('340205');

    expect(content.category).toContain('PCCE');
  });

  it('should parse examples correctly', async () => {
    const content = await scraper.getProblem('389632');

    expect(content.examples.length).toBeGreaterThan(0);
    expect(content.examples[0].input).toBeTruthy();
    expect(content.examples[0].output).toBeTruthy();
  });

  it('should parse constraints if exists', async () => {
    const content = await scraper.getProblem('389632');

    if (content.constraints) {
      expect(content.constraints.length).toBeGreaterThan(0);
    }
  });

  it('should cache problem content', async () => {
    const start1 = Date.now();
    await scraper.getProblem('389632');
    const elapsed1 = Date.now() - start1;

    const start2 = Date.now();
    await scraper.getProblem('389632');
    const elapsed2 = Date.now() - start2;

    expect(elapsed2).toBeLessThan(100); // 캐시는 100ms 이내
  });

  it('should throw error for invalid problem ID', async () => {
    await expect(scraper.getProblem('invalid')).rejects.toThrow();
  });

  it('should throw error for non-existent problem', async () => {
    await expect(scraper.getProblem('999999999')).rejects.toThrow('NOT_FOUND');
  });

  it('should set correct metadata', async () => {
    const content = await scraper.getProblem('389632');

    expect(content.metadata.source).toBe('cheerio');
    expect(content.metadata.fetchedAt).toBeTruthy();
    expect(content.metadata.cacheExpiresAt).toBeTruthy();
  });
});
```

---

### 1.4. HTML 파서 테스트 (10개)

**파일**: `tests/utils/html-parser-programmers.test.ts`

```typescript
describe('parseProgrammersProblemContent', () => {
  const sampleHtml = `
    <article>
      <h6>2025 프로그래머스 코드챌린지 본선</h6>
      <h4>문자열과 알파벳과 쿼리</h4>
      <div>
        <h5>제한사항</h5>
        <ul>
          <li>1 ≤ s의 길이 ≤ 100,000</li>
        </ul>
        <h5>입출력 예</h5>
        <table>
          <tbody>
            <tr><td>"programmers"</td><td>["YES", "NO"]</td></tr>
          </tbody>
        </table>
      </div>
    </article>
  `;

  it('should parse title from h4', () => {
    const content = parseProgrammersProblemContent(sampleHtml, '389632');

    expect(content.title).toBe('문자열과 알파벳과 쿼리');
  });

  it('should parse category from breadcrumb', () => {
    const content = parseProgrammersProblemContent(sampleHtml, '389632');

    expect(content.category).toContain('코드챌린지');
  });

  it('should parse constraints from ul', () => {
    const content = parseProgrammersProblemContent(sampleHtml, '389632');

    expect(content.constraints).toContain('100,000');
  });

  it('should parse examples from table', () => {
    const content = parseProgrammersProblemContent(sampleHtml, '389632');

    expect(content.examples.length).toBeGreaterThan(0);
    expect(content.examples[0].input).toContain('programmers');
  });

  it('should throw error if title is missing', () => {
    const invalidHtml = '<article></article>';

    expect(() => parseProgrammersProblemContent(invalidHtml, '389632'))
      .toThrow('제목을 찾을 수 없습니다');
  });

  it('should handle missing constraints gracefully', () => {
    const html = '<article><h4>제목</h4></article>';
    const content = parseProgrammersProblemContent(html, '389632');

    expect(content.constraints).toBeFalsy();
  });

  it('should parse level from text', () => {
    const html = '<article><h4>제목</h4><div>Lv. 3</div></article>';
    const content = parseProgrammersProblemContent(html, '389632');

    expect(content.level).toBe(3);
  });

  it('should default level to 0 if not found', () => {
    const html = '<article><h4>제목</h4></article>';
    const content = parseProgrammersProblemContent(html, '389632');

    expect(content.level).toBe(0);
  });

  it('should set correct problemId', () => {
    const content = parseProgrammersProblemContent(sampleHtml, '389632');

    expect(content.problemId).toBe('389632');
  });

  it('should set correct metadata', () => {
    const content = parseProgrammersProblemContent(sampleHtml, '389632');

    expect(content.metadata.source).toBe('cheerio');
    expect(content.metadata.fetchedAt).toBeTruthy();
  });
});
```

---

## 2. 통합 테스트 (Integration Tests) - 25개

### 2.1. 검색 플로우 테스트 (10개)

**파일**: `tests/integration/search-flow.test.ts`

```typescript
describe('Search Flow Integration', () => {
  let scraper: ProgrammersScraper;

  beforeAll(async () => {
    scraper = new ProgrammersScraper();
  });

  afterAll(async () => {
    await scraper.close();
  });

  it('should complete full search flow', async () => {
    // 1. 검색
    const searchResult = await scraper.searchProblems({ levels: [0] });
    expect(searchResult.problems.length).toBeGreaterThan(0);

    // 2. 첫 문제 상세 조회
    const problemId = searchResult.problems[0].problemId;
    const problem = await scraper.getProblem(problemId);

    expect(problem.title).toBeTruthy();
  });

  it('should handle multiple concurrent searches', async () => {
    const promises = [
      scraper.searchProblems({ levels: [0] }),
      scraper.searchProblems({ levels: [1] }),
      scraper.searchProblems({ levels: [2] }),
    ];

    const results = await Promise.all(promises);
    expect(results.length).toBe(3);
  });

  it('should respect rate limiting', async () => {
    const start = Date.now();
    await scraper.searchProblems({ page: 1 });
    await scraper.searchProblems({ page: 2 });
    await scraper.searchProblems({ page: 3 });
    const elapsed = Date.now() - start;

    // 초당 1회 제한 → 최소 2초 소요
    expect(elapsed).toBeGreaterThan(2000);
  });

  it('should cache and reuse results', async () => {
    // 첫 요청 (캐시 없음)
    const start1 = Date.now();
    const result1 = await scraper.searchProblems({ levels: [0] });
    const elapsed1 = Date.now() - start1;

    // 두 번째 요청 (캐시 히트)
    const start2 = Date.now();
    const result2 = await scraper.searchProblems({ levels: [0] });
    const elapsed2 = Date.now() - start2;

    expect(result1.problems[0].problemId).toBe(result2.problems[0].problemId);
    expect(elapsed2).toBeLessThan(elapsed1 / 5);
  });

  it('should filter results by multiple criteria', async () => {
    const result = await scraper.searchProblems({
      levels: [0, 1],
      order: 'recent',
      page: 1,
    });

    result.problems.forEach(p => {
      expect([0, 1]).toContain(p.level);
    });
  });

  it('should paginate through multiple pages', async () => {
    const page1 = await scraper.searchProblems({ page: 1, limit: 10 });
    const page2 = await scraper.searchProblems({ page: 2, limit: 10 });

    expect(page1.problems.length).toBe(10);
    expect(page2.problems.length).toBeGreaterThan(0);
    expect(page1.problems[0].problemId).not.toBe(page2.problems[0].problemId);
  });

  it('should handle search with no results', async () => {
    const result = await scraper.searchProblems({
      query: '!@#$%^&*()_+IMPOSSIBLE',
    });

    expect(result.problems.length).toBe(0);
    expect(result.pagination.totalCount).toBe(0);
  });

  it('should recover from transient errors', async () => {
    // 타임아웃 시뮬레이션 후 재시도
    const result = await scraper.searchProblems({ levels: [0] });

    expect(result.problems.length).toBeGreaterThan(0);
  });

  it('should measure performance', async () => {
    const start = Date.now();
    await scraper.searchProblems({ levels: [0] });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(10000); // 최대 10초
  });

  it('should validate pagination metadata', async () => {
    const result = await scraper.searchProblems({ page: 1, limit: 20 });

    expect(result.pagination.currentPage).toBe(1);
    expect(result.pagination.totalPages).toBeGreaterThan(0);
    expect(result.pagination.totalCount).toBeGreaterThan(0);
  });
});
```

---

### 2.2. 문제 상세 플로우 테스트 (10개)

**파일**: `tests/integration/problem-detail-flow.test.ts`

```typescript
describe('Problem Detail Flow Integration', () => {
  let scraper: ProgrammersScraper;

  beforeAll(() => {
    scraper = new ProgrammersScraper();
  });

  it('should fetch and parse problem content', async () => {
    const content = await scraper.getProblem('389632');

    expect(content.title).toBe('문자열과 알파벳과 쿼리');
    expect(content.description).toContain('알파벳');
    expect(content.examples.length).toBeGreaterThan(0);
  });

  it('should handle multiple concurrent requests', async () => {
    const promises = [
      scraper.getProblem('389632'),
      scraper.getProblem('340205'),
      scraper.getProblem('340204'),
    ];

    const results = await Promise.all(promises);
    expect(results.length).toBe(3);
  });

  it('should cache problem content', async () => {
    // 첫 요청
    const start1 = Date.now();
    await scraper.getProblem('389632');
    const elapsed1 = Date.now() - start1;

    // 두 번째 요청 (캐시)
    const start2 = Date.now();
    await scraper.getProblem('389632');
    const elapsed2 = Date.now() - start2;

    expect(elapsed2).toBeLessThan(100); // 캐시는 100ms 이내
  });

  it('should respect rate limiting for detail requests', async () => {
    const start = Date.now();
    await scraper.getProblem('389632');
    await scraper.getProblem('340205');
    await scraper.getProblem('340204');
    await scraper.getProblem('340203');
    await scraper.getProblem('340202');
    await scraper.getProblem('340201');
    const elapsed = Date.now() - start;

    // 초당 5회 제한 → 최소 1초 소요 (6회 요청)
    expect(elapsed).toBeGreaterThan(1000);
  });

  it('should measure fetch performance', async () => {
    const start = Date.now();
    await scraper.getProblem('389632');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000); // 최대 3초
  });

  it('should validate metadata', async () => {
    const content = await scraper.getProblem('389632');

    expect(content.metadata.source).toBe('cheerio');
    expect(content.metadata.fetchedAt).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(content.metadata.cacheExpiresAt).toBeTruthy();
  });

  it('should handle 404 errors', async () => {
    await expect(scraper.getProblem('999999999'))
      .rejects.toThrow('NOT_FOUND');
  });

  it('should parse all required fields', async () => {
    const content = await scraper.getProblem('389632');

    expect(content.problemId).toBeTruthy();
    expect(content.title).toBeTruthy();
    expect(content.description).toBeTruthy();
    expect(content.level).toBeGreaterThanOrEqual(0);
    expect(content.category).toBeTruthy();
    expect(content.examples).toBeInstanceOf(Array);
  });

  it('should handle problems with no constraints', async () => {
    const content = await scraper.getProblem('340205');

    // 제한사항이 없어도 에러 없음
    expect(content).toBeDefined();
  });

  it('should parse examples with explanation', async () => {
    const content = await scraper.getProblem('389632');
    const example = content.examples[0];

    expect(example.input).toBeTruthy();
    expect(example.output).toBeTruthy();
  });
});
```

---

### 2.3. 캐싱 동작 테스트 (5개)

**파일**: `tests/integration/caching.test.ts`

```typescript
describe('Caching Behavior Integration', () => {
  let scraper: ProgrammersScraper;

  beforeAll(() => {
    scraper = new ProgrammersScraper();
  });

  afterEach(() => {
    scraper.clearCache();
  });

  it('should cache search results', async () => {
    const result1 = await scraper.searchProblems({ levels: [0] });
    const result2 = await scraper.searchProblems({ levels: [0] });

    expect(result1.metadata.fetchedAt).toBe(result2.metadata.fetchedAt);
  });

  it('should cache problem content', async () => {
    const content1 = await scraper.getProblem('389632');
    const content2 = await scraper.getProblem('389632');

    expect(content1.metadata.fetchedAt).toBe(content2.metadata.fetchedAt);
  });

  it('should respect cache TTL for search', async () => {
    await scraper.searchProblems({ levels: [0] });

    // 30분 경과 시뮬레이션
    scraper['cache'].clear(); // TTL 만료

    await scraper.searchProblems({ levels: [0] });
    // 새로 fetch됨
  });

  it('should respect cache TTL for problem', async () => {
    await scraper.getProblem('389632');

    // 30일 경과 시뮬레이션
    scraper['cache'].clear();

    await scraper.getProblem('389632');
    // 새로 fetch됨
  });

  it('should measure cache hit rate', async () => {
    // 10회 요청
    for (let i = 0; i < 10; i++) {
      await scraper.searchProblems({ levels: [0] });
    }

    const stats = scraper.getCacheStats();
    expect(stats.hitRate).toBeGreaterThan(0.8); // 80% 이상
  });
});
```

---

## 3. E2E 테스트 (End-to-End Tests) - 10개

### 3.1. MCP 도구 통합 테스트 (5개)

**파일**: `tests/e2e/mcp-tools.test.ts`

```typescript
describe('MCP Tools E2E', () => {
  it('should call search_programmers_problems', async () => {
    const result = await mcpClient.callTool('search_programmers_problems', {
      levels: [0],
      page: 1,
    });

    expect(result.type).toBe('text');
    const data = JSON.parse(result.text);
    expect(data.problems).toBeInstanceOf(Array);
  });

  it('should call get_programmers_problem', async () => {
    const result = await mcpClient.callTool('get_programmers_problem', {
      problemId: '389632',
    });

    expect(result.type).toBe('text');
    const data = JSON.parse(result.text);
    expect(data.title).toBeTruthy();
  });

  it('should validate Zod schema', async () => {
    await expect(mcpClient.callTool('search_programmers_problems', {
      levels: [99], // 유효하지 않은 레벨
    })).rejects.toThrow();
  });

  it('should complete full user flow', async () => {
    // 1. 검색
    const searchResult = await mcpClient.callTool('search_programmers_problems', {
      levels: [0],
    });
    const searchData = JSON.parse(searchResult.text);

    // 2. 문제 상세
    const problemId = searchData.problems[0].problemId;
    const problemResult = await mcpClient.callTool('get_programmers_problem', {
      problemId,
    });

    expect(problemResult).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const result = await mcpClient.callTool('get_programmers_problem', {
      problemId: 'invalid',
    });

    expect(result.type).toBe('text');
    expect(result.text).toContain('error');
  });
});
```

---

### 3.2. 성능 벤치마크 (3개)

**파일**: `tests/e2e/performance.test.ts`

```typescript
describe('Performance Benchmark', () => {
  it('should complete search within 5 seconds', async () => {
    const start = Date.now();
    await scraper.searchProblems({ levels: [0] });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });

  it('should complete problem fetch within 1 second', async () => {
    const start = Date.now();
    await scraper.getProblem('389632');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1000);
  });

  it('should handle 100 concurrent requests', async () => {
    const promises = Array(100).fill(null).map((_, i) =>
      scraper.getProblem(`${i}`)
    );

    const start = Date.now();
    await Promise.allSettled(promises);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(30000); // 30초 이내
  });
});
```

---

### 3.3. 메모리 누수 테스트 (2개)

**파일**: `tests/e2e/memory-leak.test.ts`

```typescript
describe('Memory Leak Detection', () => {
  it('should not leak memory after 1000 searches', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < 1000; i++) {
      await scraper.searchProblems({ levels: [0] });
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const increase = finalMemory - initialMemory;

    expect(increase).toBeLessThan(100 * 1024 * 1024); // 100MB 이내
  });

  it('should close browser instances properly', async () => {
    const scraper = new ProgrammersScraper();
    await scraper.searchProblems({ levels: [0] });
    await scraper.close();

    // 브라우저가 완전히 종료되어야 함
    expect(scraper['browserPool']['browsers'].length).toBe(0);
  });
});
```

---

## 4. 테스트 환경 설정 (Test Environment)

### 4.1. vitest.config.ts

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // Puppeteer는 느림
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['tests/**', 'dist/**'],
    },
  },
});
```

### 4.2. tests/setup.ts

```typescript
import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  // Puppeteer 설치 확인
  console.log('Checking Puppeteer installation...');
});

afterAll(async () => {
  // 브라우저 인스턴스 정리
  console.log('Cleaning up browser instances...');
});
```

---

## 5. 테스트 실행 계획 (Test Execution Plan)

### Day 1: 단위 테스트 (35개)
```bash
npm run test:unit -- tests/utils/browser-pool.test.ts
npm run test:unit -- tests/api/programmers-scraper-search.test.ts
npm run test:unit -- tests/api/programmers-scraper-problem.test.ts
npm run test:unit -- tests/utils/html-parser-programmers.test.ts
```

### Day 2: 통합 테스트 (25개)
```bash
npm run test:integration -- tests/integration/search-flow.test.ts
npm run test:integration -- tests/integration/problem-detail-flow.test.ts
npm run test:integration -- tests/integration/caching.test.ts
```

### Day 3: E2E 테스트 (10개)
```bash
npm run test:e2e -- tests/e2e/mcp-tools.test.ts
npm run test:e2e -- tests/e2e/performance.test.ts
npm run test:e2e -- tests/e2e/memory-leak.test.ts
```

---

## 6. 인수 조건 (Acceptance Criteria)

### 전체 테스트
- [ ] 단위 테스트 35개 이상 통과
- [ ] 통합 테스트 25개 이상 통과
- [ ] E2E 테스트 10개 이상 통과
- [ ] **총 70개 이상 테스트 통과**

### 커버리지
- [ ] 라인 커버리지 **80% 이상**
- [ ] 브랜치 커버리지 **75% 이상**
- [ ] 함수 커버리지 **85% 이상**

### 성능
- [ ] 검색 (Puppeteer): **평균 5초 이내**
- [ ] 문제 상세 (cheerio): **평균 1초 이내**
- [ ] 캐시 히트: **100ms 이내**

### 안정성
- [ ] 100회 연속 요청 성공률 **95% 이상**
- [ ] 메모리 누수 없음 (1000회 요청 후 **100MB 이내 증가**)
- [ ] Rate Limiting 동작 확인

---

## 7. 참고 자료 (References)

- [vitest 공식 문서](https://vitest.dev/)
- [Puppeteer Testing 가이드](https://pptr.dev/guides/testing)
- [구현 계획서](../01-planning/programmers-puppeteer-implementation.md)

---

**작성자**: qa-testing-agent
**검토자**: project-manager
**다음 단계**: Task 7.7 테스트 코드 작성 시작
