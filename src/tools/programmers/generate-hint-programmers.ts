/**
 * generate_hint_programmers MCP 도구
 *
 * 프로그래머스 문제 힌트 가이드 생성 (SRP: 힌트만)
 */

import { z } from 'zod';
import type { ProgrammersProblemAnalyzer } from '../../services/programmers-problem-analyzer.js';
import { ProgrammersScrapeError } from '../../api/programmers-scraper.js';
import { parseProgrammersUrl } from '../../utils/url-parser.js';

/**
 * 입력 스키마
 */
export const GenerateHintProgrammersInputSchema = z.object({
  problem_id: z.union([z.string(), z.number()])
    .describe('프로그래머스 문제 ID 또는 URL'),
});

export type GenerateHintProgrammersInput = z.infer<typeof GenerateHintProgrammersInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * generate_hint_programmers 도구 핸들러
 */
export function generateHintProgrammersTool(analyzer: ProgrammersProblemAnalyzer) {
  return {
    name: 'generate_hint_programmers',
    description: `프로그래머스 문제 힌트 생성. 3단계 가이드 프롬프트 제공.

🎯 **핵심: 한 번에 1개 레벨 힌트만 제공. 1,2,3 단계를 동시에 제시하지 마세요.**

📋 응답에 포함된 정보:
- hint_levels[0]: Level 1 - 문제 분석 (처음 시도)
- hint_levels[1]: Level 2 - 핵심 아이디어 (부분 구현)
- hint_levels[2]: Level 3 - 상세 풀이 (거의 완성)

🤖 **사용자 상황 판단 → 적절한 1개 레벨만 제시**:

1️⃣ Level 1 제시 (처음/막힐 때):
   "사용자가 코드 없거나 어디서부터 시작해야 할지 모를 때"
   → hint_levels[0].prompt로 문제 접근법 제시

2️⃣ Level 2 제시 (다시 요청하거나 부분 구현 언급):
   "사용자가 '더 필요해', '더 자세히' 요청하거나, 이미 코드를 시작했다고 언급"
   → hint_levels[1].prompt로 핵심 로직 제시

3️⃣ Level 3 제시 (상세 풀이 명시 요청):
   "사용자가 '정답', '풀이', '코드' 등 최종 답변 요청"
   → hint_levels[2].prompt로 상세 구현 가이드 제시

📖 **[권장] 어려운 문제는 본문 먼저 확인**:
   - 난이도 높은 문제(Lv. 3 이상)는 메타데이터만으로 부족할 수 있음
   - fetch_problem_content_programmers로 실제 문제 본문 확인 후 힌트 생성 권장

**정답 정책**: 힌트만 기본 제공. 사용자가 "정답", "풀이", "코드" 명시 요청 시만 전체 풀이 제공.`,
    inputSchema: GenerateHintProgrammersInputSchema,
    handler: async (input: GenerateHintProgrammersInput): Promise<TextContent> => {
      try {
        const { problem_id } = GenerateHintProgrammersInputSchema.parse(input);

        const parsedId = parseProgrammersUrl(problem_id);
        if (!parsedId) {
          throw new Error(`유효하지 않은 프로그래머스 문제 ID 또는 URL: ${problem_id}`);
        }

        const result = await analyzer.analyze(parsedId, false);

        return {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`입력 검증 실패: ${error.issues[0].message}`);
        }

        if (error instanceof ProgrammersScrapeError) {
          if (error.code === 'NAVIGATION_ERROR') {
            throw new Error(`문제를 찾을 수 없습니다: ${(input as GenerateHintProgrammersInput).problem_id}`);
          }
        }

        throw error;
      }
    },
  };
}
