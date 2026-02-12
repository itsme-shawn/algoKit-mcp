/**
 * search_tags 도구
 *
 * 알고리즘 태그를 키워드로 검색합니다.
 */

import { z } from 'zod';
import { SolvedAcClient } from '../api/solvedac-client.js';
import { Tag } from '../api/types.js';

/**
 * 입력 스키마
 */
export const SearchTagsInputSchema = z.object({
  query: z.string().min(1).describe('태그 검색 키워드 (최소 1글자)'),
});

export type SearchTagsInput = z.infer<typeof SearchTagsInputSchema>;

/**
 * 다국어 태그명 추출
 */
function getTagNames(tag: Tag): { korean: string; english: string } {
  const korean = tag.displayNames.find(dn => dn.language === 'ko')?.name || tag.key;
  const english = tag.displayNames.find(dn => dn.language === 'en')?.name || tag.key;

  return { korean, english };
}

/**
 * 태그 검색 결과를 마크다운 테이블로 포맷팅
 */
function formatTagResults(tags: Tag[]): string {
  if (tags.length === 0) {
    return '검색 결과가 없습니다. 다른 키워드로 시도해보세요.';
  }

  let result = `# 태그 검색 결과\n\n`;
  result += `**총 ${tags.length}개 태그**\n\n`;
  result += `| 태그 키 | 한글명 | 영문명 | 문제 수 |\n`;
  result += `|---------|--------|--------|----------|\n`;

  for (const tag of tags) {
    const { korean, english } = getTagNames(tag);
    const problemCount = tag.problemCount ? tag.problemCount.toLocaleString() : '-';

    result += `| \`${tag.key}\` | ${korean} | ${english} | ${problemCount}개 |\n`;
  }

  result += `\n---\n`;
  result += `💡 **팁**: 태그 키를 사용하여 \`search_problems\` 도구로 해당 태그의 문제를 검색할 수 있습니다.\n`;
  result += `\n**사용 예시**:\n`;
  result += `\`\`\`\n`;
  result += `search_problems(tag: "${tags[0]?.key || 'dp'}")\n`;
  result += `\`\`\`\n`;

  return result;
}

/**
 * 태그 검색 도구 핸들러
 */
export async function searchTags(input: SearchTagsInput): Promise<string> {
  // 입력 검증 (공백 제거)
  const query = input.query.trim();
  if (query.length === 0) {
    throw new Error('검색 키워드는 최소 1글자 이상이어야 합니다.');
  }

  const client = new SolvedAcClient();

  try {
    // API 호출
    const tags = await client.searchTags(query);

    // 결과 포맷팅
    return formatTagResults(tags);
  } catch (error) {
    // 에러 처리
    if (error instanceof Error) {
      throw new Error(`태그 검색 중 오류가 발생했습니다: ${error.message}`);
    }

    throw new Error('태그 검색 중 알 수 없는 오류가 발생했습니다.');
  }
}
