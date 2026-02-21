/**
 * generate_hint_programmers 도구 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GenerateHintProgrammersInputSchema,
  generateHintProgrammersTool,
} from '../../../src/tools/programmers/generate-hint-programmers.js';
import type { ProgrammersProblemAnalyzer } from '../../../src/services/programmers-problem-analyzer.js';

describe('GenerateHintProgrammersInputSchema', () => {
  it('문자열 problem_id 허용', () => {
    const result = GenerateHintProgrammersInputSchema.safeParse({ problem_id: '42748' });
    expect(result.success).toBe(true);
  });

  it('숫자 problem_id 허용', () => {
    const result = GenerateHintProgrammersInputSchema.safeParse({ problem_id: 42748 });
    expect(result.success).toBe(true);
  });

  it('problem_id 필수', () => {
    const result = GenerateHintProgrammersInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('generateHintProgrammersTool 핸들러', () => {
  let mockAnalyzer: { analyze: ReturnType<typeof vi.fn> };
  let tool: ReturnType<typeof generateHintProgrammersTool>;

  const mockResult = {
    problem: { problemId: '42748', title: 'K번째수', level: 1 },
    difficulty: { levelLabel: 'Lv. 1', level: 1 },
    similar_problems: [],
    hint_guide: {
      context: '컨텍스트',
      hint_levels: [
        { level: 1, label: '문제 분석', prompt: '힌트 1' },
        { level: 2, label: '핵심 아이디어', prompt: '힌트 2' },
        { level: 3, label: '상세 풀이', prompt: '힌트 3' },
      ],
      review_prompts: {},
    },
  };

  beforeEach(() => {
    mockAnalyzer = { analyze: vi.fn().mockResolvedValue(mockResult) };
    tool = generateHintProgrammersTool(mockAnalyzer as unknown as ProgrammersProblemAnalyzer);
  });

  it('정상 힌트 생성', async () => {
    const result = await tool.handler({ problem_id: '42748' });

    expect(result.type).toBe('text');
    const parsed = JSON.parse(result.text);
    expect(parsed).toHaveProperty('hint_guide');
    expect(parsed.hint_guide.hint_levels).toHaveLength(3);
    expect(mockAnalyzer.analyze).toHaveBeenCalledWith('42748', false);
  });

  it('URL 입력', async () => {
    await tool.handler({
      problem_id: 'https://school.programmers.co.kr/learn/courses/30/lessons/42748',
    });

    expect(mockAnalyzer.analyze).toHaveBeenCalledWith('42748', false);
  });

  it('유효하지 않은 ID 에러', async () => {
    await expect(
      tool.handler({ problem_id: 'not-a-url' }),
    ).rejects.toThrow('유효하지 않은 프로그래머스 문제 ID 또는 URL');
  });

  it('에러 전파', async () => {
    mockAnalyzer.analyze.mockRejectedValue(new Error('실패'));

    await expect(
      tool.handler({ problem_id: '42748' }),
    ).rejects.toThrow('실패');
  });

  it('도구 설명에 단계적 힌트 정보 포함', () => {
    expect(tool.description).toContain('한 번에 1개 레벨 힌트만 제공');
    expect(tool.description).toContain('Level 1');
    expect(tool.description).toContain('Level 2');
    expect(tool.description).toContain('Level 3');
  });
});
