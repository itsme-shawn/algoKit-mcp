/**
 * get_programmers_problem MCP 도구
 *
 * Phase 7 - Task 7.5: 프로그래머스 문제 상세 조회 MCP 도구 구현
 */

import { z } from 'zod';
import type { ProgrammersProblemDetail } from '../../types/programmers.js';
import { ProgrammersScraper, ProgrammersScrapeError } from '../../api/programmers-scraper.js';
import { parseProgrammersUrl } from '../../utils/url-parser.js';

/**
 * 입력 스키마 (URL 또는 숫자 모두 지원)
 */
export const GetProgrammersProblemInputSchema = z.object({
  problem_id: z.union([z.string(), z.number()])
    .describe('문제 ID 또는 프로그래머스 URL. 예: 42748 또는 https://school.programmers.co.kr/learn/courses/30/lessons/42748'),
});

export type GetProgrammersProblemInput = z.infer<typeof GetProgrammersProblemInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * get_programmers_problem 도구 핸들러
 *
 * @param args - 입력 인자 (problem_id)
 * @returns ProgrammersProblemDetail 마크다운 문자열
 * @throws {Error} 검증 실패, 스크래핑 실패, 파싱 실패 시
 */
export async function handleGetProgrammersProblem(args: unknown): Promise<TextContent> {
  try {
    // 1. 입력 검증
    const { problem_id } = GetProgrammersProblemInputSchema.parse(args);

    // 2. URL 파싱 (URL 또는 숫자 모두 지원)
    const problemId = parseProgrammersUrl(problem_id);

    if (!problemId) {
      throw new Error(`유효하지 않은 문제 ID 또는 URL: ${problem_id}`);
    }

    // 3. 프로그래머스 스크래핑
    const scraper = new ProgrammersScraper();
    const detail = await scraper.getProblem(problemId);

    // 4. 마크다운 포맷팅
    const markdown = formatProblemAsMarkdown(detail);

    return {
      type: 'text',
      text: markdown,
    };
  } catch (error) {
    // Zod 검증 에러
    if (error instanceof z.ZodError) {
      throw new Error(`입력 검증 실패: ${error.issues[0].message}`);
    }

    // 프로그래머스 스크래핑 에러
    if (error instanceof ProgrammersScrapeError) {
      const problemId = (args as GetProgrammersProblemInput).problem_id;

      if (error.code === 'NAVIGATION_ERROR') {
        throw new Error(`문제를 찾을 수 없습니다: ${problemId}번`);
      }
      if (error.code === 'TIMEOUT') {
        throw new Error(`문제 페이지 요청이 타임아웃되었습니다: ${problemId}번`);
      }
      if (error.code === 'PARSE_ERROR') {
        throw new Error(`문제 페이지 응답을 처리할 수 없습니다: ${error.message}`);
      }
      if (error.code === 'SELECTOR_NOT_FOUND') {
        throw new Error(`HTML 파싱 실패 (필수 요소 없음): ${error.message}`);
      }
    }

    // 기타 에러
    if (error instanceof Error) {
      throw new Error(`프로그래머스 문제 조회 실패: ${error.message}`);
    }

    throw error;
  }
}

/**
 * 문제를 마크다운으로 포맷팅
 */
function formatProblemAsMarkdown(problem: ProgrammersProblemDetail): string {
  const lines: string[] = [];

  // 헤더
  lines.push(`# ${problem.title}\n`);
  lines.push(`**레벨**: ${formatLevel(problem.level)} | **카테고리**: ${problem.category}\n`);
  lines.push(`**문제 ID**: ${problem.problemId}\n`);
  lines.push(`**URL**: https://school.programmers.co.kr/learn/courses/30/lessons/${problem.problemId}\n`);
  lines.push('---\n');

  // 문제 설명
  lines.push('## 문제 설명\n');
  lines.push(problem.description);
  lines.push('\n');

  // 제한사항
  if (problem.constraints.length > 0) {
    lines.push('## 제한사항\n');
    problem.constraints.forEach((c) => {
      lines.push(`- ${c}`);
    });
    lines.push('\n');
  }

  // 입출력 예제
  if (problem.examples.length > 0) {
    lines.push('## 입출력 예\n');
    lines.push('| 입력 | 출력 |');
    lines.push('|------|------|');
    problem.examples.forEach((ex) => {
      lines.push(`| ${ex.input} | ${ex.output} |`);
    });
    lines.push('\n');
  }

  // 안내
  lines.push('---');
  lines.push('');
  lines.push('💡 **다음 단계**:');
  lines.push('- 문제 분석: `analyze_programmers_problem` (구현 예정)');
  lines.push('- 코드 제출 분석: `analyze_code_submission` (BOJ만 지원)');
  lines.push('');
  lines.push('⚠️ **참고**: 프로그래머스 사이트에서 직접 문제를 풀어야 합니다.');

  return lines.join('\n');
}

/**
 * 레벨 포맷팅
 */
function formatLevel(level: number): string {
  const levelEmoji: Record<number, string> = {
    0: '🟢 Lv. 0 (입문)',
    1: '🟢 Lv. 1',
    2: '🟡 Lv. 2',
    3: '🟠 Lv. 3',
    4: '🔴 Lv. 4',
    5: '🔴 Lv. 5',
  };

  return levelEmoji[level] || `Lv. ${level}`;
}

/**
 * 테스트용 별칭 (backward compatibility)
 */
export const getProgrammersProblem = handleGetProgrammersProblem;

/**
 * MCP 도구 정의
 */
export function getProgrammersProblemTool() {
  return {
    name: 'get_programmers_problem',
    description: `프로그래머스 문제 상세 정보 조회 (웹 스크래핑).

프로그래머스 페이지에서 문제 제목, 설명, 제한사항, 입출력 예제를 가져옵니다.

응답 구조: problemId, title, level, category, description, constraints, examples, tags

**사용 시나리오**:
- 프로그래머스 문제 풀이 전 문제 본문 확인
- 문제 복습 시 문제 내용 참조
- 코드 분석 시 문제 요구사항 비교

**제한사항**:
- 스크래핑 대상: https://school.programmers.co.kr/learn/courses/30/lessons/{problem_id}
- 타임아웃: 10초
- 재시도: 최대 2회
- Rate Limiting: 초당 1회

**참고**:
- BOJ와 다르게 프로그래머스는 fetch + cheerio 사용 (SSR 페이지)
- 프로그래머스는 태그 정보가 없으므로 tags 필드는 빈 배열`,
    inputSchema: GetProgrammersProblemInputSchema,
    handler: handleGetProgrammersProblem,
  };
}
