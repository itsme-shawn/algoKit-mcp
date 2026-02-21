/**
 * search_programmers_problems MCP 도구
 *
 * Phase 7 - Task 7.5: 프로그래머스 문제 검색 MCP 도구
 */

import { z } from 'zod';
import { ProgrammersScraper } from '../../api/programmers-scraper.js';
import type { ProgrammersSearchOptions, ProgrammersProblemSummary } from '../../types/programmers.js';

/**
 * 입력 스키마
 */
export const SearchProgrammersProblemsInputSchema = z.object({
  levels: z.array(z.number().int().min(0).max(5)).optional()
    .describe('난이도 레벨 배열 (0: 입문, 1-5: 레벨1-5). 예: [1, 2] - 레벨1, 2 문제'),
  order: z.enum(['recent', 'accuracy', 'popular']).optional()
    .describe('정렬 방식. recent: 최신순, accuracy: 정확도순, popular: 인기순 (기본값: recent)'),
  page: z.number().int().positive().optional()
    .describe('페이지 번호 (기본값: 1, 페이지당 20개 문제)'),
  limit: z.number().int().positive().max(20).optional()
    .describe('반환할 문제 개수 (최대 20개, 기본값: 20)'),
  query: z.string().optional()
    .describe('검색 키워드 (문제 제목으로 검색)'),
});

export type SearchProgrammersProblemsInput = z.infer<typeof SearchProgrammersProblemsInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * 프로그래머스 문제 검색 도구 핸들러
 *
 * @param args - 입력 인자
 * @returns 문제 목록 (마크다운 테이블 형식)
 * @throws {Error} 검증 실패 또는 스크래핑 실패 시
 */
export async function searchProgrammersProblems(args: unknown): Promise<TextContent> {
  try {
    // 1. 입력 검증
    const input = SearchProgrammersProblemsInputSchema.parse(args);

    // 2. 검색 옵션 구성
    const options: ProgrammersSearchOptions = {
      levels: input.levels,
      order: input.order || 'recent',
      page: input.page || 1,
      limit: input.limit || 20,
      query: input.query,
    };

    // 3. 프로그래머스 스크래핑
    const scraper = new ProgrammersScraper();
    const problems = await scraper.searchProblems(options);

    // 4. 결과가 없는 경우
    if (problems.length === 0) {
      return {
        type: 'text',
        text: '🔍 검색 결과가 없습니다.\n\n검색 조건을 변경해보세요.',
      };
    }

    // 5. 마크다운 테이블 생성
    const markdown = formatProblemsAsMarkdown(problems, options);

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
      throw new Error(`프로그래머스 검색 실패: ${error.message}`);
    }

    throw error;
  }
}

/**
 * 문제 목록을 마크다운 테이블로 포맷팅
 */
function formatProblemsAsMarkdown(
  problems: ProgrammersProblemSummary[],
  options: ProgrammersSearchOptions
): string {
  const lines: string[] = [];

  // 헤더
  lines.push('# 🔍 프로그래머스 문제 검색 결과\n');

  // 검색 조건 요약
  const conditions: string[] = [];
  if (options.levels && options.levels.length > 0) {
    conditions.push(`레벨 ${options.levels.join(', ')}`);
  }
  if (options.query) {
    conditions.push(`키워드 "${options.query}"`);
  }
  if (options.order) {
    const orderName = {
      recent: '최신순',
      accuracy: '정확도순',
      popular: '인기순',
    }[options.order];
    conditions.push(`정렬: ${orderName}`);
  }

  if (conditions.length > 0) {
    lines.push(`**검색 조건**: ${conditions.join(' | ')}\n`);
  }

  lines.push(`**결과**: ${problems.length}개 문제 (페이지 ${options.page || 1})\n`);

  // 테이블 헤더
  lines.push('| 번호 | 제목 | 레벨 | 카테고리 | 완료자 | 정답률 |');
  lines.push('|------|------|------|----------|--------|--------|');

  // 테이블 행
  for (const problem of problems) {
    const title = `[${problem.title}](${problem.url})`;
    const level = formatLevel(problem.level);
    const category = problem.category || '-';
    const finishedCount = problem.finishedCount
      ? problem.finishedCount.toLocaleString()
      : '-';
    const acceptanceRate = problem.acceptanceRate
      ? `${problem.acceptanceRate}%`
      : '-';

    lines.push(
      `| ${problem.problemId} | ${title} | ${level} | ${category} | ${finishedCount} | ${acceptanceRate} |`
    );
  }

  lines.push('');

  // 안내 메시지
  lines.push('---');
  lines.push('');
  lines.push('💡 **다음 단계**:');
  lines.push('- 문제를 선택하여 상세 정보 조회: `get_programmers_problem`');
  lines.push('- 문제 분석 및 힌트 생성: `analyze_programmers_problem` (구현 예정)');
  lines.push('');
  lines.push('⚠️ **참고**:');
  lines.push('- 프로그래머스는 페이지당 20개 문제를 반환합니다');
  lines.push('- 실제 프로그래머스 사이트에서 문제를 풀어야 합니다');

  return lines.join('\n');
}

/**
 * 레벨을 이모지와 텍스트로 포맷팅
 */
function formatLevel(level: number): string {
  const levelEmoji = {
    0: '🟢 입문',
    1: '🟢 Lv.1',
    2: '🟡 Lv.2',
    3: '🟠 Lv.3',
    4: '🔴 Lv.4',
    5: '🔴 Lv.5',
  };

  return levelEmoji[level as keyof typeof levelEmoji] || `Lv.${level}`;
}

/**
 * MCP 도구 정의
 */
export function searchProgrammersProblemsTool() {
  return {
    name: 'search_programmers_problems',
    description: `프로그래머스 문제를 검색합니다. 난이도, 정렬 방식, 키워드로 필터링할 수 있습니다.

**사용 예시**:
- 레벨 1 문제 검색: levels: [1]
- 레벨 1-2 문제 검색: levels: [1, 2]
- 최신 문제 검색: order: "recent"
- 정확도순 정렬: order: "accuracy"
- 키워드 검색: query: "동적계획법"
- 페이지 이동: page: 2

**제한사항**:
- Puppeteer 기반 스크래핑 (응답 시간 3-5초)
- 페이지당 20개 문제 반환
- 프로그래머스 레벨 체계: 0(입문), 1-5

**응답 형식**:
- 마크다운 테이블 (번호, 제목, 레벨, 카테고리, 완료자, 정답률)
- 문제 제목은 프로그래머스 링크로 제공

⚠️ **중요**: 프로그래머스는 JavaScript 렌더링이 필요하여 BOJ보다 느립니다 (3-5초).`,
    inputSchema: SearchProgrammersProblemsInputSchema,
    handler: searchProgrammersProblems,
  };
}
