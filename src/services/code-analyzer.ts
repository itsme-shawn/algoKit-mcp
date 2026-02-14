/**
 * CodeAnalyzer 서비스
 *
 * 사용자 코드와 문제 본문을 결합하여 LLM 분석용 프롬프트 생성
 *
 * Phase 6 - P6-005: 코드 분석 프롬프트 생성 서비스 구현
 */

import type {
  ProblemContent,
  CodeSubmission,
  CodeMetadata,
  AnalysisType,
  CodeAnalysisResult,
  SupportedLanguage,
} from '../types/problem-content.js';

/**
 * 언어별 함수 패턴 정의
 */
const FUNCTION_PATTERNS: Record<SupportedLanguage, RegExp[]> = {
  python: [/\bdef\s+\w+\s*\(/g],
  cpp: [/\b\w+\s+\w+\s*\([^)]*\)\s*{/g],
  javascript: [/\bfunction\s+\w+\s*\(/g, /\bconst\s+\w+\s*=\s*\(/g],
  java: [
    /\b(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\([^)]*\)\s*{/g,
  ],
  go: [/\bfunc\s+\w+\s*\(/g],
};

/**
 * 언어 표시 이름 맵
 */
const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  python: 'Python',
  cpp: 'C++',
  javascript: 'JavaScript',
  java: 'Java',
  go: 'Go',
};

/**
 * CodeAnalyzer 클래스
 */
export class CodeAnalyzer {
  /**
   * 코드 분석 프롬프트 생성
   */
  async analyzeCode(
    problemContent: ProblemContent,
    submission: CodeSubmission,
    analysisType: AnalysisType,
  ): Promise<CodeAnalysisResult> {
    // 1. 코드 메타데이터 추출
    const codeMetadata = this.extractCodeMetadata(submission);

    // 2. 분석 프롬프트 생성
    const analysisPrompts = this.buildAnalysisPrompts(
      problemContent,
      submission,
      analysisType,
    );

    // 3. 추천 질문 생성
    const suggestedQuestions = this.generateSuggestedQuestions(analysisType);

    return {
      problemInfo: problemContent,
      codeMetadata,
      analysisPrompts,
      suggestedQuestions,
    };
  }

  /**
   * 코드 메타데이터 추출
   */
  private extractCodeMetadata(submission: CodeSubmission): CodeMetadata {
    const { code, language } = submission;

    // 줄 수 계산
    const lines = code.split('\n');
    const lineCount = lines.length;

    // 언어별 함수 개수 추정
    const functionCount = this.estimateFunctionCount(code, language);

    return {
      language,
      lineCount,
      functionCount,
    };
  }

  /**
   * 언어별 함수 개수 추정
   */
  private estimateFunctionCount(
    code: string,
    language: SupportedLanguage,
  ): number {
    const languagePatterns = FUNCTION_PATTERNS[language] || [];

    return languagePatterns.reduce((total, pattern) => {
      const matches = code.match(pattern);
      return total + (matches?.length || 0);
    }, 0);
  }

  /**
   * 분석 프롬프트 생성
   */
  private buildAnalysisPrompts(
    problemContent: ProblemContent,
    submission: CodeSubmission,
    analysisType: AnalysisType,
  ) {
    const systemPrompt = this.buildSystemPrompt(problemContent, analysisType);
    const userPrompt = this.buildUserPrompt(submission);

    return {
      systemPrompt,
      userPrompt,
    };
  }

  /**
   * 시스템 프롬프트 생성
   */
  private buildSystemPrompt(
    problemContent: ProblemContent,
    analysisType: AnalysisType,
  ): string {
    const { title, description, inputFormat, outputFormat, examples, limits } =
      problemContent;

    // 기본 프롬프트
    let prompt = `당신은 알고리즘 문제 풀이 전문가입니다.\n\n`;
    prompt += `## 문제: ${title}\n\n`;
    prompt += `### 문제 설명\n${description}\n\n`;
    prompt += `### 입력 형식\n${inputFormat}\n\n`;
    prompt += `### 출력 형식\n${outputFormat}\n\n`;

    // 예제 추가
    if (examples.length > 0) {
      prompt += `### 예제\n`;
      for (const example of examples) {
        prompt += `입력:\n${example.input}\n\n`;
        prompt += `출력:\n${example.output}\n\n`;
      }
    }

    // 제한사항
    prompt += `### 제한사항\n`;
    prompt += `시간 제한: ${limits.timeLimit}\n`;
    prompt += `메모리 제한: ${limits.memoryLimit}\n\n`;

    // 분석 목표 (타입별)
    prompt += this.getAnalysisGoal(analysisType);

    return prompt;
  }

  /**
   * 분석 타입별 목표 텍스트
   */
  private getAnalysisGoal(analysisType: AnalysisType): string {
    switch (analysisType) {
      case 'full':
        return `## 분석 목표\n사용자가 제출한 코드를 분석하여 다음을 제공하세요:\n1. 코드의 정확성 평가\n2. 시간/공간 복잡도 분석\n3. 개선 가능한 부분 제안\n`;

      case 'hint':
        return `## 분석 목표\n사용자가 문제를 해결할 수 있도록 힌트를 제공하세요:\n1. 문제 이해를 돕는 핵심 개념\n2. 효과적인 접근 방법 제안\n3. 구현 시 주의할 점\n`;

      case 'debug':
        return `## 분석 목표\n사용자 코드의 문제점을 찾아 디버깅을 도와주세요:\n1. 에러 원인 분석\n2. 잘못된 로직 지적\n3. 수정 방법 제안\n`;

      case 'review':
        return `## 분석 목표\n코드 리뷰를 통해 품질을 개선하세요:\n1. 코드 스타일 및 가독성 평가\n2. 개선 가능한 부분 제안\n3. 베스트 프랙티스 적용\n`;

      default:
        return '';
    }
  }

  /**
   * 사용자 프롬프트 생성
   */
  private buildUserPrompt(submission: CodeSubmission): string {
    const { code, language } = submission;
    const languageLabel = LANGUAGE_LABELS[language] || language;

    return `다음은 제가 작성한 ${languageLabel} 코드입니다:

\`\`\`${language}
${code}
\`\`\`

이 코드를 분석해주세요.`;
  }

  /**
   * 추천 질문 생성
   */
  private generateSuggestedQuestions(analysisType: AnalysisType): string[] {
    const questions: Record<AnalysisType, string[]> = {
      full: [
        '이 코드의 시간 복잡도는 어떻게 되나요?',
        '공간 복잡도를 개선할 수 있나요?',
        '더 효율적인 알고리즘이 있나요?',
        '코드의 가독성을 높이려면 어떻게 해야 하나요?',
        '예외 케이스나 엣지 케이스를 놓친 부분이 있나요?',
      ],
      hint: [
        '이 문제를 어떻게 시작해야 할까요?',
        '어떤 자료구조를 사용하면 좋을까요?',
        '핵심 알고리즘은 무엇인가요?',
      ],
      debug: [
        '왜 이 코드가 틀렸다고 나오나요?',
        '이 부분에서 에러가 발생하는 이유는 무엇인가요?',
        '특정 테스트 케이스에서 실패하는 이유를 알려주세요.',
      ],
      review: [
        '이 코드에서 개선할 수 있는 부분은 무엇인가요?',
        '더 나은 코딩 패턴이 있나요?',
        '이 언어의 베스트 프랙티스를 적용하려면 어떻게 해야 하나요?',
      ],
    };

    return questions[analysisType] || [];
  }
}
