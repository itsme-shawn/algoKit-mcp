/**
 * BOJ HTML 파싱 유틸리티
 *
 * Phase 6 - P6-002: 문제 본문 스크래퍼 구현
 *
 * cheerio를 사용하여 BOJ 문제 페이지를 파싱합니다.
 */

import * as cheerio from 'cheerio';
import type { ProblemContent, ProblemExample, ProblemLimits } from '../types/problem-content.js';

/**
 * BOJ 페이지 CSS Selector 정의
 */
const BOJ_SELECTORS = {
  /** 문제 제목 */
  title: '#problem_title',
  /** 문제 설명 */
  description: '#problem_description',
  /** 입력 형식 */
  input: '#problem_input',
  /** 출력 형식 */
  output: '#problem_output',
  /** 예제 입력 (n은 1부터 시작) */
  sampleInput: (n: number) => `#sample-input-${n}`,
  /** 예제 출력 (n은 1부터 시작) */
  sampleOutput: (n: number) => `#sample-output-${n}`,
  /** 시간 제한 */
  timeLimit: '#problem-info tbody tr td:nth-child(1)',
  /** 메모리 제한 */
  memoryLimit: '#problem-info tbody tr td:nth-child(2)',
} as const;

/**
 * HTML 파싱 에러
 */
export class HtmlParseError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'HtmlParseError';
  }
}

/**
 * BOJ 문제 페이지 HTML을 파싱하여 구조화된 데이터로 변환
 *
 * @param html - BOJ 문제 페이지의 HTML 문자열
 * @param problemId - 문제 번호
 * @returns 파싱된 문제 콘텐츠
 * @throws {HtmlParseError} 필수 필드 파싱 실패 시
 *
 * @example
 * ```typescript
 * const html = await scraper.fetchProblemPage(1000);
 * const content = parseProblemContent(html, 1000);
 * console.log(content.title); // "A+B"
 * console.log(content.examples[0].input); // "1 2"
 * ```
 */
export function parseProblemContent(html: string, problemId: number): ProblemContent {
  const $ = cheerio.load(html);

  // 1. 제목 추출
  const title = parseTitle($);

  // 2. 설명 추출
  const description = parseDescription($);

  // 3. 입력 형식 추출
  const inputFormat = parseInputFormat($);

  // 4. 출력 형식 추출
  const outputFormat = parseOutputFormat($);

  // 5. 예제 추출
  const examples = parseExamples($);

  // 6. 제한사항 추출
  const limits = parseLimits($);

  // 현재 시각 및 만료 시각 계산
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후

  return {
    problemId,
    title,
    description,
    inputFormat,
    outputFormat,
    examples,
    limits,
    metadata: {
      fetchedAt: now.toISOString(),
      source: 'web',
      cacheExpiresAt: expiresAt.toISOString(),
    },
  };
}

/**
 * 제목 파싱
 */
function parseTitle($: cheerio.Root): string {
  const title = $(BOJ_SELECTORS.title).text().trim();

  if (!title) {
    throw new HtmlParseError('문제 제목을 찾을 수 없습니다.', 'title');
  }

  return title;
}

/**
 * 설명 파싱
 */
function parseDescription($: cheerio.Root): string {
  const description = $(BOJ_SELECTORS.description).text().trim();

  if (!description) {
    throw new HtmlParseError('문제 설명을 찾을 수 없습니다.', 'description');
  }

  // 여러 줄 공백을 단일 공백으로 치환
  return description.replace(/\s+/g, ' ').trim();
}

/**
 * 입력 형식 파싱
 */
function parseInputFormat($: cheerio.Root): string {
  const input = $(BOJ_SELECTORS.input).text().trim();

  if (!input) {
    throw new HtmlParseError('입력 형식을 찾을 수 없습니다.', 'inputFormat');
  }

  return input.replace(/\s+/g, ' ').trim();
}

/**
 * 출력 형식 파싱
 */
function parseOutputFormat($: cheerio.Root): string {
  const output = $(BOJ_SELECTORS.output).text().trim();

  if (!output) {
    throw new HtmlParseError('출력 형식을 찾을 수 없습니다.', 'outputFormat');
  }

  return output.replace(/\s+/g, ' ').trim();
}

/**
 * 예제 입출력 파싱
 */
function parseExamples($: cheerio.Root): ProblemExample[] {
  const examples: ProblemExample[] = [];

  // 최대 10개의 예제 확인
  for (let i = 1; i <= 10; i++) {
    const inputSelector = BOJ_SELECTORS.sampleInput(i);
    const outputSelector = BOJ_SELECTORS.sampleOutput(i);

    const input = $(inputSelector).text();
    const output = $(outputSelector).text();

    // 더 이상 예제가 없으면 종료
    if (!input && !output) {
      break;
    }

    // 입력 또는 출력 중 하나만 있으면 경고 (일부 문제는 이럴 수 있음)
    if (!input || !output) {
      console.warn(`예제 ${i}번의 입력 또는 출력이 누락되었습니다.`);
      continue;
    }

    examples.push({
      input: input.trim(),
      output: output.trim(),
    });
  }

  if (examples.length === 0) {
    throw new HtmlParseError('예제를 찾을 수 없습니다.', 'examples');
  }

  return examples;
}

/**
 * 시간/메모리 제한 파싱
 */
function parseLimits($: cheerio.Root): ProblemLimits {
  const timeLimit = $(BOJ_SELECTORS.timeLimit).text().trim();
  const memoryLimit = $(BOJ_SELECTORS.memoryLimit).text().trim();

  if (!timeLimit || !memoryLimit) {
    throw new HtmlParseError('시간 또는 메모리 제한을 찾을 수 없습니다.', 'limits');
  }

  return {
    timeLimit,
    memoryLimit,
  };
}

/**
 * HTML 엔티티 디코딩 (cheerio가 대부분 처리하지만 보조 함수로 제공)
 *
 * @param text - HTML 엔티티가 포함된 텍스트
 * @returns 디코딩된 텍스트
 */
export function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
  };

  return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
}
