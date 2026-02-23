/**
 * analyze_code_submission_boj MCP 도구
 *
 * Phase 6 - P6-006: BOJ 사용자 코드 분석 MCP 도구 구현
 */

import { z } from 'zod';
import type { CodeAnalysisResult, SupportedLanguage, AnalysisType } from '../../types/problem-content.js';
import { handleFetchProblemContentBOJ } from './fetch-problem-content-boj.js';
import { CodeAnalyzer } from '../../services/code-analyzer.js';

/**
 * 입력 스키마
 */
export const AnalyzeCodeSubmissionBOJInputSchema = z.object({
  problem_id: z.number().int().positive()
    .describe('백준 문제 번호'),
  code: z.string().min(1)
    .describe('분석할 사용자 코드'),
  language: z.enum(['python', 'cpp', 'javascript', 'java', 'go'])
    .describe('프로그래밍 언어'),
  analysis_type: z.enum(['full', 'hint', 'debug', 'review']).optional().default('full')
    .describe('분석 타입 (기본값: full)'),
});

export type AnalyzeCodeSubmissionBOJInput = z.infer<typeof AnalyzeCodeSubmissionBOJInputSchema>;

/**
 * MCP TextContent 타입
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * analyze_code_submission_boj 도구 핸들러
 *
 * @param args - 입력 인자 (problem_id, code, language, analysis_type)
 * @returns CodeAnalysisResult JSON 문자열
 * @throws {Error} 검증 실패, 스크래핑 실패, 파싱 실패, 분석 실패 시
 */
export async function handleAnalyzeCodeSubmissionBOJ(args: unknown): Promise<TextContent> {
  try {
    // 1. 입력 검증
    const { problem_id, code, language, analysis_type } = AnalyzeCodeSubmissionBOJInputSchema.parse(args);

    // 2. 문제 본문 스크래핑 (fetch_problem_content_boj 재사용)
    const problemContentResponse = await handleFetchProblemContentBOJ({ problem_id });
    const problemContent = JSON.parse(problemContentResponse.text);

    // 3. CodeSubmission 객체 생성
    const submission = {
      problemId: problem_id,
      code,
      language: language as SupportedLanguage,
      submittedAt: new Date().toISOString(),
    };

    // 4. CodeAnalyzer로 분석
    const analyzer = new CodeAnalyzer();
    const result: CodeAnalysisResult = await analyzer.analyzeCode(
      problemContent,
      submission,
      analysis_type as AnalysisType,
    );

    // 5. JSON 문자열로 반환
    return {
      type: 'text',
      text: JSON.stringify(result, null, 2),
    };
  } catch (error) {
    // Zod 검증 에러
    if (error instanceof z.ZodError) {
      throw new Error(`입력 검증 실패: ${error.issues[0].message}`);
    }

    // 기타 에러 (스크래핑/파싱 에러는 handleFetchProblemContentBOJ에서 처리됨)
    throw error;
  }
}

/**
 * MCP 도구 정의
 */
export function analyzeCodeSubmissionBOJTool() {
  return {
    name: 'analyze_code_submission_boj',
    description: `백준(BOJ) 문제에 대한 사용자 코드를 분석하여 피드백을 제공합니다.

문제 본문과 사용자 코드를 결합하여 LLM 분석용 프롬프트를 생성합니다.

**분석 타입**:
- full: 전체 분석 (정확성, 복잡도, 개선점)
- hint: 힌트 제공 (핵심 개념, 접근 방법)
- debug: 디버깅 (에러 원인, 로직 오류)
- review: 코드 리뷰 (스타일, 가독성)

**응답 구조**: problemInfo, codeMetadata, analysisPrompts, suggestedQuestions

**사용 시나리오**:
- 문제 풀이 후 코드 개선점 확인
- 틀린 코드 디버깅
- 코드 리뷰 및 품질 개선

**지원 언어**: Python, C++, JavaScript, Java, Go

⚠️ 플랫폼 판별: 문제 번호만 입력된 경우 대화 맥락에서 플랫폼을 파악하거나, 맥락이 없으면 반드시 BOJ/프로그래머스 중 어느 플랫폼인지 사용자에게 확인 후 호출하세요.`,
    inputSchema: AnalyzeCodeSubmissionBOJInputSchema,
    handler: handleAnalyzeCodeSubmissionBOJ,
  };
}
