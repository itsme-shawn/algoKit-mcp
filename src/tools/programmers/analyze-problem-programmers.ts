/**
 * analyze_problem_programmers MCP 도구
 *
 * 프로그래머스 문제 분석 및 구조화된 힌트 데이터 제공
 */

import { z } from 'zod';
import type { ProgrammersProblemAnalyzer } from '../../services/programmers-problem-analyzer.js';
import { ProgrammersScrapeError } from '../../api/programmers-scraper.js';
import { parseProgrammersUrl } from '../../utils/url-parser.js';

/**
 * 입력 스키마
 */
export const AnalyzeProblemProgrammersInputSchema = z.object({
  problem_id: z.union([z.string(), z.number()])
    .describe('프로그래머스 문제 ID 또는 URL'),
  include_similar: z.boolean().optional().default(true)
    .describe('유사 문제 추천 포함 여부'),
});

export type AnalyzeProblemProgrammersInput = z.infer<typeof AnalyzeProblemProgrammersInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * analyze_problem_programmers 도구 핸들러
 */
export function analyzeProblemProgrammersTool(analyzer: ProgrammersProblemAnalyzer) {
  return {
    name: 'analyze_problem_programmers',
    description: '프로그래머스 문제를 분석하여 구조화된 힌트 데이터를 제공합니다. 난이도 컨텍스트, 3단계 힌트 가이드 프롬프트를 포함합니다.',
    inputSchema: AnalyzeProblemProgrammersInputSchema,
    handler: async (input: AnalyzeProblemProgrammersInput): Promise<TextContent> => {
      try {
        const { problem_id, include_similar } = AnalyzeProblemProgrammersInputSchema.parse(input);

        const parsedId = parseProgrammersUrl(problem_id);
        if (!parsedId) {
          throw new Error(`유효하지 않은 프로그래머스 문제 ID 또는 URL: ${problem_id}`);
        }

        const analysis = await analyzer.analyze(parsedId, include_similar);

        return {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`입력 검증 실패: ${error.issues[0].message}`);
        }

        if (error instanceof ProgrammersScrapeError) {
          if (error.code === 'NAVIGATION_ERROR') {
            throw new Error(`문제를 찾을 수 없습니다: ${(input as AnalyzeProblemProgrammersInput).problem_id}`);
          }
        }

        throw error;
      }
    },
  };
}
