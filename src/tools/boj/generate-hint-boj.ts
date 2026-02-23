/**
 * generate_hint_boj MCP 도구
 *
 * BOJ 문제 힌트 가이드 생성 (SRP: 힌트만)
 */

import { z } from 'zod';
import type { ProblemAnalyzer } from '../../services/problem-analyzer.js';
import { ProblemNotFoundError } from '../../api/types.js';

/**
 * 입력 스키마
 */
export const GenerateHintBOJInputSchema = z.object({
  problem_id: z.number().int().positive()
    .describe('백준 문제 번호'),
});

export type GenerateHintBOJInput = z.infer<typeof GenerateHintBOJInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * generate-hint 도구 핸들러
 */
export function generateHintBOJTool(analyzer: ProblemAnalyzer) {
  return {
    name: 'generate_hint_boj',
    description: `백준(BOJ) 문제 힌트 생성. 3단계 가이드 프롬프트 제공.

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
   - 난이도 높은 문제(Gold 이상, level ≥ 11)는 메타데이터만으로 부족할 수 있음
   - fetch_problem_content로 실제 문제 본문 확인 후 힌트 생성 권장
   - 문제 본문을 보면 더 정확하고 맞춤형 힌트 제공 가능
   - 예: mcp-cli call algokit/fetch_problem_content '{"problem_id": 1234}'
   - 본문 확인은 권장사항이며 필수는 아님

**정답 정책**: 힌트만 기본 제공. 사용자가 "정답", "풀이", "코드" 명시 요청 시만 전체 풀이 제공.

⚠️ 플랫폼 판별: 문제 번호만 입력된 경우 대화 맥락에서 플랫폼을 파악하거나, 맥락이 없으면 반드시 BOJ/프로그래머스 중 어느 플랫폼인지 사용자에게 확인 후 호출하세요.`,
    inputSchema: GenerateHintBOJInputSchema,
    handler: async (input: GenerateHintBOJInput): Promise<TextContent> => {
      try {
        // 입력 검증
        const { problem_id } = GenerateHintBOJInputSchema.parse(input);

        // 힌트 가이드 생성 (유사 문제 제외)
        const result = await analyzer.analyze(problem_id, false);

        // JSON 문자열로 반환 (Claude Code가 파싱)
        return {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        };
      } catch (error) {
        // Zod 검증 에러
        if (error instanceof z.ZodError) {
          throw new Error(`입력 검증 실패: ${error.issues[0].message}`);
        }

        // ProblemNotFoundError
        if (error instanceof ProblemNotFoundError) {
          throw new Error(`문제를 찾을 수 없습니다: ${(input as GenerateHintBOJInput).problem_id}번`);
        }

        // 기타 에러
        throw error;
      }
    },
  };
}
