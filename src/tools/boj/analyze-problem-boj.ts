/**
 * analyze_problem_boj MCP 도구
 *
 * BOJ 문제 분석 및 구조화된 힌트 데이터 제공 (Keyless Architecture)
 */

import { z } from 'zod';
import type { ProblemAnalyzer } from '../../services/problem-analyzer.js';
import { ProblemNotFoundError } from '../../api/types.js';

/**
 * 입력 스키마
 */
export const AnalyzeProblemBOJInputSchema = z.object({
  problem_id: z.number().int().positive()
    .describe('백준 문제 번호'),
  include_similar: z.boolean().optional().default(true)
    .describe('유사 문제 추천 포함 여부'),
});

export type AnalyzeProblemBOJInput = z.infer<typeof AnalyzeProblemBOJInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * analyze_problem_boj 도구 핸들러
 */
export function analyzeProblemBOJTool(analyzer: ProblemAnalyzer) {
  return {
    name: 'analyze_problem_boj',
    description: '백준(BOJ) 문제를 분석하여 구조화된 힌트 데이터를 제공합니다. 알고리즘 패턴, 난이도 컨텍스트, 3단계 힌트 포인트, 유사 문제 추천을 포함합니다.\n\n⚠️ 플랫폼 판별: 문제 번호만 입력된 경우 대화 맥락에서 플랫폼을 파악하거나, 맥락이 없으면 반드시 BOJ/프로그래머스 중 어느 플랫폼인지 사용자에게 확인 후 호출하세요.',
    inputSchema: AnalyzeProblemBOJInputSchema,
    handler: async (input: AnalyzeProblemBOJInput): Promise<TextContent> => {
      try {
        // 입력 검증
        const { problem_id, include_similar } = AnalyzeProblemBOJInputSchema.parse(input);

        // 문제 분석
        const analysis = await analyzer.analyze(problem_id, include_similar);

        // JSON 문자열로 반환 (Claude Code가 파싱)
        return {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        };
      } catch (error) {
        // Zod 검증 에러
        if (error instanceof z.ZodError) {
          throw new Error(`입력 검증 실패: ${error.issues[0].message}`);
        }

        // ProblemNotFoundError
        if (error instanceof ProblemNotFoundError) {
          throw new Error(`문제를 찾을 수 없습니다: ${(input as AnalyzeProblemBOJInput).problem_id}번`);
        }

        // 기타 에러
        throw error;
      }
    },
  };
}
