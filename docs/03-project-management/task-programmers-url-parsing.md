# Task: 프로그래머스 URL 파싱 및 문제 상세 조회 도구 구현

**Task ID**: Task 7.9
**Phase**: Phase 7 (프로그래머스 통합)
**우선순위**: P1 (높음)
**예상 소요**: 2일
**작성일**: 2026-02-16
**담당**: fullstack-developer

---

## 📋 요구사항

**사용자 요청**:
> 프로그래머스 URL의 끝번호를 문제번호로 인식해서 보여주는 기능을 구현해주세요.

**URL 형식**: `https://school.programmers.co.kr/learn/courses/30/lessons/{문제번호}`

**예시**:
- URL: `https://school.programmers.co.kr/learn/courses/30/lessons/42748`
- 추출할 문제번호: `42748`

**현재 상태**:
- ✅ `search_programmers_problems` 도구: 검색 기능 구현됨 (Puppeteer)
- ❌ 문제 상세 조회 도구 없음 (Task 7.3 미구현)

---

## 🎯 목표

**핵심 기능**:
1. URL 파싱: 프로그래머스 URL에서 문제번호 추출
2. 문제 조회: 문제번호로 상세 정보 가져오기
3. MCP 통합: `get_programmers_problem` 도구 구현

**입력 형식 지원**:
- URL: `https://school.programmers.co.kr/learn/courses/30/lessons/42748`
- 숫자: `42748`
- 문자열 숫자: `"42748"`

---

## 🏗️ 구현 계획

### Day 1: URL 파싱 및 스크래핑 로직 (4시간)

#### 1.1. URL 파싱 유틸리티 (1시간)

**파일**: `src/utils/url-parser.ts`

**구현 내용**:
```typescript
/**
 * 프로그래머스 URL 파싱
 *
 * @param input - URL 또는 문제번호
 * @returns 문제번호 또는 null
 */
export function parseProgrammersUrl(input: string | number): string | null {
  // 1. 숫자면 문자열로 변환 후 반환
  if (typeof input === 'number') {
    return input.toString();
  }

  // 2. 이미 숫자 문자열이면 반환
  if (/^\d+$/.test(input)) {
    return input;
  }

  // 3. URL 파싱
  const urlPattern = /\/lessons\/(\d+)/;
  const match = input.match(urlPattern);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}
```

**검증 케이스**:
- ✅ 전체 URL: `https://school.programmers.co.kr/learn/courses/30/lessons/42748`
- ✅ 상대 경로: `/learn/courses/30/lessons/42748`
- ✅ 숫자: `42748`
- ✅ 숫자 문자열: `"42748"`
- ❌ 잘못된 URL: `https://programmers.co.kr/invalid`

#### 1.2. ProgrammersScraper.getProblem() 메서드 (3시간)

**파일**: `src/api/programmers-scraper.ts`

**구현 내용**:
```typescript
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * 문제 상세 정보 가져오기
 *
 * @param problemId 문제 ID
 * @returns 문제 상세 정보
 * @throws {ProgrammersScrapeError}
 */
async getProblem(problemId: string): Promise<ProgrammersProblemDetail> {
  // Rate limiting
  await this.rateLimiter.acquire();

  const url = `${this.baseUrl}/learn/courses/30/lessons/${problemId}`;

  try {
    // fetch로 HTML 가져오기 (BOJScraper 패턴)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new ProgrammersScrapeError(
          `문제를 찾을 수 없습니다: ${problemId}`,
          'NOT_FOUND'
        );
      }
      throw new ProgrammersScrapeError(
        `HTTP ${response.status}: ${url}`,
        'NETWORK_ERROR'
      );
    }

    const html = await response.text();

    // cheerio로 파싱
    const $ = cheerio.load(html);

    // 제목
    const title = $('h3.guide-section-title').first().text().trim();

    // 난이도 (Lv. 0-5)
    const levelText = $('span.level-badge').text().trim();
    const level = parseInt(levelText.match(/Lv\. (\d)/)?.[1] || '0');

    // 카테고리
    const category = $('h5.guide-section-description').first().text().trim();

    // 문제 설명
    const description = $('.guide-section-description').html() || '';

    // 제한사항
    const constraints: string[] = [];
    $('.guide-section ul li').each((_, el) => {
      constraints.push($(el).text().trim());
    });

    // 입출력 예제
    const examples: ProgrammersExample[] = [];
    $('table.test-cases tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      examples.push({
        input: $(cells[0]).text().trim(),
        output: $(cells[1]).text().trim(),
      });
    });

    return {
      problemId,
      title,
      level,
      category,
      description,
      constraints,
      examples,
      tags: [], // 프로그래머스는 태그 제공 안함
    };
  } catch (error) {
    if (error instanceof ProgrammersScrapeError) {
      throw error;
    }
    throw new ProgrammersScrapeError(
      `문제 조회 실패: ${problemId}`,
      'PARSE_ERROR',
      error
    );
  }
}
```

**캐싱 전략**:
- TTL: 30일 (문제 본문은 잘 바뀌지 않음)
- 최대 100개 (LRU)

---

### Day 2: MCP 도구 및 테스트 (4시간)

#### 2.1. MCP 도구 구현 (2시간)

**파일**: `src/tools/get-programmers-problem.ts`

**구현 내용**:
```typescript
import { z } from 'zod';
import { ProgrammersScraper } from '../api/programmers-scraper.js';
import { parseProgrammersUrl } from '../utils/url-parser.js';

/**
 * 입력 스키마
 */
export const GetProgrammersProblemInputSchema = z.object({
  problem_id: z.union([z.string(), z.number()])
    .describe('문제 ID 또는 프로그래머스 URL. 예: 42748 또는 https://school.programmers.co.kr/learn/courses/30/lessons/42748'),
});

export type GetProgrammersProblemInput = z.infer<typeof GetProgrammersProblemInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * 프로그래머스 문제 상세 조회 도구 핸들러
 */
export async function getProgrammersProblem(args: unknown): Promise<TextContent> {
  try {
    // 1. 입력 검증
    const input = GetProgrammersProblemInputSchema.parse(args);

    // 2. URL 파싱 (URL 또는 숫자 모두 지원)
    const problemId = parseProgrammersUrl(input.problem_id);

    if (!problemId) {
      throw new Error(`유효하지 않은 문제 ID 또는 URL: ${input.problem_id}`);
    }

    // 3. 문제 조회
    const scraper = new ProgrammersScraper();
    const problem = await scraper.getProblem(problemId);

    // 4. 마크다운 포맷팅
    const markdown = formatProblemAsMarkdown(problem);

    return {
      type: 'text',
      text: markdown,
    };
  } catch (error) {
    // Zod 검증 에러
    if (error instanceof z.ZodError) {
      throw new Error(`입력 검증 실패: ${error.issues[0].message}`);
    }

    // 기타 에러
    if (error instanceof Error) {
      throw new Error(`프로그래머스 문제 조회 실패: ${error.message}`);
    }

    throw error;
  }
}

/**
 * 문제를 마크다운으로 포맷팅
 */
function formatProblemAsMarkdown(problem: ProgrammersProblemDetail): string {
  const lines: string[] = [];

  // 헤더
  lines.push(`# ${problem.title}\n`);
  lines.push(`**레벨**: ${formatLevel(problem.level)} | **카테고리**: ${problem.category}\n`);
  lines.push(`**문제 ID**: ${problem.problemId}\n`);
  lines.push(`**URL**: https://school.programmers.co.kr/learn/courses/30/lessons/${problem.problemId}\n`);
  lines.push('---\n');

  // 문제 설명
  lines.push('## 문제 설명\n');
  lines.push(problem.description);
  lines.push('\n');

  // 제한사항
  if (problem.constraints.length > 0) {
    lines.push('## 제한사항\n');
    problem.constraints.forEach(c => {
      lines.push(`- ${c}`);
    });
    lines.push('\n');
  }

  // 입출력 예제
  if (problem.examples.length > 0) {
    lines.push('## 입출력 예\n');
    lines.push('| 입력 | 출력 |');
    lines.push('|------|------|');
    problem.examples.forEach(ex => {
      lines.push(`| ${ex.input} | ${ex.output} |`);
    });
    lines.push('\n');
  }

  // 안내
  lines.push('---');
  lines.push('');
  lines.push('💡 **다음 단계**:');
  lines.push('- 문제 분석: `analyze_programmers_problem` (구현 예정)');
  lines.push('- 코드 제출 분석: `analyze_code_submission` (BOJ만 지원)');
  lines.push('');
  lines.push('⚠️ **참고**: 프로그래머스 사이트에서 직접 문제를 풀어야 합니다.');

  return lines.join('\n');
}

/**
 * 레벨 포맷팅
 */
function formatLevel(level: number): string {
  const levelEmoji = {
    0: '🟢 Lv. 0 (입문)',
    1: '🟢 Lv. 1',
    2: '🟡 Lv. 2',
    3: '🟠 Lv. 3',
    4: '🔴 Lv. 4',
    5: '🔴 Lv. 5',
  };

  return levelEmoji[level as keyof typeof levelEmoji] || `Lv. ${level}`;
}

/**
 * MCP 도구 정의
 */
export function getProgrammersProblemTool() {
  return {
    name: 'get_programmers_problem',
    description: `프로그래머스 문제 상세 정보를 조회합니다. URL 또는 문제 ID로 조회 가능합니다.

**입력 형식**:
- URL: https://school.programmers.co.kr/learn/courses/30/lessons/42748
- 문제 ID (숫자): 42748
- 문제 ID (문자열): "42748"

**응답 형식**:
- 문제 제목, 난이도, 카테고리
- 문제 설명 (HTML)
- 제한사항 (배열)
- 입출력 예제 (테이블)

**제약사항**:
- cheerio 기반 스크래핑 (응답 시간 500ms-1초)
- Rate Limiting (초당 5회)
- 캐싱 (TTL 30일)

⚠️ **중요**: 프로그래머스는 실제 사이트에서 문제를 풀어야 합니다.`,
    inputSchema: GetProgrammersProblemInputSchema,
    handler: getProgrammersProblem,
  };
}
```

#### 2.2. index.ts 통합 (30분)

**파일**: `src/index.ts`

**변경 내용**:
```typescript
// 도구 임포트 추가
import {
  getProgrammersProblemTool,
  GetProgrammersProblemInputSchema,
} from './tools/get-programmers-problem.js';

// 도구 객체 생성
const getProgrammersProblemToolObj = getProgrammersProblemTool();

// ListToolsRequestSchema 핸들러에 추가
tools: [
  // ... 기존 도구들
  {
    name: getProgrammersProblemToolObj.name,
    description: getProgrammersProblemToolObj.description,
    inputSchema: zodToJsonSchema(GetProgrammersProblemInputSchema),
  },
]

// CallToolRequestSchema 핸들러에 case 추가
case 'get_programmers_problem':
  return {
    content: [
      await getProgrammersProblemToolObj.handler(request.params.arguments ?? {})
    ],
  };
```

#### 2.3. 테스트 작성 (1.5시간)

**테스트 파일**:

**1. `tests/utils/url-parser.test.ts` (10개 테스트)**
```typescript
import { describe, it, expect } from 'vitest';
import { parseProgrammersUrl } from '../../src/utils/url-parser.js';

describe('parseProgrammersUrl', () => {
  it('전체 URL 파싱', () => {
    const result = parseProgrammersUrl('https://school.programmers.co.kr/learn/courses/30/lessons/42748');
    expect(result).toBe('42748');
  });

  it('상대 경로 파싱', () => {
    const result = parseProgrammersUrl('/learn/courses/30/lessons/42748');
    expect(result).toBe('42748');
  });

  it('숫자 입력', () => {
    const result = parseProgrammersUrl(42748);
    expect(result).toBe('42748');
  });

  it('숫자 문자열 입력', () => {
    const result = parseProgrammersUrl('42748');
    expect(result).toBe('42748');
  });

  it('잘못된 URL 형식', () => {
    const result = parseProgrammersUrl('https://programmers.co.kr/invalid');
    expect(result).toBeNull();
  });

  // ... 5개 추가 테스트
});
```

**2. `tests/api/programmers-scraper-detail.test.ts` (15개 테스트)**
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { ProgrammersScraper } from '../../src/api/programmers-scraper.js';

describe('ProgrammersScraper.getProblem', () => {
  let scraper: ProgrammersScraper;

  beforeAll(() => {
    scraper = new ProgrammersScraper();
  });

  it('유효한 문제 ID로 조회', async () => {
    const problem = await scraper.getProblem('42748');

    expect(problem.problemId).toBe('42748');
    expect(problem.title).toBeTruthy();
    expect(problem.level).toBeGreaterThanOrEqual(0);
    expect(problem.level).toBeLessThanOrEqual(5);
  });

  it('모든 필드 존재 확인', async () => {
    const problem = await scraper.getProblem('42748');

    expect(problem.title).toBeTruthy();
    expect(problem.category).toBeTruthy();
    expect(problem.description).toBeTruthy();
    expect(Array.isArray(problem.constraints)).toBe(true);
    expect(Array.isArray(problem.examples)).toBe(true);
  });

  it('존재하지 않는 문제 ID', async () => {
    await expect(scraper.getProblem('999999')).rejects.toThrow('NOT_FOUND');
  });

  // ... 12개 추가 테스트
});
```

**3. `tests/tools/get-programmers-problem.test.ts` (10개 테스트)**
```typescript
import { describe, it, expect } from 'vitest';
import { getProgrammersProblem } from '../../src/tools/get-programmers-problem.js';

describe('getProgrammersProblem', () => {
  it('URL 입력으로 문제 조회', async () => {
    const result = await getProgrammersProblem({
      problem_id: 'https://school.programmers.co.kr/learn/courses/30/lessons/42748',
    });

    expect(result.type).toBe('text');
    expect(result.text).toContain('42748');
    expect(result.text).toContain('문제 설명');
  });

  it('숫자 입력으로 문제 조회', async () => {
    const result = await getProgrammersProblem({
      problem_id: 42748,
    });

    expect(result.type).toBe('text');
    expect(result.text).toContain('42748');
  });

  it('잘못된 URL 입력', async () => {
    await expect(getProgrammersProblem({
      problem_id: 'https://invalid-url.com',
    })).rejects.toThrow('유효하지 않은 문제 ID 또는 URL');
  });

  // ... 7개 추가 테스트
});
```

---

## ✅ 인수 조건 (Acceptance Criteria)

### 기능 요구사항
- [ ] URL 파싱 함수가 모든 입력 형식 지원 (URL, 숫자, 문자열)
- [ ] getProblem() 메서드가 모든 필드 파싱 (제목, 레벨, 카테고리, 설명, 제한사항, 예제)
- [ ] MCP 도구가 URL과 숫자 입력 모두 지원
- [ ] 존재하지 않는 문제 ID 에러 처리 (404)
- [ ] 마크다운 포맷팅 적용

### 성능 요구사항
- [ ] getProblem() 응답 시간 1초 이내 (최초 요청)
- [ ] 캐시 히트 시 응답 시간 50ms 이내
- [ ] Rate Limiting 정상 동작 (초당 5회)

### 테스트 요구사항
- [ ] 단위 테스트 35개 이상 통과
- [ ] 통합 테스트 10개 이상 통과
- [ ] 테스트 커버리지 80% 이상

### 문서 요구사항
- [ ] `docs/02-development/TOOLS.md` 업데이트
- [ ] `CLAUDE.md` 프로그래머스 지원 명시
- [ ] 이 문서 (`task-programmers-url-parsing.md`) 완료 표시

---

## 🔧 기술 세부사항

### 의존성
```json
{
  "dependencies": {
    "cheerio": "^1.0.0-rc.12",
    "node-fetch": "^3.3.2"
  }
}
```

### CSS Selector 참고
**문제 상세 페이지**:
- 제목: `h3.guide-section-title`
- 난이도: `span.level-badge`
- 카테고리: `h5.guide-section-description`
- 문제 설명: `.guide-section-description` (HTML)
- 제한사항: `.guide-section ul li`
- 입출력 예제: `table.test-cases tbody tr td`

**주의**: CSS 클래스명은 변경될 수 있음 → 주기적 파서 업데이트 필요

### Rate Limiting 설정
```typescript
new RateLimiter({
  capacity: 10,        // 버킷 용량
  refillRate: 5,       // 초당 5회 (문제 상세는 검색보다 빈번)
})
```

### 캐싱 설정
```typescript
LRUCache.set(cacheKey, problemDetail, {
  ttl: 30 * 24 * 60 * 60 * 1000,  // 30일
  maxSize: 100,                     // 최대 100개
});
```

---

## 📊 예상 산출물

| 파일 | 줄 수 | 설명 |
|------|-------|------|
| `src/utils/url-parser.ts` | 40줄 | URL 파싱 함수 |
| `src/api/programmers-scraper.ts` | +150줄 | getProblem() 메서드 추가 |
| `src/tools/get-programmers-problem.ts` | 180줄 | MCP 도구 |
| `tests/utils/url-parser.test.ts` | 80줄 | 10개 테스트 |
| `tests/api/programmers-scraper-detail.test.ts` | 120줄 | 15개 테스트 |
| `tests/tools/get-programmers-problem.test.ts` | 100줄 | 10개 테스트 |
| **총계** | **670줄** | **35개 테스트** |

---

## 🚧 리스크 및 대응 방안

### 기술적 리스크

| 리스크 | 발생 가능성 | 영향도 | 대응 방안 |
|--------|-------------|--------|----------|
| **HTML 구조 변경** | 🟡 중간 | 🔴 높음 | CSS Selector 테스트 자동화, 알림 시스템 |
| **Rate Limiting 초과** | 🟢 낮음 | 🟡 중간 | 보수적 Rate Limit (초당 5회), 캐싱 |
| **프로그래머스 차단** | 🟢 낮음 | 🔴 높음 | User-Agent 설정, robots.txt 준수 |

### 대응 전략
1. **파서 안정성**: CSS Selector 변경 시 즉시 테스트 실패 → 알림
2. **캐싱**: 30일 TTL로 반복 요청 최소화
3. **Rate Limiting**: 보수적으로 초당 5회 제한
4. **에러 로깅**: 파싱 실패 시 스크린샷 저장 (디버깅용)

---

## 📚 참고 자료

### 관련 코드
- `src/api/boj-scraper.ts`: cheerio 기반 스크래핑 패턴
- `src/api/programmers-scraper.ts`: Puppeteer 기반 검색 구현
- `src/tools/fetch-problem-content.ts`: BOJ 문제 본문 스크래핑

### 관련 문서
- `docs/01-planning/programmers-analysis.md`: 프로그래머스 통합 계획
- `docs/02-development/web-scraping-guide.md`: 윤리적 스크래핑 가이드
- `docs/03-project-management/tasks.md`: Phase 7 태스크 목록

### 외부 자료
- [cheerio 공식 문서](https://cheerio.js.org/)
- [프로그래머스 robots.txt](https://programmers.co.kr/robots.txt)
- [웹 스크래핑 Best Practices](https://www.scrapehero.com/best-practices/)

---

## 📝 변경 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|----------|
| 2026-02-16 | project-manager | 최초 작성 (사용자 요청 기반) |

---

**작성자**: project-manager
**검토자**: fullstack-developer (구현 담당)
**다음 단계**: fullstack-developer에게 작업 위임 → 구현 시작
