/**
 * fetch_problem_content_boj MCP 도구
 *
 * Phase 6 - P6-004: BOJ 문제 본문 스크래핑 MCP 도구 구현
 */

import { z } from 'zod';
import type { ProblemContent } from '../../types/problem-content.js';
import { BOJScraper, BojFetchError } from '../../api/boj-scraper.js';
import { parseProblemContent, HtmlParseError } from '../../utils/html-parser.js';

/**
 * 입력 스키마
 */
export const FetchProblemContentBOJInputSchema = z.object({
  problem_id: z.number().int().positive()
    .describe('백준 문제 번호'),
});

export type FetchProblemContentBOJInput = z.infer<typeof FetchProblemContentBOJInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * fetch_problem_content_boj 도구 핸들러
 *
 * @param args - 입력 인자 (problem_id)
 * @returns ProblemContent JSON 문자열
 * @throws {Error} 검증 실패, 스크래핑 실패, 파싱 실패 시
 */
export async function handleFetchProblemContentBOJ(args: unknown): Promise<TextContent> {
  try {
    // 1. 입력 검증
    const { problem_id } = FetchProblemContentBOJInputSchema.parse(args);

    // 2. BOJ 페이지 스크래핑
    const scraper = new BOJScraper();
    const html = await scraper.fetchProblemPage(problem_id);

    // 3. HTML 파싱
    const content = parseProblemContent(html, problem_id);

    // 4. JSON 문자열로 반환
    return {
      type: 'text',
      text: JSON.stringify(content, null, 2),
    };
  } catch (error) {
    // Zod 검증 에러
    if (error instanceof z.ZodError) {
      throw new Error(`입력 검증 실패: ${error.issues[0].message}`);
    }

    // BOJ 스크래핑 에러
    if (error instanceof BojFetchError) {
      if (error.code === 'NOT_FOUND') {
        throw new Error(`문제를 찾을 수 없습니다: ${(args as FetchProblemContentBOJInput).problem_id}번`);
      }
      if (error.code === 'TIMEOUT') {
        throw new Error(`문제 페이지 요청이 타임아웃되었습니다: ${(args as FetchProblemContentBOJInput).problem_id}번`);
      }
      if (error.code === 'NETWORK_ERROR') {
        throw new Error(`네트워크 에러가 발생했습니다: ${error.message}`);
      }
      if (error.code === 'PARSE_ERROR') {
        throw new Error(`문제 페이지 응답을 처리할 수 없습니다: ${error.message}`);
      }
    }

    // HTML 파싱 에러
    if (error instanceof HtmlParseError) {
      throw new Error(`HTML 파싱 실패 (${error.field}): ${error.message}`);
    }

    // 기타 에러
    throw error;
  }
}

/**
 * MCP 도구 정의
 */
export function fetchProblemContentBOJTool() {
  return {
    name: 'fetch_problem_content_boj',
    description: `백준(BOJ) 문제 본문 스크래핑 (힌트 제외).

BOJ 페이지에서 문제 제목, 설명, 입출력 형식, 예제, 제한사항을 가져옵니다.
**힌트는 포함되지 않습니다** - generate_hint_boj 도구를 사용하세요.

응답 구조: problemId, title, description, inputFormat, outputFormat, examples, limits, metadata

**사용 시나리오**:
- 문제 풀이 전 문제 본문 확인
- 문제 복습 시 문제 내용 참조
- 코드 분석 시 문제 요구사항 비교

**제한사항**:
- 스크래핑 대상: https://www.acmicpc.net/problem/{problem_id}
- 타임아웃: 10초
- 재시도: 최대 2회
- 캐시: 30일

⚠️ 플랫폼 판별: 문제 번호만 입력된 경우 대화 맥락에서 플랫폼을 파악하거나, 맥락이 없으면 반드시 BOJ/프로그래머스 중 어느 플랫폼인지 사용자에게 확인 후 호출하세요.`,
    inputSchema: FetchProblemContentBOJInputSchema,
    handler: handleFetchProblemContentBOJ,
  };
}
