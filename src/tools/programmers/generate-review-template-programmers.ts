/**
 * generate_review_template_programmers MCP 도구
 *
 * 프로그래머스 복습 템플릿 및 가이드 제공
 */

import { z } from 'zod';
import type { ProgrammersReviewTemplateGenerator } from '../../services/programmers-review-template-generator.js';
import { ProgrammersScrapeError } from '../../api/programmers-scraper.js';
import { parseProgrammersUrl } from '../../utils/url-parser.js';

/**
 * 입력 스키마
 */
export const GenerateReviewTemplateProgrammersInputSchema = z.object({
  problem_id: z.union([z.string(), z.number()])
    .describe('프로그래머스 문제 ID 또는 URL'),
  user_notes: z.string().optional()
    .describe('사용자가 미리 작성한 메모 (선택)'),
});

export type GenerateReviewTemplateProgrammersInput = z.infer<typeof GenerateReviewTemplateProgrammersInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * generate_review_template_programmers 도구 핸들러
 */
export function generateReviewTemplateProgrammersTool(generator: ProgrammersReviewTemplateGenerator) {
  return {
    name: 'generate_review_template_programmers',
    description: '프로그래머스 문제에 대한 복기용 가이드를 제공합니다. 마크다운 템플릿, 문제 분석, 작성 프롬프트를 포함합니다.',
    inputSchema: GenerateReviewTemplateProgrammersInputSchema,
    handler: async (input: GenerateReviewTemplateProgrammersInput): Promise<TextContent> => {
      try {
        const { problem_id, user_notes } = GenerateReviewTemplateProgrammersInputSchema.parse(input);

        const parsedId = parseProgrammersUrl(problem_id);
        if (!parsedId) {
          throw new Error(`유효하지 않은 프로그래머스 문제 ID 또는 URL: ${problem_id}`);
        }

        const template = await generator.generate(parsedId, user_notes);

        return {
          type: 'text',
          text: JSON.stringify(template, null, 2),
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`입력 검증 실패: ${error.issues[0].message}`);
        }

        if (error instanceof ProgrammersScrapeError) {
          if (error.code === 'NAVIGATION_ERROR') {
            throw new Error(`문제를 찾을 수 없습니다: ${(input as GenerateReviewTemplateProgrammersInput).problem_id}`);
          }
        }

        throw error;
      }
    },
  };
}
