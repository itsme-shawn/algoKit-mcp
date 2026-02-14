/**
 * fetch_problem_content MCP 도구
 *
 * Phase 6 - P6-004: BOJ 문제 본문 크롤링 MCP 도구 구현
 */

import { z } from 'zod';
import type { ProblemContent } from '../types/problem-content.js';
import { BOJScraper, BojFetchError } from '../api/boj-scraper.js';
import { parseProblemContent, HtmlParseError } from '../utils/html-parser.js';

/**
 * 입력 스키마
 */
export const FetchProblemContentInputSchema = z.object({
  problem_id: z.number().int().positive()
    .describe('백준 문제 번호'),
});

export type FetchProblemContentInput = z.infer<typeof FetchProblemContentInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * fetch_problem_content 도구 핸들러
 *
 * @param args - 입력 인자 (problem_id)
 * @returns ProblemContent JSON 문자열
 * @throws {Error} 검증 실패, 크롤링 실패, 파싱 실패 시
 */
export async function handleFetchProblemContent(args: unknown): Promise<TextContent> {
  try {
    // 1. 입력 검증
    const { problem_id } = FetchProblemContentInputSchema.parse(args);

    // 2. BOJ 페이지 크롤링
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

    // BOJ 크롤링 에러
    if (error instanceof BojFetchError) {
      if (error.code === 'NOT_FOUND') {
        throw new Error(`문제를 찾을 수 없습니다: ${(args as FetchProblemContentInput).problem_id}번`);
      }
      if (error.code === 'TIMEOUT') {
        throw new Error(`문제 페이지 요청이 타임아웃되었습니다: ${(args as FetchProblemContentInput).problem_id}번`);
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
export function fetchProblemContentTool() {
  return {
    name: 'fetch_problem_content',
    description: `백준 문제 본문 크롤링.

BOJ 페이지에서 문제 제목, 설명, 입출력 형식, 예제, 제한사항을 가져옵니다.

응답 구조: problemId, title, description, inputFormat, outputFormat, examples, limits, metadata

**사용 시나리오**:
- 문제 풀이 전 문제 본문 확인
- 문제 복습 시 문제 내용 참조
- 코드 분석 시 문제 요구사항 비교

**제한사항**:
- 크롤링 대상: https://www.acmicpc.net/problem/{problem_id}
- 타임아웃: 10초
- 재시도: 최대 2회
- 캐시: 30일 (Phase 6-3에서 구현 예정)`,
    inputSchema: FetchProblemContentInputSchema,
    handler: handleFetchProblemContent,
  };
}
