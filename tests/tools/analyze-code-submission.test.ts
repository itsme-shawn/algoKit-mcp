/**
 * analyze_code_submission 도구 테스트
 *
 * Phase 6 - P6-006
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleAnalyzeCodeSubmission,
  AnalyzeCodeSubmissionInputSchema,
} from '../../src/tools/analyze-code-submission.js';
import type { ProblemContent, CodeAnalysisResult } from '../../src/types/problem-content.js';

// Mock 설정
vi.mock('../../src/tools/fetch-problem-content.js', () => ({
  handleFetchProblemContent: vi.fn(),
}));

vi.mock('../../src/services/code-analyzer.js', () => {
  return {
    CodeAnalyzer: vi.fn(function() {
      this.analyzeCode = vi.fn();
    }),
  };
});

// Mock 임포트
import { handleFetchProblemContent } from '../../src/tools/fetch-problem-content.js';
import { CodeAnalyzer } from '../../src/services/code-analyzer.js';

describe('AnalyzeCodeSubmissionInputSchema', () => {
  describe('입력 검증', () => {
    it('필수 필드: problem_id, code, language', () => {
      const input = {
        problem_id: 1000,
        code: 'print("Hello World")',
        language: 'python',
      };

      const result = AnalyzeCodeSubmissionInputSchema.parse(input);

      expect(result.problem_id).toBe(1000);
      expect(result.code).toBe('print("Hello World")');
      expect(result.language).toBe('python');
      expect(result.analysis_type).toBe('full'); // 기본값
    });

    it('problem_id는 양의 정수여야 함', () => {
      const input1 = {
        problem_id: 0,
        code: 'code',
        language: 'python',
      };

      const input2 = {
        problem_id: -10,
        code: 'code',
        language: 'python',
      };

      const input3 = {
        problem_id: 1.5,
        code: 'code',
        language: 'python',
      };

      expect(() => AnalyzeCodeSubmissionInputSchema.parse(input1)).toThrow();
      expect(() => AnalyzeCodeSubmissionInputSchema.parse(input2)).toThrow();
      expect(() => AnalyzeCodeSubmissionInputSchema.parse(input3)).toThrow();
    });

    it('code는 비어있지 않아야 함', () => {
      const input = {
        problem_id: 1000,
        code: '',
        language: 'python',
      };

      expect(() => AnalyzeCodeSubmissionInputSchema.parse(input)).toThrow();
    });

    it('language는 지원되는 언어만 허용', () => {
      const validLanguages = ['python', 'cpp', 'javascript', 'java', 'go'];

      for (const lang of validLanguages) {
        const input = {
          problem_id: 1000,
          code: 'code',
          language: lang,
        };

        const result = AnalyzeCodeSubmissionInputSchema.parse(input);
        expect(result.language).toBe(lang);
      }

      const invalidInput = {
        problem_id: 1000,
        code: 'code',
        language: 'ruby',
      };

      expect(() => AnalyzeCodeSubmissionInputSchema.parse(invalidInput)).toThrow();
    });

    it('analysis_type은 선택사항, 기본값은 "full"', () => {
      const input1 = {
        problem_id: 1000,
        code: 'code',
        language: 'python',
      };

      const result1 = AnalyzeCodeSubmissionInputSchema.parse(input1);
      expect(result1.analysis_type).toBe('full');

      const input2 = {
        problem_id: 1000,
        code: 'code',
        language: 'python',
        analysis_type: 'hint',
      };

      const result2 = AnalyzeCodeSubmissionInputSchema.parse(input2);
      expect(result2.analysis_type).toBe('hint');
    });

    it('analysis_type은 "full", "hint", "debug", "review"만 허용', () => {
      const validTypes = ['full', 'hint', 'debug', 'review'];

      for (const type of validTypes) {
        const input = {
          problem_id: 1000,
          code: 'code',
          language: 'python',
          analysis_type: type,
        };

        const result = AnalyzeCodeSubmissionInputSchema.parse(input);
        expect(result.analysis_type).toBe(type);
      }

      const invalidInput = {
        problem_id: 1000,
        code: 'code',
        language: 'python',
        analysis_type: 'invalid',
      };

      expect(() => AnalyzeCodeSubmissionInputSchema.parse(invalidInput)).toThrow();
    });
  });
});

describe('handleAnalyzeCodeSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('정상 케이스', () => {
    it('Python 코드 + full 분석', async () => {
      // Mock 문제 본문
      const mockProblemContent: ProblemContent = {
        problemId: 1000,
        title: 'A+B',
        description: '두 정수 A와 B를 입력받은 다음, A+B를 출력하는 프로그램을 작성하시오.',
        inputFormat: '첫째 줄에 A와 B가 주어진다.',
        outputFormat: '첫째 줄에 A+B를 출력한다.',
        examples: [
          { input: '1 2', output: '3' },
        ],
        limits: {
          timeLimit: '2초',
          memoryLimit: '128MB',
        },
        metadata: {
          fetchedAt: '2026-02-14T00:00:00Z',
          source: 'web',
          cacheExpiresAt: '2026-03-16T00:00:00Z',
        },
      };

      // Mock 분석 결과
      const mockAnalysisResult: CodeAnalysisResult = {
        problemInfo: mockProblemContent,
        codeMetadata: {
          language: 'python',
          lineCount: 2,
          functionCount: 0,
        },
        analysisPrompts: {
          systemPrompt: '분석 시스템 프롬프트...',
          userPrompt: '분석 요청 프롬프트...',
        },
        suggestedQuestions: [
          '이 코드의 시간 복잡도는 어떻게 되나요?',
        ],
      };

      // Mock 함수 설정
      vi.mocked(handleFetchProblemContent).mockResolvedValue({
        type: 'text',
        text: JSON.stringify(mockProblemContent),
      });

      const mockAnalyzeCode = vi.fn().mockResolvedValue(mockAnalysisResult);
      vi.mocked(CodeAnalyzer).mockImplementation(function() {
        this.analyzeCode = mockAnalyzeCode;
      } as any);

      // 테스트 실행
      const input = {
        problem_id: 1000,
        code: 'a, b = map(int, input().split())\nprint(a + b)',
        language: 'python',
        analysis_type: 'full',
      };

      const result = await handleAnalyzeCodeSubmission(input);

      // 검증
      expect(result.type).toBe('text');
      const parsedResult = JSON.parse(result.text);
      expect(parsedResult).toEqual(mockAnalysisResult);

      // Mock 호출 검증
      expect(handleFetchProblemContent).toHaveBeenCalledWith({ problem_id: 1000 });
      expect(CodeAnalyzer).toHaveBeenCalled();
      expect(mockAnalyzeCode).toHaveBeenCalledWith(
        mockProblemContent,
        expect.objectContaining({
          problemId: 1000,
          code: input.code,
          language: 'python',
        }),
        'full'
      );
    });

    it('C++ 코드 + hint 분석', async () => {
      // Mock 문제 본문
      const mockProblemContent: ProblemContent = {
        problemId: 1000,
        title: 'A+B',
        description: '두 정수 A와 B를 입력받은 다음, A+B를 출력하는 프로그램을 작성하시오.',
        inputFormat: '첫째 줄에 A와 B가 주어진다.',
        outputFormat: '첫째 줄에 A+B를 출력한다.',
        examples: [
          { input: '1 2', output: '3' },
        ],
        limits: {
          timeLimit: '2초',
          memoryLimit: '128MB',
        },
        metadata: {
          fetchedAt: '2026-02-14T00:00:00Z',
          source: 'web',
          cacheExpiresAt: '2026-03-16T00:00:00Z',
        },
      };

      // Mock 분석 결과
      const mockAnalysisResult: CodeAnalysisResult = {
        problemInfo: mockProblemContent,
        codeMetadata: {
          language: 'cpp',
          lineCount: 8,
          functionCount: 1,
        },
        analysisPrompts: {
          systemPrompt: '힌트 시스템 프롬프트...',
          userPrompt: '힌트 요청 프롬프트...',
        },
        suggestedQuestions: [
          '이 문제를 어떻게 시작해야 할까요?',
        ],
      };

      // Mock 함수 설정
      vi.mocked(handleFetchProblemContent).mockResolvedValue({
        type: 'text',
        text: JSON.stringify(mockProblemContent),
      });

      const mockAnalyzeCode = vi.fn().mockResolvedValue(mockAnalysisResult);
      vi.mocked(CodeAnalyzer).mockImplementation(function() {
        this.analyzeCode = mockAnalyzeCode;
      } as any);

      // 테스트 실행
      const input = {
        problem_id: 1000,
        code: '#include <iostream>\nint main() {\n  int a, b;\n  std::cin >> a >> b;\n  std::cout << a + b;\n  return 0;\n}',
        language: 'cpp',
        analysis_type: 'hint',
      };

      const result = await handleAnalyzeCodeSubmission(input);

      // 검증
      expect(result.type).toBe('text');
      const parsedResult = JSON.parse(result.text);
      expect(parsedResult).toEqual(mockAnalysisResult);

      // Mock 호출 검증
      expect(mockAnalyzeCode).toHaveBeenCalledWith(
        mockProblemContent,
        expect.objectContaining({
          problemId: 1000,
          language: 'cpp',
        }),
        'hint'
      );
    });

    it('analysis_type 기본값 "full" 동작', async () => {
      // Mock 설정
      const mockProblemContent: ProblemContent = {
        problemId: 1000,
        title: 'A+B',
        description: '',
        inputFormat: '',
        outputFormat: '',
        examples: [],
        limits: { timeLimit: '2초', memoryLimit: '128MB' },
        metadata: {
          fetchedAt: '2026-02-14T00:00:00Z',
          source: 'web',
          cacheExpiresAt: '2026-03-16T00:00:00Z',
        },
      };

      vi.mocked(handleFetchProblemContent).mockResolvedValue({
        type: 'text',
        text: JSON.stringify(mockProblemContent),
      });

      const mockAnalyzeCode = vi.fn().mockResolvedValue({
        problemInfo: mockProblemContent,
        codeMetadata: { language: 'python', lineCount: 1, functionCount: 0 },
        analysisPrompts: { systemPrompt: '', userPrompt: '' },
        suggestedQuestions: [],
      });
      vi.mocked(CodeAnalyzer).mockImplementation(function() {
        this.analyzeCode = mockAnalyzeCode;
      } as any);

      // analysis_type 없이 호출
      const input = {
        problem_id: 1000,
        code: 'print("hello")',
        language: 'python',
      };

      await handleAnalyzeCodeSubmission(input);

      // 기본값 "full"로 호출되었는지 확인
      expect(mockAnalyzeCode).toHaveBeenCalledWith(
        mockProblemContent,
        expect.any(Object),
        'full'
      );
    });
  });

  describe('응답 형식 검증', () => {
    it('CodeAnalysisResult 구조 확인', async () => {
      const mockProblemContent: ProblemContent = {
        problemId: 1000,
        title: 'A+B',
        description: '',
        inputFormat: '',
        outputFormat: '',
        examples: [],
        limits: { timeLimit: '2초', memoryLimit: '128MB' },
        metadata: {
          fetchedAt: '2026-02-14T00:00:00Z',
          source: 'web',
          cacheExpiresAt: '2026-03-16T00:00:00Z',
        },
      };

      const mockAnalysisResult: CodeAnalysisResult = {
        problemInfo: mockProblemContent,
        codeMetadata: {
          language: 'python',
          lineCount: 10,
          functionCount: 2,
        },
        analysisPrompts: {
          systemPrompt: 'System prompt',
          userPrompt: 'User prompt',
        },
        suggestedQuestions: [
          'Question 1',
          'Question 2',
        ],
      };

      vi.mocked(handleFetchProblemContent).mockResolvedValue({
        type: 'text',
        text: JSON.stringify(mockProblemContent),
      });

      vi.mocked(CodeAnalyzer).mockImplementation(function() {
        this.analyzeCode = vi.fn().mockResolvedValue(mockAnalysisResult);
      } as any);

      const result = await handleAnalyzeCodeSubmission({
        problem_id: 1000,
        code: 'code',
        language: 'python',
      });

      const parsedResult = JSON.parse(result.text);

      // 구조 검증
      expect(parsedResult).toHaveProperty('problemInfo');
      expect(parsedResult).toHaveProperty('codeMetadata');
      expect(parsedResult).toHaveProperty('analysisPrompts');
      expect(parsedResult).toHaveProperty('suggestedQuestions');

      expect(parsedResult.codeMetadata).toHaveProperty('language');
      expect(parsedResult.codeMetadata).toHaveProperty('lineCount');
      expect(parsedResult.codeMetadata).toHaveProperty('functionCount');

      expect(parsedResult.analysisPrompts).toHaveProperty('systemPrompt');
      expect(parsedResult.analysisPrompts).toHaveProperty('userPrompt');

      expect(Array.isArray(parsedResult.suggestedQuestions)).toBe(true);
    });

    it('JSON 직렬화 확인', async () => {
      const mockProblemContent: ProblemContent = {
        problemId: 1000,
        title: 'A+B',
        description: '',
        inputFormat: '',
        outputFormat: '',
        examples: [],
        limits: { timeLimit: '2초', memoryLimit: '128MB' },
        metadata: {
          fetchedAt: '2026-02-14T00:00:00Z',
          source: 'web',
          cacheExpiresAt: '2026-03-16T00:00:00Z',
        },
      };

      vi.mocked(handleFetchProblemContent).mockResolvedValue({
        type: 'text',
        text: JSON.stringify(mockProblemContent),
      });

      vi.mocked(CodeAnalyzer).mockImplementation(function() {
        this.analyzeCode = vi.fn().mockResolvedValue({
          problemInfo: mockProblemContent,
          codeMetadata: { language: 'python', lineCount: 1, functionCount: 0 },
          analysisPrompts: { systemPrompt: '', userPrompt: '' },
          suggestedQuestions: [],
        });
      } as any);

      const result = await handleAnalyzeCodeSubmission({
        problem_id: 1000,
        code: 'code',
        language: 'python',
      });

      // JSON 파싱 시도
      expect(() => JSON.parse(result.text)).not.toThrow();

      const parsed = JSON.parse(result.text);
      expect(typeof parsed).toBe('object');
    });
  });

  describe('에러 케이스', () => {
    it('Zod 검증 실패 시 에러 메시지 반환', async () => {
      const invalidInput = {
        problem_id: -1, // 잘못된 값
        code: 'code',
        language: 'python',
      };

      await expect(handleAnalyzeCodeSubmission(invalidInput)).rejects.toThrow('입력 검증 실패');
    });

    it('문제 크롤링 실패 시 에러 전파', async () => {
      vi.mocked(handleFetchProblemContent).mockRejectedValue(
        new Error('문제를 찾을 수 없습니다: 99999번')
      );

      const input = {
        problem_id: 99999,
        code: 'code',
        language: 'python',
      };

      await expect(handleAnalyzeCodeSubmission(input)).rejects.toThrow('문제를 찾을 수 없습니다');
    });
  });
});
