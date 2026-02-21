/**
 * analyze_code_submission_programmers 도구 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AnalyzeCodeSubmissionProgrammersInputSchema,
  analyzeCodeSubmissionProgrammersTool,
} from '../../../src/tools/programmers/analyze-code-submission-programmers.js';
import type { ProgrammersScraper } from '../../../src/api/programmers-scraper.js';
import type { ProgrammersProblemDetail } from '../../../src/types/programmers.js';

const mockDetail: ProgrammersProblemDetail = {
  problemId: '42748',
  title: 'K번째수',
  level: 1,
  category: '정렬',
  description: '배열을 자르고 정렬하는 문제',
  constraints: ['array 길이 1~100'],
  examples: [{ input: '[1,5,2]', output: '[5]' }],
  tags: ['정렬'],
};

describe('AnalyzeCodeSubmissionProgrammersInputSchema', () => {
  it('유효한 입력', () => {
    const result = AnalyzeCodeSubmissionProgrammersInputSchema.safeParse({
      problem_id: '42748',
      code: 'def solution(): pass',
      language: 'python',
    });
    expect(result.success).toBe(true);
  });

  it('빈 코드 거부', () => {
    const result = AnalyzeCodeSubmissionProgrammersInputSchema.safeParse({
      problem_id: '42748',
      code: '',
      language: 'python',
    });
    expect(result.success).toBe(false);
  });

  it('지원하지 않는 언어 거부', () => {
    const result = AnalyzeCodeSubmissionProgrammersInputSchema.safeParse({
      problem_id: '42748',
      code: 'code',
      language: 'rust',
    });
    expect(result.success).toBe(false);
  });

  it('analysis_type 기본값 full', () => {
    const result = AnalyzeCodeSubmissionProgrammersInputSchema.safeParse({
      problem_id: '42748',
      code: 'code',
      language: 'python',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.analysis_type).toBe('full');
    }
  });
});

describe('analyzeCodeSubmissionProgrammersTool 핸들러', () => {
  let mockScraper: { getProblem: ReturnType<typeof vi.fn> };
  let tool: ReturnType<typeof analyzeCodeSubmissionProgrammersTool>;

  beforeEach(() => {
    mockScraper = { getProblem: vi.fn().mockResolvedValue(mockDetail) };
    tool = analyzeCodeSubmissionProgrammersTool(
      mockScraper as unknown as ProgrammersScraper,
    );
  });

  it('정상 코드 분석', async () => {
    const result = await tool.handler({
      problem_id: '42748',
      code: 'def solution(array, commands):\n    return [sorted(array[i-1:j])[k-1] for i,j,k in commands]',
      language: 'python',
      analysis_type: 'full',
    });

    expect(result.type).toBe('text');
    const analysis = JSON.parse(result.text);
    expect(analysis).toHaveProperty('problemInfo');
    expect(analysis).toHaveProperty('codeMetadata');
    expect(analysis).toHaveProperty('analysisPrompts');
    expect(analysis).toHaveProperty('suggestedQuestions');
    expect(mockScraper.getProblem).toHaveBeenCalledWith('42748');
  });

  it('URL 입력', async () => {
    await tool.handler({
      problem_id: 'https://school.programmers.co.kr/learn/courses/30/lessons/42748',
      code: 'code',
      language: 'python',
      analysis_type: 'full',
    });

    expect(mockScraper.getProblem).toHaveBeenCalledWith('42748');
  });

  it('유효하지 않은 ID', async () => {
    await expect(
      tool.handler({
        problem_id: 'invalid',
        code: 'code',
        language: 'python',
        analysis_type: 'full',
      }),
    ).rejects.toThrow('유효하지 않은 프로그래머스 문제 ID 또는 URL');
  });

  it('코드 메타데이터 추출', async () => {
    const result = await tool.handler({
      problem_id: '42748',
      code: 'def solution():\n    pass\ndef helper():\n    pass',
      language: 'python',
      analysis_type: 'full',
    });

    const analysis = JSON.parse(result.text);
    expect(analysis.codeMetadata.language).toBe('python');
    expect(analysis.codeMetadata.lineCount).toBe(4);
    expect(analysis.codeMetadata.functionCount).toBe(2);
  });

  it('에러 전파', async () => {
    mockScraper.getProblem.mockRejectedValue(new Error('스크래핑 실패'));

    await expect(
      tool.handler({
        problem_id: '42748',
        code: 'code',
        language: 'python',
        analysis_type: 'full',
      }),
    ).rejects.toThrow('스크래핑 실패');
  });

  it('도구 정의 구조', () => {
    expect(tool.name).toBe('analyze_code_submission_programmers');
    expect(typeof tool.description).toBe('string');
    expect(tool.description).toContain('코드를 분석');
  });
});
