/**
 * search_problems 도구
 *
 * BOJ 문제를 티어, 태그, 키워드로 검색합니다.
 */

import { z } from 'zod';
import { SolvedAcClient } from '../../api/solvedac-client.js';
import { SearchParams } from '../../api/types.js';
import { getTierBadge, levelToTier, parseTierString } from '../../utils/tier-converter.js';

/**
 * 입력 스키마
 *
 * level_min/level_max는 숫자(1-30) 또는 티어 문자열(예: "실버 3", "Gold I") 모두 지원
 */
export const SearchProblemsInputSchema = z.object({
  query: z.string().optional().describe('검색 키워드 (제목, 번호, 태그 등)'),
  level_min: z
    .union([
      z.number().int().min(1).max(30),
      z.string().transform((val, ctx) => {
        // 숫자 문자열이면 숫자로 변환 (예: "16" → 16)
        const numVal = Number(val);
        if (!isNaN(numVal) && Number.isInteger(numVal)) {
          if (numVal < 1 || numVal > 30) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: '레벨은 1-30 사이여야 합니다.' });
            return z.NEVER;
          }
          return numVal;
        }
        // 티어 문자열 파싱 (예: "실버 3", "Gold I")
        try {
          return parseTierString(val);
        } catch (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: error instanceof Error ? error.message : '티어 파싱 실패',
          });
          return z.NEVER;
        }
      }),
    ])
    .optional()
    .describe('최소 난이도 (숫자 1-30 또는 "실버 3", "Gold I" 형식)'),
  level_max: z
    .union([
      z.number().int().min(1).max(30),
      z.string().transform((val, ctx) => {
        // 숫자 문자열이면 숫자로 변환 (예: "17" → 17)
        const numVal = Number(val);
        if (!isNaN(numVal) && Number.isInteger(numVal)) {
          if (numVal < 1 || numVal > 30) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: '레벨은 1-30 사이여야 합니다.' });
            return z.NEVER;
          }
          return numVal;
        }
        // 티어 문자열 파싱 (예: "실버 3", "Gold I")
        try {
          return parseTierString(val);
        } catch (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: error instanceof Error ? error.message : '티어 파싱 실패',
          });
          return z.NEVER;
        }
      }),
    ])
    .optional()
    .describe('최대 난이도 (숫자 1-30 또는 "실버 3", "Gold I" 형식)'),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('알고리즘 태그 (예: "dp" 또는 ["dp", "greedy", "bfs"])'),
  sort: z.enum(['level', 'id', 'average_try']).optional().describe('정렬 기준'),
  direction: z.enum(['asc', 'desc']).optional().describe('정렬 방향'),
  page: z.number().int().min(1).optional().default(1).describe('페이지 번호 (기본: 1)'),
});

export type SearchProblemsInput = z.infer<typeof SearchProblemsInputSchema>;

/**
 * 한글 태그명 추출
 */
function getKoreanTagName(tag: { key: string; displayNames: Array<{ language: string; name: string }> }): string {
  const korean = tag.displayNames.find(dn => dn.language === 'ko');
  return korean?.name || tag.key;
}

/**
 * 문제 검색 결과를 마크다운 테이블로 포맷팅
 */
function formatSearchResults(
  items: Array<{
    problemId: number;
    titleKo: string;
    level: number;
    tags: Array<{ key: string; displayNames: Array<{ language: string; name: string }> }>;
    acceptedUserCount: number;
    averageTries: number;
  }>,
  count: number,
  page: number
): string {
  if (items.length === 0) {
    return '검색 결과가 없습니다.';
  }

  let result = `# 문제 검색 결과\n\n`;
  result += `**총 ${count}개 문제** (${page}페이지)\n\n`;
  result += `| 번호 | 제목 | 난이도 | 태그 | 해결자 수 | 평균 시도 |\n`;
  result += `|------|------|--------|------|-----------|----------|\n`;

  for (const problem of items) {
    const tierBadge = getTierBadge(problem.level);
    const tags = problem.tags.slice(0, 3).map(getKoreanTagName).join(', ');
    const tagsDisplay = problem.tags.length > 3 ? `${tags}...` : tags;
    const bojLink = `https://www.acmicpc.net/problem/${problem.problemId}`;

    result += `| [${problem.problemId}](${bojLink}) | ${problem.titleKo} | ${tierBadge} | ${tagsDisplay} | ${problem.acceptedUserCount.toLocaleString()}명 | ${problem.averageTries.toFixed(1)}회 |\n`;
  }

  result += `\n---\n`;
  result += `💡 **팁**: 문제 번호를 클릭하면 BOJ 페이지로 이동합니다.\n`;

  return result;
}

/**
 * 문제 검색 도구 핸들러
 */
export async function searchProblems(input: SearchProblemsInput): Promise<string> {
  // 입력 검증
  if (input.level_min !== undefined && input.level_max !== undefined) {
    if (input.level_min > input.level_max) {
      throw new Error('level_min은 level_max보다 작거나 같아야 합니다.');
    }
  }

  const client = new SolvedAcClient();

  try {
    // API 호출
    const params: SearchParams = {
      query: input.query,
      level_min: input.level_min,
      level_max: input.level_max,
      tags: input.tags,
      sort: input.sort,
      direction: input.direction,
      page: input.page,
    };

    const result = await client.searchProblems(params);

    // 결과 포맷팅
    return formatSearchResults(result.items, result.count, input.page);
  } catch (error) {
    // 에러 메시지 포맷팅
    if (error instanceof Error) {
      throw new Error(`문제 검색 중 오류가 발생했습니다: ${error.message}`);
    }
    throw new Error('문제 검색 중 알 수 없는 오류가 발생했습니다.');
  }
}
