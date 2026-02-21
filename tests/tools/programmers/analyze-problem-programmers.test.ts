/**
 * analyze_problem_programmers 도구 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AnalyzeProblemProgrammersInputSchema,
  analyzeProblemProgrammersTool,
} from '../../../src/tools/programmers/analyze-problem-programmers.js';
import type { ProgrammersProblemAnalyzer } from '../../../src/services/programmers-problem-analyzer.js';

describe('AnalyzeProblemProgrammersInputSchema', () => {
  it('문자열 problem_id 허용', () => {
    const result = AnalyzeProblemProgrammersInputSchema.safeParse({ problem_id: '42748' });
    expect(result.success).toBe(true);
  });

  it('숫자 problem_id 허용', () => {
    const result = AnalyzeProblemProgrammersInputSchema.safeParse({ problem_id: 42748 });
    expect(result.success).toBe(true);
  });

  it('URL problem_id 허용', () => {
    const result = AnalyzeProblemProgrammersInputSchema.safeParse({
      problem_id: 'https://school.programmers.co.kr/learn/courses/30/lessons/42748',
    });
    expect(result.success).toBe(true);
  });

  it('include_similar 기본값 true', () => {
    const result = AnalyzeProblemProgrammersInputSchema.safeParse({ problem_id: '42748' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include_similar).toBe(true);
    }
  });

  it('problem_id 필수', () => {
    const result = AnalyzeProblemProgrammersInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('analyzeProblemProgrammersTool 핸들러', () => {
  let mockAnalyzer: { analyze: ReturnType<typeof vi.fn> };
  let tool: ReturnType<typeof analyzeProblemProgrammersTool>;

  const mockAnalysis = {
    problem: { problemId: '42748', title: 'K번째수', level: 1, category: '정렬' },
    difficulty: { levelLabel: 'Lv. 1', level: 1, emoji: '🟡', description: '초급' },
    similar_problems: [],
    hint_guide: {
      context: '테스트',
      hint_levels: [
        { level: 1, label: '문제 분석', prompt: '프롬프트 1' },
        { level: 2, label: '핵심 아이디어', prompt: '프롬프트 2' },
        { level: 3, label: '상세 풀이', prompt: '프롬프트 3' },
      ],
      review_prompts: {},
    },
  };

  beforeEach(() => {
    mockAnalyzer = { analyze: vi.fn().mockResolvedValue(mockAnalysis) };
    tool = analyzeProblemProgrammersTool(mockAnalyzer as unknown as ProgrammersProblemAnalyzer);
  });

  it('정상 분석', async () => {
    const result = await tool.handler({ problem_id: '42748', include_similar: true });

    expect(result.type).toBe('text');
    const analysis = JSON.parse(result.text);
    expect(analysis).toHaveProperty('problem');
    expect(analysis).toHaveProperty('hint_guide');
    expect(mockAnalyzer.analyze).toHaveBeenCalledWith('42748', true);
  });

  it('URL 입력', async () => {
    const result = await tool.handler({
      problem_id: 'https://school.programmers.co.kr/learn/courses/30/lessons/42748',
      include_similar: false,
    });

    expect(result.type).toBe('text');
    expect(mockAnalyzer.analyze).toHaveBeenCalledWith('42748', false);
  });

  it('숫자 입력', async () => {
    const result = await tool.handler({ problem_id: 42748, include_similar: true });

    expect(result.type).toBe('text');
    expect(mockAnalyzer.analyze).toHaveBeenCalledWith('42748', true);
  });

  it('유효하지 않은 URL 에러', async () => {
    await expect(
      tool.handler({ problem_id: 'invalid-url', include_similar: true }),
    ).rejects.toThrow('유효하지 않은 프로그래머스 문제 ID 또는 URL');
  });

  it('에러 전파', async () => {
    mockAnalyzer.analyze.mockRejectedValue(new Error('분석 실패'));

    await expect(
      tool.handler({ problem_id: '42748', include_similar: true }),
    ).rejects.toThrow('분석 실패');
  });

  it('도구 정의 구조', () => {
    expect(tool.name).toBe('analyze_problem_programmers');
    expect(typeof tool.description).toBe('string');
    expect(tool.inputSchema).toBe(AnalyzeProblemProgrammersInputSchema);
  });
});
