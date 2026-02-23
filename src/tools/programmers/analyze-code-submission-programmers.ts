/**
 * analyze_code_submission_programmers MCP 도구
 *
 * 프로그래머스 사용자 코드 분석 및 피드백 제공
 */

import { z } from 'zod';
import type { CodeAnalysisResult, SupportedLanguage, AnalysisType } from '../../types/problem-content.js';
import type { ProgrammersScraper } from '../../api/programmers-scraper.js';
import { ProgrammersScrapeError } from '../../api/programmers-scraper.js';
import { parseProgrammersUrl } from '../../utils/url-parser.js';
import { programmersToProblemContent } from '../../utils/programmers-converter.js';
import { CodeAnalyzer } from '../../services/code-analyzer.js';

/**
 * 입력 스키마
 */
export const AnalyzeCodeSubmissionProgrammersInputSchema = z.object({
  problem_id: z.union([z.string(), z.number()])
    .describe('프로그래머스 문제 ID 또는 URL'),
  code: z.string().min(1)
    .describe('분석할 사용자 코드'),
  language: z.enum(['python', 'cpp', 'javascript', 'java', 'go'])
    .describe('프로그래밍 언어'),
  analysis_type: z.enum(['full', 'hint', 'debug', 'review']).optional().default('full')
    .describe('분석 타입 (기본값: full)'),
});

export type AnalyzeCodeSubmissionProgrammersInput = z.infer<typeof AnalyzeCodeSubmissionProgrammersInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * analyze_code_submission_programmers 도구 핸들러
 */
export function analyzeCodeSubmissionProgrammersTool(scraper: ProgrammersScraper) {
  return {
    name: 'analyze_code_submission_programmers',
    description: `프로그래머스 문제에 대한 사용자 코드를 분석하여 피드백을 제공합니다.

문제 본문과 사용자 코드를 결합하여 LLM 분석용 프롬프트를 생성합니다.

**분석 타입**:
- full: 전체 분석 (정확성, 복잡도, 개선점)
- hint: 힌트 제공 (핵심 개념, 접근 방법)
- debug: 디버깅 (에러 원인, 로직 오류)
- review: 코드 리뷰 (스타일, 가독성)

**응답 구조**: problemInfo, codeMetadata, analysisPrompts, suggestedQuestions

**지원 언어**: Python, C++, JavaScript, Java, Go

⚠️ 플랫폼 판별: 문제 번호만 입력된 경우 대화 맥락에서 플랫폼을 파악하거나, 맥락이 없으면 반드시 BOJ/프로그래머스 중 어느 플랫폼인지 사용자에게 확인 후 호출하세요.`,
    inputSchema: AnalyzeCodeSubmissionProgrammersInputSchema,
    handler: async (input: AnalyzeCodeSubmissionProgrammersInput): Promise<TextContent> => {
      try {
        const { problem_id, code, language, analysis_type } =
          AnalyzeCodeSubmissionProgrammersInputSchema.parse(input);

        const parsedId = parseProgrammersUrl(problem_id);
        if (!parsedId) {
          throw new Error(`유효하지 않은 프로그래머스 문제 ID 또는 URL: ${problem_id}`);
        }

        // 1. 문제 본문 조회
        const detail = await scraper.getProblem(parsedId);
        const problemContent = programmersToProblemContent(detail);

        // 2. CodeSubmission 객체 생성
        const submission = {
          problemId: parseInt(parsedId, 10) || 0,
          code,
          language: language as SupportedLanguage,
          submittedAt: new Date().toISOString(),
        };

        // 3. CodeAnalyzer로 분석
        const analyzer = new CodeAnalyzer();
        const result: CodeAnalysisResult = await analyzer.analyzeCode(
          problemContent,
          submission,
          analysis_type as AnalysisType,
        );

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
            throw new Error(`문제를 찾을 수 없습니다: ${(input as AnalyzeCodeSubmissionProgrammersInput).problem_id}`);
          }
        }

        throw error;
      }
    },
  };
}
