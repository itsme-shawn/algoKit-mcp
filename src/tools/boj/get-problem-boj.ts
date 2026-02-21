/**
 * get_problem 도구
 *
 * 특정 BOJ 문제의 상세 정보를 조회합니다.
 */

import { z } from 'zod';
import { SolvedAcClient } from '../../api/solvedac-client.js';
import { Problem, ProblemNotFoundError } from '../../api/types.js';
import { getTierBadge, levelToTier } from '../../utils/tier-converter.js';

/**
 * 입력 스키마
 */
export const GetProblemInputSchema = z.object({
  problem_id: z.number().int().positive().describe('BOJ 문제 번호 (양의 정수)'),
});

export type GetProblemInput = z.infer<typeof GetProblemInputSchema>;

/**
 * 한글 태그명 추출 (우선순위: 한글 > 영어 > 키)
 */
function getKoreanTagName(tag: {
  key: string;
  displayNames: Array<{ language: string; name: string }>;
}): string {
  const korean = tag.displayNames.find(dn => dn.language === 'ko');
  if (korean) return korean.name;

  const english = tag.displayNames.find(dn => dn.language === 'en');
  if (english) return english.name;

  return tag.key;
}

/**
 * 문제 상세 정보를 마크다운으로 포맷팅
 */
function formatProblemDetail(problem: Problem): string {
  const tierBadge = getTierBadge(problem.level);
  const tierName = levelToTier(problem.level);
  const bojLink = `https://www.acmicpc.net/problem/${problem.problemId}`;

  let result = `# [${problem.problemId}] ${problem.titleKo}\n\n`;

  // 기본 정보
  result += `## 📋 기본 정보\n\n`;
  result += `- **문제 번호**: ${problem.problemId}\n`;
  result += `- **제목**: ${problem.titleKo}\n`;
  result += `- **난이도**: ${tierBadge} (레벨 ${problem.level})\n`;
  result += `- **링크**: [BOJ ${problem.problemId}](${bojLink})\n\n`;

  // 태그
  if (problem.tags.length > 0) {
    result += `## 🏷️ 알고리즘 태그\n\n`;
    const tagList = problem.tags.map(tag => {
      const koreanName = getKoreanTagName(tag);
      return `- **${koreanName}** (\`${tag.key}\`)`;
    }).join('\n');
    result += `${tagList}\n\n`;
  }

  // 통계
  result += `## 📊 통계\n\n`;
  result += `- **해결한 사용자**: ${problem.acceptedUserCount.toLocaleString()}명\n`;
  result += `- **평균 시도 횟수**: ${problem.averageTries.toFixed(1)}회\n`;

  // 풀이 가능 여부
  if (problem.isSolvable !== undefined) {
    result += `- **풀이 가능**: ${problem.isSolvable ? '✅ 예' : '❌ 아니오'}\n`;
  }
  if (problem.isPartial !== undefined) {
    result += `- **부분 점수**: ${problem.isPartial ? '✅ 있음' : '❌ 없음'}\n`;
  }

  result += `\n---\n`;
  result += `💡 **팁**: 위 링크를 클릭하면 BOJ에서 문제를 확인할 수 있습니다.\n`;

  return result;
}

/**
 * 문제 상세 조회 도구 핸들러
 */
export async function getProblem(input: GetProblemInput): Promise<string> {
  const client = new SolvedAcClient();

  try {
    // API 호출
    const problem = await client.getProblem(input.problem_id);

    // 결과 포맷팅
    return formatProblemDetail(problem);
  } catch (error) {
    // 에러 처리
    if (error instanceof ProblemNotFoundError) {
      throw new Error(
        `문제 ${input.problem_id}를 찾을 수 없습니다. 문제 번호를 확인해주세요.\n` +
        `BOJ 링크: https://www.acmicpc.net/problem/${input.problem_id}`
      );
    }

    if (error instanceof Error) {
      throw new Error(`문제 조회 중 오류가 발생했습니다: ${error.message}`);
    }

    throw new Error('문제 조회 중 알 수 없는 오류가 발생했습니다.');
  }
}
