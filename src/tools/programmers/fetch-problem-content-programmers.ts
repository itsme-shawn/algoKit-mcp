/**
 * fetch_problem_content_programmers MCP 도구
 *
 * 프로그래머스 문제 본문을 ProblemContent 형태로 반환
 */

import { z } from 'zod';
import type { ProgrammersScraper } from '../../api/programmers-scraper.js';
import { ProgrammersScrapeError } from '../../api/programmers-scraper.js';
import { parseProgrammersUrl } from '../../utils/url-parser.js';
import { programmersToProblemContent } from '../../utils/programmers-converter.js';

/**
 * 입력 스키마
 */
export const FetchProblemContentProgrammersInputSchema = z.object({
  problem_id: z.union([z.string(), z.number()])
    .describe('프로그래머스 문제 ID 또는 URL'),
});

export type FetchProblemContentProgrammersInput = z.infer<typeof FetchProblemContentProgrammersInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * fetch_problem_content_programmers 핸들러 (재사용 가능)
 */
export async function handleFetchProblemContentProgrammers(
  args: unknown,
  scraper: ProgrammersScraper,
): Promise<TextContent> {
  try {
    const { problem_id } = FetchProblemContentProgrammersInputSchema.parse(args);

    const parsedId = parseProgrammersUrl(problem_id);
    if (!parsedId) {
      throw new Error(`유효하지 않은 프로그래머스 문제 ID 또는 URL: ${problem_id}`);
    }

    const detail = await scraper.getProblem(parsedId);
    const content = programmersToProblemContent(detail);

    return {
      type: 'text',
      text: JSON.stringify(content, null, 2),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`입력 검증 실패: ${error.issues[0].message}`);
    }

    if (error instanceof ProgrammersScrapeError) {
      if (error.code === 'NAVIGATION_ERROR') {
        throw new Error(`문제를 찾을 수 없습니다: ${(args as FetchProblemContentProgrammersInput).problem_id}`);
      }
      if (error.code === 'TIMEOUT') {
        throw new Error(`요청이 타임아웃되었습니다: ${(args as FetchProblemContentProgrammersInput).problem_id}`);
      }
    }

    throw error;
  }
}

/**
 * fetch_problem_content_programmers 도구 핸들러
 */
export function fetchProblemContentProgrammersTool(scraper: ProgrammersScraper) {
  return {
    name: 'fetch_problem_content_programmers',
    description: `프로그래머스 문제 본문 스크래핑.

프로그래머스 페이지에서 문제 제목, 설명, 제한사항, 입출력 예시를 가져옵니다.

응답 구조: problemId, title, description, inputFormat, outputFormat, examples, limits, metadata

**사용 시나리오**:
- 문제 풀이 전 문제 본문 확인
- 코드 분석 시 문제 요구사항 비교

**제한사항**:
- 스크래핑 대상: https://school.programmers.co.kr/learn/courses/30/lessons/{problem_id}
- 타임아웃: 10초
- 재시도: 최대 2회
- 캐시: 30일`,
    inputSchema: FetchProblemContentProgrammersInputSchema,
    handler: (input: FetchProblemContentProgrammersInput) =>
      handleFetchProblemContentProgrammers(input, scraper),
  };
}
